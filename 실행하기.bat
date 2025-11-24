@echo off
REM 전자 방명록 - 간단 실행 파일
REM 이 파일을 더블클릭하면 서버가 시작되고 브라우저가 자동으로 열립니다!

REM 현재 스크립트의 디렉토리로 이동
cd /d "%~dp0"

REM Node.js 설치 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo.
    echo Node.js를 설치해주세요: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM npm install 실행 (node_modules가 없을 경우)
if not exist "node_modules" (
    echo.
    echo ========================================
    echo 최초 실행: 패키지를 설치하는 중...
    echo ========================================
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [오류] 패키지 설치에 실패했습니다.
        pause
        exit /b 1
    )
    echo.
    echo 설치 완료!
    echo.
)

REM 서버 시작
echo ========================================
echo 전자 방명록 서버 시작 중...
echo ========================================
echo.

REM 서버 시작 및 브라우저 자동 실행을 별도 프로세스로 실행
start "전자 방명록 서버" cmd /c "node server.js"

REM 서버가 시작될 때까지 대기
echo 서버 준비 중... (잠시만 기다려주세요)
timeout /t 4 /nobreak >nul

REM 브라우저 자동 실행
echo 브라우저를 여는 중...
start "" "http://localhost:3000"

echo.
echo ========================================
echo 준비 완료!
echo ========================================
echo.
echo 브라우저가 자동으로 열렸습니다.
echo 서버 주소: http://localhost:3000
echo.
echo 서버는 별도 창에서 실행 중입니다.
echo 서버를 종료하려면 서버 창을 닫으세요.
echo.
echo 이 창은 3초 후 자동으로 닫힙니다...
timeout /t 3 /nobreak >nul

