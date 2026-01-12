import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Schedule } from '../types';

import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Calendar: React.FC = () => {
  const { userData } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('전체');
  const [typeFilter, setTypeFilter] = useState<string>('전체');
  const [ageFilter, setAgeFilter] = useState<string>('전체');
  const [formData, setFormData] = useState({
    ageGroup: 'U12' as 'U12' | 'U11' | 'U10' | 'U9',
    homeAway: 'HOME' as 'HOME' | 'AWAY',
    opponent: '',
    dateTime: '',
    type: '연습경기' as '대회' | '연습경기' | '리그' | '스토브리그',
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, yearFilter, typeFilter, ageFilter]);

  const fetchSchedules = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'schedules'), orderBy('dateTime', 'asc'));
      const querySnapshot = await getDocs(q);
      const schedulesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Schedule[];

      setSchedules(schedulesData);

      // 가장 가까운 2개 일정
      const now = new Date();
      const upcoming = schedulesData
        .filter((s) => {
          const scheduleDate = s.dateTime.toDate ? s.dateTime.toDate() : new Date(s.dateTime);
          return scheduleDate >= now;
        })
        .slice(0, 2);
      setUpcomingSchedules(upcoming);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = [...schedules];

    if (yearFilter !== '전체') {
      const year = parseInt(yearFilter);
      filtered = filtered.filter((s) => {
        const date = s.dateTime.toDate ? s.dateTime.toDate() : new Date(s.dateTime);
        return date.getFullYear() === year;
      });
    }

    if (typeFilter !== '전체') {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    if (ageFilter !== '전체') {
      filtered = filtered.filter((s) => s.ageGroup === ageFilter);
    }

    setFilteredSchedules(filtered);
    setPage(1);
  };

  const formatDateTime = (dateTime: any) => {
    const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
    return {
      date: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };
  };

  const isPast = (dateTime: any) => {
    const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
    return date < new Date();
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    setFormData({
      ageGroup: 'U12',
      homeAway: 'HOME',
      opponent: '',
      dateTime: '',
      type: '연습경기',
    });
    setShowModal(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    const date = schedule.dateTime.toDate ? schedule.dateTime.toDate() : new Date(schedule.dateTime);
    setFormData({
      ageGroup: schedule.ageGroup,
      homeAway: schedule.homeAway,
      opponent: schedule.opponent,
      dateTime: date.toISOString().slice(0, 16),
      type: schedule.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?') || !db) return;

    try {
      await deleteDoc(doc(db, 'schedules', id));
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
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
      const scheduleData = {
        ageGroup: formData.ageGroup,
        homeAway: formData.homeAway,
        opponent: formData.opponent,
        dateTime: new Date(formData.dateTime),
        type: formData.type,
        createdAt: editingSchedule?.createdAt || new Date(),
      };

      if (editingSchedule) {
        await updateDoc(doc(db, 'schedules', editingSchedule.id), scheduleData);
      } else {
        await addDoc(collection(db, 'schedules'), scheduleData);
      }

      setShowModal(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const getYears = () => {
    const years = new Set<number>();
    schedules.forEach((s) => {
      const date = s.dateTime.toDate ? s.dateTime.toDate() : new Date(s.dateTime);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const paginatedSchedules = filteredSchedules.slice(0, page * itemsPerPage);
  const hasMore = filteredSchedules.length > page * itemsPerPage;

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
          <h1 className="text-3xl font-bold">일정</h1>
          {isAdmin && (
            <button onClick={handleAdd} className="btn-primary flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>일정 추가</span>
            </button>
          )}
        </div>

        {/* 예정 일정 */}
        {upcomingSchedules.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">예정 일정</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSchedules.map((schedule) => {
                const { date, time } = formatDateTime(schedule.dateTime);
                return (
                  <div key={schedule.id} className="card bg-gray-900 border-gold-500 border-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gold">
                        경기 {schedule.ageGroup} {schedule.homeAway}
                      </h3>
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-gold-400 hover:text-gold-300"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm mb-1 whitespace-nowrap overflow-hidden text-ellipsis text-white">{schedule.opponent} vs NYJ BJ UTD U12</p>
                    <p className="text-gray-300 text-sm">{date} {time}</p>
                    <p className="text-sm text-gray-400 mt-2">{schedule.type}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 필터 */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-4">전체 일정</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">연도</label>
              <select
                className="input-field"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
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
              <label className="block text-sm font-medium mb-2">유형</label>
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
          </div>
        </section>

        {/* 일정 리스트 */}
        <div className="space-y-2">
          {paginatedSchedules.map((schedule) => {
            const { full } = formatDateTime(schedule.dateTime);
            const past = isPast(schedule.dateTime);
            return (
              <div
                key={schedule.id}
                className={`card flex items-center justify-between ${
                  past ? 'bg-gray-800 text-gray-500' : 'bg-gray-900'
                }`}
              >
                <div className="flex-1">
                  <span className="font-semibold">
                    경기 {schedule.ageGroup} {schedule.homeAway}
                  </span>
                  {' | '}
                  <span>{schedule.opponent} vs NYJ BJ UTD U12</span>
                  {' | '}
                  <span>{full}</span>
                  {' | '}
                  <span>{schedule.type}</span>
                </div>
                {isAdmin && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="text-gold-600 hover:text-gold-700"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {paginatedSchedules.length === 0 && (
          <div className="text-center text-gray-400 py-12">일정이 없습니다.</div>
        )}

        {hasMore && (
          <div className="text-center mt-6">
            <button onClick={() => setPage(page + 1)} className="btn-outline">
              더보기
            </button>
          </div>
        )}

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">
                {editingSchedule ? '일정 수정' : '일정 추가'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm font-medium mb-2 text-white">홈/어웨이 *</label>
                  <select
                    required
                    className="input-field"
                    value={formData.homeAway}
                    onChange={(e) => setFormData({ ...formData, homeAway: e.target.value as any })}
                  >
                    <option value="HOME">HOME</option>
                    <option value="AWAY">AWAY</option>
                  </select>
                </div>
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
                  <label className="block text-sm font-medium mb-2 text-white">날짜/시간 *</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.dateTime}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  />
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

export default Calendar;

