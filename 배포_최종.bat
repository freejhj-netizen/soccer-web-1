@echo off
chcp 65001 >nul
echo ========================================
echo 최종 배포 시작
echo ========================================
echo.
echo 모든 변경사항을 반영하여 배포합니다.
echo.

echo [1단계] 이전 빌드 파일 삭제...
if exist dist (
    rmdir /s /q dist
    echo ✅ dist 폴더 삭제 완료
) else (
    echo ℹ️  dist 폴더가 없습니다 (정상)
)
echo.

echo [2단계] 프로젝트 빌드 중...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패!
    echo 오류 메시지를 확인하고 다시 시도해주세요.
    pause
    exit /b 1
)
echo.
echo ✅ 빌드 완료!
echo.

echo [3단계] 빌드 결과 확인...
if not exist dist (
    echo ❌ dist 폴더가 생성되지 않았습니다!
    pause
    exit /b 1
)
if not exist dist\index.html (
    echo ❌ dist\index.html 파일이 없습니다!
    pause
    exit /b 1
)
echo ✅ 빌드 결과 확인 완료
echo.

echo [4단계] Firebase 배포 중...
echo.
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ 배포 실패!
    echo.
    echo 가능한 원인:
    echo 1. Firebase에 로그인되지 않았습니다
    echo    해결: firebase login 명령어 실행
    echo.
    echo 2. 프로젝트가 선택되지 않았습니다
    echo    해결: firebase use --add 명령어 실행
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 배포 완료!
echo ========================================
echo.
echo 중요: 배포 후 브라우저 캐시를 지우고 새로고침하세요!
echo (Ctrl + Shift + Delete 또는 Ctrl + F5)
echo.
pause


