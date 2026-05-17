import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import type { User, UserRole } from '../types';

export function userFromFirestoreDoc(
  docSnap: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): User {
  const data = docSnap.data() as User;
  return {
    ...data,
    uid: docSnap.id,
  };
}

export function resolveRoleForNewAccount(
  email: string | null | undefined,
  adminEmail: string,
  existingRole?: UserRole,
): UserRole {
  if (email === adminEmail) return 'admin';
  if (existingRole && existingRole !== 'guest') return existingRole;
  return 'guest';
}
