import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, UserRole } from '../types';

import ProtectedRoute from '../components/ProtectedRoute';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    if (expandedUser === user.uid) {
      setExpandedUser(null);
      setSelectedUser(null);
      setSelectedRole(null);
    } else {
      setExpandedUser(user.uid);
      setSelectedUser(user);
      setSelectedRole(user.role);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRole || !db) return;
    
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        role: selectedRole,
      });
      fetchUsers();
      setSelectedUser({ ...selectedUser, role: selectedRole });
      alert('권한이 변경되었습니다.');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('권한 변경에 실패했습니다.');
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser || !newPassword) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      // Firebase Admin SDK가 필요하지만, 클라이언트에서는 직접 비밀번호 변경 불가
      // 대신 사용자에게 비밀번호 재설정 이메일을 보내는 방법을 사용하거나
      // Firebase Admin SDK를 백엔드에서 사용해야 함
      alert('비밀번호 초기화는 Firebase Admin SDK가 필요합니다. 현재는 지원되지 않습니다.');
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('비밀번호 초기화에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('정말 이 회원을 탈퇴시키시겠습니까? 모든 데이터가 삭제됩니다.')) return;
    if (!db) return;

    try {
      await deleteDoc(doc(db, 'users', uid));
      fetchUsers();
      if (selectedUser?.uid === uid) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('회원 탈퇴에 실패했습니다.');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-gold-500 text-black';
      case 'member':
        return 'bg-blue-500 text-white';
      case 'guest':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'member':
        return '선수/학부모';
      case 'guest':
        return '손님';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={['admin']}>
      <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-white">계정 관리</h1>

        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-white">계정 목록</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {users.map((user) => (
              <div key={user.uid}>
                <div
                  onClick={() => handleUserClick(user)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    expandedUser === user.uid
                      ? 'border-gold-500 bg-gray-800'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{user.email}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs mt-1 ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 계정 관리 메뉴 */}
                {expandedUser === user.uid && (
                  <div className="mt-2 p-4 border border-gray-700 rounded-lg bg-gray-800">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">이메일</label>
                        <input
                          type="email"
                          disabled
                          className="input-field bg-gray-700"
                          value={user.email}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">권한</label>
                        <div className="space-y-2">
                          {(['admin', 'member', 'guest'] as UserRole[]).map((role) => (
                            <label key={role} className="flex items-center space-x-2 text-white">
                              <input
                                type="radio"
                                name={`role-${user.uid}`}
                                checked={selectedRole === role}
                                onChange={() => setSelectedRole(role)}
                                className="w-4 h-4 text-gold-500"
                              />
                              <span>{getRoleLabel(role)}</span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={handleSaveRole}
                          className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                          저장
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">비밀번호 초기화</label>
                        <div className="flex space-x-2">
                          <input
                            type="password"
                            className="input-field flex-1"
                            placeholder="새 비밀번호 입력"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button onClick={handlePasswordReset} className="btn-primary">
                            초기화
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          비밀번호 초기화는 Firebase Admin SDK가 필요합니다.
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={() => handleDeleteUser(user.uid)}
                          className="btn-secondary bg-red-600 hover:bg-red-700 w-full"
                        >
                          회원 탈퇴
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;

