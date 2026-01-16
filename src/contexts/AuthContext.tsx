import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 개발 모드 확인
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'cjjhj@naver.com';

  // 개발 모드 로그
  if (isDevMode && isLocalhost) {
    console.log('🔧 개발 모드 활성화');
    console.log('👤 관리자 이메일:', adminEmail);
  }

  const fetchUserData = async (uid: string, email?: string | null) => {
    if (!db) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as User);
      } else {
        // 사용자 데이터가 없으면 기본값으로 생성
        // 관리자 이메일이거나 개발 모드인 경우 admin 권한 부여
        const isAdmin = email === adminEmail || (isDevMode && isLocalhost);
        const defaultUser: User = {
          uid,
          email: email || '',
          role: isAdmin ? 'admin' : 'guest',
          createdAt: new Date(),
        };
        await setDoc(doc(db, 'users', uid), defaultUser);
        setUserData(defaultUser);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (currentUser && db) {
      await fetchUserData(currentUser.uid, currentUser.email);
    }
  };

  useEffect(() => {
    if (!auth) {
      // Firebase가 설정되지 않은 경우
      // 개발 모드이고 로컬호스트인 경우 더미 관리자 데이터 생성
      if (isDevMode && isLocalhost) {
        const devUser: User = {
          uid: 'dev-admin-uid',
          email: adminEmail,
          role: 'admin',
          createdAt: new Date(),
        };
        setUserData(devUser);
        setLoading(false);
        console.log('🔧 개발 모드: 관리자 권한으로 자동 로그인');
        return;
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && db) {
        // 관리자 이메일 확인 및 권한 부여
        const isAdminEmail = user.email === adminEmail;
        
        if (isAdminEmail || (isDevMode && isLocalhost)) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                role: 'admin',
                createdAt: new Date(),
              }, { merge: true });
              console.log('✅ 관리자 권한이 부여되었습니다.');
            }
          } catch (error) {
            console.error('Error setting admin role:', error);
          }
        }
        await fetchUserData(user.uid, user.email);
      } else {
        // 로그인하지 않은 상태에서 개발 모드인 경우
        if (isDevMode && isLocalhost) {
          const devUser: User = {
            uid: 'dev-admin-uid',
            email: adminEmail,
            role: 'admin',
            createdAt: new Date(),
          };
          setUserData(devUser);
          console.log('🔧 개발 모드: 로그인 없이 관리자 권한으로 접근');
        } else {
          setUserData(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isDevMode, isLocalhost, adminEmail]);

  const logout = async () => {
    if (auth) {
      await signOut(auth);
      setUserData(null);
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    logout,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

