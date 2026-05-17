import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';
import { resolveRoleForNewAccount, userFromFirestoreDoc } from '../utils/userDoc';

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

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'cjjhj@naver.com';

  const bumpOwnAgeGroupIfNeeded = async (uid: string, user: User) => {
    if (!db) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    if (now.getMonth() !== 0 || now.getDate() < 1) return;
    if (user.ageGroupBumpedYear === currentYear) return;
    if (!user.ageGroup || user.ageGroup === '졸업') return;

    const ageTransitions: Partial<
      Record<NonNullable<User['ageGroup']>, NonNullable<User['ageGroup']>>
    > = {
      U7: 'U8',
      U8: 'U9',
      U9: 'U10',
      U10: 'U11',
      U11: 'U12',
      U12: '졸업',
    };

    const newAgeGroup = ageTransitions[user.ageGroup];
    if (!newAgeGroup || newAgeGroup === user.ageGroup) return;

    await updateDoc(doc(db, 'users', uid), {
      ageGroup: newAgeGroup,
      ageGroupBumpedYear: currentYear,
    });
    user.ageGroup = newAgeGroup;
    user.ageGroupBumpedYear = currentYear;
  };

  const findUserDocByEmail = async (email: string) => {
    if (!db) return null;
    const snapshot = await getDocs(
      query(collection(db, 'users'), where('email', '==', email), limit(1)),
    );
    if (snapshot.empty) return null;
    return snapshot.docs[0];
  };

  const fetchUserData = async (uid: string, email?: string | null) => {
    if (!db) return;

    try {
      const userRef = doc(db, 'users', uid);
      let userDoc = await getDoc(userRef);

      if (!userDoc.exists() && email) {
        const emailDoc = await findUserDocByEmail(email);
        if (emailDoc) {
          const migrated = userFromFirestoreDoc(emailDoc);
          await setDoc(
            userRef,
            {
              ...migrated,
              uid,
              email,
            },
            { merge: true },
          );
          if (emailDoc.id !== uid) {
            await deleteDoc(doc(db, 'users', emailDoc.id));
          }
          userDoc = await getDoc(userRef);
        }
      }

      if (userDoc.exists()) {
        const user = userFromFirestoreDoc(userDoc);
        await bumpOwnAgeGroupIfNeeded(uid, user);
        setUserData(user);
        return;
      }

      const role = resolveRoleForNewAccount(email, adminEmail);
      const defaultUser: User = {
        uid,
        email: email || '',
        role,
        createdAt: new Date(),
      };
      await setDoc(userRef, defaultUser, { merge: true });
      setUserData(defaultUser);
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
        if (user.email === adminEmail) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const existingRole = userDoc.data()?.role;

            if (!userDoc.exists() || existingRole !== 'admin') {
              await setDoc(
                doc(db, 'users', user.uid),
                {
                  uid: user.uid,
                  email: user.email,
                  role: 'admin',
                },
                { merge: true },
              );
            }
          } catch (error) {
            console.error('Error setting admin role:', error);
          }
        }

        await fetchUserData(user.uid, user.email);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [adminEmail]);

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
