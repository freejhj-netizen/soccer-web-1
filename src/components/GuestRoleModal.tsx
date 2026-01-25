import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const GuestRoleModal: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // 오늘 팝업을 숨겼는지 확인
  const shouldShowModal = () => {
    if (userData?.role !== 'guest' || !currentUser) {
      return false;
    }
    
    const hiddenDate = localStorage.getItem('guestRoleModalHiddenDate');
    const today = getTodayDateString();
    
    // 오늘 날짜와 저장된 날짜가 다르면 표시
    return hiddenDate !== today;
  };

  useEffect(() => {
    // 손님 권한이고 로그인된 상태일 때마다 팝업 표시 여부 확인
    if (userData?.role === 'guest' && currentUser) {
      if (shouldShowModal()) {
        setShowModal(true);
      }
    } else {
      setShowModal(false);
    }
  }, [userData, currentUser]);

  const handleClose = () => {
    setShowModal(false);
    
    // '오늘 다시 보지 않기'가 체크되어 있으면 오늘 날짜 저장
    if (dontShowToday) {
      const today = getTodayDateString();
      localStorage.setItem('guestRoleModalHiddenDate', today);
    }
    
    setDontShowToday(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <div className="mt-4">
          <h2 className="text-xl font-bold text-white mb-4">권한 안내</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            '선수/학부모' 권한으로 등업을 원하실 경우 단톡방 또는{' '}
            <a 
              href="mailto:cjjhj@naver.com" 
              className="text-blue-400 hover:text-blue-300 underline"
            >
              cjjhj@naver.com
            </a>
            {' '}로 문의 바랍니다.
          </p>
          
          <div className="mb-4">
            <label className="flex items-center text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mr-2"
              />
              <span className="text-sm">오늘 다시 보지 않기</span>
            </label>
          </div>
          
          <button
            onClick={handleClose}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestRoleModal;

