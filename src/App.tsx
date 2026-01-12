import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Main from './pages/Main';
import Player from './pages/Player';
import Calendar from './pages/Calendar';
import Game from './pages/Game';
import GameDetail from './pages/GameDetail';
import GameEdit from './pages/GameEdit';
import Notice from './pages/Notice';
import Free from './pages/Free';
import PostDetail from './pages/PostDetail';
import Setting from './pages/Setting';
import Admin from './pages/Admin';

const AppRoutes: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // 스플래시 스크린 표시 (2-3초)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Main />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/player"
        element={
          <ProtectedRoute>
            <Layout>
              <Player />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <Calendar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/game"
        element={
          <ProtectedRoute>
            <Layout>
              <Game />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <GameDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:id/edit"
        element={
          <ProtectedRoute requiredRole={['admin']}>
            <Layout>
              <GameEdit />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notice"
        element={
          <ProtectedRoute>
            <Layout>
              <Notice />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notice/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <PostDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/free"
        element={
          <ProtectedRoute>
            <Layout>
              <Free />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/free/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <PostDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/setting"
        element={
          <ProtectedRoute>
            <Layout>
              <Setting />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={['admin']}>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
