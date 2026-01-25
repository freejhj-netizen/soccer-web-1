@echo off
chcp 65001 >nul
echo ========================================
echo 완전 배포 시작 (모든 변경사항 반영)
echo ========================================
echo.

echo [1/4] 이전 빌드 파일 삭제 중...
if exist dist rmdir /s /q dist
echo 완료!
echo.

echo [2/4] 프로젝트 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패!
    echo 오류를 확인하고 다시 시도해주세요.
    pause
    exit /b 1
)
echo.
echo ✅ 빌드 완료!
echo.

echo [3/4] 빌드 결과 확인 중...
if not exist dist (
    echo ❌ dist 폴더가 생성되지 않았습니다!
    pause
    exit /b 1
)
echo ✅ dist 폴더 확인 완료
echo.

echo [4/4] Firebase에 배포 중...
echo.
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ 배포 실패!
    echo Firebase 로그인 상태를 확인해주세요.
    echo 'firebase login' 명령어로 로그인하세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 배포 완료!
echo ========================================
echo.
echo 배포된 사이트에서 변경사항을 확인해주세요.
echo (브라우저 캐시를 지우고 새로고침하세요)
echo.
pause

