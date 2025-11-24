@echo off
REM 전자 방명록 자동 실행 스크립트
REM 브라우저를 전체화면 모드로 실행합니다

REM 현재 스크립트의 디렉토리 경로 가져오기
cd /d "%~dp0"

REM index.html 파일의 전체 경로
set HTML_FILE=%CD%\public\index.html

REM Chrome 브라우저 경로 (기본 설치 경로)
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"

REM Edge 브라우저 경로 (Windows 기본)
set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

REM Chrome이 있으면 Chrome 사용, 없으면 Edge 사용
if exist %CHROME_PATH% (
    start "" %CHROME_PATH% --kiosk --app=file:///%HTML_FILE%
) else if exist %EDGE_PATH% (
    start "" %EDGE_PATH% --kiosk --app=file:///%HTML_FILE%
) else (
    REM 브라우저를 찾을 수 없으면 기본 브라우저로 열기
    start "" %HTML_FILE%
)

