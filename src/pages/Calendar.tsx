import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Schedule } from '../types';

import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

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
    ageGroup: 'U12' as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
    homeAway: 'HOME' as 'HOME' | 'AWAY',
    opponent: '',
    dateTime: '',
    type: '연습경기' as '대회' | '연습경기' | '리그' | '스토브리그',
    location: '',
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [countdowns, setCountdowns] = useState<{ [key: string]: { days: number; hours: number; minutes: number; seconds: number } }>({});

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, yearFilter, typeFilter, ageFilter]);

  useEffect(() => {
    // 카운트다운 업데이트
    const updateCountdowns = () => {
      const now = new Date();
      const newCountdowns: { [key: string]: { days: number; hours: number; minutes: number; seconds: number } } = {};
      
      upcomingSchedules.forEach((schedule) => {
        const scheduleDate = schedule.dateTime.toDate ? schedule.dateTime.toDate() : new Date(schedule.dateTime);
        const diff = scheduleDate.getTime() - now.getTime();
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          newCountdowns[schedule.id] = { days, hours, minutes, seconds };
        } else {
          newCountdowns[schedule.id] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
      });
      
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    
    return () => clearInterval(interval);
  }, [upcomingSchedules]);

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
    const now = new Date();

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

    // 지나간 일정과 남아있는 일정 분리 (시간까지 고려)
    const pastSchedules = filtered.filter((s) => {
      const date = s.dateTime.toDate ? s.dateTime.toDate() : new Date(s.dateTime);
      return date.getTime() < now.getTime();
    });

    const upcomingSchedules = filtered.filter((s) => {
      const date = s.dateTime.toDate ? s.dateTime.toDate() : new Date(s.dateTime);
      return date.getTime() >= now.getTime();
    });

    // 남아있는 일정: 날짜 오름차순 (가장 먼저 올 일정이 위로)
    upcomingSchedules.sort((a, b) => {
      const dateA = a.dateTime.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
      const dateB = b.dateTime.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
      return dateA.getTime() - dateB.getTime();
    });

    // 지나간 일정: 날짜 내림차순 (가장 최근에 지나간 일정이 위로, 가장 오래된 일정이 밑으로)
    pastSchedules.sort((a, b) => {
      const dateA = a.dateTime.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
      const dateB = b.dateTime.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
      return dateB.getTime() - dateA.getTime(); // 내림차순 (가장 최근 일정이 위로, 가장 오래된 일정이 밑으로)
    });

    // 최종 정렬: 남아있는 일정들 + 지나간 일정들
    const sorted = [...upcomingSchedules, ...pastSchedules];

    setFilteredSchedules(sorted);
    setPage(1);
  };

  const formatDateTime = (dateTime: any) => {
    const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return {
      date: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      weekday: weekdays[date.getDay()],
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
      ageGroup: 'U12' as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
      homeAway: 'HOME',
      opponent: '',
      dateTime: '',
      type: '연습경기',
      location: '',
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
      location: (schedule as any).location || '',
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
        location: formData.location,
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
            <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>일정 추가</span>
            </button>
          )}
        </div>

        {/* 다가오는 일정 */}
        {upcomingSchedules.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">다가오는 일정</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSchedules.map((schedule) => {
                const { date, weekday, time } = formatDateTime(schedule.dateTime);
                const countdown = countdowns[schedule.id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };
                const location = (schedule as any).location || '장소 미정';
                const teamName = schedule.homeAway === 'HOME' 
                  ? `NYJ BJ UTD U12 vs ${schedule.opponent}`
                  : `${schedule.opponent} vs NYJ BJ UTD U12`;
                
                return (
                  <div key={schedule.id} className="card bg-gray-900 border-2 border-red-500 p-4">
                    {/* 경기 레이블 */}
                    <div className="mb-3">
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">경기</span>
                    </div>
                    
                    {/* 팀명 vs 팀명 */}
                    <p className="text-white font-bold mb-3">{teamName}</p>
                    
                    {/* 날짜/시간 */}
                    <div className="flex items-center space-x-2 mb-2 text-sm text-gray-300">
                      <CalendarIcon className="w-4 h-4 text-blue-400" />
                      <span>{date} {weekday}</span>
                      <ClockIcon className="w-4 h-4 ml-2 text-gray-400" />
                      <span>{time}</span>
                    </div>
                    
                    {/* 위치 */}
                    <div className="flex items-center space-x-2 mb-2 text-sm text-gray-300">
                      <MapPinIcon className="w-4 h-4 text-pink-400" />
                      <span>{location}</span>
                    </div>
                    
                    {/* 경기 종류 */}
                    <div className="flex items-center space-x-2 mb-3 text-sm">
                      <span className="text-lg">⚽</span>
                      <span className="text-red-500">{schedule.type}</span>
                    </div>
                    
                    {/* 구분선 */}
                    <div className="border-t border-gray-700 my-3"></div>
                    
                    {/* 다가오는 경기 일정 */}
                    <p className="text-center text-sm text-white mb-2">다가오는 경기 일정</p>
                    
                    {/* 카운트다운 */}
                    <div className="flex justify-center items-center space-x-2">
                      <div className="text-center">
                        <div className="text-red-500 text-2xl font-bold">
                          {String(countdown.days).padStart(2, '0')}
                        </div>
                        <div className="text-white text-xs">일</div>
                      </div>
                      <span className="text-red-500 text-xl">:</span>
                      <div className="text-center">
                        <div className="text-red-500 text-2xl font-bold">
                          {String(countdown.hours).padStart(2, '0')}
                        </div>
                        <div className="text-white text-xs">시</div>
                      </div>
                      <span className="text-red-500 text-xl">:</span>
                      <div className="text-center">
                        <div className="text-red-500 text-2xl font-bold">
                          {String(countdown.minutes).padStart(2, '0')}
                        </div>
                        <div className="text-white text-xs">분</div>
                      </div>
                      <span className="text-red-500 text-xl">:</span>
                      <div className="text-center">
                        <div className="text-red-500 text-2xl font-bold">
                          {String(countdown.seconds).padStart(2, '0')}
                        </div>
                        <div className="text-white text-xs">초</div>
                      </div>
                    </div>
                    
                    {/* 관리자 버튼 */}
                    {isAdmin && (
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-blue-400 hover:text-blue-300"
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
              <label className="block text-sm font-medium mb-2 text-white">연도</label>
              <select
                className="input-field"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="전체">전체</option>
                <option value="2027">2027</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">유형</label>
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
          </div>
        </section>

        {/* 일정 리스트 */}
        <div className="space-y-4">
          {paginatedSchedules.map((schedule) => {
            const { date, weekday, time } = formatDateTime(schedule.dateTime);
            const past = isPast(schedule.dateTime);
            const location = (schedule as any).location || '장소 미정';
            const teamName = schedule.homeAway === 'HOME' 
              ? `NYJ BJ UTD U12 vs ${schedule.opponent}`
              : `${schedule.opponent} vs NYJ BJ UTD U12`;
            
            return (
              <div
                key={schedule.id}
                className="card bg-gray-900 p-4"
              >
                {/* 태그 */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">경기</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    schedule.homeAway === 'HOME' ? 'bg-blue-500' : 'bg-blue-600'
                  } text-white`}>
                    {schedule.homeAway}
                  </span>
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {schedule.ageGroup}
                  </span>
                  {past && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      종료
                    </span>
                  )}
                </div>
                
                {/* 팀명 vs 팀명 */}
                <p className="text-white font-bold mb-3">{teamName}</p>
                
                {/* 날짜/시간 */}
                <div className="flex items-center space-x-2 mb-2 text-sm text-gray-300">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span>{date} {weekday}</span>
                  <ClockIcon className="w-4 h-4 ml-2 text-gray-400" />
                  <span>{time}</span>
                </div>
                
                {/* 위치 및 경기 종류 (한 줄) */}
                <div className="flex items-center space-x-2 mb-3 text-sm text-gray-300">
                  <MapPinIcon className="w-4 h-4 text-pink-400" />
                  <span>{location}</span>
                  <span className="text-lg ml-2">⚽</span>
                  <span className="text-red-500">{schedule.type}</span>
                </div>
                
                {/* 관리자 버튼 */}
                {isAdmin && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors flex items-center space-x-1"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span className="text-sm">수정</span>
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center space-x-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span className="text-sm">삭제</span>
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
                    <option value="U8">U8</option>
                    <option value="U7">U7</option>
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
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">위치</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="예: 남양주체육문화센터"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
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

export default Calendar;

