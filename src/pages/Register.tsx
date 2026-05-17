import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'' | 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7'>('');
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
      let userCredential;
      let user;
      
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          if (db) {
            const usersQuery = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(usersQuery);
            
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              existingUserDocId = userDoc.id;
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
          }
          setError('이미 사용 중인 이메일입니다. 로그인하시거나 비밀번호를 찾아주세요.');
        } else {
          throw authErr;
        }
        setLoading(false);
        return;
      }
      
      if (db) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(usersQuery);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          existingUserDocId = userDoc.id;
        }
      }

      const userRole = user.email === 'cjjhj@naver.com' ? 'admin' : 'guest';
      
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: userRole,
          createdAt: serverTimestamp(),
          deletedAt: null,
          childName: childName.trim() || null, // 선택 필드
          ageGroup: ageGroup || null, // 선택 필드
        });
        
        if (existingUserDocId && db && existingUserDocId !== user.uid) {
          try {
            await deleteDoc(doc(db, 'users', existingUserDocId));
            console.log('Deleted old user document:', existingUserDocId);
          } catch (deleteErr) {
            console.warn('Could not delete old user document:', deleteErr);
          }
        }
      } catch (firestoreErr: any) {
        console.error('Firestore write error:', firestoreErr);
        try {
          await user.delete();
        } catch (deleteErr) {
          console.error('Error deleting auth user:', deleteErr);
        }
        
        if (firestoreErr.code === 'permission-denied' || firestoreErr.message?.includes('permission')) {
          setError('Firestore 보안 규칙을 확인해주세요. Firebase Console에서 Firestore 보안 규칙을 업데이트해주세요.');
        } else {
          setError(`사용자 데이터 저장에 실패했습니다: ${firestoreErr.message || '알 수 없는 오류'}`);
        }
        setLoading(false);
        return;
      }

      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
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
            alt="남양주축구센터 U12 로고" 
            className="max-w-[200px] w-full h-auto max-h-28 object-contain mx-auto mb-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <h2 className="text-3xl font-bold text-white">회원가입</h2>
          <p className="mt-2 text-gray-300">남양주축구센터 U12</p>
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
            <div>
              <label htmlFor="childName" className="block text-sm font-medium text-white mb-2">
                자녀(선수) 이름
              </label>
              <input
                id="childName"
                name="childName"
                type="text"
                className="input-field"
                placeholder="자녀(선수) 이름을 입력하세요 (선택)"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                감독/코치/운영진 등 선수 부모가 아닌 경우 미입력 가능합니다.
              </p>
            </div>
            <div>
              <label htmlFor="ageGroup" className="block text-sm font-medium text-white mb-2">
                자녀(선수) 나이
              </label>
              <select
                id="ageGroup"
                name="ageGroup"
                className="input-field"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as any)}
              >
                <option value="">선택 안함</option>
                <option value="U12">U12</option>
                <option value="U11">U11</option>
                <option value="U10">U10</option>
                <option value="U9">U9</option>
                <option value="U8">U8</option>
                <option value="U7">U7</option>
              </select>
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
