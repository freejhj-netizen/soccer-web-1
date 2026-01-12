import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Game } from '../types';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const GameEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    year: '2026',
    ageGroup: 'U12' as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
    type: '연습경기' as '대회' | '연습경기' | '리그' | '스토브리그',
    opponent: '',
    ourScore: 0,
    opponentScore: 0,
    result: '승리' as '승리' | '무승부' | '패배',
    quarters: {
      q1: { our: 0, opponent: 0, result: '승리' as '승리' | '무승부' | '패배' },
      q2: { our: 0, opponent: 0, result: '승리' as '승리' | '무승부' | '패배' },
      q3: { our: 0, opponent: 0, result: '승리' as '승리' | '무승부' | '패배' },
      q4: { our: 0, opponent: 0, result: '승리' as '승리' | '무승부' | '패배' },
    },
    videoUrl: '',
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (id && isAdmin) {
      fetchGame();
    } else if (!isAdmin) {
      navigate('/game');
    }
  }, [id, isAdmin]);

  const fetchGame = async () => {
    if (!db || !id) {
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, 'games', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const game = { id: docSnap.id, ...docSnap.data() } as Game;
        const date = game.date.toDate ? game.date.toDate() : new Date(game.date);
        setFormData({
          date: date.toISOString().slice(0, 10),
          year: date.getFullYear().toString(),
          ageGroup: game.ageGroup as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
          type: game.type,
          opponent: game.opponent,
          ourScore: game.ourScore,
          opponentScore: game.opponentScore,
          result: game.result,
          quarters: {
            q1: { 
              our: game.quarters.q1.our, 
              opponent: game.quarters.q1.opponent,
              result: game.quarters.q1.our > game.quarters.q1.opponent ? '승리' : 
                      game.quarters.q1.our < game.quarters.q1.opponent ? '패배' : '무승부'
            },
            q2: { 
              our: game.quarters.q2.our, 
              opponent: game.quarters.q2.opponent,
              result: game.quarters.q2.our > game.quarters.q2.opponent ? '승리' : 
                      game.quarters.q2.our < game.quarters.q2.opponent ? '패배' : '무승부'
            },
            q3: { 
              our: game.quarters.q3.our, 
              opponent: game.quarters.q3.opponent,
              result: game.quarters.q3.our > game.quarters.q3.opponent ? '승리' : 
                      game.quarters.q3.our < game.quarters.q3.opponent ? '패배' : '무승부'
            },
            q4: { 
              our: game.quarters.q4.our, 
              opponent: game.quarters.q4.opponent,
              result: game.quarters.q4.our > game.quarters.q4.opponent ? '승리' : 
                      game.quarters.q4.our < game.quarters.q4.opponent ? '패배' : '무승부'
            },
          },
          videoUrl: game.videoUrl || '',
        });
      }
    } catch (error) {
      console.error('Error fetching game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id) {
      alert('Firebase 설정이 필요합니다.');
      return;
    }

    try {
      const gameDate = new Date(formData.date);
      gameDate.setFullYear(parseInt(formData.year));

      const gameData = {
        date: gameDate,
        ageGroup: formData.ageGroup,
        opponent: formData.opponent,
        ourScore: formData.ourScore,
        opponentScore: formData.opponentScore,
        result: formData.result,
        type: formData.type,
        quarters: {
          q1: { our: formData.quarters.q1.our, opponent: formData.quarters.q1.opponent },
          q2: { our: formData.quarters.q2.our, opponent: formData.quarters.q2.opponent },
          q3: { our: formData.quarters.q3.our, opponent: formData.quarters.q3.opponent },
          q4: { our: formData.quarters.q4.our, opponent: formData.quarters.q4.opponent },
        },
        videoUrl: formData.videoUrl,
      };

      await updateDoc(doc(db, 'games', id), gameData);
      navigate(`/game/${id}`);
    } catch (error) {
      console.error('Error updating game:', error);
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
      <button
        onClick={() => navigate(`/game/${id}`)}
        className="flex items-center space-x-2 text-gray-400 hover:text-gold mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>경기 상세로</span>
      </button>

      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">경기 수정</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">연도 *</label>
              <select
                required
                className="input-field"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">날짜 *</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* 연령 그룹 */}
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
              <option value="U8">U8</option>
              <option value="U7">U7</option>
            </select>
          </div>

          {/* 경기 유형 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">경기 유형 *</label>
            <select
              required
              className="input-field"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="대회">대회</option>
              <option value="연습경기">연습경기</option>
              <option value="리그">리그</option>
              <option value="스토브리그">스토브리그</option>
            </select>
          </div>

          {/* 상대팀명 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">상대팀명 *</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
            />
          </div>

          {/* 총점 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">우리팀 총점 *</label>
              <input
                type="number"
                min="0"
                required
                className="input-field"
                value={formData.ourScore}
                onChange={(e) => setFormData({ ...formData, ourScore: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">상대팀 총점 *</label>
              <input
                type="number"
                min="0"
                required
                className="input-field"
                value={formData.opponentScore}
                onChange={(e) => setFormData({ ...formData, opponentScore: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">결과 *</label>
              <select
                required
                className="input-field"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value as any })}
              >
                <option value="승리">승리</option>
                <option value="무승부">무승부</option>
                <option value="패배">패배</option>
              </select>
            </div>
          </div>

          {/* 쿼터별 점수 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">쿼터별 점수 (선택사항)</label>
            <div className="grid grid-cols-2 gap-4">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((q, index) => (
                <div key={q} className="bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3 font-semibold">{index + 1}쿼터</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">우리팀</label>
                      <input
                        type="number"
                        min="0"
                        className="input-field text-sm"
                        value={formData.quarters[q].our}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quarters: {
                              ...formData.quarters,
                              [q]: { ...formData.quarters[q], our: parseInt(e.target.value) || 0 },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">상대팀</label>
                      <input
                        type="number"
                        min="0"
                        className="input-field text-sm"
                        value={formData.quarters[q].opponent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quarters: {
                              ...formData.quarters,
                              [q]: { ...formData.quarters[q], opponent: parseInt(e.target.value) || 0 },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">결과</label>
                      <select
                        className="input-field text-sm"
                        value={formData.quarters[q].result}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quarters: {
                              ...formData.quarters,
                              [q]: { ...formData.quarters[q], result: e.target.value as any },
                            },
                          })
                        }
                      >
                        <option value="승리">승리</option>
                        <option value="무승부">무승부</option>
                        <option value="패배">패배</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 유튜브 링크 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">유튜브 링크 (선택사항)</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://youtube.com/..."
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            />
          </div>

          {/* 버튼 */}
          <div className="flex space-x-2">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex-1">
              저장
            </button>
            <button
              type="button"
              onClick={() => navigate(`/game/${id}`)}
              className="btn-secondary flex-1"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameEdit;

