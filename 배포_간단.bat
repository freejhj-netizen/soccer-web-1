@echo off
chcp 65001 >nul
echo ========================================
echo 간단 배포
echo ========================================
echo.

echo 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo 빌드 실패! 오류를 확인하세요.
    pause
    exit /b 1
)

echo.
echo 배포 중...
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo 배포 실패!
    echo.
    echo 확인 사항:
    echo 1. firebase login 실행했는지 확인
    echo 2. firebase use --add 로 프로젝트 선택했는지 확인
    pause
    exit /b 1
)

echo.
echo 배포 완료!
pause

