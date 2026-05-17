import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Comment } from '../types';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

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
        createdAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'posts', post.id), {
        comments: arrayUnion(newComment),
      });

      setComment('');
      fetchPost();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('댓글 작성에 실패했습니다.');
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
            <div className="space-y-2 text-gray-400 mb-4 text-sm">
              <div>작성자: {post.author}</div>
              <div>날짜: {formatDate(post.createdAt)}</div>
              <div>조회수: {post.views}</div>
            </div>
            <div className="border-t border-gray-700 pt-6">
              <div
                className="text-gray-300 prose prose-invert max-w-none break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2 [&_a]:text-blue-400 [&_a]:underline [&_p]:mb-2"
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
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
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

