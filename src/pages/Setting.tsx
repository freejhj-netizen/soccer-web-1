import React, { useState } from 'react';
import { updatePassword, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


const Setting: React.FC = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'member':
        return '학부모/선수';
      case 'guest':
        return '손님';
      default:
        return '손님';
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

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말 회원탈퇴 하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
      return;
    }

    if (!currentUser || !db) return;

    try {
      // Firestore에서 사용자 데이터 삭제
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // Firebase Auth에서 사용자 삭제
      await deleteUser(currentUser);
      
      // 로그아웃 및 로그인 페이지로 이동
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || '회원탈퇴에 실패했습니다.');
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
                <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {message && (
                <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
                  {message}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">이메일</label>
                <input
                  type="email"
                  disabled
                  className="input-field"
                  value={currentUser?.email || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">권한</label>
                <input
                  type="text"
                  disabled
                  className="input-field"
                  value={getRoleLabel(userData?.role)}
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
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors w-full">비밀번호 변경</button>
            </form>
          </div>

          {/* 로그아웃 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white">계정</h2>
            <button onClick={handleLogout} className="btn-secondary w-full">
              로그아웃
            </button>
          </div>

          {/* 회원탈퇴 */}
          <div className="card bg-red-900 border-red-700">
            <h2 className="text-xl font-bold mb-4 text-white">회원탈퇴</h2>
            <p className="text-white mb-4 text-sm">
              회원탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
            </p>
            <button 
              onClick={handleDeleteAccount} 
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors w-full"
            >
              회원탈퇴
            </button>
          </div>
        </div>
      </div>
    
  );
};

export default Setting;

