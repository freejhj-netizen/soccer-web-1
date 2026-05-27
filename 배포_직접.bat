@echo off
setlocal
chcp 65001 >nul 2>&1
cls

echo ========================================
echo Firebase 배포
echo ========================================
echo.

echo 1단계: 빌드 중...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [오류] 빌드 실패!
    echo.
    pause
    exit /b 1
)
echo.
echo [성공] 빌드 완료
echo.

echo 2단계: Firebase 배포 중...
echo.
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo [오류] 배포 실패!
    echo.
    echo 확인 사항:
    echo   1. firebase login 실행
    echo   2. firebase use --add 로 프로젝트 선택
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo [성공] 배포 완료!
echo ========================================
echo.
pause


