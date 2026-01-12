import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../types';

import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Notice: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    pinned: false,
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((post: any) => post.type === 'notice') as Post[];
      
      // 고정된 게시글을 먼저, 그 다음 일반 게시글
      const sortedPosts = [...postsData].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
      
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleAdd = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '', pinned: false });
    setShowModal(true);
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: post.content, pinned: post.pinned || false });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?') || !db) return;

    try {
      await deleteDoc(doc(db, 'posts', id));
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData || !db) return;

    try {
      const postData = {
        type: 'notice' as const,
        title: formData.title,
        content: formData.content,
        author: userData.displayName || userData.email,
        authorUid: userData.uid,
        views: editingPost?.views || 0,
        comments: editingPost?.comments || [],
        pinned: formData.pinned,
        createdAt: editingPost?.createdAt || new Date(),
      };

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), postData);
      } else {
        await addDoc(collection(db, 'posts'), postData);
      }

      setShowModal(false);
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/notice/${postId}`);
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
          <h1 className="text-3xl font-bold">공지사항</h1>
          {isAdmin && (
            <button onClick={handleAdd} className="btn-primary flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>글쓰기</span>
            </button>
          )}
        </div>

        <div className="card overflow-x-auto">
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border-b border-gray-700 pb-2 hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handlePostClick(post.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(post.createdAt)}</span>
                      {post.pinned && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">고정</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold truncate pr-2 text-white">{post.title}</div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-gold-400 hover:text-gold-300"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {posts.length === 0 && (
          <div className="text-center text-gray-400 py-12">공지사항이 없습니다.</div>
        )}

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-3xl w-full p-6 my-8">
              <h2 className="text-2xl font-bold mb-4 text-white">
                {editingPost ? '공지사항 수정' : '공지사항 작성'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">내용 *</label>
                  <textarea
                    required
                    className="input-field min-h-[300px]"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
                {isAdmin && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={formData.pinned}
                      onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      className="w-4 h-4 text-gold bg-gray-700 border-gray-600 rounded focus:ring-gold"
                    />
                    <label htmlFor="pinned" className="ml-2 text-sm text-gray-300">
                      고정 (공지사항 목록 상단에 표시)
                    </label>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary flex-1">저장</button>
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

export default Notice;

