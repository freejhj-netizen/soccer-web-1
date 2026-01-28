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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  // Firebase가 설정되지 않은 경우 모든 페이지 접근 허용 (개발/테스트용)
  if (!auth) {
    return <>{children}</>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userData && !requiredRole.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  // 손님 권한은 MAIN, 공지사항, SETTING 페이지만 접근 가능
  if (userData?.role === 'guest' && currentUser) {
    const allowedPaths = ['/', '/notice', '/setting', '/notice/'];
    const currentPath = window.location.pathname;
    const isAllowed = allowedPaths.some(path => 
      currentPath === path || currentPath.startsWith(path + '/')
    );
    
    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

