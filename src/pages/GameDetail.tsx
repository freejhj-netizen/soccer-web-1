import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Game } from '../types';

import { ArrowLeftIcon, FilmIcon } from '@heroicons/react/24/outline';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchGame();
    }
  }, [id]);

  const fetchGame = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, 'games', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setGame({ id: docSnap.id, ...docSnap.data() } as Game);
      }
    } catch (error) {
      console.error('Error fetching game:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    const d = date.toDate ? date.toDate() : new Date(date);
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return {
      full: d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      day: days[d.getDay()],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <div className="text-center text-gray-400 py-12">경기를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const { full, day } = formatDate(game.date);
  const resultColor =
    game.result === '승리'
      ? 'text-green-400'
      : game.result === '무승부'
      ? 'text-gray-400'
      : 'text-red-400';

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <button
          onClick={() => navigate('/game')}
          className="flex items-center space-x-2 text-gray-400 hover:text-gold mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>경기 목록으로</span>
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-300 mb-2">
              {full} {day}
            </p>
          </div>

          <div className="card text-center mb-6">
            <div className="flex items-center justify-center space-x-8 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-black font-bold">NYJ</span>
                </div>
                <p className="font-bold text-white">NYJ BJ UTD U12</p>
              </div>
              <div className="text-4xl font-bold text-white">
                {game.ourScore} : {game.opponentScore}
              </div>
              <div className="text-center">
                {game.opponentLogoUrl ? (
                  <img
                    src={game.opponentLogoUrl}
                    alt={game.opponent}
                    className="w-16 h-16 mx-auto mb-2"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-gray-400 text-xs">로고</span>
                  </div>
                )}
                <p className="font-bold text-white">{game.opponent}</p>
              </div>
            </div>
            <p className={`text-2xl font-bold ${resultColor}`}>{game.result}</p>
          </div>

          <div className="card mb-6">
            <h3 className="text-xl font-bold mb-4 text-white">쿼터별 스코어</h3>
            <div className="grid grid-cols-4 gap-4">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                <div key={q} className="text-center">
                  <p className="text-sm text-gray-400 mb-2">{q.toUpperCase()}</p>
                  <p className="text-lg font-bold text-white">
                    {game.quarters[q].our} - {game.quarters[q].opponent}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {game.videoUrl && (
            <div className="text-center">
              <a
                href={game.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <FilmIcon className="w-5 h-5" />
                <span>경기 영상 보기</span>
              </a>
            </div>
          )}
        </div>
      </div>
    
  );
};

export default GameDetail;

