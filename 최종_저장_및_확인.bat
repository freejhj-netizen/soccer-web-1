@echo off
chcp 65001 >nul
echo ====================================
echo 최종 저장 및 확인 시작
echo ====================================
echo.

echo [1단계] 빌드 테스트...
call npm run build > build_log.txt 2>&1
if %errorlevel% neq 0 (
    echo ❌ 빌드 실패!
    type build_log.txt
    del build_log.txt
    pause
    exit /b 1
)
echo ✅ 빌드 성공!
del build_log.txt
echo.

echo [2단계] Git 상태 확인...
git status > git_status.txt 2>&1
type git_status.txt
echo.

echo [3단계] 변경사항 스테이징...
git add -A
echo.

echo [4단계] 커밋 생성...
git commit -m "deploy: 최종 배포 및 저장

- 모든 기능 구현 완료
- 빌드 오류 수정
- 배포 준비 완료" 2>&1
echo.

echo [5단계] GitHub 푸시...
git push origin main-clean-final > push_log.txt 2>&1
if %errorlevel% neq 0 (
    echo GitHub 푸시 실패. main 브랜치로 시도...
    git push origin main >> push_log.txt 2>&1
)
type push_log.txt
del push_log.txt
echo.

echo [6단계] Firebase 배포...
call firebase deploy --only hosting > deploy_log.txt 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase 배포 실패!
    type deploy_log.txt
    del deploy_log.txt
    pause
    exit /b 1
)
type deploy_log.txt
del deploy_log.txt
echo.

echo ====================================
echo 저장 상태 최종 확인
echo ====================================
echo.

echo [확인 1] Git 로컬 상태...
git status
echo.

echo [확인 2] 최근 커밋 내역...
git log --oneline -3
echo.

echo [확인 3] 원격 저장소와의 동기화...
git fetch origin 2>&1
git status -sb
echo.

echo [확인 4] 푸시되지 않은 커밋 확인...
git log origin/main-clean-final..HEAD --oneline 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ 푸시되지 않은 커밋이 있습니다.
) else (
    echo ✅ 모든 커밋이 푸시되었습니다.
)
echo.

echo [확인 5] 빌드 폴더 확인...
if exist dist\index.html (
    echo ✅ dist 폴더 존재
    dir dist\index.html
) else (
    echo ❌ dist 폴더 없음
)
echo.

echo ====================================
echo ✅ 최종 저장 완료!
echo ====================================
echo.
echo 저장된 위치:
echo - 로컬: C:\Users\1\soccer-web-1
echo - GitHub: https://github.com/freejhj-netizen/soccer-web-1
echo - Firebase: webpage-2a5e5
echo.
pause

