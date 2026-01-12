import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { MainContent, Schedule } from '../types';
import { TextEditModal } from '../components/TextEditModal';
import { PencilIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

const Main: React.FC = () => {
  const { userData } = useAuth();
  const [content, setContent] = useState<MainContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notice' | 'uniform'>('notice');
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [countdowns, setCountdowns] = useState<{ [key: string]: { days: number; hours: number; minutes: number; seconds: number } }>({});
  
  // 모달 상태
  const [isClubIntroModalOpen, setIsClubIntroModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  const isAdmin = userData?.role === 'admin';

  // 이미지 슬라이드 관련 useEffect
  useEffect(() => {
    if (!content?.images || content.images.length === 0) {
      setCurrentImageIndex(0);
      return;
    }

    if (isAutoPlaying && content.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % content.images.length);
      }, 3000); // 3초마다 자동 슬라이드

      return () => clearInterval(interval);
    }
  }, [content?.images, isAutoPlaying]);

  // 컨텐츠 로드 useEffect
  useEffect(() => {
    fetchContent();
    fetchUpcomingSchedules();
  }, []);

  // 카운트다운 업데이트
  useEffect(() => {
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

  const fetchContent = async () => {
    if (!db) {
      const defaultContent: MainContent = {
        images: [],
        clubIntro: {
          title: 'NYJ BJ UTD U12',
          content: '유소년 축구클럽에 오신 것을 환영합니다.',
        },
        management: {
          title: '경영진 소개',
          subtitle: '우리 클럽을 이끄는 분들',
          content: '경영진 소개 내용을 입력해주세요.',
        },
        schedule: {
          title: '주요 일정',
          subtitle: '이번 달 주요 일정',
          content: '주요 일정 내용을 입력해주세요.',
        },
        notice: {
          title: '공지사항',
          content: '공지사항 내용을 입력해주세요.',
        },
        uniform: {
          home: '',
          away: '',
          third: '',
        },
      };
      setContent(defaultContent);
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContent(docSnap.data() as MainContent);
      } else {
        const defaultContent: MainContent = {
          images: [],
          clubIntro: {
            title: 'NYJ BJ UTD U12',
            content: '유소년 축구클럽에 오신 것을 환영합니다.',
          },
          management: {
            title: '경영진 소개',
            subtitle: '우리 클럽을 이끄는 분들',
            content: '경영진 소개 내용을 입력해주세요.',
          },
          schedule: {
            title: '주요 일정',
            subtitle: '이번 달 주요 일정',
            content: '주요 일정 내용을 입력해주세요.',
          },
          notice: {
            title: '공지사항',
            content: '공지사항 내용을 입력해주세요.',
          },
          uniform: {
            home: '',
            away: '',
            third: '',
          },
        };
        setContent(defaultContent);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      const defaultContent: MainContent = {
        images: [],
        clubIntro: {
          title: 'NYJ BJ UTD U12',
          content: '유소년 축구클럽에 오신 것을 환영합니다.',
        },
        management: {
          title: '경영진 소개',
          subtitle: '우리 클럽을 이끄는 분들',
          content: '경영진 소개 내용을 입력해주세요.',
        },
        schedule: {
          title: '주요 일정',
          subtitle: '이번 달 주요 일정',
          content: '주요 일정 내용을 입력해주세요.',
        },
        notice: {
          title: '공지사항',
          content: '공지사항 내용을 입력해주세요.',
        },
        uniform: {
          home: '',
          away: '',
          third: '',
        },
      };
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingSchedules = async () => {
    if (!db) return;
    try {
      const now = new Date();
      const q = query(
        collection(db, 'schedules'),
        where('dateTime', '>=', now),
        orderBy('dateTime', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const schedules = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Schedule[];
      setUpcomingSchedules(schedules.slice(0, 2));
    } catch (error) {
      console.error('Error fetching upcoming schedules:', error);
    }
  };

  const handleClubIntroSave = async (title: string, _subtitle: string, contentHtml: string) => {
    if (!db || !content) return;
    try {
      const updatedContent = { ...content, clubIntro: { title, content: contentHtml } };
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
      } else {
        await setDoc(docRef, updatedContent as any);
      }
      
      setContent(updatedContent);
      setIsClubIntroModalOpen(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert('저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  const handleManagementSave = async (title: string, subtitle: string, contentHtml: string) => {
    if (!db || !content) return;
    try {
      const updatedContent = { ...content, management: { title, subtitle, content: contentHtml } };
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
      } else {
        await setDoc(docRef, updatedContent as any);
      }
      
      setContent(updatedContent);
      setIsManagementModalOpen(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert('저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  const handleScheduleSave = async (title: string, subtitle: string, contentHtml: string) => {
    if (!db || !content) return;
    try {
      const updatedContent = { ...content, schedule: { title, subtitle, content: contentHtml } };
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
      } else {
        await setDoc(docRef, updatedContent as any);
      }
      
      setContent(updatedContent);
      setIsScheduleModalOpen(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert('저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  const handleNoticeSave = async (title: string, _subtitle: string, contentHtml: string) => {
    if (!db || !content) return;
    try {
      const updatedContent = { ...content, notice: { title, content: contentHtml } };
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
      } else {
        await setDoc(docRef, updatedContent as any);
      }
      
      setContent(updatedContent);
      setIsNoticeModalOpen(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      alert('저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  const handleUniformImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'home' | 'away' | 'third') => {
    const file = e.target.files?.[0];
    if (!file || !content || !storage || !db) {
      alert('Firebase 설정이 필요합니다.');
      return;
    }

    try {
      const storageRef = ref(storage, `uniforms/${type}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const updatedContent: MainContent = {
        ...content,
        uniform: {
          home: content.uniform?.home || '',
          away: content.uniform?.away || '',
          third: content.uniform?.third || '',
          [type]: downloadURL,
        },
      };
      
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
      } else {
        await setDoc(docRef, updatedContent as any);
      }
      
      setContent(updatedContent);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleImageDelete = async (type: 'home' | 'away' | 'third') => {
    if (!confirm('정말 이 이미지를 삭제하시겠습니까?') || !content || !db) {
      return;
    }

    try {
      const updatedContent: MainContent = {
        ...content,
        uniform: {
          home: content.uniform?.home || '',
          away: content.uniform?.away || '',
          third: content.uniform?.third || '',
          [type]: '',
        },
      };
      
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
      } else {
        await setDoc(docRef, updatedContent as any);
      }
      
      setContent(updatedContent);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  const formatDateTime = (dateTime: any) => {
    const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return {
      date: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      weekday: weekdays[date.getDay()],
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (!content) {
      alert('컨텐츠를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!storage) {
      alert('Firebase Storage가 설정되지 않았습니다. 관리자에게 문의하세요.');
      console.error('Storage is null');
      return;
    }

    if (!db) {
      alert('Firebase Firestore가 설정되지 않았습니다. 관리자에게 문의하세요.');
      console.error('Database is null');
      return;
    }

    // 최대 5개 이미지 제한
    if (content.images && content.images.length >= 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
      console.log('Uploading image to:', storageRef.fullPath);
      
      await uploadBytes(storageRef, file);
      console.log('Image uploaded successfully');
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);

      const updatedImages = [...(content.images || []), downloadURL];
      const updatedContent = { ...content, images: updatedImages };
      
      // 문서가 존재하는지 확인 후 업데이트 또는 생성
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
        console.log('Content updated in Firestore');
      } else {
        await setDoc(docRef, updatedContent as any);
        console.log('Content created in Firestore');
      }
      
      setContent(updatedContent);
      alert('이미지가 성공적으로 업로드되었습니다.');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = '이미지 업로드에 실패했습니다.';
      if (error.code === 'storage/unauthorized') {
        errorMessage = '이미지 업로드 권한이 없습니다. Firebase Storage 규칙을 확인하세요.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = '저장 공간이 부족합니다.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = '업로드가 취소되었습니다.';
      } else if (error.message) {
        errorMessage = `이미지 업로드 실패: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const handleGalleryImageDelete = async (_imageUrl: string, index: number) => {
    if (!confirm('정말 이 이미지를 삭제하시겠습니까?') || !content || !db) {
      return;
    }

    try {
      const updatedImages = content.images.filter((_, i) => i !== index);
      const updatedContent = { ...content, images: updatedImages };
      
      // 문서가 존재하는지 확인 후 업데이트 또는 생성
      const docRef = doc(db, 'mainContent', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, updatedContent as any);
        console.log('Content updated after image deletion');
      } else {
        await setDoc(docRef, updatedContent as any);
        console.log('Content created after image deletion');
      }
      
      setContent(updatedContent);
      alert('이미지가 성공적으로 삭제되었습니다.');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert('이미지 삭제에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  const handlePrevImage = () => {
    if (!content?.images || content.images.length === 0) return;
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => (prev - 1 + content.images.length) % content.images.length);
  };

  const handleNextImage = () => {
    if (!content?.images || content.images.length === 0) return;
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => (prev + 1) % content.images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.currentTarget as HTMLElement).setAttribute('data-touch-x', touch.clientX.toString());
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const startX = parseFloat((e.currentTarget as HTMLElement).getAttribute('data-touch-x') || '0');
    const diff = startX - touch.clientX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
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
      {/* 이미지 갤러리 슬라이더 */}
      {content?.images && content.images.length > 0 && (
        <section className="mb-12">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {content.images.map((img, index) => (
                <div key={index} className="min-w-full h-full relative">
                  <img src={img} alt={`클럽 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                  {isAdmin && (
                    <button
                      onClick={() => handleGalleryImageDelete(img, index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* 네비게이션 화살표 */}
            {content.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                  aria-label="이전 이미지"
                >
                  ←
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                  aria-label="다음 이미지"
                >
                  →
                </button>
              </>
            )}

            {/* 인디케이터 */}
            {content.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {content.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-gold-500 w-6' : 'bg-gray-500'
                    }`}
                    aria-label={`이미지 ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 이미지 추가 버튼 (한 줄) */}
          {isAdmin && (
            <div className="mt-2">
              <label className="w-full border border-dashed border-gray-600 rounded px-4 py-2 flex items-center justify-center cursor-pointer hover:border-gold-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={content.images && content.images.length >= 5}
                />
                <span className="text-gray-400 hover:text-gold-500 text-sm">
                  {content.images && content.images.length >= 5 
                    ? '이미지는 최대 5개까지 업로드할 수 있습니다.' 
                    : '+ 이미지 추가'}
                </span>
              </label>
            </div>
          )}
        </section>
      )}

      {/* 이미지가 없을 때 */}
      {(!content?.images || content.images.length === 0) && isAdmin && (
        <section className="mb-12">
          <label className="w-full border border-dashed border-gray-600 rounded px-4 py-2 flex items-center justify-center cursor-pointer hover:border-gold-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <span className="text-gray-400 hover:text-gold-500 text-sm">+ 이미지 추가</span>
          </label>
        </section>
      )}

      {/* 공지 / 유니폼 버튼 */}
      <section className="mb-12">
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setActiveTab('notice')}
            className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
              activeTab === 'notice'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            공지
          </button>
          <button
            onClick={() => setActiveTab('uniform')}
            className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
              activeTab === 'uniform'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            유니폼
          </button>
        </div>
      </section>

      {/* 공지 페이지 */}
      {activeTab === 'notice' && (
        <div className="space-y-6">
          {/* NYJ BJ UTD U12 (클럽 소개) */}
          <section className="mb-12">
            <div className="card">
              <div className="relative">
                {isAdmin && (
                  <button
                    onClick={() => setIsClubIntroModalOpen(true)}
                    className="absolute top-0 right-0 p-2 text-gold-500 hover:text-gold-600"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-3xl font-bold mb-4 text-white">{content?.clubIntro.title}</h2>
                <div 
                  className="text-gray-300 whitespace-pre-line" 
                  dangerouslySetInnerHTML={{ __html: content?.clubIntro.content || '' }}
                />
              </div>
            </div>
          </section>

          {/* 지도진 구성 (경영진 소개) */}
          <section className="mb-12">
            <div className="card">
              <div className="relative">
                {isAdmin && (
                  <button
                    onClick={() => setIsManagementModalOpen(true)}
                    className="absolute top-0 right-0 p-2 text-gold-500 hover:text-gold-600"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-3xl font-bold mb-2 text-white">{content?.management.title}</h2>
                <h3 className="text-xl text-gray-400 mb-4">{content?.management.subtitle}</h3>
                <div 
                  className="text-gray-300 whitespace-pre-line" 
                  dangerouslySetInnerHTML={{ __html: content?.management.content || '' }}
                />
              </div>
            </div>
          </section>

          {/* 주요 일정 */}
          <section className="mb-12">
            <div className="card">
              <div className="relative">
                {isAdmin && (
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="absolute top-0 right-0 p-2 text-gold-500 hover:text-gold-600"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-3xl font-bold mb-2 text-white">{content?.schedule.title}</h2>
                <h3 className="text-xl text-gray-400 mb-4">{content?.schedule.subtitle}</h3>
                <div 
                  className="text-gray-300 whitespace-pre-line" 
                  dangerouslySetInnerHTML={{ __html: content?.schedule.content || '' }}
                />
              </div>
            </div>
          </section>

          {/* 예정 일정 */}
          {upcomingSchedules.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4 text-white">예정 일정</h2>
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
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 유니폼 페이지 */}
      {activeTab === 'uniform' && (
        <section className="mb-12">
          <div className="card">
            <div className="space-y-8">
              {/* HOME 유니폼 */}
              <div className="relative">
                <div className="text-red-500 text-sm font-semibold mb-2">HOME</div>
                {content?.uniform?.home ? (
                  <div className="relative group">
                    <img
                      src={content.uniform.home}
                      alt="HOME 유니폼"
                      className="w-full h-auto object-contain rounded-lg"
                    />
                    {isAdmin && (
                      <button
                        onClick={() => handleImageDelete('home')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="min-h-[200px] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gold-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUniformImageUpload(e, 'home')}
                    />
                    <span className="text-gray-400 hover:text-gold-500 text-sm">+ 이미지 추가</span>
                  </label>
                )}
              </div>

              {/* AWAY 유니폼 */}
              <div className="relative">
                <div className="text-red-500 text-sm font-semibold mb-2">AWAY</div>
                {content?.uniform?.away ? (
                  <div className="relative group">
                    <img
                      src={content.uniform.away}
                      alt="AWAY 유니폼"
                      className="w-full h-auto object-contain rounded-lg"
                    />
                    {isAdmin && (
                      <button
                        onClick={() => handleImageDelete('away')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="min-h-[200px] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gold-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUniformImageUpload(e, 'away')}
                    />
                    <span className="text-gray-400 hover:text-gold-500 text-sm">+ 이미지 추가</span>
                  </label>
                )}
              </div>

              {/* THIRD 유니폼 */}
              <div className="relative">
                <div className="text-red-500 text-sm font-semibold mb-2">THIRD</div>
                {content?.uniform?.third ? (
                  <div className="relative group">
                    <img
                      src={content.uniform.third}
                      alt="THIRD 유니폼"
                      className="w-full h-auto object-contain rounded-lg"
                    />
                    {isAdmin && (
                      <button
                        onClick={() => handleImageDelete('third')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="min-h-[200px] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gold-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUniformImageUpload(e, 'third')}
                    />
                    <span className="text-gray-400 hover:text-gold-500 text-sm">+ 이미지 추가</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TextEditModal들 */}
      <TextEditModal
        isOpen={isClubIntroModalOpen}
        onClose={() => setIsClubIntroModalOpen(false)}
        onSave={handleClubIntroSave}
        initialTitle={content?.clubIntro?.title || ''}
        initialContent={content?.clubIntro?.content || ''}
        showSubtitle={false}
      />
      <TextEditModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
        onSave={handleManagementSave}
        initialTitle={content?.management?.title || ''}
        initialSubtitle={content?.management?.subtitle || ''}
        initialContent={content?.management?.content || ''}
        showSubtitle={true}
      />
      <TextEditModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleScheduleSave}
        initialTitle={content?.schedule?.title || ''}
        initialSubtitle={content?.schedule?.subtitle || ''}
        initialContent={content?.schedule?.content || ''}
        showSubtitle={true}
      />
      <TextEditModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        onSave={handleNoticeSave}
        initialTitle={content?.notice?.title || '공지사항'}
        initialContent={content?.notice?.content || ''}
        showSubtitle={false}
      />
    </div>
  );
};

export default Main;
