import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
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

  // 년도 변경 시 자동 나이 업데이트
  const updateAgeGroupsOnYearChange = async () => {
    if (!db) return;
    const dbRef = db!;
    
    try {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11
      const currentDay = now.getDate();
      
      // 1월 1일 이후인지 확인
      if (currentMonth === 0 && currentDay >= 1) {
        // 모든 사용자 가져오기
        const usersSnapshot = await getDocs(collection(dbRef, 'users'));
        const updates: Promise<void>[] = [];
        
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data() as User;
          if (userData.ageGroup && userData.ageGroup !== '졸업') {
            let newAgeGroup: 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7' | '졸업' | undefined;
            
            switch (userData.ageGroup) {
              case 'U7':
                newAgeGroup = 'U8';
                break;
              case 'U8':
                newAgeGroup = 'U9';
                break;
              case 'U9':
                newAgeGroup = 'U10';
                break;
              case 'U10':
                newAgeGroup = 'U11';
                break;
              case 'U11':
                newAgeGroup = 'U12';
                break;
              case 'U12':
                newAgeGroup = '졸업';
                break;
            }
            
            if (newAgeGroup && newAgeGroup !== userData.ageGroup) {
              updates.push(
                updateDoc(doc(dbRef, 'users', userDoc.id), {
                  ageGroup: newAgeGroup,
                })
              );
            }
          }
        });
        
        if (updates.length > 0) {
          await Promise.all(updates);
          console.log(`✅ ${updates.length}명의 나이 그룹이 자동 업데이트되었습니다.`);
        }
      }
    } catch (error) {
      console.error('Error updating age groups:', error);
    }
  };

  const fetchUserData = async (uid: string, email?: string | null) => {
    if (!db) return;
    const dbRef = db!;
    try {
      // 년도 변경 시 자동 업데이트 (로그인 시마다 체크)
      await updateAgeGroupsOnYearChange();
      
      const userDoc = await getDoc(doc(dbRef, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as User);
      } else {
        // 사용자 데이터가 없으면 기본값으로 생성
        // 관리자 이메일인 경우에만 admin 권한 부여 (개발 모드 체크 제거)
        const isAdmin = email === adminEmail;
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
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && db) {
        // 관리자 이메일 확인 및 권한 부여
        // 개발 모드 체크 제거: 실제 사용자는 Firestore의 role을 사용
        const isAdminEmail = user.email === adminEmail;
        
        // 관리자 이메일인 경우에만 권한 부여 (개발 모드 자동 권한 부여 제거)
        if (isAdminEmail) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const existingRole = userDoc.data()?.role;
            
            // Firestore에 문서가 없거나 role이 admin이 아닌 경우에만 업데이트
            if (!userDoc.exists() || existingRole !== 'admin') {
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
        // Firestore에서 사용자 데이터 가져오기 (실제 role 사용)
        await fetchUserData(user.uid, user.email);
      } else {
        setUserData(null);
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

