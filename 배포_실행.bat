@echo off
chcp 65001 >nul
echo ========================================
echo Firebase 배포 시작
echo ========================================
echo.

echo [1/3] 프로젝트 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo 빌드 실패!
    pause
    exit /b 1
)
echo 빌드 완료!
echo.

echo [2/3] Firebase 로그인 확인 중...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo Firebase에 로그인되지 않았습니다.
    echo 로그인을 진행합니다...
    firebase login
)
echo.

echo [3/3] Firebase에 배포 중...
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo 배포 실패!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 배포 완료!
echo ========================================
pause
