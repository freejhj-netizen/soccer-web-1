# 배포 가이드

## 배포 단계

### 1단계: GitHub에 푸시

터미널에서 실행:

```bash
# 변경사항 커밋
git add .
git commit -m "feat: 파비콘 및 타이틀 변경"

# GitHub에 푸시
git push -u origin main-clean-final
```

인증 정보:
- Username: `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`
- Password: `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`

### 2단계: 빌드

```bash
npm run build
```

### 3단계: Firebase 배포

```bash
firebase deploy --only hosting
```

또는 전체 배포:
```bash
firebase deploy
```

## Firebase 프로젝트 정보
- 프로젝트 ID: `webpage-2a5e5`

## 배포 확인
배포가 완료되면 Firebase가 제공하는 URL로 접속하여 확인하세요.

