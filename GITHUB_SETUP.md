# GitHub 저장소 연동 가이드

## 1단계: GitHub에서 저장소 생성

1. https://github.com 에 로그인
2. 우측 상단의 **+** 버튼 클릭 → **New repository** 선택
3. Repository name: `soccer-web-1` (또는 원하는 이름)
4. Public 또는 Private 선택
5. **"Initialize this repository with a README"** 체크 해제 (이미 로컬에 파일이 있으므로)
6. **Create repository** 클릭

## 2단계: 로컬에서 GitHub 저장소 연결

GitHub에서 저장소를 생성하면 나오는 URL을 복사한 후, 아래 명령어를 실행하세요:

```bash
# 원격 저장소 추가 (HTTPS 방식)
git remote add origin https://github.com/사용자명/soccer-web-1.git

# 또는 SSH 방식 (SSH 키가 설정되어 있다면)
git remote add origin git@github.com:사용자명/soccer-web-1.git
```

## 3단계: 브랜치 이름 설정 및 푸시

```bash
# 메인 브랜치 이름 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

## 4단계: 인증 (첫 푸시 시)

GitHub에 푸시할 때 인증이 필요합니다:

### 방법 1: Personal Access Token 사용 (권장)
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic) 클릭
3. Note: "soccer-web-1" 입력
4. Expiration: 원하는 기간 선택
5. Scopes: `repo` 체크
6. Generate token 클릭
7. 생성된 토큰을 복사 (한 번만 보여줌!)
8. 푸시할 때 비밀번호 대신 이 토큰 사용

### 방법 2: GitHub CLI 사용
```bash
# GitHub CLI 설치 후
gh auth login
```

## 확인 명령어

```bash
# 원격 저장소 확인
git remote -v

# 상태 확인
git status

# 커밋 이력 확인
git log --oneline -5
```

## 문제 해결

### 이미 원격 저장소가 있는 경우
```bash
# 기존 원격 저장소 제거
git remote remove origin

# 새 원격 저장소 추가
git remote add origin https://github.com/사용자명/soccer-web-1.git
```

### 푸시 오류 시
```bash
# 강제 푸시 (주의: 원격 저장소의 내용을 덮어씁니다)
git push -u origin main --force
```

