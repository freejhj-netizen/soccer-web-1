@echo off
chcp 65001 >nul
echo ========================================
echo GitHub 푸시 스크립트 (깨끗한 버전)
echo ========================================
echo.
echo 이 스크립트는 토큰이 포함된 파일 없이 푸시합니다.
echo.

echo [1/5] 현재 브랜치 확인...
git branch
echo.

echo [2/5] 원격 저장소 설정...
git remote remove origin 2>nul
git remote add origin https://github.com/freejhj-netizen/soccer-web-1.git
git branch -M main
echo.

echo [3/5] 원격 저장소 확인...
git remote -v
echo.

echo [4/5] 변경사항 확인...
git status
echo.

echo [5/5] GitHub에 푸시...
echo.
echo ========================================
echo 인증 정보 입력 필요
echo ========================================
echo 사용자명: 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
echo 비밀번호: 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
echo.
echo (위 정보를 복사하여 입력하세요)
echo.
git push -u origin main --force
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo 성공! GitHub에 푸시되었습니다!
    echo ========================================
    echo.
    echo 저장소 확인: https://github.com/freejhj-netizen/soccer-web-1
) else (
    echo ========================================
    echo 오류가 발생했습니다!
    echo ========================================
    echo.
    echo 다음 방법을 시도해보세요:
    echo 1. 새 브랜치로 푸시 (push_new_branch.bat 실행)
    echo 2. 커밋 히스토리 정리 필요
)
echo.
pause

