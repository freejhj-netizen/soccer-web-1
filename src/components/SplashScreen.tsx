import React from 'react';
import { CLUB_NAME } from '../constants/club';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center px-6">
        <img
          src="/로고.png"
          alt={`${CLUB_NAME} 로고`}
          className="max-w-[260px] w-full h-auto mx-auto mb-6 object-contain"
          width={260}
          height={260}
          fetchPriority="high"
        />
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">{CLUB_NAME}</h1>
        <p className="text-gold-500 text-lg">유소년 축구클럽</p>
      </div>
    </div>
  );
};

export default SplashScreen;
