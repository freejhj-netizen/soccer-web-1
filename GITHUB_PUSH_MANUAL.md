# GitHub 푸시 수동 가이드

터미널에서 아래 명령어를 **순서대로** 실행하세요:

## 1단계: 변경사항 확인 및 스테이징

```bash
git status
git add .
```

## 2단계: 커밋 생성

```bash
git commit -m "feat: UI/UX 개선 및 기능 추가

- Main 페이지: 유니폼 탭 레이아웃 개선 (HOME/AWAY/THIRD 세로 배치)
- Main 페이지: 다가오는 일정을 Calendar 페이지와 동일하게 반영
- Calendar 페이지: 다가오는 일정 UI 개선, 필터 및 정렬 기능 추가
- Game 페이지: 시즌 필터 고정, 테이블에서 관리 컬럼 제거
- GameDetail 페이지: 수정 버튼 클릭 시 Game 페이지로 이동하여 수정 모달 열기
- Game 모달: 쿼터별 결과에 '미진행' 추가, 점수 기본값 공란으로 변경
- Notice 페이지: 리치 텍스트 에디터 추가, 버튼 스타일 변경
- PostDetail 페이지: HTML 렌더링, 메타데이터 표시 개선
- Setting 페이지: 이메일 배경 수정, 권한 추가, 회원탈퇴 기능 추가
- Admin 페이지: 권한 변경 저장 버튼 추가, 계정 관리 UI 개선
- 자유게시판 페이지 삭제"
```

## 3단계: 원격 저장소 설정 (토큰 포함)

```bash
# 기존 원격 저장소 제거
git remote remove origin

# 새 원격 저장소 추가 (토큰 포함)
git remote add origin https://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@github.com/freejhj-netizen/soccer-web-1.git

# 브랜치 이름 설정
git branch -M main
```

## 4단계: GitHub에 푸시

```bash
git push -u origin main
```

## 확인

푸시가 성공하면:
1. https://github.com/freejhj-netizen/soccer-web-1 접속
2. 최신 커밋이 "방금 전" 또는 "몇 분 전"으로 표시되는지 확인
3. 파일 목록에 최근 수정한 파일들이 있는지 확인

## 문제 해결

### 오류: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://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@github.com/freejhj-netizen/soccer-web-1.git
```

### 오류: "authentication failed"
- 토큰이 만료되었거나 권한이 없는 경우
- GitHub에서 새 토큰 생성 필요

### 오류: "failed to push some refs"
```bash
# 원격 저장소의 변경사항을 먼저 가져오기
git pull origin main --allow-unrelated-histories

# 다시 푸시
git push -u origin main
```

