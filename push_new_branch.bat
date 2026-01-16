@echo off
chcp 65001 >nul
echo ========================================
echo 새 브랜치로 GitHub 푸시
echo ========================================
echo.
echo 이 방법은 기존 커밋 히스토리를 무시하고 새로 시작합니다.
echo.

echo [1/6] 현재 상태 확인...
git status
echo.

echo [2/6] 모든 변경사항 스테이징...
git add .
echo.

echo [3/6] 커밋 생성...
git commit -m "feat: UI/UX 개선 및 기능 추가" 2>nul
if %errorlevel% neq 0 (
    echo 경고: 커밋할 변경사항이 없거나 이미 커밋되었습니다.
)
echo.

echo [4/6] 새 브랜치 생성...
git checkout -b main-clean 2>nul || git branch main-clean
git checkout main-clean
echo.

echo [5/6] 원격 저장소 설정...
git remote remove origin 2>nul
git remote add origin https://github.com/freejhj-netizen/soccer-web-1.git
echo.

echo [6/6] 새 브랜치로 푸시...
echo.
echo ========================================
echo 인증 정보 입력 필요
echo ========================================
echo 사용자명: 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
echo 비밀번호: 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
echo.
echo (위 정보를 복사하여 입력하세요)
echo.
git push -u origin main-clean --force
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo 성공! 새 브랜치로 푸시되었습니다!
    echo ========================================
    echo.
    echo 다음 단계:
    echo 1. https://github.com/freejhj-netizen/soccer-web-1 접속
    echo 2. Settings - General - Default branch
    echo 3. main-clean을 기본 브랜치로 설정
    echo 4. main 브랜치 삭제 (선택사항)
    echo 5. main-clean을 main으로 이름 변경
) else (
    echo ========================================
    echo 오류가 발생했습니다!
    echo ========================================
    echo.
    echo 위의 오류 메시지를 확인하세요.
)
echo.
pause

