import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Game } from '../types';

import { PlusIcon, PencilIcon, TrashIcon, FilmIcon } from '@heroicons/react/24/outline';

const GamePage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string>(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [ageFilter, setAgeFilter] = useState<string>('전체');
  const [typeFilter, setTypeFilter] = useState<string>('전체');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
  });

  const [formData, setFormData] = useState({
    date: '',
    ageGroup: 'U12',
    opponent: '',
    opponentLogo: null as File | null,
    ourScore: 0,
    opponentScore: 0,
    type: '연습경기' as '대회' | '연습경기' | '리그' | '스토브리그',
    videoUrl: '',
    quarters: {
      q1: { our: 0, opponent: 0 },
      q2: { our: 0, opponent: 0 },
      q3: { our: 0, opponent: 0 },
      q4: { our: 0, opponent: 0 },
    },
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, seasonFilter, dateRange, ageFilter, typeFilter, opponentFilter]);

  useEffect(() => {
    calculateStats();
  }, [filteredGames]);

  const fetchGames = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'games'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const gamesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      setGames(gamesData);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGames = () => {
    let filtered = [...games];

    if (seasonFilter !== '전체') {
      const year = parseInt(seasonFilter);
      filtered = filtered.filter((g) => {
        const date = g.date.toDate ? g.date.toDate() : new Date(g.date);
        return date.getFullYear() === year;
      });
    }

    if (dateRange.start) {
      filtered = filtered.filter((g) => {
        const date = g.date.toDate ? g.date.toDate() : new Date(g.date);
        return date >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter((g) => {
        const date = g.date.toDate ? g.date.toDate() : new Date(g.date);
        return date <= new Date(dateRange.end);
      });
    }

    if (ageFilter !== '전체') {
      filtered = filtered.filter((g) => g.ageGroup === ageFilter);
    }

    if (typeFilter !== '전체') {
      filtered = filtered.filter((g) => g.type === typeFilter);
    }

    if (opponentFilter) {
      filtered = filtered.filter((g) =>
        g.opponent.toLowerCase().includes(opponentFilter.toLowerCase())
      );
    }

    setFilteredGames(filtered);
  };

  const calculateStats = () => {
    const stats = {
      total: filteredGames.length,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
    };

    filteredGames.forEach((game) => {
      stats.goalsFor += game.ourScore;
      stats.goalsAgainst += game.opponentScore;
      if (game.result === '승리') stats.wins++;
      else if (game.result === '무승부') stats.draws++;
      else stats.losses++;
    });

    stats.goalDiff = stats.goalsFor - stats.goalsAgainst;
    setStats(stats);
  };

  const formatDate = (date: any) => {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getYears = () => {
    const years = new Set<number>();
    games.forEach((g) => {
      const date = g.date.toDate ? g.date.toDate() : new Date(g.date);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const handleAdd = () => {
    setEditingGame(null);
    setFormData({
      date: '',
      ageGroup: 'U12',
      opponent: '',
      opponentLogo: null,
      ourScore: 0,
      opponentScore: 0,
      type: '연습경기',
      videoUrl: '',
      quarters: {
        q1: { our: 0, opponent: 0 },
        q2: { our: 0, opponent: 0 },
        q3: { our: 0, opponent: 0 },
        q4: { our: 0, opponent: 0 },
      },
    });
    setShowModal(true);
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    const date = game.date.toDate ? game.date.toDate() : new Date(game.date);
    setFormData({
      date: date.toISOString().slice(0, 10),
      ageGroup: game.ageGroup,
      opponent: game.opponent,
      opponentLogo: null,
      ourScore: game.ourScore,
      opponentScore: game.opponentScore,
      type: game.type,
      videoUrl: game.videoUrl || '',
      quarters: game.quarters,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?') || !db) return;

    try {
      await deleteDoc(doc(db, 'games', id));
      fetchGames();
    } catch (error) {
      console.error('Error deleting game:', error);
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
      let opponentLogoUrl = editingGame?.opponentLogoUrl || '';

      if (formData.opponentLogo) {
        const storageRef = ref(storage, `logos/${Date.now()}_${formData.opponentLogo.name}`);
        await uploadBytes(storageRef, formData.opponentLogo);
        opponentLogoUrl = await getDownloadURL(storageRef);
      }

      const ourTotal = formData.quarters.q1.our + formData.quarters.q2.our + formData.quarters.q3.our + formData.quarters.q4.our;
      const opponentTotal = formData.quarters.q1.opponent + formData.quarters.q2.opponent + formData.quarters.q3.opponent + formData.quarters.q4.opponent;

      let result: '승리' | '무승부' | '패배';
      if (ourTotal > opponentTotal) result = '승리';
      else if (ourTotal === opponentTotal) result = '무승부';
      else result = '패배';

      const gameData = {
        date: new Date(formData.date),
        ageGroup: formData.ageGroup,
        opponent: formData.opponent,
        opponentLogoUrl,
        ourScore: ourTotal,
        opponentScore: opponentTotal,
        result,
        type: formData.type,
        quarters: formData.quarters,
        videoUrl: formData.videoUrl,
        createdAt: editingGame?.createdAt || new Date(),
      };

      if (editingGame) {
        await updateDoc(doc(db, 'games', editingGame.id), gameData);
      } else {
        await addDoc(collection(db, 'games'), gameData);
      }

      setShowModal(false);
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
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
          <h1 className="text-3xl font-bold">경기 결과</h1>
          {isAdmin && (
            <button onClick={handleAdd} className="btn-primary flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>경기 추가</span>
            </button>
          )}
        </div>

        {/* 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">시즌</label>
            <select
              className="input-field"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
            >
              <option value="전체">전체</option>
              {getYears().map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">시작일</label>
            <input
              type="date"
              className="input-field"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">종료일</label>
            <input
              type="date"
              className="input-field"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">연령</label>
            <select
              className="input-field"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="전체">전체</option>
              <option value="U12">U12</option>
              <option value="U11">U11</option>
              <option value="U10">U10</option>
              <option value="U9">U9</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">경기 유형</label>
            <select
              className="input-field"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="전체">전체</option>
              <option value="대회">대회</option>
              <option value="연습경기">연습경기</option>
              <option value="리그">리그</option>
              <option value="스토브리그">스토브리그</option>
            </select>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">상대팀 검색</label>
          <input
            type="text"
            className="input-field"
            placeholder="상대팀명을 입력하세요"
            value={opponentFilter}
            onChange={(e) => setOpponentFilter(e.target.value)}
          />
        </div>

        {/* 통계 표 */}
        <div className="card mb-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1.5 text-xs">경기수</th>
                <th className="text-left p-1.5 text-xs">승리</th>
                <th className="text-left p-1.5 text-xs">무</th>
                <th className="text-left p-1.5 text-xs">패배</th>
                <th className="text-left p-1.5 text-xs">득점</th>
                <th className="text-left p-1.5 text-xs">실점</th>
                <th className="text-left p-1.5 text-xs">득실차</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1.5 font-bold text-xs">{stats.total}</td>
                <td className="p-1.5 text-green-600 font-bold text-xs">{stats.wins}</td>
                <td className="p-1.5 text-gray-600 font-bold text-xs">{stats.draws}</td>
                <td className="p-1.5 text-red-600 font-bold text-xs">{stats.losses}</td>
                <td className="p-1.5 font-bold text-xs">{stats.goalsFor}</td>
                <td className="p-1.5 font-bold text-xs">{stats.goalsAgainst}</td>
                <td className={`p-1.5 font-bold text-xs ${stats.goalDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.goalDiff >= 0 ? '+' : ''}{stats.goalDiff}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 경기 리스트 */}
        <div className="card overflow-x-auto">
          <div className="space-y-2">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="border-b border-gray-700 pb-2 hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleGameClick(game.id)}
              >
                {/* 첫 번째 줄: 날짜, 상대, 대회 */}
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-gray-400 whitespace-nowrap">{formatDate(game.date)}</span>
                    <span className="font-semibold truncate text-white">{game.opponent}</span>
                    <span className="text-gray-400 whitespace-nowrap">{game.type}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2 ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(game)}
                        className="text-gold-600 hover:text-gold-700"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(game.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {/* 두 번째 줄: 스코어, 결과, 영상 */}
                <div className="flex items-center space-x-3 text-sm">
                  <span className="font-bold">
                    {game.ourScore} : {game.opponentScore}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      game.result === '승리'
                        ? 'bg-green-900 text-green-300'
                        : game.result === '무승부'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {game.result}
                  </span>
                  {game.videoUrl && (
                    <a
                      href={game.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gold-400 hover:text-gold-300"
                    >
                      <FilmIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center text-gray-400 py-12">경기 결과가 없습니다.</div>
        )}

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full p-6 my-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                {editingGame ? '경기 수정' : '경기 추가'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">연령 그룹 *</label>
                    <select
                      required
                      className="input-field"
                      value={formData.ageGroup}
                      onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    >
                      <option value="U12">U12</option>
                      <option value="U11">U11</option>
                      <option value="U10">U10</option>
                      <option value="U9">U9</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">상대팀 *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={formData.opponent}
                      onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">상대팀 로고</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => setFormData({ ...formData, opponentLogo: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>
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
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">유튜브 링크</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://youtube.com/..."
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">쿼터별 스코어</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                      <div key={q} className="space-y-2">
                        <label className="text-xs text-gray-300">{q.toUpperCase()}</label>
                        <input
                          type="number"
                          min="0"
                          className="input-field"
                          placeholder="우리"
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
                        <input
                          type="number"
                          min="0"
                          className="input-field"
                          placeholder="상대"
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
                    ))}
                  </div>
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

export default GamePage;

