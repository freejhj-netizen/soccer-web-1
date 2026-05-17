import React, { useEffect, useState } from 'react';
import { isStandaloneApp } from '../utils/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AppInstallGuide: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandaloneApp());
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const onInstallable = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onInstallable);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="card border border-green-700/50 bg-green-950/30">
        <h2 className="text-xl font-bold mb-2 text-white">앱 설치</h2>
        <p className="text-green-300 text-sm">앱 모드로 실행 중입니다. 홈 화면 아이콘으로 열면 브라우저 주소창 없이 사용할 수 있습니다.</p>
      </div>
    );
  }

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setInstallEvent(null);
  };

  return (
    <div className="card border border-gold-500/30">
      <h2 className="text-xl font-bold mb-3 text-white">앱처럼 설치하기</h2>
      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
        일반 &quot;홈 화면에 추가&quot;는 <strong className="text-gold-500">브라우저 북마크</strong>라서 주소창이 보입니다.
        아래 방법으로 설치하면 <strong className="text-gold-500">앱처럼</strong> 전체 화면으로 열립니다.
      </p>

      {installEvent && (
        <button
          type="button"
          onClick={handleInstall}
          className="w-full mb-4 bg-gold-500 text-black px-4 py-3 rounded-lg font-bold hover:bg-gold-400 transition-colors"
        >
          앱 설치
        </button>
      )}

      <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
        <li>기존 <strong className="text-white">NYJ BJ UTD</strong> 바로가기가 있으면 삭제</li>
        <li>
          <strong className="text-white">Google Chrome</strong>으로 사이트 접속 (삼성 인터넷·IE는 앱 설치 미지원)
        </li>
        {installEvent ? (
          <li>위 <strong className="text-white">앱 설치</strong> 버튼을 누르거나, Chrome 메뉴(⋮) → <strong className="text-white">앱 설치</strong></li>
        ) : (
          <li>Chrome 메뉴(⋮) → <strong className="text-white">앱 설치</strong> 또는 <strong className="text-white">홈 화면에 추가</strong></li>
        )}
        <li>홈 화면에 생긴 <strong className="text-white">남양주축구센터 U12</strong> 아이콘으로 실행</li>
      </ol>

      {isIos && (
        <p className="mt-4 text-xs text-gray-400">
          iPhone: Safari 공유 버튼 → &quot;홈 화면에 추가&quot; 후, 반드시 홈 화면 아이콘으로 실행하세요.
        </p>
      )}
    </div>
  );
};

export default AppInstallGuide;
