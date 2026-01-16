# GitHub 저장 상태 확인 가이드

## 확인 방법

### 방법 1: 터미널에서 확인

Git Bash 또는 PowerShell에서 아래 명령어를 실행하세요:

```bash
# 1. 현재 상태 확인
git status

# 2. 최근 커밋 확인
git log --oneline -5

# 3. 원격 저장소 확인
git remote -v

# 4. 원격 브랜치 정보 가져오기
git fetch origin

# 5. 로컬과 원격의 차이 확인
git log HEAD..origin/main-clean-final --oneline
git log origin/main-clean-final..HEAD --oneline

# 6. 푸시되지 않은 커밋 확인
git log origin/main-clean-final..HEAD --oneline
```

### 방법 2: GitHub 웹사이트에서 확인

1. https://github.com/freejhj-netizen/soccer-web-1 접속
2. 브랜치가 `main-clean-final`인지 확인
3. 최신 커밋 메시지 확인:
   - "feat: 파비콘 및 타이틀 변경"
   - "feat: UI/UX 개선 및 기능 추가"
4. 파일 목록에서 확인:
   - `index.html` 파일이 있는지
   - `src/pages/Main.tsx` 등 수정한 파일들이 있는지
5. `index.html` 파일을 클릭하여 내용 확인:
   - 파비콘이 `/로고.png`인지
   - 타이틀이 `NYJ BJ UTD U12`인지

## 현재 로컬 상태 확인

✅ `index.html` 파일 확인:
- 파비콘: `/로고.png` ✓
- 타이틀: `NYJ BJ UTD U12` ✓

## 푸시가 필요한 경우

만약 푸시되지 않은 커밋이 있다면:

```bash
git push -u origin main-clean-final
```

인증 정보:
- Username: `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`
- Password: `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`

