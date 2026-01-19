@echo off
chcp 65001 >nul
echo ====================================
echo 모든 작업 공간에 저장 시작
echo ====================================
echo.

echo [1/4] Git 상태 확인...
git status
echo.

echo [2/4] 변경사항 스테이징...
git add -A
echo.

echo [3/4] 커밋 생성...
git commit -m "feat: 상대팀 분석 및 HIGHLIGHT 페이지 기능 추가 및 개선

- Player 페이지: 이미지 삭제 기능 추가
- 상대팀 분석 페이지: 표 스타일 개선, A팀/B팀 스코어 분리, 검색 필터 추가
- HIGHLIGHT 페이지: 유튜브 URL 입력 및 썸네일 자동 표시 기능 추가
- 버튼 텍스트 및 UI 개선"
echo.

echo [4/4] GitHub에 푸시...
git push origin main
echo.

echo [5/5] 프로젝트 빌드...
call npm run build
echo.

echo [6/6] Firebase 배포...
call firebase deploy --only hosting
echo.

echo ====================================
echo 모든 저장 작업 완료!
echo ====================================
echo.
echo 저장된 위치:
echo - 로컬 파일: C:\Users\1\soccer-web-1
echo - GitHub: https://github.com/freejhj-netizen/soccer-web-1
echo - Firebase Hosting: 배포 완료
echo.
pause

