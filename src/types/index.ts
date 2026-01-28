export type UserRole = 'admin' | 'member' | 'guest' | 'coach';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: any;
  lastLogin?: any;
  deletedAt?: any; // 회원탈퇴 시각 (30일 후 자동 삭제)
  childName?: string; // 자녀(선수) 이름 (선택)
  ageGroup?: 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7' | '졸업'; // 자녀(선수) 나이 (선택)
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  grade: string;
  position: 'FIELD' | 'GK';
  ageGroup: 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7';
  photoUrl: string;
  jerseyNumber?: number;
  createdAt: any;
}

export interface Schedule {
  id: string;
  ageGroup: 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7';
  homeAway: 'HOME' | 'AWAY';
  opponent: string;
  dateTime: any;
  type: '대회' | '연습경기' | '리그' | '스토브리그';
  createdAt: any;
}

export interface Game {
  id: string;
  date: any;
  ageGroup: string;
  opponent: string;
  opponentLogoUrl?: string;
  ourScore: number | null;
  opponentScore: number | null;
  result: '승리' | '무승부' | '패배' | '미진행';
  type: '대회' | '연습경기' | '리그' | '스토브리그';
  quarters: {
    q1: { our: number | null; opponent: number | null; result: '승리' | '무승부' | '패배' | '미진행' };
    q2: { our: number | null; opponent: number | null; result: '승리' | '무승부' | '패배' | '미진행' };
    q3: { our: number | null; opponent: number | null; result: '승리' | '무승부' | '패배' | '미진행' };
    q4: { our: number | null; opponent: number | null; result: '승리' | '무승부' | '패배' | '미진행' };
    q5: { our: number | null; opponent: number | null; result: '승리' | '무승부' | '패배' | '미진행' };
    q6: { our: number | null; opponent: number | null; result: '승리' | '무승부' | '패배' | '미진행' };
  };
  videoUrl?: string;
  createdAt: any;
}

export interface Post {
  id: string;
  type: 'notice' | 'free';
  title: string;
  content: string;
  author: string;
  authorUid: string;
  views: number;
  createdAt: any;
  comments: Comment[];
  pinned?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorUid: string;
  createdAt: any;
}

export interface MainContent {
  images: string[];
  clubIntro: {
    title: string;
    content: string;
  };
  management: {
    title: string;
    subtitle: string;
    content: string;
  };
  schedule: {
    title: string;
    subtitle: string;
    content: string;
  };
  notice?: {
    title: string;
    content: string;
  };
  uniform?: {
    home: string;
    away: string;
    third: string;
  };
}

export interface OpponentAnalysis {
  id: string;
  date: any;
  teamA: string;
  teamB: string;
  teamAScore: number | '';
  teamBScore: number | '';
  ageGroup: 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7';
  videoUrl: string;
  type: '대회' | '연습경기' | '리그' | '스토브리그';
  createdAt: any;
}

export interface Highlight {
  id: string;
  videoUrl: string;
  date: any;
  ageGroup: 'U12' | 'U11' | 'U10' | 'U9' | 'U8' | 'U7';
  title: string;
  createdAt: any;
}

