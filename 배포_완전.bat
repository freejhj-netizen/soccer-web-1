@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls

echo ========================================
echo 완전 배포 스크립트
echo ========================================
echo.

echo [1/4] 이전 빌드 파일 삭제...
if exist dist (
    rmdir /s /q dist
    echo ✅ dist 폴더 삭제 완료
) else (
    echo ℹ️  dist 폴더가 없습니다
)
echo.

echo [2/4] TypeScript 타입 체크...
echo.
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo ❌ TypeScript 오류가 있습니다!
    echo 위의 오류를 수정하고 다시 시도하세요.
    echo.
    pause
    exit /b 1
)
echo ✅ TypeScript 타입 체크 통과
echo.

echo [3/4] 프로젝트 빌드 중...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패!
    echo 위의 오류 메시지를 확인하고 수정하세요.
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ 빌드 완료!
echo.

echo [4/4] Firebase 배포 중...
echo.
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ 배포 실패!
    echo.
    echo 확인 사항:
    echo   1. firebase login 실행
    echo   2. firebase use --add 로 프로젝트 선택
    echo   3. dist 폴더가 생성되었는지 확인
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 배포 완료!
echo ========================================
echo.
echo 배포된 사이트에서 변경사항을 확인하세요.
echo (브라우저 캐시를 지우고 새로고침: Ctrl + Shift + Delete)
echo.
pause


