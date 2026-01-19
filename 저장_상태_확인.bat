@echo off
chcp 65001 >nul
echo ====================================
echo 저장 상태 확인 리포트
echo ====================================
echo.

echo [1] Git 상태 확인
echo ------------------------------------
git status
echo.

echo [2] 최근 커밋 내역 (최근 5개)
echo ------------------------------------
git log --oneline -5
echo.

echo [3] 원격 저장소와의 동기화 상태
echo ------------------------------------
git fetch origin 2>&1
git status -sb
echo.

echo [4] 푸시되지 않은 커밋 확인
echo ------------------------------------
git log origin/main-clean-final..HEAD --oneline 2>&1
if %errorlevel% equ 0 (
    echo 푸시되지 않은 커밋이 있습니다.
) else (
    echo 모든 커밋이 푸시되었습니다.
)
echo.

echo [5] 빌드 상태 확인
echo ------------------------------------
call npm run build 2>&1 | findstr /C:"error" /C:"Error" /C:"built" /C:"vite"
echo.

echo [6] 변경된 파일 목록
echo ------------------------------------
git diff --name-only HEAD origin/main-clean-final 2>&1 | head -20
echo.

echo [7] 로컬 변경사항 확인
echo ------------------------------------
git diff --name-only
if %errorlevel% equ 0 (
    echo 커밋되지 않은 변경사항이 있습니다.
) else (
    echo 모든 변경사항이 커밋되었습니다.
)
echo.

echo ====================================
echo 확인 완료
echo ====================================
echo.
echo 확인 사항:
echo 1. Git 상태가 "working tree clean"인지 확인
echo 2. 최근 커밋에 작업 내용이 포함되어 있는지 확인
echo 3. 빌드 오류가 없는지 확인
echo 4. GitHub에 푸시되었는지 확인
echo.
pause

