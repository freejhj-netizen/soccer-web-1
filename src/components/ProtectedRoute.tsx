import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, userData, loading } = useAuth();

  // 개발 모드 확인
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  // 개발 모드이고 로컬호스트인 경우 관리자 권한으로 접근 허용
  if (isDevMode && isLocalhost && !auth) {
    return <>{children}</>;
  }

  // Firebase가 설정되지 않은 경우 모든 페이지 접근 허용 (개발/테스트용)
  if (!auth) {
    return <>{children}</>;
  }

  // 개발 모드이고 로컬호스트인 경우 userData가 있으면 통과
  if (isDevMode && isLocalhost && userData) {
    if (requiredRole && !requiredRole.includes(userData.role)) {
      // 개발 모드에서는 관리자 권한으로 자동 승인
      if (userData.role === 'admin') {
        return <>{children}</>;
      }
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userData && !requiredRole.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

