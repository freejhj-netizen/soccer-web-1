import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gold-500 font-bold text-lg mb-4">소셜 미디어</h3>
            <div className="space-y-2 text-sm">
              <p>클럽 인스타: <a href="https://instagram.com/nyj_bj_united" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">@nyj_bj_united</a></p>
              <p>클럽 유튜브: <a href="https://youtube.com/@nyjbjfc_footballclub" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">@nyjbjfc_footballclub</a></p>
            </div>
          </div>
          <div>
            <h3 className="text-gold-500 font-bold text-lg mb-4">연락처</h3>
            <div className="space-y-2 text-sm">
              <p>클럽 주소: 경기도 남양주시 다산지금로 127 3층</p>
              <p>야외훈련장: 남양주체육문화센터</p>
              <p>대표번호: <a href="tel:1644-7552" className="text-gold-500 hover:underline">1644-7552</a></p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© 2026 NYJ BJ UTD U12. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

