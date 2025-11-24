# 전자 방명록 - 바이오기술의 미래

바이오기술의 미래에 대한 의견을 수집하는 전자 방명록 시스템입니다.

## 기능

- 키보드 입력 방식의 방명록 작성
- 바이오기술 미래에 대한 질문과 답변 수집
- **로컬 파일에 데이터 저장** (`data/guestbook.json`)
- 실시간 방명록 목록 표시
- 반응형 웹 디자인
- **완전히 로컬에서 실행** - 외부 서버 불필요

## 사용 방법

### 빠른 시작 (권장)

1. **Node.js 설치** (아직 설치하지 않았다면)
   - https://nodejs.org/ 에서 다운로드 및 설치
   - 설치 확인: 명령 프롬프트에서 `node --version` 입력

2. **자동 실행 스크립트 사용**
   - `start-server.bat` 파일을 더블클릭
   - 브라우저가 자동으로 열립니다

### 수동 실행

```bash
# 1. 의존성 설치 (최초 1회만)
npm install

# 2. 서버 시작
npm start
```

그 후 브라우저에서 `http://localhost:3000` 접속

## 프로젝트 구조

```
전자방명록/
├── server.js          # Express 서버 (선택사항)
├── package.json       # 프로젝트 설정 및 의존성 (선택사항)
└── public/            # 프론트엔드 파일
    ├── index.html     # 메인 HTML 페이지
    ├── style.css      # 스타일시트
    └── script.js      # 클라이언트 JavaScript (로컬 스토리지 사용)
```

## 데이터 저장

방명록 데이터는 **로컬 PC의 `data/guestbook.json` 파일**에 자동으로 저장됩니다.

각 항목은 다음 정보를 포함합니다:
- `id`: 고유 식별자
- `name`: 작성자 이름
- `answer`: 답변 내용
- `timestamp`: ISO 형식 타임스탬프
- `date`: 한국어 형식 날짜/시간

### 데이터 백업 방법

`data/guestbook.json` 파일을 복사하여 백업하세요.
이 파일은 텍스트 에디터로 열어서 확인하거나 수정할 수 있습니다.

## 미니피시 배포

미니피시에 배포할 때는:

### 1. 파일 복사
전체 프로젝트 폴더를 미니피시에 복사합니다.

### 2. Node.js 설치
미니피시에 Node.js가 설치되어 있어야 합니다.
- https://nodejs.org/ 에서 다운로드 및 설치

### 3. 자동 실행 설정

#### 방법 A: 시작 프로그램에 추가 (권장)
1. `start-server-with-browser.bat` 파일을 우클릭
2. "바로가기 만들기" 선택
3. 바로가기를 `C:\Users\[사용자명]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup` 폴더에 복사
4. 재부팅 시 자동으로 서버가 시작되고 브라우저가 열립니다

#### 방법 B: 수동 실행
- `start-server-with-browser.bat` 파일을 더블클릭하여 실행

### 4. 전체화면 모드
브라우저가 자동으로 전체화면(kiosk) 모드로 열립니다.
종료하려면 Alt+F4를 누르세요.

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Data Storage**: 로컬 파일 시스템 (`data/guestbook.json`)

## 주의사항

- 서버가 실행 중이어야 방명록을 작성하고 볼 수 있습니다
- 데이터는 `data/guestbook.json` 파일에 저장되므로 이 파일을 정기적으로 백업하세요
- 서버를 종료하면 방명록에 접근할 수 없습니다 (데이터는 파일에 저장되어 있으므로 서버 재시작 시 다시 표시됩니다)
- **완전히 로컬에서 실행되므로 인터넷 연결이 필요 없습니다**
"# biolog_guestbook" 
