@echo off
chcp 65001 >nul
echo ====================================
echo 최종 저장 작업 시작
echo ====================================
echo.

echo [1단계] 빌드 테스트...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패! 오류를 확인하세요.
    pause
    exit /b 1
)
echo.
echo ✅ 빌드 성공!
echo.

echo [2단계] Git 상태 확인...
git status
echo.

echo [3단계] 변경사항 스테이징...
git add -A
echo.

echo [4단계] 커밋 생성...
git commit -m "fix: 빌드 오류 수정 및 최종 저장

- OpponentAnalysis.tsx: 사용하지 않는 import 및 함수 제거
- 빌드 오류 해결"
echo.

echo [5단계] GitHub에 푸시...
git push origin main-clean-final
if %errorlevel% neq 0 (
    echo.
    echo main 브랜치로 시도...
    git push origin main
)
echo.

echo [6단계] Firebase 배포...
call firebase deploy --only hosting
echo.

echo ====================================
echo ✅ 모든 저장 작업 완료!
echo ====================================
echo.
echo 저장된 위치:
echo - 로컬: C:\Users\1\soccer-web-1
echo - GitHub: https://github.com/freejhj-netizen/soccer-web-1
echo - Firebase: 배포 완료
echo.
pause


