@echo off
chcp 65001 >nul
echo ========================================
echo GitHub 푸시 스크립트 (간단 버전)
echo ========================================
echo.

echo 모든 변경사항을 스테이징합니다...
git add .
echo.

echo 커밋을 생성합니다...
git commit -m "feat: UI/UX 개선 및 기능 추가"
if %errorlevel% neq 0 (
    echo 경고: 커밋할 변경사항이 없거나 이미 커밋되었습니다.
    echo 계속 진행합니다...
)
echo.

echo 원격 저장소를 설정합니다...
git remote remove origin 2>nul
git remote add origin https://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@github.com/freejhj-netizen/soccer-web-1.git
git branch -M main
echo.

echo GitHub에 푸시합니다...
git push -u origin main --force
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 성공! GitHub에 푸시되었습니다!
    echo ========================================
    echo.
    echo 저장소 확인: https://github.com/freejhj-netizen/soccer-web-1
) else (
    echo.
    echo ========================================
    echo 오류가 발생했습니다!
    echo ========================================
    echo.
    echo 위의 오류 메시지를 확인하세요.
)
echo.
pause

