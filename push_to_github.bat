@echo off
chcp 65001 >nul
echo ========================================
echo GitHub 푸시 스크립트
echo ========================================
echo.

echo [1/5] Git 상태 확인...
git status
echo.

echo [2/5] 변경사항 스테이징...
git add .
echo.

echo [3/5] 커밋 생성...
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
echo.

echo [4/5] 원격 저장소 설정...
git remote remove origin 2>nul
git remote add origin https://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@github.com/freejhj-netizen/soccer-web-1.git
git branch -M main
echo.

echo [5/5] GitHub에 푸시...
git push -u origin main
echo.

echo ========================================
echo 완료!
echo ========================================
echo.
echo GitHub 저장소를 확인하세요:
echo https://github.com/freejhj-netizen/soccer-web-1
echo.
pause

