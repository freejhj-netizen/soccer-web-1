import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Player } from '../types';

import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const PlayerPage: React.FC = () => {
  const { userData } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [positionFilter, setPositionFilter] = useState<'전체' | 'FIELD' | 'GK'>('전체');
  const [ageFilter, setAgeFilter] = useState<'전체' | 'U12' | 'U11' | 'U10' | 'U9'>('전체');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    grade: '',
    position: 'FIELD' as 'FIELD' | 'GK',
    ageGroup: 'U12' as 'U12' | 'U11' | 'U10' | 'U9',
    photo: null as File | null,
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, positionFilter, ageFilter]);

  const fetchPlayers = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'players'));
      const playersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[];
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = [...players];

    if (positionFilter !== '전체') {
      filtered = filtered.filter((p) => p.position === positionFilter);
    }

    if (ageFilter !== '전체') {
      filtered = filtered.filter((p) => p.ageGroup === ageFilter);
    }

    setFilteredPlayers(filtered);
  };

  const handleAdd = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      nickname: '',
      grade: '',
      position: 'FIELD',
      ageGroup: 'U12',
      photo: null,
    });
    setShowModal(true);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      nickname: player.nickname || '',
      grade: player.grade,
      position: player.position,
      ageGroup: player.ageGroup,
      photo: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?') || !db) return;

    try {
      await deleteDoc(doc(db, 'players', id));
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !storage) {
      alert('Firebase 설정이 필요합니다.');
      return;
    }

    try {
      let photoUrl = editingPlayer?.photoUrl || '';

      if (formData.photo) {
        const storageRef = ref(storage, `players/${Date.now()}_${formData.photo.name}`);
        await uploadBytes(storageRef, formData.photo);
        photoUrl = await getDownloadURL(storageRef);
      }

      const playerData = {
        name: formData.name,
        nickname: formData.nickname,
        grade: formData.grade,
        position: formData.position,
        ageGroup: formData.ageGroup,
        photoUrl,
        createdAt: editingPlayer?.createdAt || new Date(),
      };

      if (editingPlayer) {
        await updateDoc(doc(db, 'players', editingPlayer.id), playerData);
      } else {
        await addDoc(collection(db, 'players'), playerData);
      }

      setShowModal(false);
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('저장에 실패했습니다.');
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
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">선수 명단</h1>
          {isAdmin && (
            <button onClick={handleAdd} className="btn-primary flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>선수 추가</span>
            </button>
          )}
        </div>

        {/* 필터 */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">포지션</label>
            <div className="flex space-x-2">
              {['전체', 'FIELD', 'GK'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos as any)}
                  className={`px-4 py-2 rounded-lg ${
                    positionFilter === pos
                      ? 'bg-gold-500 text-black font-semibold'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">연령</label>
            <div className="flex space-x-2 flex-wrap">
              {['전체', 'U12', 'U11', 'U10', 'U9'].map((age) => (
                <button
                  key={age}
                  onClick={() => setAgeFilter(age as any)}
                  className={`px-4 py-2 rounded-lg ${
                    ageFilter === age
                      ? 'bg-gold-500 text-black font-semibold'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 선수 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => (
            <div key={player.id} className="card p-0 overflow-hidden">
              <div className="aspect-square bg-gray-800 relative">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    사진 없음
                  </div>
                )}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(player)}
                      className="bg-gold-500 text-black p-2 rounded hover:bg-gold-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-1">학년: {player.grade}</p>
                <p className="text-lg font-bold mb-1 text-white">이름: {player.name}</p>
                {player.nickname && (
                  <p className="text-sm text-gold-400">별명: {player.nickname}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            선수가 없습니다.
          </div>
        )}

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">
                {editingPlayer ? '선수 수정' : '선수 추가'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">이름 *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">별명</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">학년 *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="예: 6학년"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">포지션 *</label>
                  <select
                    required
                    className="input-field"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as 'FIELD' | 'GK' })}
                  >
                    <option value="FIELD">FIELD</option>
                    <option value="GK">GK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">연령 그룹 *</label>
                  <select
                    required
                    className="input-field"
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as any })}
                  >
                    <option value="U12">U12</option>
                    <option value="U11">U11</option>
                    <option value="U10">U10</option>
                    <option value="U9">U9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">사진</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary flex-1">저장</button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default PlayerPage;

