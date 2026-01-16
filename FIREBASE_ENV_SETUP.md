# Firebase 환경 변수 설정 방법

## 빠른 시작

1. 프로젝트 루트에 `.env.local` 파일을 생성하세요.

2. 다음 내용을 복사하여 붙여넣고, 실제 Firebase 설정값으로 채워주세요:

```env
VITE_FIREBASE_API_KEY=실제_API_KEY_입력
VITE_FIREBASE_AUTH_DOMAIN=실제_AUTH_DOMAIN_입력
VITE_FIREBASE_PROJECT_ID=실제_PROJECT_ID_입력
VITE_FIREBASE_STORAGE_BUCKET=실제_STORAGE_BUCKET_입력
VITE_FIREBASE_MESSAGING_SENDER_ID=실제_MESSAGING_SENDER_ID_입력
VITE_FIREBASE_APP_ID=실제_APP_ID_입력

VITE_DEV_MODE=true
VITE_ADMIN_EMAIL=cjjhj@naver.com
```

3. 개발 서버를 재시작하세요:
```bash
npm run dev
```

## Firebase 설정값 찾는 방법

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. ⚙️ 아이콘 (프로젝트 설정) 클릭
4. "일반" 탭에서 "내 앱" 섹션 확인
5. 웹 앱이 없으면 "앱 추가" > "웹" 선택
6. `firebaseConfig` 객체의 값들을 `.env.local`에 입력

## 개발 모드 기능

`VITE_DEV_MODE=true`로 설정하면:
- 로컬호스트에서 Firebase 인증 없이 관리자 권한으로 자동 접근
- 모든 페이지와 관리자 기능 사용 가능
- 콘솔에 "🔧 개발 모드" 메시지 표시

## 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 실제 Firebase 프로젝트의 설정값을 사용하세요
- 배포 시에는 호스팅 서비스의 환경 변수 설정을 사용하세요

