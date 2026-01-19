@echo off
chcp 65001 >nul
echo ====================================
echo 빌드 오류 수정 및 저장
echo ====================================
echo.

echo [1단계] 빌드 오류 수정 확인...
call npm run build
if %errorlevel% neq 0 (
    echo 빌드 오류가 있습니다. 수정 후 다시 시도하세요.
    pause
    exit /b 1
)
echo 빌드 성공!
echo.

echo [2단계] Git 상태 확인...
git status
echo.

echo [3단계] 변경사항 스테이징...
git add -A
git status --short
echo.

echo [4단계] 커밋 생성...
git commit -m "fix: 빌드 오류 수정 - 사용하지 않는 import 및 함수 제거"
echo.

echo [5단계] GitHub에 푸시...
git push origin main-clean-final
if %errorlevel% neq 0 (
    echo GitHub 푸시 실패. main 브랜치로 시도합니다...
    git push origin main
)
echo.

echo [6단계] Firebase 배포...
call firebase deploy --only hosting
echo.

echo ====================================
echo 모든 작업 완료!
echo ====================================
pause

