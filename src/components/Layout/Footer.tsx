import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gold-500 font-bold text-lg mb-4">소셜 미디어</h3>
            <div className="space-y-2 text-sm">
              <p>클럽 인스타 계정: <a href="https://instagram.com/nyj_footballcenter" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">@nyj_footballcenter</a></p>
              <p>클럽 유튜브: <a href="https://youtube.com/@2016nyjfc" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">@2016nyjfc</a></p>
            </div>
          </div>
          <div>
            <h3 className="text-gold-500 font-bold text-lg mb-4">연락처</h3>
            <div className="space-y-2 text-sm">
              <p>야외훈련장: 남양주체육문화센터 축구장</p>
              <p>대표번호: <a href="tel:010-6206-1018" className="text-gold-500 hover:underline">010-6206-1018</a></p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© 1999 남양주축구센터 U12. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

