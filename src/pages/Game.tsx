import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Game } from '../types';

import { PlusIcon, FilmIcon } from '@heroicons/react/24/outline';
import PaginationControls from '../components/PaginationControls';

const GamePage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string>('전체');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [ageFilter, setAgeFilter] = useState<string>('전체');
  const [typeFilter, setTypeFilter] = useState<string>('전체');
  const [opponentFilter, setOpponentFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
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
    year: '2026',
    ageGroup: 'U10' as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
    type: '연습경기' as '대회' | '연습경기' | '리그' | '스토브리그',
    opponent: '',
    ourScore: '' as number | '',
    opponentScore: '' as number | '',
    result: '승리' as '승리' | '무승부' | '패배' | '미진행',
    quarters: {
      q1: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
      q2: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
      q3: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
      q4: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
      q5: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
      q6: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
    },
    videoUrl: '',
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    // URL 파라미터에서 edit ID 확인
    const editId = searchParams.get('edit');
    if (editId && games.length > 0) {
      const gameToEdit = games.find(g => g.id === editId);
      if (gameToEdit) {
        handleEdit(gameToEdit);
        // URL에서 edit 파라미터 제거
        setSearchParams({});
      }
    }
  }, [games, searchParams]);

  useEffect(() => {
    filterGames();
    setCurrentPage(1);
  }, [games, seasonFilter, dateRange, ageFilter, typeFilter, opponentFilter]);

  useEffect(() => {
    calculateStats();
  }, [filteredGames]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGames = filteredGames.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

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
      stats.goalsFor += game.ourScore || 0;
      stats.goalsAgainst += game.opponentScore || 0;
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


  const handleAdd = () => {
    setEditingGame(null);
    setFormData({
      date: '',
      year: '2026',
      ageGroup: 'U10' as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
      type: '연습경기' as '대회' | '연습경기' | '리그' | '스토브리그',
      opponent: '',
      ourScore: '' as number | '',
      opponentScore: '' as number | '',
      result: '승리' as '승리' | '무승부' | '패배' | '미진행',
      quarters: {
        q1: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
        q2: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
        q3: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
        q4: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
        q5: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
        q6: { our: '' as number | '', opponent: '' as number | '', result: '승리' as '승리' | '무승부' | '패배' | '미진행' },
      },
      videoUrl: '',
    });
    setShowModal(true);
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    const date = game.date.toDate ? game.date.toDate() : new Date(game.date);
    const quarters = game.quarters || {
      q1: { our: 0, opponent: 0 },
      q2: { our: 0, opponent: 0 },
      q3: { our: 0, opponent: 0 },
      q4: { our: 0, opponent: 0 },
      q5: { our: 0, opponent: 0 },
      q6: { our: 0, opponent: 0 },
    };
    setFormData({
      date: date.toISOString().slice(0, 10),
      year: date.getFullYear().toString(),
      ageGroup: (game.ageGroup as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7') || 'U10',
      type: game.type,
      opponent: game.opponent,
      ourScore: game.ourScore === null ? '' : game.ourScore,
      opponentScore: game.opponentScore === null ? '' : game.opponentScore,
      result: (game.result as '승리' | '무승부' | '패배' | '미진행') || '승리',
      quarters: {
        q1: { 
          our: quarters.q1?.our !== undefined && quarters.q1.our !== null ? quarters.q1.our : '', 
          opponent: quarters.q1?.opponent !== undefined && quarters.q1.opponent !== null ? quarters.q1.opponent : '', 
          result: (quarters.q1 as any)?.result || '승리' 
        },
        q2: { 
          our: quarters.q2?.our !== undefined && quarters.q2.our !== null ? quarters.q2.our : '', 
          opponent: quarters.q2?.opponent !== undefined && quarters.q2.opponent !== null ? quarters.q2.opponent : '', 
          result: (quarters.q2 as any)?.result || '승리' 
        },
        q3: { 
          our: quarters.q3?.our !== undefined && quarters.q3.our !== null ? quarters.q3.our : '', 
          opponent: quarters.q3?.opponent !== undefined && quarters.q3.opponent !== null ? quarters.q3.opponent : '', 
          result: (quarters.q3 as any)?.result || '승리' 
        },
        q4: { 
          our: quarters.q4?.our !== undefined && quarters.q4.our !== null ? quarters.q4.our : '', 
          opponent: quarters.q4?.opponent !== undefined && quarters.q4.opponent !== null ? quarters.q4.opponent : '', 
          result: (quarters.q4 as any)?.result || '승리' 
        },
        q5: { 
          our: quarters.q5?.our !== undefined && quarters.q5.our !== null ? quarters.q5.our : '', 
          opponent: quarters.q5?.opponent !== undefined && quarters.q5.opponent !== null ? quarters.q5.opponent : '', 
          result: (quarters.q5 as any)?.result || '승리' 
        },
        q6: { 
          our: quarters.q6?.our !== undefined && quarters.q6.our !== null ? quarters.q6.our : '', 
          opponent: quarters.q6?.opponent !== undefined && quarters.q6.opponent !== null ? quarters.q6.opponent : '', 
          result: (quarters.q6 as any)?.result || '승리' 
        },
      },
      videoUrl: game.videoUrl || '',
    });
    setShowModal(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
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
        opponentLogoUrl: editingGame?.opponentLogoUrl || '',
        ourScore: formData.ourScore === '' ? null : (typeof formData.ourScore === 'number' ? formData.ourScore : parseInt(String(formData.ourScore)) || null),
        opponentScore: formData.opponentScore === '' ? null : (typeof formData.opponentScore === 'number' ? formData.opponentScore : parseInt(String(formData.opponentScore)) || null),
        result: formData.result,
        type: formData.type,
        quarters: {
          q1: { 
            our: formData.quarters.q1.our === '' || formData.quarters.q1.result === '미진행' ? null : (typeof formData.quarters.q1.our === 'number' ? formData.quarters.q1.our : parseInt(String(formData.quarters.q1.our)) || null), 
            opponent: formData.quarters.q1.opponent === '' || formData.quarters.q1.result === '미진행' ? null : (typeof formData.quarters.q1.opponent === 'number' ? formData.quarters.q1.opponent : parseInt(String(formData.quarters.q1.opponent)) || null),
            result: formData.quarters.q1.result
          },
          q2: { 
            our: formData.quarters.q2.our === '' || formData.quarters.q2.result === '미진행' ? null : (typeof formData.quarters.q2.our === 'number' ? formData.quarters.q2.our : parseInt(String(formData.quarters.q2.our)) || null), 
            opponent: formData.quarters.q2.opponent === '' || formData.quarters.q2.result === '미진행' ? null : (typeof formData.quarters.q2.opponent === 'number' ? formData.quarters.q2.opponent : parseInt(String(formData.quarters.q2.opponent)) || null),
            result: formData.quarters.q2.result
          },
          q3: { 
            our: formData.quarters.q3.our === '' || formData.quarters.q3.result === '미진행' ? null : (typeof formData.quarters.q3.our === 'number' ? formData.quarters.q3.our : parseInt(String(formData.quarters.q3.our)) || null), 
            opponent: formData.quarters.q3.opponent === '' || formData.quarters.q3.result === '미진행' ? null : (typeof formData.quarters.q3.opponent === 'number' ? formData.quarters.q3.opponent : parseInt(String(formData.quarters.q3.opponent)) || null),
            result: formData.quarters.q3.result
          },
          q4: { 
            our: formData.quarters.q4.our === '' || formData.quarters.q4.result === '미진행' ? null : (typeof formData.quarters.q4.our === 'number' ? formData.quarters.q4.our : parseInt(String(formData.quarters.q4.our)) || null), 
            opponent: formData.quarters.q4.opponent === '' || formData.quarters.q4.result === '미진행' ? null : (typeof formData.quarters.q4.opponent === 'number' ? formData.quarters.q4.opponent : parseInt(String(formData.quarters.q4.opponent)) || null),
            result: formData.quarters.q4.result
          },
          q5: { 
            our: formData.quarters.q5.our === '' || formData.quarters.q5.result === '미진행' ? null : (typeof formData.quarters.q5.our === 'number' ? formData.quarters.q5.our : parseInt(String(formData.quarters.q5.our)) || null), 
            opponent: formData.quarters.q5.opponent === '' || formData.quarters.q5.result === '미진행' ? null : (typeof formData.quarters.q5.opponent === 'number' ? formData.quarters.q5.opponent : parseInt(String(formData.quarters.q5.opponent)) || null),
            result: formData.quarters.q5.result
          },
          q6: { 
            our: formData.quarters.q6.our === '' || formData.quarters.q6.result === '미진행' ? null : (typeof formData.quarters.q6.our === 'number' ? formData.quarters.q6.our : parseInt(String(formData.quarters.q6.our)) || null), 
            opponent: formData.quarters.q6.opponent === '' || formData.quarters.q6.result === '미진행' ? null : (typeof formData.quarters.q6.opponent === 'number' ? formData.quarters.q6.opponent : parseInt(String(formData.quarters.q6.opponent)) || null),
            result: formData.quarters.q6.result
          },
        },
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
            <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2">
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
              <option value="2026">2026년</option>
              <option value="2027">2027년</option>
              <option value="2028">2028년</option>
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
            <label className="block text-sm font-medium mb-2 text-white">연령</label>
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
              <option value="U8">U8</option>
              <option value="U7">U7</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">경기 유형</label>
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
          <label className="block text-sm font-medium mb-2 text-white">상대팀 검색</label>
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
              <tr className="border-b border-gray-700">
                <th className="text-center p-1.5 text-xs text-white">경기수</th>
                <th className="text-center p-1.5 text-xs text-white">승리</th>
                <th className="text-center p-1.5 text-xs text-white">무</th>
                <th className="text-center p-1.5 text-xs text-white">패배</th>
                <th className="text-center p-1.5 text-xs text-white">득점</th>
                <th className="text-center p-1.5 text-xs text-white">실점</th>
                <th className="text-center p-1.5 text-xs text-white">득실차</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1.5 font-bold text-xs text-white text-center">{stats.total}</td>
                <td className="p-1.5 text-red-500 font-bold text-xs text-center">{stats.wins}</td>
                <td className="p-1.5 text-red-500 font-bold text-xs text-center">{stats.draws}</td>
                <td className="p-1.5 text-red-500 font-bold text-xs text-center">{stats.losses}</td>
                <td className="p-1.5 font-bold text-xs text-white text-center">{stats.goalsFor}</td>
                <td className="p-1.5 font-bold text-xs text-white text-center">{stats.goalsAgainst}</td>
                <td className="p-1.5 font-bold text-xs text-white text-center">
                  {stats.goalDiff >= 0 ? '+' : ''}{stats.goalDiff}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 경기별 일정 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-white">경기별 일정</h2>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredGames.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            showPageNumbers={false}
          />
          <div className="card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-center p-1.5 text-white whitespace-nowrap">날짜</th>
                  <th className="text-center p-1.5 text-white whitespace-nowrap">상대</th>
                  <th className="text-center p-1.5 text-white whitespace-nowrap">스코어</th>
                  <th className="text-center p-1.5 text-white whitespace-nowrap">결과</th>
                  <th className="text-center p-1.5 text-white whitespace-nowrap">연령</th>
                  <th className="text-center p-1.5 text-white whitespace-nowrap">유튜브</th>
                  <th className="text-center p-1.5 text-white whitespace-nowrap">경기종류</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGames.map((game) => (
                  <tr
                    key={game.id}
                    className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleGameClick(game.id)}
                  >
                    <td className="p-1.5 text-gray-300 whitespace-nowrap text-center">{formatDate(game.date)}</td>
                    <td className="p-1.5 font-semibold text-white whitespace-nowrap text-center">{game.opponent}</td>
                    <td className="p-1.5 font-bold text-white text-center whitespace-nowrap">
                      {game.ourScore !== null && game.ourScore !== undefined ? game.ourScore : ''} : {game.opponentScore !== null && game.opponentScore !== undefined ? game.opponentScore : ''}
                    </td>
                    <td className="p-1.5 text-center whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${
                          game.result === '승리'
                            ? 'bg-green-900 text-green-300'
                            : game.result === '무승부'
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {game.result}
                      </span>
                    </td>
                    <td className="p-1.5 text-gray-300 whitespace-nowrap text-center">{game.ageGroup}</td>
                    <td className="p-1.5 text-center whitespace-nowrap">
                      {game.videoUrl ? (
                        <a
                          href={game.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-500 hover:text-red-400 inline-block"
                        >
                          <FilmIcon className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="p-1.5 text-gray-300 whitespace-nowrap text-center">{game.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredGames.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            showTopBar={false}
          />
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center text-gray-400 py-12">경기 결과가 없습니다.</div>
        )}

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full p-6 mt-8 mb-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-white">
                {editingGame ? '경기 수정' : '경기 추가'}
              </h2>
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
                      <option value="2026">2026년</option>
                      <option value="2027">2027년</option>
                      <option value="2028">2028년</option>
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
                      value={formData.ourScore === '' ? '' : formData.ourScore}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData({ ...formData, ourScore: '' });
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setFormData({ ...formData, ourScore: numValue });
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">상대팀 총점 *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="input-field"
                      value={formData.opponentScore === '' ? '' : formData.opponentScore}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData({ ...formData, opponentScore: '' });
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setFormData({ ...formData, opponentScore: numValue });
                          }
                        }
                      }}
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
                      <option value="미진행">미진행</option>
                    </select>
                  </div>
                </div>

                {/* 쿼터별 점수 */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">쿼터별 점수 (선택사항)</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const).map((q, index) => (
                      <div key={q} className="bg-gray-800 rounded-lg p-4">
                        <p className="text-sm text-gray-300 mb-3 font-semibold">{index + 1}쿼터</p>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">우리팀</label>
                            <input
                              type="number"
                              min="0"
                              className="input-field text-sm"
                              disabled={formData.quarters[q].result === '미진행'}
                              value={formData.quarters[q].our === '' ? '' : formData.quarters[q].our}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  setFormData({
                                    ...formData,
                                    quarters: {
                                      ...formData.quarters,
                                      [q]: { ...formData.quarters[q], our: '' },
                                    },
                                  });
                                } else {
                                  const numValue = parseInt(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    setFormData({
                                      ...formData,
                                      quarters: {
                                        ...formData.quarters,
                                        [q]: { ...formData.quarters[q], our: numValue },
                                      },
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">상대팀</label>
                            <input
                              type="number"
                              min="0"
                              className="input-field text-sm"
                              disabled={formData.quarters[q].result === '미진행'}
                              value={formData.quarters[q].opponent === '' ? '' : formData.quarters[q].opponent}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  setFormData({
                                    ...formData,
                                    quarters: {
                                      ...formData.quarters,
                                      [q]: { ...formData.quarters[q], opponent: '' },
                                    },
                                  });
                                } else {
                                  const numValue = parseInt(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    setFormData({
                                      ...formData,
                                      quarters: {
                                        ...formData.quarters,
                                        [q]: { ...formData.quarters[q], opponent: numValue },
                                      },
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">결과</label>
                            <select
                              className="input-field text-sm"
                              value={formData.quarters[q].result}
                              onChange={(e) => {
                                const newResult = e.target.value as any;
                                setFormData({
                                  ...formData,
                                  quarters: {
                                    ...formData.quarters,
                                    [q]: { 
                                      ...formData.quarters[q], 
                                      result: newResult,
                                      // 미진행 선택 시 점수 초기화
                                      our: newResult === '미진행' ? 0 : formData.quarters[q].our,
                                      opponent: newResult === '미진행' ? 0 : formData.quarters[q].opponent,
                                    },
                                  },
                                });
                              }}
                            >
                              <option value="승리">승리</option>
                              <option value="무승부">무승부</option>
                              <option value="패배">패배</option>
                              <option value="미진행">미진행</option>
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
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex-1">저장</button>
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

