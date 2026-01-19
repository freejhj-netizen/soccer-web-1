import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Highlight } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const HighlightPage: React.FC = () => {
  const { userData } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    ageGroup: 'U12' as 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7',
    title: '',
    videoUrl: '',
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'highlights'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const highlightsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Highlight[];
      setHighlights(highlightsData);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingHighlight(null);
    setFormData({
      date: '',
      ageGroup: 'U12',
      title: '',
      videoUrl: '',
    });
    setShowModal(true);
  };

  const handleEdit = (highlight: Highlight) => {
    setEditingHighlight(highlight);
    const date = highlight.date?.toDate ? highlight.date.toDate() : new Date(highlight.date);
    setFormData({
      date: format(date, 'yyyy-MM-dd'),
      ageGroup: highlight.ageGroup,
      title: highlight.title,
      videoUrl: highlight.videoUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?') || !db) return;

    try {
      await deleteDoc(doc(db, 'highlights', id));
      fetchHighlights();
    } catch (error) {
      console.error('Error deleting highlight:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      alert('Firebase 설정이 필요합니다.');
      return;
    }

    try {
      if (!formData.videoUrl.trim() && !editingHighlight) {
        alert('유튜브 URL을 입력해주세요.');
        return;
      }

      const dateObj = new Date(formData.date);
      const highlightData = {
        date: dateObj,
        ageGroup: formData.ageGroup,
        title: formData.title,
        videoUrl: formData.videoUrl.trim(),
        createdAt: editingHighlight?.createdAt || new Date(),
      };

      if (editingHighlight) {
        await updateDoc(doc(db, 'highlights', editingHighlight.id), highlightData);
      } else {
        await addDoc(collection(db, 'highlights'), highlightData);
      }

      setShowModal(false);
      fetchHighlights();
    } catch (error) {
      console.error('Error saving highlight:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const formatDate = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return format(d, 'yyyy.MM.dd', { locale: ko });
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">HIGHLIGHT</h1>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>영상 추가</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {highlights.map((highlight) => {
          const thumbnailUrl = highlight.videoUrl ? getYouTubeThumbnail(highlight.videoUrl) : null;
          return (
            <div key={highlight.id} className="card p-0 overflow-hidden">
              <div className="aspect-video bg-gray-800 relative">
                {thumbnailUrl ? (
                  <a
                    href={highlight.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <img
                      src={thumbnailUrl}
                      alt={highlight.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 썸네일 로드 실패 시 대체 이미지
                        const target = e.target as HTMLImageElement;
                        target.src = `https://img.youtube.com/vi/${getYouTubeVideoId(highlight.videoUrl)}/hqdefault.jpg`;
                      }}
                    />
                  </a>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    영상 없음
                  </div>
                )}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(highlight)}
                      className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(highlight.id)}
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-1">{formatDate(highlight.date)}</p>
                <p className="text-sm text-gray-400 mb-2">{highlight.ageGroup}</p>
                <p className="text-base font-bold text-white">{highlight.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {highlights.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          하이라이트가 없습니다.
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {editingHighlight ? '영상 수정' : '영상 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">유튜브 URL *</label>
                {formData.videoUrl && getYouTubeThumbnail(formData.videoUrl) && (
                  <div className="mb-2">
                    <img
                      src={getYouTubeThumbnail(formData.videoUrl)!}
                      alt="썸네일 미리보기"
                      className="w-full h-32 object-cover rounded-lg border border-gray-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const videoId = getYouTubeVideoId(formData.videoUrl);
                        if (videoId) {
                          target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }
                      }}
                    />
                  </div>
                )}
                <input
                  type="url"
                  required={!editingHighlight}
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">날짜 *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">연령 *</label>
                <select
                  required
                  className="input-field"
                  value={formData.ageGroup}
                  onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as any })}
                >
                  <option value="U12">U12</option>
                  <option value="U11">U11</option>
                  <option value="U10">U10</option>
                  <option value="U9">U9</option>
                  <option value="U8">U8</option>
                  <option value="U7">U7</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">제목 *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex-1"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlightPage;

