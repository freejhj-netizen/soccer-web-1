import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <img 
          src="/로고.png" 
          alt="남양주축구센터 U12 로고" 
          className="max-w-[280px] w-full h-auto max-h-52 mx-auto mb-6 object-contain animate-pulse"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 로고 표시
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className="w-40 h-40 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse hidden">
          <span className="text-black font-bold text-sm text-center px-1">남양주</span>
        </div>
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">남양주축구센터 U12</h1>
        <p className="text-gold-500 text-lg">유소년 축구클럽</p>
      </div>
    </div>
  );
};

export default SplashScreen;

