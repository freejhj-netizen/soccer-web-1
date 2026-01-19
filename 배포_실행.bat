@echo off
chcp 65001 >nul
echo ====================================
echo 배포 시작
echo ====================================
echo.

echo [1/5] 빌드 테스트...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패! 오류를 확인하세요.
    pause
    exit /b 1
)
echo.
echo ✅ 빌드 성공!
echo.

echo [2/5] Git 상태 확인...
git status
echo.

echo [3/5] 변경사항 커밋...
git add -A
git commit -m "fix: 빌드 오류 수정 및 최종 배포

- OpponentAnalysis.tsx: 사용하지 않는 import 및 함수 제거
- 빌드 오류 해결
- 최종 배포 준비 완료"
echo.

echo [4/5] GitHub에 푸시...
git push origin main-clean-final
if %errorlevel% neq 0 (
    echo.
    echo main 브랜치로 시도...
    git push origin main
)
echo.

echo [5/5] Firebase 배포...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ Firebase 배포 실패!
    pause
    exit /b 1
)
echo.

echo ====================================
echo ✅ 배포 완료!
echo ====================================
echo.
echo 배포된 위치:
echo - GitHub: https://github.com/freejhj-netizen/soccer-web-1
echo - Firebase Hosting: 배포 완료
echo.
pause

