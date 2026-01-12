import React, { useState } from 'react';
import { updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';


const Setting: React.FC = () => {
  const { currentUser, userData, logout } = useAuth();
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentUser) return;

    try {
      await updateProfile(currentUser, { displayName });
      if (currentUser && db) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          displayName,
        });
      }
      setMessage('프로필이 업데이트되었습니다.');
    } catch (err: any) {
      setError(err.message || '프로필 업데이트에 실패했습니다.');
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

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-white">설정</h1>

        <div className="max-w-2xl space-y-6">
          {/* 프로필 정보 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white">프로필 정보</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                <label className="block text-sm font-medium mb-2">이메일</label>
                <input
                  type="email"
                  disabled
                  className="input-field bg-gray-100"
                  value={currentUser?.email || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">이름</label>
                <input
                  type="text"
                  className="input-field"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <button type="submit" className="btn-primary">프로필 업데이트</button>
            </form>
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
              <button type="submit" className="btn-primary">비밀번호 변경</button>
            </form>
          </div>

          {/* 로그아웃 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white">계정</h2>
            <button onClick={handleLogout} className="btn-secondary">
              로그아웃
            </button>
          </div>
        </div>
      </div>
    
  );
};

export default Setting;

