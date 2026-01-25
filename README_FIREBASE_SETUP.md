# Firebase 설정 가이드

## 1. 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=여기에_API_KEY_입력
VITE_FIREBASE_AUTH_DOMAIN=여기에_AUTH_DOMAIN_입력
VITE_FIREBASE_PROJECT_ID=여기에_PROJECT_ID_입력
VITE_FIREBASE_STORAGE_BUCKET=여기에_STORAGE_BUCKET_입력
VITE_FIREBASE_MESSAGING_SENDER_ID=여기에_MESSAGING_SENDER_ID_입력
VITE_FIREBASE_APP_ID=여기에_APP_ID_입력

# 개발 모드 설정
VITE_DEV_MODE=true
VITE_ADMIN_EMAIL=cjjhj@naver.com
```

## 2. Firebase 설정 값 찾기

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택
3. 프로젝트 설정 (⚙️ 아이콘) 클릭
4. "일반" 탭에서 "앱" 섹션의 웹 앱 설정 확인
5. `firebaseConfig` 객체의 값들을 `.env.local`에 입력

## 3. Firestore 보안 규칙 설정

Firebase Console > Firestore Database > 규칙에서 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터
    match /users/{userId} {
      // 읽기: 인증된 사용자만
      allow read: if request.auth != null;
      
      // 쓰기: 
      // 1. 인증된 사용자가 자신의 문서를 생성할 수 있음 (회원가입 시)
      // 2. 인증된 사용자가 자신의 문서를 수정할 수 있음
      // 3. 관리자가 모든 사용자 문서를 수정/삭제할 수 있음
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && (
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // 게시글
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.authorUid == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // 선수 데이터
    match /players/{playerId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 경기 일정
    match /schedules/{scheduleId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 경기 결과
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 메인 콘텐츠
    match /mainContent/{contentId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 4. Storage 보안 규칙 설정

Firebase Console > Storage > 규칙에서 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 갤러리 이미지
    match /gallery/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 선수 사진
    match /players/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 유니폼 이미지
    match /uniforms/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 상대팀 로고
    match /logos/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 5. 개발 모드 (로컬호스트)

로컬호스트에서 개발할 때는 `.env.local`에서 `VITE_DEV_MODE=true`로 설정하면:
- Firebase 인증 없이 관리자 권한으로 자동 접근
- 모든 페이지에 접근 가능
- 관리자 기능 사용 가능

## 6. 배포

배포 시에는 `.env.local` 파일을 제외하고, Firebase Hosting 또는 다른 호스팅 서비스의 환경 변수 설정에서 Firebase 설정값을 입력하세요.

## 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 실제 Firebase 프로젝트의 설정값을 사용하세요
- 관리자 이메일은 `cjjhj@naver.com`으로 설정되어 있습니다

