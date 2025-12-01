@echo off
chcp 65001 >nul
REM 전자 방명록 로컬 서버 + 브라우저 자동 실행
REM Node.js가 설치되어 있어야 합니다

REM 현재 스크립트의 디렉토리로 이동
cd /d "%~dp0"

REM Node.js 설치 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo Node.js를 설치해주세요: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM npm install 실행 (node_modules가 없을 경우)
if not exist "node_modules" (
    echo.
    echo 의존성 패키지를 설치하는 중...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [오류] 패키지 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

REM Chrome 브라우저 경로
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

REM 서버 시작 (백그라운드)
start /b node server.js

REM 서버가 시작될 때까지 대기
timeout /t 3 /nobreak >nul

REM 브라우저 자동 실행
if exist %CHROME_PATH% (
    start "" %CHROME_PATH% --kiosk http://localhost:3000
) else if exist %EDGE_PATH% (
    start "" %EDGE_PATH% --kiosk http://localhost:3000
) else (
    start "" http://localhost:3000
)

echo.
echo ========================================
echo 전자 방명록 서버가 실행 중입니다.
echo ========================================
echo.
echo 서버 주소: http://localhost:3000
echo 브라우저가 자동으로 열렸습니다.
echo.
echo 서버를 종료하려면 이 창을 닫으세요.
echo.
pause

