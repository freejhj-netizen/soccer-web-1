# GitHub 푸시 가이드

## 방법 1: 명령어로 직접 푸시 (권장)

### 1. GitHub 저장소 URL 확인
GitHub에서 저장소를 생성했다면, 저장소 페이지에서 **Code** 버튼을 클릭하면 URL이 보입니다.
예: `https://github.com/사용자명/soccer-web-1.git`

### 2. 원격 저장소 설정
```bash
# 기존 원격 저장소가 있다면 제거
git remote remove origin

# 새 원격 저장소 추가 (URL을 실제 저장소 URL로 변경)
git remote add origin https://github.com/사용자명/soccer-web-1.git

# 브랜치 이름 설정
git branch -M main
```

### 3. 변경사항 커밋 (아직 안 했다면)
```bash
git add .
git commit -m "feat: UI/UX 개선 및 기능 추가"
```

### 4. GitHub에 푸시 (토큰 사용)
```bash
# 푸시할 때 사용자명은 아무거나 입력하고, 비밀번호는 토큰을 입력
git push -u origin main
```

**인증 정보 입력:**
- Username: `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` (또는 GitHub 사용자명)
- Password: `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` (토큰)

### 또는 URL에 토큰 포함 (더 쉬운 방법)
```bash
# URL에 토큰을 포함하여 설정
git remote set-url origin https://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@github.com/사용자명/soccer-web-1.git

# 푸시
git push -u origin main
```

## 방법 2: 배치 파일 사용

1. `github_push.bat` 파일을 실행
2. GitHub 저장소 URL 입력
3. 자동으로 푸시됩니다

## 저장소 URL 확인 방법

1. GitHub에 로그인
2. 저장소 페이지로 이동
3. 초록색 **Code** 버튼 클릭
4. HTTPS 탭에서 URL 복사

## 문제 해결

### 인증 오류가 발생하는 경우
```bash
# URL에 토큰 포함하여 다시 설정
git remote set-url origin https://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@github.com/사용자명/soccer-web-1.git
```

### 푸시 권한 오류
- 토큰에 `repo` 권한이 있는지 확인
- 저장소가 Private인 경우 토큰에 `repo` 권한 필요

