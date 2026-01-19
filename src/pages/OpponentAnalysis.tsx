import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { OpponentAnalysis } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, FilmIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const OpponentAnalysisPage: React.FC = () => {
  const { userData } = useAuth();
  const [analyses, setAnalyses] = useState<OpponentAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<OpponentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<OpponentAnalysis | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [ageFilter, setAgeFilter] = useState<string>('전체');
  const [teamFilter, setTeamFilter] = useState('');
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

  const fetchAnalyses = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'opponentAnalyses'), orderBy('date', 'desc'));
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
        endDate.setHours(23, 59, 59, 999); // 종료일 하루 끝까지 포함
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
  };

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
        createdAt: editingAnalysis?.createdAt || new Date(),
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

  const getVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
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

      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-center p-1.5 text-white whitespace-nowrap">날짜</th>
              <th className="text-center p-1.5 text-white whitespace-nowrap">A팀</th>
              <th className="text-center p-1.5 text-white whitespace-nowrap">B팀</th>
              <th className="text-center p-1.5 text-white whitespace-nowrap">연령</th>
              <th className="text-center p-1.5 text-white whitespace-nowrap">영상</th>
              <th className="text-center p-1.5 text-white whitespace-nowrap">경기종류</th>
              {isAdmin && (
                <th className="text-center p-1.5 text-white whitespace-nowrap">관리</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAnalyses.map((analysis) => {
              const scoreA = analysis.teamAScore === '' || analysis.teamAScore === null ? null : analysis.teamAScore;
              const scoreB = analysis.teamBScore === '' || analysis.teamBScore === null ? null : analysis.teamBScore;
              
              return (
                <tr key={analysis.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-1.5 text-white text-center whitespace-nowrap">{formatDate(analysis.date)}</td>
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

        {filteredAnalyses.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            분석 데이터가 없습니다.
          </div>
        )}
      </div>

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

