import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, UserRole } from '../types';
import { userFromFirestoreDoc } from '../utils/userDoc';

import ProtectedRoute from '../components/ProtectedRoute';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingChildName, setEditingChildName] = useState('');
  const [editingAgeGroup, setEditingAgeGroup] = useState<'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7' | '졸업' | ''>('');
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

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
      const usersData = querySnapshot.docs.map((docSnap) => userFromFirestoreDoc(docSnap));
      
      // deletedAt이 없는 활성 계정만 필터링
      const activeUsers = usersData.filter(user => !user.deletedAt);
      
      // deletedAt이 있는 탈퇴 계정 필터링
      const deletedUsersList = usersData.filter(user => user.deletedAt);
      
      // 30일 경과한 탈퇴 계정 자동 삭제
      const now = new Date();
      const usersToDelete: string[] = [];
      
      deletedUsersList.forEach(user => {
        if (user.deletedAt) {
          const deletedAt = user.deletedAt.toDate ? user.deletedAt.toDate() : new Date(user.deletedAt);
          const daysSinceDeletion = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceDeletion >= 30) {
            usersToDelete.push(user.uid);
          }
        }
      });
      
      // 30일 경과한 계정 삭제
      for (const uid of usersToDelete) {
        try {
          await deleteDoc(doc(db, 'users', uid));
        } catch (deleteErr) {
          console.error('Error deleting expired user:', deleteErr);
        }
      }
      
      // 삭제 후 다시 필터링 (30일 경과한 계정 제외)
      const remainingDeletedUsers = deletedUsersList.filter(user => 
        !usersToDelete.includes(user.uid)
      );
      
      setUsers(activeUsers);
      setDeletedUsers(remainingDeletedUsers);
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
      setEditingChildName('');
      setEditingAgeGroup('');
    } else {
      setExpandedUser(user.uid);
      setSelectedUser(user);
      setSelectedRole(user.role);
      setEditingChildName(user.childName || '');
      setEditingAgeGroup(user.ageGroup || '');
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRole || !db) return;
    
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        role: selectedRole,
        roleUpdatedAt: serverTimestamp(),
      });
      fetchUsers();
      setSelectedUser({ ...selectedUser, role: selectedRole });
      alert('권한이 변경되었습니다.');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('권한 변경에 실패했습니다.');
    }
  };

  const handleSaveChildInfo = async () => {
    if (!selectedUser || !db) return;
    
    try {
      const updateData: any = {};
      if (editingChildName !== undefined) {
        updateData.childName = editingChildName.trim() || null;
      }
      if (editingAgeGroup) {
        updateData.ageGroup = editingAgeGroup;
      }
      
      await updateDoc(doc(db, 'users', selectedUser.uid), updateData);
      fetchUsers();
      setSelectedUser({ ...selectedUser, childName: editingChildName.trim() || undefined, ageGroup: editingAgeGroup as any });
      alert('자녀 정보가 변경되었습니다.');
    } catch (error) {
      console.error('Error updating child info:', error);
      alert('자녀 정보 변경에 실패했습니다.');
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
    if (!confirm('정말 이 회원을 탈퇴시키시겠습니까? 회원탈퇴 후 30일 동안은 동일한 계정으로 재가입이 불가합니다.')) return;
    if (!db) return;

    try {
      // deletedAt 필드 추가 (30일 보관)
      await updateDoc(doc(db, 'users', uid), {
        deletedAt: serverTimestamp(),
      });
      
      fetchUsers();
      if (selectedUser?.uid === uid) {
        setSelectedUser(null);
      }
      alert('회원 탈퇴가 완료되었습니다. 30일 후 자동으로 삭제됩니다.');
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
      case 'coach':
        return 'bg-purple-500 text-white';
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
      case 'coach':
        return '감독/코치/운영진';
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

        {/* 탭 메뉴 */}
        <div className="mb-6 flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => {
              setActiveTab('active');
              setExpandedUser(null);
            }}
            className={`pb-2 px-4 font-semibold transition-colors ${
              activeTab === 'active'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            활성 회원 ({users.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('deleted');
              setExpandedUser(null);
            }}
            className={`pb-2 px-4 font-semibold transition-colors ${
              activeTab === 'deleted'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            탈퇴한 회원 ({deletedUsers.length})
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-white">
            {activeTab === 'active' ? '활성 계정 목록' : '탈퇴한 계정 목록'}
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {(activeTab === 'active' ? users : deletedUsers).map((user) => {
              // 탈퇴한 회원의 경우 남은 일수 계산
              let remainingDays = null;
              let deletedDate = null;
              if (user.deletedAt) {
                deletedDate = user.deletedAt.toDate ? user.deletedAt.toDate() : new Date(user.deletedAt);
                const now = new Date();
                const daysSinceDeletion = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                remainingDays = 30 - daysSinceDeletion;
              }
              
              return (
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
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                        {user.deletedAt && deletedDate && remainingDays !== null && (
                          <span className="text-xs text-gray-400">
                            탈퇴일: {deletedDate.toLocaleDateString('ko-KR')} 
                            {remainingDays > 0 ? ` (${remainingDays}일 후 삭제)` : ' (삭제 예정)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 계정 관리 메뉴 - 활성 회원만 */}
                {expandedUser === user.uid && activeTab === 'active' && (
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
                          {(['admin', 'member', 'guest', 'coach'] as UserRole[]).map((role) => (
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
                        <label className="block text-sm font-medium mb-2 text-white">자녀(선수) 이름</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="자녀(선수) 이름 입력"
                          value={editingChildName}
                          onChange={(e) => setEditingChildName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">자녀(선수) 나이</label>
                        <select
                          className="input-field"
                          value={editingAgeGroup}
                          onChange={(e) => setEditingAgeGroup(e.target.value as any)}
                        >
                          <option value="">선택 안함</option>
                          <option value="U12">U12</option>
                          <option value="U11">U11</option>
                          <option value="U10">U10</option>
                          <option value="U9">U9</option>
                          <option value="U8">U8</option>
                          <option value="U7">U7</option>
                          <option value="졸업">졸업</option>
                        </select>
                        <button
                          onClick={handleSaveChildInfo}
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

                {/* 탈퇴한 회원 상세 정보 */}
                {expandedUser === user.uid && activeTab === 'deleted' && user.deletedAt && deletedDate && (
                  <div className="mt-2 p-4 border border-gray-700 rounded-lg bg-gray-800">
                    <div className="space-y-4">
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
                        <input
                          type="text"
                          disabled
                          className="input-field bg-gray-700"
                          value={getRoleLabel(user.role)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">탈퇴일</label>
                        <input
                          type="text"
                          disabled
                          className="input-field bg-gray-700"
                          value={deletedDate.toLocaleDateString('ko-KR') + ' ' + deletedDate.toLocaleTimeString('ko-KR')}
                        />
                      </div>
                      {remainingDays !== null && (
                        <div>
                          <label className="block text-sm font-medium mb-2 text-white">삭제 예정일</label>
                          <input
                            type="text"
                            disabled
                            className="input-field bg-gray-700"
                            value={remainingDays > 0 ? `${remainingDays}일 후 자동 삭제` : '곧 삭제 예정'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )})}
            {activeTab === 'deleted' && deletedUsers.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                탈퇴한 회원이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;

