@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls

echo ========================================
echo 최종 배포 (호스팅 + Firestore 규칙)
echo ========================================
echo.

echo [1/5] 이전 빌드 파일 삭제...
if exist dist (
    rmdir /s /q dist
    echo ✅ dist 폴더 삭제 완료
) else (
    echo ℹ️  dist 폴더가 없습니다
)
echo.

echo [2/5] 프로젝트 빌드 중...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패!
    echo 위의 오류 메시지를 확인하고 수정하세요.
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ 빌드 완료!
echo.

echo [3/5] 빌드 결과 확인...
if not exist dist (
    echo ❌ dist 폴더가 생성되지 않았습니다!
    pause
    exit /b 1
)
if not exist dist\index.html (
    echo ❌ dist\index.html 파일이 없습니다!
    pause
    exit /b 1
)
echo ✅ 빌드 결과 확인 완료
echo.

echo [4/5] Firestore 보안 규칙 배포 중...
echo.
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Firestore 규칙 배포 실패 (호스팅은 계속 진행)
    echo Firebase Console에서 수동으로 규칙을 업데이트하세요.
    echo.
) else (
    echo ✅ Firestore 규칙 배포 완료
)
echo.

echo [5/5] Firebase 호스팅 배포 중...
echo.
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ 호스팅 배포 실패!
    echo.
    echo 확인 사항:
    echo   1. firebase login 실행
    echo   2. firebase use --add 로 프로젝트 선택
    echo   3. dist 폴더가 생성되었는지 확인
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 배포 완료!
echo ========================================
echo.
echo 배포된 내용:
echo   - 호스팅: 모든 최신 변경사항
echo   - Firestore 규칙: opponentAnalyses 컬렉션 권한 수정
echo.
echo 중요: 배포 후 브라우저 캐시를 지우고 새로고침하세요!
echo (Ctrl + Shift + Delete 또는 Ctrl + F5)
echo.
pause

