import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { OpponentAnalysis } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, FilmIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

type SortField = 'date' | 'teamA' | 'teamB' | 'ageGroup' | 'type' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const OpponentAnalysisPage: React.FC = () => {
  const { userData } = useAuth();
  const [analyses, setAnalyses] = useState<OpponentAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<OpponentAnalysis[]>([]);
  const [sortedAnalyses, setSortedAnalyses] = useState<OpponentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<OpponentAnalysis | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [ageFilter, setAgeFilter] = useState<string>('전체');
  const [teamFilter, setTeamFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    teamA: '',
    teamB: '',
    teamAScore: '' as number | '',
    teamBScore: '' as number | '',
    ageGroup: 'U12' as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
    videoUrl: '',
    type: '연습경기' as '대회' | '연습경기' | '리그' | '스토브리그',
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchAnalyses();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, dateRange, ageFilter, teamFilter]);

  useEffect(() => {
    sortAnalyses();
  }, [filteredAnalyses, sortField, sortDirection]);

  const fetchAnalyses = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      // 등록순 정렬 (최근 등록이 상단)
      const q = query(collection(db, 'opponentAnalyses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const analysesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OpponentAnalysis[];
      setAnalyses(analysesData);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnalyses = () => {
    let filtered = [...analyses];

    // 날짜 필터
    if (dateRange.start) {
      filtered = filtered.filter((a) => {
        const date = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        return date >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter((a) => {
        const date = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return date <= endDate;
      });
    }

    // 연령 필터
    if (ageFilter !== '전체') {
      filtered = filtered.filter((a) => a.ageGroup === ageFilter);
    }

    // 상대팀 검색 필터
    if (teamFilter.trim()) {
      const searchTerm = teamFilter.trim().toLowerCase();
      filtered = filtered.filter((a) => 
        a.teamA.toLowerCase().includes(searchTerm) || 
        a.teamB.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredAnalyses(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  const sortAnalyses = () => {
    let sorted = [...filteredAnalyses];

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          bValue = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          break;
        case 'teamA':
          aValue = a.teamA.toLowerCase();
          bValue = b.teamA.toLowerCase();
          break;
        case 'teamB':
          aValue = a.teamB.toLowerCase();
          bValue = b.teamB.toLowerCase();
          break;
        case 'ageGroup':
          aValue = a.ageGroup;
          bValue = b.ageGroup;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'createdAt':
          aValue = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          bValue = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setSortedAnalyses(sorted);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const isNew = (createdAt: any) => {
    if (!createdAt) return false;
    const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-3 h-3 inline ml-1" />
    );
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedAnalyses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAnalyses = sortedAnalyses.slice(startIndex, endIndex);

  const handleAdd = () => {
    setEditingAnalysis(null);
    setFormData({
      date: '',
      teamA: '',
      teamB: '',
      teamAScore: '',
      teamBScore: '',
      ageGroup: 'U12',
      videoUrl: '',
      type: '연습경기',
    });
    setShowModal(true);
  };

  const handleEdit = (analysis: OpponentAnalysis) => {
    setEditingAnalysis(analysis);
    const date = analysis.date?.toDate ? analysis.date.toDate() : new Date(analysis.date);
    setFormData({
      date: format(date, 'yyyy-MM-dd'),
      teamA: analysis.teamA,
      teamB: analysis.teamB,
      teamAScore: analysis.teamAScore ?? '',
      teamBScore: analysis.teamBScore ?? '',
      ageGroup: analysis.ageGroup,
      videoUrl: analysis.videoUrl || '',
      type: analysis.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?') || !db) return;

    try {
      await deleteDoc(doc(db, 'opponentAnalyses', id));
      fetchAnalyses();
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      alert('Firebase 설정이 필요합니다.');
      return;
    }

    try {
      const dateObj = new Date(formData.date);
      const analysisData = {
        date: dateObj,
        teamA: formData.teamA,
        teamB: formData.teamB,
        teamAScore: formData.teamAScore === '' ? '' : (typeof formData.teamAScore === 'number' ? formData.teamAScore : parseInt(String(formData.teamAScore)) || ''),
        teamBScore: formData.teamBScore === '' ? '' : (typeof formData.teamBScore === 'number' ? formData.teamBScore : parseInt(String(formData.teamBScore)) || ''),
        ageGroup: formData.ageGroup,
        videoUrl: formData.videoUrl,
        type: formData.type,
        createdAt: editingAnalysis?.createdAt || serverTimestamp(),
      };

      if (editingAnalysis) {
        await updateDoc(doc(db, 'opponentAnalyses', editingAnalysis.id), analysisData);
      } else {
        await addDoc(collection(db, 'opponentAnalyses'), analysisData);
      }

      setShowModal(false);
      fetchAnalyses();
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const formatDate = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    const year = d.getFullYear().toString().slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}.`;
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
        <h1 className="text-3xl font-bold text-white">상대팀 분석</h1>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>영상 등록</span>
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">시작일</label>
            <input
              type="date"
              className="input-field"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">종료일</label>
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
            <label className="block text-sm font-medium mb-2 text-white">상대팀 검색</label>
            <input
              type="text"
              className="input-field"
              placeholder="팀명 입력"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 페이지네이션 컨트롤 (상단) */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 whitespace-nowrap">
          <label className="text-sm text-white whitespace-nowrap">표시 개수:</label>
          <select
            className="input-field text-sm py-1 px-2"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
        <div className="text-sm text-gray-400 whitespace-nowrap">
          총 {sortedAnalyses.length}개 중 {startIndex + 1}-{Math.min(endIndex, sortedAnalyses.length)}개 표시
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              <th 
                className="text-center p-1.5 text-white whitespace-nowrap cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('date')}
              >
                날짜 {getSortIcon('date')}
              </th>
              <th 
                className="text-center p-1.5 text-white whitespace-nowrap cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('teamA')}
              >
                A팀 {getSortIcon('teamA')}
              </th>
              <th 
                className="text-center p-1.5 text-white whitespace-nowrap cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('teamB')}
              >
                B팀 {getSortIcon('teamB')}
              </th>
              <th 
                className="text-center p-1.5 text-white whitespace-nowrap cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('ageGroup')}
              >
                연령 {getSortIcon('ageGroup')}
              </th>
              <th className="text-center p-1.5 text-white whitespace-nowrap">영상</th>
              <th 
                className="text-center p-1.5 text-white whitespace-nowrap cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('type')}
              >
                경기종류 {getSortIcon('type')}
              </th>
              {isAdmin && (
                <th className="text-center p-1.5 text-white whitespace-nowrap">관리</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedAnalyses.map((analysis) => {
              const scoreA = analysis.teamAScore === '' || analysis.teamAScore === null ? null : analysis.teamAScore;
              const scoreB = analysis.teamBScore === '' || analysis.teamBScore === null ? null : analysis.teamBScore;
              const isNewItem = isNew(analysis.createdAt);
              
              return (
                <tr key={analysis.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-1.5 text-white text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      {isNewItem && (
                        <span className="text-xs text-red-500 font-bold mb-1">🆕 NEW</span>
                      )}
                      <span>{formatDate(analysis.date)}</span>
                    </div>
                  </td>
                  <td className="p-1.5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-white whitespace-nowrap">{analysis.teamA}</span>
                      {scoreA !== null && (
                        <span className="text-white font-semibold whitespace-nowrap">{scoreA}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-1.5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-white whitespace-nowrap">{analysis.teamB}</span>
                      {scoreB !== null && (
                        <span className="text-white font-semibold whitespace-nowrap">{scoreB}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-1.5 text-white text-center whitespace-nowrap">{analysis.ageGroup}</td>
                  <td className="p-1.5 text-center whitespace-nowrap">
                    {analysis.videoUrl ? (
                      <a
                        href={analysis.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 inline-block"
                      >
                        <FilmIcon className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-1.5 text-white text-center whitespace-nowrap">{analysis.type}</td>
                  {isAdmin && (
                    <td className="p-1.5 text-center whitespace-nowrap">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleEdit(analysis)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(analysis.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {paginatedAnalyses.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            분석 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 페이지네이션 (하단) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            다음
          </button>
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {editingAnalysis ? '영상 수정' : '영상 등록'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-2 text-white">A팀 *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.teamA}
                  onChange={(e) => setFormData({ ...formData, teamA: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">B팀 *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.teamB}
                  onChange={(e) => setFormData({ ...formData, teamB: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">A팀 스코어</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="미입력 시 공란"
                    value={formData.teamAScore === '' ? '' : formData.teamAScore}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData({ ...formData, teamAScore: '' });
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setFormData({ ...formData, teamAScore: numValue });
                        }
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">B팀 스코어</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="미입력 시 공란"
                    value={formData.teamBScore === '' ? '' : formData.teamBScore}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData({ ...formData, teamBScore: '' });
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setFormData({ ...formData, teamBScore: numValue });
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">연령 *</label>
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
              <div>
                <label className="block text-sm font-medium mb-2 text-white">유튜브 URL</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://www.youtube.com/..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">경기종류 *</label>
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
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex-1"
                >
                  저장
                </button>
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

export default OpponentAnalysisPage;
