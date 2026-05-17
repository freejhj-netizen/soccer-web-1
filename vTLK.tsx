import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Game } from '../types';

import { ArrowLeftIcon, FilmIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userData?.role === 'admin';

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
    return {
      full: d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      year: d.getFullYear(),
    };
  };

  const handleEdit = () => {
    navigate(`/game/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?') || !db || !id) return;

    try {
      await deleteDoc(doc(db, 'games', id));
      navigate('/game');
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const getQuarterResult = (our: number, opponent: number, result?: string) => {
    if (result === '미진행') return { text: '미진행', color: 'text-gray-500', isNotPlayed: true };
    if (our > opponent) return { text: '승리', color: 'text-green-400', isNotPlayed: false };
    if (our < opponent) return { text: '패배', color: 'text-red-400', isNotPlayed: false };
    return { text: '무승부', color: 'text-gray-400', isNotPlayed: false };
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

  const { full, year } = formatDate(game.date);

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
          {/* 상단: 경기 유형 • 시즌 */}
          <div className="text-center mb-4">
            <p className="text-orange-400 text-lg font-semibold">
              {game.type} • {year} 시즌
            </p>
          </div>

          {/* 날짜 */}
          <div className="text-center mb-8">
            <p className="text-2xl font-bold text-white">
              {full}
            </p>
          </div>

          {/* 경기 결과 */}
          <div className="card text-center mb-6 bg-gray-900">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <p className="font-bold text-white text-base leading-tight">남양주축구센터 U12</p>
                <p className="font-bold text-white text-base leading-tight">U12</p>
              </div>
              <div className="text-3xl font-bold text-white whitespace-nowrap">
                {game.ourScore} - {game.opponentScore}
              </div>
              <div className="text-center max-w-[120px]">
                <p className="font-bold text-white text-sm leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: game.opponent.length > 8 ? '0.75rem' : '1rem' }}>
                  {game.opponent}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <p className="text-xl font-bold text-white bg-red-500 inline-block px-4 py-2 rounded">
                {game.result}
              </p>
            </div>
          </div>

          {/* 쿼터별 스코어 */}
          <div className="card mb-6 bg-gray-900">
            <div className="grid grid-cols-2 gap-4">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((q, index) => {
                const quarterResult = getQuarterResult(
                  game.quarters[q].our, 
                  game.quarters[q].opponent,
                  (game.quarters[q] as any).result
                );
                return (
                  <div key={q} className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-400 mb-2">{index + 1}쿼터</p>
                    {!quarterResult.isNotPlayed && (
                      <p className="text-xl font-bold text-white mb-2">
                        {game.quarters[q].our} - {game.quarters[q].opponent}
                      </p>
                    )}
                    <p className={`text-sm font-semibold ${quarterResult.color}`}>
                      {quarterResult.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 경기 영상 보기 버튼 */}
          {game.videoUrl && (
            <div className="text-center mb-6">
              <a
                href={game.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-600 transition-colors inline-flex items-center space-x-2 text-lg w-full justify-center"
              >
                <FilmIcon className="w-6 h-6" />
                <span>경기 영상 보기</span>
              </a>
            </div>
          )}

          {/* 관리자 버튼 */}
          {isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <PencilIcon className="w-5 h-5" />
                <span>수정</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
              >
                <TrashIcon className="w-5 h-5" />
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>
      </div>
    
  );
};

export default GameDetail;

