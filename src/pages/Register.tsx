import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    if (!auth || !db) {
      setError('Firebase 설정이 필요합니다.');
      setLoading(false);
      return;
    }

    try {
      let existingUserDocId: string | null = null;
      
      // 먼저 Firebase Auth 계정 생성 시도
      // 성공하면 Auth에 계정이 없었다는 의미 (수동 삭제된 경우) → 즉시 재가입 허용
      // 실패하면 Auth에 계정이 있다는 의미 → 기존 로직대로 처리
      let userCredential;
      let user;
      
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        // Auth 계정 생성 성공 = Auth에 계정이 없었음 = 수동 삭제된 경우
        // → Firestore의 30일 체크를 무시하고 즉시 재가입 허용
      } catch (authErr: any) {
        // Auth 계정이 이미 존재하는 경우
        if (authErr.code === 'auth/email-already-in-use') {
          // Firestore에서 탈퇴 기록 확인
          if (db) {
            const usersQuery = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(usersQuery);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              existingUserDocId = userDoc.id;
              const userData = userDoc.data();
              
              // deletedAt이 있는 경우 30일 경과 여부 확인
              if (userData.deletedAt) {
                const deletedAt = userData.deletedAt.toDate ? userData.deletedAt.toDate() : new Date(userData.deletedAt);
                const now = new Date();
                const daysSinceDeletion = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceDeletion < 30) {
                  const remainingDays = 30 - daysSinceDeletion;
                  setError(`회원탈퇴 후 30일 동안은 동일한 계정으로 재가입이 불가합니다. (남은 기간: ${remainingDays}일)`);
                  setLoading(false);
                  return;
                }
              }
            }
          }
          // Auth에 계정이 있지만 30일이 지났거나 deletedAt이 없는 경우
          setError('이미 사용 중인 이메일입니다. 로그인하시거나 비밀번호를 찾아주세요.');
        } else {
          // 다른 Auth 오류
          throw authErr;
        }
        setLoading(false);
        return;
      }
      
      // Auth 계정 생성 성공 → Firestore에서 기존 문서 확인 (삭제용)
      if (db) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(usersQuery);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          existingUserDocId = userDoc.id;
        }
      }

      // 사용자가 인증된 상태에서 Firestore에 데이터 저장
      // 사용자 데이터 생성 (기본 권한: guest)
      const userRole = user.email === 'cjjhj@naver.com' ? 'admin' : 'guest';
      
      try {
        // 새 UID로 새 문서 생성 (기존 문서와는 별개)
        // 기존 문서는 30일 후 Admin 페이지에서 자동 삭제됨
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: userRole,
          createdAt: serverTimestamp(),
          deletedAt: null, // 재가입 시 deletedAt 초기화
        });
        
        // 기존 문서가 있고 30일이 지났다면, 새 문서 생성 후 기존 문서 삭제 시도
        // (권한이 없어도 실패해도 무시 - 새 문서는 이미 생성됨)
        if (existingUserDocId && db && existingUserDocId !== user.uid) {
          try {
            await deleteDoc(doc(db, 'users', existingUserDocId));
            console.log('Deleted old user document:', existingUserDocId);
          } catch (deleteErr) {
            console.warn('Could not delete old user document (this is OK, admin will clean it up):', deleteErr);
            // 삭제 실패해도 무시 - 새 문서는 이미 생성되었고, 기존 문서는 나중에 자동 삭제됨
          }
        }
      } catch (firestoreErr: any) {
        console.error('Firestore write error:', firestoreErr);
        // Firestore 저장 실패 시 Auth 계정도 삭제
        try {
          await user.delete();
        } catch (deleteErr) {
          console.error('Error deleting auth user:', deleteErr);
        }
        
        // 권한 오류인 경우 더 명확한 메시지 제공
        if (firestoreErr.code === 'permission-denied' || firestoreErr.message?.includes('permission')) {
          setError('Firestore 보안 규칙을 확인해주세요. Firebase Console에서 Firestore 보안 규칙을 업데이트해주세요. (자세한 내용은 FIREBASE_RULES_배포_가이드.md 참고)');
        } else {
          setError(`사용자 데이터 저장에 실패했습니다: ${firestoreErr.message || '알 수 없는 오류'}`);
        }
        setLoading(false);
        return;
      }

      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // email-already-in-use 에러인 경우
      if (err.code === 'auth/email-already-in-use') {
        // Firestore에서 다시 확인 (Auth에는 있지만 Firestore에 없을 수 있음)
        if (db) {
          try {
            const usersQuery = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(usersQuery);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userData = userDoc.data();
              
              if (userData.deletedAt) {
                const deletedAt = userData.deletedAt.toDate ? userData.deletedAt.toDate() : new Date(userData.deletedAt);
                const now = new Date();
                const daysSinceDeletion = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceDeletion < 30) {
                  const remainingDays = 30 - daysSinceDeletion;
                  setError(`회원탈퇴 후 30일 동안은 동일한 계정으로 재가입이 불가합니다. (남은 기간: ${remainingDays}일)`);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (checkErr) {
            console.error('Error checking deleted account:', checkErr);
          }
        }
        setError('이미 사용 중인 이메일입니다. 로그인하시거나 비밀번호를 찾아주세요.');
      } else if (err.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 주소입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호가 너무 약합니다. 최소 6자 이상 입력해주세요.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('이메일/비밀번호 로그인이 허용되지 않았습니다. 관리자에게 문의해주세요.');
      } else {
        setError(err.message || '회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="/로고.png" 
            alt="NYJ BJ UTD U12 로고" 
            className="w-20 h-20 object-contain mx-auto mb-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <h2 className="text-3xl font-bold text-white">회원가입</h2>
          <p className="mt-2 text-gray-300">NYJ BJ UTD U12</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-field"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-gold-400 hover:text-gold-300">
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

