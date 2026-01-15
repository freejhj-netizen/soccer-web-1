@echo off
echo GitHub 저장소 연동 스크립트
echo.

REM GitHub 저장소 URL을 입력하세요 (예: https://github.com/사용자명/soccer-web-1.git)
set /p REPO_URL="GitHub 저장소 URL을 입력하세요: "

if "%REPO_URL%"=="" (
    echo 오류: 저장소 URL을 입력해주세요.
    pause
    exit /b 1
)

REM 원격 저장소 설정
echo.
echo 원격 저장소 설정 중...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

REM 브랜치 이름 설정
echo.
echo 브랜치 이름 설정 중...
git branch -M main

REM 변경사항 커밋
echo.
echo 변경사항 커밋 중...
git add .
git commit -m "feat: UI/UX 개선 및 기능 추가" 2>nul

REM GitHub에 푸시 (토큰 사용)
echo.
echo GitHub에 푸시 중...
echo 사용자명: 토큰 사용
echo 비밀번호: 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
echo.
git push -u origin main

echo.
echo 완료!
pause

