# Firestore 보안 규칙 배포 가이드

## 문제 상황
회원가입 시 "Missing or insufficient permissions" 오류가 발생하는 경우, Firestore 보안 규칙이 Firebase 서버에 배포되지 않았을 가능성이 높습니다.

## 해결 방법

### 방법 1: Firebase Console에서 직접 업데이트 (가장 빠름)

1. **Firebase Console 접속**
   - https://console.firebase.google.com/ 접속
   - 프로젝트 선택 (예: `webpage-2a5e5`)

2. **Firestore Database로 이동**
   - 왼쪽 사이드바에서 "Firestore Database" 클릭

3. **규칙 탭 열기**
   - 상단 탭에서 "규칙" (Rules) 클릭

4. **규칙 코드 복사 및 붙여넣기**
   - 프로젝트의 `firestore.rules` 파일 내용을 복사
   - Firebase Console의 규칙 편집기에 붙여넣기

5. **검증 및 게시**
   - "검증" 버튼 클릭하여 문법 오류 확인
   - "게시" 버튼 클릭하여 규칙 배포

### 방법 2: Firebase CLI를 사용한 배포

#### 사전 준비

1. **Firebase CLI 설치 확인**
   ```bash
   firebase --version
   ```
   설치되어 있지 않다면:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase 로그인**
   ```bash
   firebase login
   ```
   브라우저가 열리면 Google 계정으로 로그인

3. **프로젝트 확인**
   ```bash
   firebase use --add
   ```
   올바른 프로젝트 선택 (예: `webpage-2a5e5`)

#### 배포 실행

프로젝트 루트 디렉토리에서 실행:
```bash
firebase deploy --only firestore:rules
```

배포가 성공하면 다음과 같은 메시지가 표시됩니다:
```
✔ Deploy complete!
```

### 방법 3: 자동 배포 스크립트 사용

프로젝트에 `deploy_rules.bat` 파일을 생성하여 사용할 수 있습니다:

```batch
@echo off
echo Firestore 보안 규칙 배포 중...
firebase deploy --only firestore:rules
pause
```

## 배포 후 확인

1. **Firebase Console에서 확인**
   - Firestore Database → 규칙 탭
   - 최근 업데이트 시간 확인

2. **회원가입 테스트**
   - 회원가입 페이지에서 다시 시도
   - 오류가 발생하지 않는지 확인

## 문제 해결

### 배포 실패 시

1. **Firebase 로그인 확인**
   ```bash
   firebase login --reauth
   ```

2. **프로젝트 확인**
   ```bash
   firebase use
   ```

3. **규칙 파일 확인**
   - `firestore.rules` 파일이 프로젝트 루트에 있는지 확인
   - `firebase.json`에 `"firestore": { "rules": "firestore.rules" }` 설정 확인

### 여전히 오류가 발생하는 경우

1. **브라우저 캐시 삭제**
   - Ctrl + Shift + Delete
   - 캐시된 이미지 및 파일 삭제

2. **Firebase Console에서 규칙 직접 확인**
   - 규칙이 올바르게 저장되었는지 확인
   - 특히 `allow create: if request.auth != null && request.auth.uid == userId;` 규칙 확인

3. **콘솔 로그 확인**
   - 브라우저 개발자 도구 (F12) → Console 탭
   - 정확한 오류 메시지 확인

## 중요 사항

- Firestore 보안 규칙은 즉시 적용됩니다 (몇 초 내)
- 규칙 변경 후 테스트를 위해 잠시 기다려주세요
- 규칙 문법 오류가 있으면 배포가 실패합니다
- 배포 전에 반드시 "검증" 버튼을 클릭하세요


