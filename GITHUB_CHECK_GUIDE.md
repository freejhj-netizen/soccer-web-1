# GitHub 웹사이트에서 확인하는 방법

## 1단계: 저장소 접속
1. https://github.com/freejhj-netizen/soccer-web-1 접속

## 2단계: 브랜치 확인
1. 저장소 페이지 상단에서 브랜치 드롭다운 확인
2. `main-clean-final` 브랜치가 선택되어 있는지 확인
3. 만약 `main` 브랜치가 선택되어 있다면, `main-clean-final`로 변경

## 3단계: 최신 커밋 확인
1. 파일 목록 위쪽에 최신 커밋 정보가 표시됨
2. 커밋 메시지 확인:
   - "feat: 파비콘 및 타이틀 변경" ← 가장 최신이어야 함
   - "feat: UI/UX 개선 및 기능 추가"
3. 커밋 시간 확인:
   - "방금 전" 또는 "몇 분 전"으로 표시되어야 함

## 4단계: index.html 파일 확인
1. 파일 목록에서 `index.html` 파일 찾기
2. `index.html` 파일 클릭
3. 파일 내용 확인:
   - **5번째 줄**: `<link rel="icon" type="image/png" href="/로고.png" />`
   - **10번째 줄**: `<title>NYJ BJ UTD U12</title>`
4. 파일 상단의 커밋 정보 확인:
   - 커밋 메시지: "feat: 파비콘 및 타이틀 변경"
   - 커밋 시간: "방금 전" 또는 "몇 분 전"

## 5단계: 커밋 히스토리 확인
1. 저장소 페이지에서 "X commits" 링크 클릭 (X는 숫자)
2. 또는 상단 메뉴에서 "Commits" 클릭
3. 최신 커밋이 맨 위에 표시되는지 확인
4. 커밋 메시지 확인:
   - "feat: 파비콘 및 타이틀 변경" (가장 최신)
   - "feat: UI/UX 개선 및 기능 추가"

## 문제 해결

### "35 minutes ago"가 최신인 경우
→ 로컬 변경사항이 아직 푸시되지 않았습니다.

**해결 방법:**
터미널에서 아래 명령어 실행:
```bash
git add index.html
git commit -m "feat: 파비콘 및 타이틀 변경"
git push -u origin main-clean-final
```

인증 정보:
- Username: `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`
- Password: `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`

### 브랜치가 다른 경우
→ `main-clean-final` 브랜치로 전환:
1. 브랜치 드롭다운 클릭
2. `main-clean-final` 선택

