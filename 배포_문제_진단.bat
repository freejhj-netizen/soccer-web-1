@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls
echo ========================================
echo 배포 문제 진단
echo ========================================
echo.

echo [1] Firebase CLI 버전 확인...
echo.
firebase --version 2>nul
set firebase_cli_status=%errorlevel%
if !firebase_cli_status! neq 0 (
    echo [오류] Firebase CLI가 설치되지 않았습니다!
    echo.
    echo 설치 방법:
    echo   npm install -g firebase-tools
    echo.
) else (
    echo [성공] Firebase CLI 설치됨
)
echo.
echo 다음 단계로 진행하려면 아무 키나 누르세요...
pause >nul
echo.
echo.

echo [2] Firebase 로그인 상태 확인...
echo.
firebase projects:list >nul 2>&1
set firebase_login_status=%errorlevel%
if !firebase_login_status! neq 0 (
    echo [오류] Firebase에 로그인되지 않았습니다!
    echo.
    echo 해결 방법:
    echo   firebase login
    echo.
) else (
    echo [성공] Firebase 로그인됨
)
echo.
echo 다음 단계로 진행하려면 아무 키나 누르세요...
pause >nul
echo.
echo.

echo [3] 현재 프로젝트 확인...
echo.
firebase use >nul 2>&1
set firebase_project_status=%errorlevel%
if !firebase_project_status! neq 0 (
    echo [오류] 프로젝트가 선택되지 않았습니다!
    echo.
    echo 해결 방법:
    echo   firebase use --add
    echo.
) else (
    echo [성공] 프로젝트 선택됨
    firebase use
)
echo.
echo 다음 단계로 진행하려면 아무 키나 누르세요...
pause >nul
echo.
echo.

echo [4] 빌드 테스트...
echo 빌드를 시작합니다...
echo.
call npm run build 2>&1
set build_status=%errorlevel%
if !build_status! neq 0 (
    echo.
    echo [오류] 빌드 실패!
    echo 위의 오류 메시지를 확인하세요.
) else (
    echo.
    echo [성공] 빌드 성공
)
echo.
echo 다음 단계로 진행하려면 아무 키나 누르세요...
pause >nul
echo.
echo.

echo [5] dist 폴더 확인...
echo.
if exist dist (
    echo [성공] dist 폴더 존재
    if exist dist\index.html (
        echo [성공] index.html 파일 존재
    ) else (
        echo [오류] index.html 파일 없음
    )
) else (
    echo [오류] dist 폴더 없음
)
echo.

echo ========================================
echo 진단 완료
echo ========================================
echo.
echo 결과를 확인하셨나요?
echo.
pause
