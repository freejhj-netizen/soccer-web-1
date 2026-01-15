import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userData } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'MAIN' },
    { path: '/player', label: 'PLAYER' },
    { path: '/calendar', label: 'CALENDAR' },
    { path: '/game', label: 'SCORE' },
    { path: '/notice', label: '공지사항' },
    { path: '/setting', label: 'SETTING' },
  ];

  if (userData?.role === 'admin') {
    menuItems.push({ path: '/admin', label: 'ADMIN' });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-black text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/로고.png" 
              alt="NYJ BJ UTD U12 로고" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 로고 표시
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center hidden">
              <span className="text-black font-bold text-lg">NYJ</span>
            </div>
            <span className="font-bold text-lg text-gold">NYJ BJ UTD U12</span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-500 text-white font-semibold'
                    : 'hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="메뉴"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <img 
              src="/로고.png" 
              alt="NYJ BJ UTD U12 로고" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="font-bold text-lg text-gold">NYJ BJ UTD U12</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-white hover:text-gold transition-colors"
            aria-label="메뉴 닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'text-white hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;

