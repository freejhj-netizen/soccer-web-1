@echo off
chcp 65001 >nul
echo ========================================
echo 최종 배포 시작
echo ========================================
echo.

echo [1단계] Firebase CLI 확인...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI가 설치되지 않았습니다!
    echo.
    echo 설치 방법:
    echo npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)
echo ✅ Firebase CLI 확인 완료
echo.

echo [2단계] Firebase 로그인 확인...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase에 로그인되지 않았습니다!
    echo.
    echo 로그인을 진행합니다...
    firebase login
    if %errorlevel% neq 0 (
        echo ❌ 로그인 실패!
        pause
        exit /b 1
    )
)
echo ✅ Firebase 로그인 확인 완료
echo.

echo [3단계] 프로젝트 확인...
firebase use >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 프로젝트가 선택되지 않았습니다!
    echo.
    echo 프로젝트를 선택합니다...
    firebase use --add
    if %errorlevel% neq 0 (
        echo ❌ 프로젝트 선택 실패!
        pause
        exit /b 1
    )
)
echo ✅ 프로젝트 확인 완료
echo.

echo [4단계] 이전 빌드 파일 삭제...
if exist dist (
    rmdir /s /q dist
    echo ✅ dist 폴더 삭제 완료
) else (
    echo ℹ️  dist 폴더가 없습니다 (정상)
)
echo.

echo [5단계] 프로젝트 빌드 중...
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

echo [6단계] 빌드 결과 확인...
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

echo [7단계] Firebase 배포 중...
echo.
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ 배포 실패!
    echo.
    echo 자세한 오류 메시지를 확인해주세요.
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


