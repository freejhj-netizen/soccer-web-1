import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Comment } from '../types';

import { ArrowLeftIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    try {
      const docRef = doc(db, 'posts', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const postData = { id: docSnap.id, ...docSnap.data() } as Post;
        setPost(postData);

        // 조회수 증가
        if (userData && db) {
          await updateDoc(docRef, {
            views: (postData.views || 0) + 1,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !post || !comment.trim() || !db) return;

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        content: comment,
        author: userData.displayName || userData.email,
        authorUid: userData.uid,
        createdAt: new Date(),
      };

      const currentComments = post.comments || [];
      await updateDoc(doc(db, 'posts', post.id), {
        comments: [...currentComments, newComment],
      });

      setComment('');
      fetchPost();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('댓글 작성에 실패했습니다.');
    }
  };

  const handleCommentEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleCommentEditSave = async (commentId: string) => {
    if (!userData || !post || !editingCommentContent.trim() || !db) return;

    try {
      const currentComments = post.comments || [];
      const updatedComments = currentComments.map((c) =>
        c.id === commentId ? { ...c, content: editingCommentContent } : c
      );

      await updateDoc(doc(db, 'posts', post.id), {
        comments: updatedComments,
      });

      setEditingCommentId(null);
      setEditingCommentContent('');
      fetchPost();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?') || !userData || !post || !db) return;

    try {
      const currentComments = post.comments || [];
      const updatedComments = currentComments.filter((c) => c.id !== commentId);

      await updateDoc(doc(db, 'posts', post.id), {
        comments: updatedComments,
      });

      fetchPost();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const canEditComment = (comment: Comment) => {
    if (!userData) return false;
    return userData.role === 'admin' || userData.uid === comment.authorUid;
  };

  const canDeleteComment = (comment: Comment) => {
    if (!userData) return false;
    return userData.role === 'admin' || userData.uid === comment.authorUid;
  };

  const formatDate = (date: any) => {
    const d = date.toDate ? date.toDate() : new Date(date);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <div className="text-center text-gray-400 py-12">게시글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <button
          onClick={() => navigate(`/${post.type === 'notice' ? 'notice' : 'free'}`)}
          className="flex items-center space-x-2 text-gray-400 hover:text-gold mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>목록으로</span>
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="card mb-6">
            <h1 className="text-3xl font-bold mb-4 text-white">{post.title}</h1>
            <div className="space-y-2 mb-4 text-sm">
              <div className="text-gray-400">
                <span className="text-gray-300 font-semibold">작성자:</span> {post.author}
              </div>
              <div className="text-gray-400">
                <span className="text-gray-300 font-semibold">ID:</span> {post.authorUid?.substring(0, 8) || '-'}
              </div>
              <div className="text-gray-400">
                <span className="text-gray-300 font-semibold">날짜:</span> {formatDate(post.createdAt)}
              </div>
              <div className="text-gray-400">
                <span className="text-gray-300 font-semibold">조회수:</span> {post.views || 0}
              </div>
            </div>
            <div className="border-t border-gray-700 pt-6">
              <div 
                className="text-gray-300 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white">댓글 ({post.comments?.length || 0})</h2>
            {userData && (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  className="input-field mb-2"
                  placeholder="댓글을 입력하세요"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">댓글 작성</button>
              </form>
            )}
            <div className="space-y-4">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-700 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-white">{comment.author}</p>
                        <p className="text-sm text-gray-400">{formatDate(comment.createdAt)}</p>
                      </div>
                      {(canEditComment(comment) || canDeleteComment(comment)) && (
                        <div className="flex space-x-2">
                          {canEditComment(comment) && editingCommentId !== comment.id && (
                            <button
                              onClick={() => handleCommentEdit(comment)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="수정"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => handleCommentDelete(comment.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="삭제"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="input-field w-full"
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCommentEditSave(comment.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors flex items-center space-x-1"
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>저장</span>
                          </button>
                          <button
                            onClick={handleCommentEditCancel}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center space-x-1"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            <span>취소</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300">{comment.content}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">댓글이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default PostDetail;

