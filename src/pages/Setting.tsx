import React, { useState } from 'react';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


const Setting: React.FC = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'member':
        return '선수/학부모';
      case 'guest':
        return '손님';
      case 'coach':
        return '감독/코치/운영진';
      default:
        return role;
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!currentUser) return;

    try {
      await updatePassword(currentUser, newPassword);
      setMessage('비밀번호가 변경되었습니다.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteConfirmModal(false);

    if (!currentUser || !db || !auth) return;

    try {
      // Firestore에 deletedAt 필드 추가 (30일 보관)
      await updateDoc(doc(db, 'users', currentUser.uid), {
        deletedAt: serverTimestamp(),
      });

      // Firebase Auth에서 사용자 계정 삭제 시도
      try {
        await deleteUser(currentUser);
      } catch (authErr: any) {
        console.error('Error deleting Auth account:', authErr);
        
        // 재인증이 필요한 경우
        if (authErr.code === 'auth/requires-recent-login') {
          setShowReauthModal(true);
          setError(''); // 모달 표시 전 에러 메시지 초기화
          return;
        }
        
        // 이미 삭제된 계정인 경우
        if (authErr.code === 'auth/user-not-found') {
          // Firestore는 이미 deletedAt이 설정되었으므로 로그아웃만 진행
          await logout();
          navigate('/login');
          return;
        }
        
        // 다른 에러인 경우에도 Firestore는 deletedAt이 설정되었으므로 로그아웃
        await logout();
        navigate('/login');
        return;
      }
      
      // 성공적으로 삭제된 경우
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      
      // 에러 코드에 따른 메시지 표시
      if (err.code === 'auth/requires-recent-login') {
        setShowReauthModal(true);
      } else {
        setError(err.message || '회원탈퇴에 실패했습니다. 관리자에게 문의해주세요.');
      }
    }
  };

  const handleReauthAndDelete = async () => {
    if (!currentUser || !auth || !reauthPassword || !db) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      // 재인증
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        reauthPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // 재인증 성공 후 Firestore에 deletedAt 필드 추가 (30일 보관)
      await updateDoc(doc(db, 'users', currentUser.uid), {
        deletedAt: serverTimestamp(),
      });

      // Firebase Auth에서 계정 삭제
      try {
        await deleteUser(currentUser);
        // 성공적으로 삭제된 경우
        await logout();
        navigate('/login');
      } catch (deleteErr: any) {
        console.error('Error deleting Auth account:', deleteErr);
        if (deleteErr.code === 'auth/user-not-found') {
          // 이미 삭제된 경우 - Firestore는 이미 deletedAt이 설정되었으므로 로그아웃만 진행
          await logout();
          navigate('/login');
        } else {
          // 다른 에러인 경우에도 Firestore는 deletedAt이 설정되었으므로 로그아웃
          await logout();
          navigate('/login');
        }
      }
    } catch (err: any) {
      console.error('Reauthentication error:', err);
      if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 일치하지 않습니다.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('인증 정보가 올바르지 않습니다.');
      } else {
        setError(err.message || '재인증에 실패했습니다.');
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-white">설정</h1>

        <div className="max-w-2xl space-y-6">
          {/* 프로필 정보 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white">프로필 정보</h2>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {message}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">이메일</label>
                <input
                  type="email"
                  disabled
                  className="input-field bg-gray-800"
                  value={currentUser?.email || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">권한</label>
                <input
                  type="text"
                  disabled
                  className="input-field bg-gray-800"
                  value={getRoleLabel(userData?.role || 'guest')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">자녀(선수) 이름</label>
                <input
                  type="text"
                  disabled
                  className="input-field bg-gray-800"
                  value={userData?.childName || '미입력'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">자녀(선수) 나이</label>
                <input
                  type="text"
                  disabled
                  className="input-field bg-gray-800"
                  value={userData?.ageGroup || '미입력'}
                />
              </div>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white">비밀번호 변경</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">새 비밀번호</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">새 비밀번호 확인</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">비밀번호 변경</button>
            </form>
          </div>

          {/* 계정 관리 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white">계정</h2>
            <div className="space-y-4">
              <button onClick={handleLogout} className="btn-secondary w-full">
                로그아웃
              </button>
              <button 
                onClick={handleDeleteAccount} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors w-full"
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>

        {/* 회원탈퇴 확인 모달 */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">회원탈퇴 확인</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                회원탈퇴 후 30일 동안은 동일한 계정으로 재가입이 불가합니다. 탈퇴하시겠습니까?
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  예
                </button>
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1 btn-secondary"
                >
                  아니오
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 재인증 모달 */}
        {showReauthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">보안 확인</h2>
              <p className="text-gray-300 mb-4">
                회원탈퇴를 위해 비밀번호를 다시 입력해주세요.
              </p>
              {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  className="input-field w-full"
                  placeholder="현재 비밀번호를 입력하세요"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleReauthAndDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  확인
                </button>
                <button
                  onClick={() => {
                    setShowReauthModal(false);
                    setReauthPassword('');
                    setError('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default Setting;

