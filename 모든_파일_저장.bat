@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls

echo ========================================
echo 모든 파일 저장 (Git + GitHub)
echo ========================================
echo.

echo [1/4] Git 상태 확인...
echo.
git status
if %errorlevel% neq 0 (
    echo.
    echo ❌ Git이 초기화되지 않았거나 오류가 발생했습니다.
    echo.
    pause
    exit /b 1
)
echo.

echo [2/4] 변경사항 스테이징...
echo.
git add .
if %errorlevel% neq 0 (
    echo.
    echo ❌ 파일 추가 실패!
    pause
    exit /b 1
)
echo ✅ 모든 변경사항 스테이징 완료
echo.

echo [3/4] 커밋 생성...
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

echo [4/4] GitHub에 푸시...
echo.
git push origin main
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
echo ✅ 모든 파일 저장 완료!
echo ========================================
echo.
echo 저장된 내용:
echo   - 로컬 Git 저장소
echo   - GitHub 원격 저장소
echo.
echo 최근 커밋 확인:
git log --oneline -3
echo.
pause

