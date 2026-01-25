@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls

echo ========================================
echo 저장 상태 확인
echo ========================================
echo.

echo [1] Git 저장소 확인...
echo.
git status --short
if %errorlevel% neq 0 (
    echo ❌ Git 저장소가 초기화되지 않았습니다.
) else (
    echo ✅ Git 저장소 확인 완료
)
echo.

echo [2] 최근 커밋 확인...
echo.
git log --oneline -5
echo.

echo [3] 원격 저장소 확인...
echo.
git remote -v
if %errorlevel% neq 0 (
    echo ❌ 원격 저장소가 설정되지 않았습니다.
) else (
    echo ✅ 원격 저장소 확인 완료
)
echo.

echo [4] 현재 브랜치 확인...
echo.
git branch --show-current
echo.

echo ========================================
echo 확인 완료
echo ========================================
pause
