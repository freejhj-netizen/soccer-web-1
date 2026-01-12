import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!auth) {
      setError('Firebase 설정이 필요합니다.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.');
    } catch (err: any) {
      setError(err.message || '이메일 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="/로고.png" 
            alt="NYJ BJ UTD U12 로고" 
            className="w-20 h-20 object-contain mx-auto mb-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <h2 className="text-3xl font-bold text-white">비밀번호 찾기</h2>
          <p className="mt-2 text-gray-300">이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '전송 중...' : '비밀번호 재설정 이메일 보내기'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-gold-400 hover:text-gold-300">
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

