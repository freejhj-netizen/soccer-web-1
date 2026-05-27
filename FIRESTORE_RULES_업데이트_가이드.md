# Firestore 보안 규칙 업데이트 가이드

## 방법 1: Firebase Console에서 직접 업데이트 (권장)

### 단계별 가이드

#### 1단계: Firebase Console 접속
1. 웹 브라우저에서 [Firebase Console](https://console.firebase.google.com/) 접속
2. Google 계정으로 로그인
3. 프로젝트 선택 (예: `260111webpage`)

#### 2단계: Firestore Database로 이동
1. 왼쪽 사이드바에서 **"Firestore Database"** 클릭
   - 또는 **"빌드(Build)"** 섹션 아래에서 **"Firestore Database"** 선택

#### 3단계: 규칙 탭 열기
1. Firestore Database 페이지 상단에 여러 탭이 있습니다:
   - **데이터** (Data)
   - **규칙** (Rules) ← **이 탭을 클릭**
   - **인덱스** (Indexes)
   - **사용량** (Usage)

#### 4단계: 규칙 편집
1. **"규칙"** 탭을 클릭하면 코드 편집기가 나타납니다
2. 기존 규칙 코드를 모두 선택하고 삭제합니다 (Ctrl+A → Delete)
3. 아래의 새로운 규칙 코드를 복사하여 붙여넣습니다:

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
    
    // 공지사항
    match /notices/{noticeId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 선수 데이터
    match /players/{playerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 경기 일정
    match /schedules/{scheduleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 경기 결과
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 상대팀 분석
    match /opponentAnalysis/{analysisId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 하이라이트
    match /highlights/{highlightId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 메인 콘텐츠
    match /mainContent/{contentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### 5단계: 규칙 검증 및 게시
1. 코드를 붙여넣은 후, 편집기 아래에 **"검증"** (Validate) 버튼이 있습니다
   - 클릭하면 규칙 문법 오류가 있는지 확인합니다
   - 오류가 없으면 "규칙이 유효합니다" 메시지가 표시됩니다

2. 검증이 완료되면 **"게시"** (Publish) 버튼을 클릭합니다
   - 또는 **"배포"** (Deploy) 버튼

3. 확인 팝업이 나타나면 **"게시"** 또는 **"확인"** 클릭

#### 6단계: 완료 확인
1. 게시가 완료되면 상단에 "규칙이 성공적으로 게시되었습니다" 메시지가 표시됩니다
2. 이제 회원가입을 다시 시도할 수 있습니다

---

## 방법 2: Firebase CLI를 사용한 업데이트 (고급)

### 사전 준비
1. Firebase CLI 설치 확인:
   ```bash
   firebase --version
   ```
   설치되어 있지 않다면:
   ```bash
   npm install -g firebase-tools
   ```

2. Firebase 로그인:
   ```bash
   firebase login
   ```

3. 프로젝트 디렉토리에서 Firebase 초기화 (이미 되어 있다면 생략):
   ```bash
   firebase init firestore
   ```

### 배포 명령어
프로젝트 루트 디렉토리에서 실행:
```bash
firebase deploy --only firestore:rules
```

---

## 주의사항

### ⚠️ 보안 규칙 업데이트 시 주의할 점

1. **규칙 문법 확인**: 게시하기 전에 반드시 "검증" 버튼을 클릭하여 문법 오류가 없는지 확인하세요.

2. **기존 규칙 백업**: 기존 규칙을 변경하기 전에 복사해 두는 것을 권장합니다.

3. **배포 시간**: 규칙이 적용되는 데 몇 초에서 1분 정도 걸릴 수 있습니다.

4. **테스트**: 규칙 업데이트 후 실제로 회원가입을 테스트하여 정상 작동하는지 확인하세요.

---

## 문제 해결

### 규칙 검증 실패 시
- 문법 오류 메시지를 확인하고 수정하세요
- 특히 괄호 `()`, 중괄호 `{}`가 제대로 닫혀있는지 확인하세요

### 규칙이 적용되지 않을 때
- 브라우저를 새로고침하세요
- 몇 분 기다린 후 다시 시도하세요
- Firebase Console에서 규칙이 제대로 저장되었는지 확인하세요

### 여전히 "Missing or insufficient permissions" 오류가 발생할 때
1. Firebase Console에서 규칙이 제대로 게시되었는지 확인
2. 브라우저 캐시를 지우고 다시 시도
3. 회원가입 코드에서 사용자 인증 상태를 확인

---

## 확인 방법

규칙이 제대로 적용되었는지 확인하려면:

1. Firebase Console → Firestore Database → 규칙 탭
2. 현재 표시된 규칙이 위의 새 규칙과 일치하는지 확인
3. 실제로 회원가입을 시도하여 오류가 발생하지 않는지 확인

---

## 추가 정보

- Firebase 보안 규칙 문서: https://firebase.google.com/docs/firestore/security/get-started
- 규칙 테스트 시뮬레이터: Firebase Console의 규칙 탭에서 "시뮬레이터" 기능 사용 가능


