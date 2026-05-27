@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls

echo ========================================
echo main-clean-final 브랜치에 저장
echo ========================================
echo.

echo [1/5] 현재 브랜치 확인...
echo.
git branch --show-current
echo.

echo [2/5] main-clean-final 브랜치로 전환...
echo.
git checkout main-clean-final 2>nul
if %errorlevel% neq 0 (
    echo 브랜치가 없어서 생성합니다...
    git checkout -b main-clean-final
    if %errorlevel% neq 0 (
        echo ❌ 브랜치 생성 실패!
        pause
        exit /b 1
    )
    echo ✅ 브랜치 생성 및 전환 완료
) else (
    echo ✅ 브랜치 전환 완료
)
echo.

echo [3/5] 변경사항 스테이징...
echo.
git add .
if %errorlevel% neq 0 (
    echo ❌ 파일 추가 실패!
    pause
    exit /b 1
)
echo ✅ 모든 변경사항 스테이징 완료
echo.

echo [4/5] 커밋 생성...
echo.
git commit -m "Fix: Game 6쿼터 지원, 상대팀 분석 저장 오류 수정, GuestRoleModal 개선, AuthContext 관리자 권한 로직 수정, Firestore 규칙 수정"
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  커밋 실패 또는 변경사항이 없습니다.
    echo.
) else (
    echo ✅ 커밋 완료
)
echo.

echo [5/5] GitHub에 푸시...
echo.
git push origin main-clean-final
if %errorlevel% neq 0 (
    echo.
    echo ❌ GitHub 푸시 실패!
    echo.
    echo 확인 사항:
    echo   1. GitHub 원격 저장소가 설정되어 있는지 확인
    echo   2. git remote -v 명령어로 확인
    echo   3. GitHub 인증이 되어 있는지 확인
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ main-clean-final 브랜치에 저장 완료!
echo ========================================
echo.
echo 저장된 내용:
echo   - 로컬 Git 저장소 (main-clean-final 브랜치)
echo   - GitHub 원격 저장소 (main-clean-final 브랜치)
echo.
echo 최근 커밋 확인:
git log --oneline -3
echo.
pause


