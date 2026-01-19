@echo off
chcp 65001 >nul
echo ====================================
echo 즉시 배포 실행
echo ====================================
echo.

echo [1단계] 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)
echo ✅ 빌드 완료!
echo.

echo [2단계] Git 커밋...
git add -A
git commit -m "deploy: 최종 배포" 2>&1
echo.

echo [3단계] GitHub 푸시...
git push origin main-clean-final 2>&1
echo.

echo [4단계] Firebase 배포...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ 배포 실패!
    pause
    exit /b 1
)
echo.

echo ====================================
echo ✅ 배포 완료!
echo ====================================
pause

