const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(__dirname)); // 루트 디렉토리의 이미지 파일도 제공

// image 폴더를 절대 경로로 제공 (한글 경로 문제 해결)
const imagePath = path.join(__dirname, 'image');
app.use('/image', express.static(imagePath, {
    setHeaders: (res, filePath) => {
        // 이미지 파일의 MIME 타입 설정
        if (filePath.endsWith('.JPG') || filePath.endsWith('.jpg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        }
    }
}));

// 데이터 파일 경로
const DATA_DIR = path.join(__dirname, 'data');
const GUESTBOOK_FILE = path.join(DATA_DIR, 'guestbook.json');

// 데이터 디렉토리 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 초기 데이터 파일 생성
if (!fs.existsSync(GUESTBOOK_FILE)) {
  fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify([], null, 2), 'utf8');
}

// 방명록 데이터 읽기
function readGuestbook() {
  try {
    const data = fs.readFileSync(GUESTBOOK_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 방명록 데이터 저장
function saveGuestbook(data) {
  fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 방명록 조회 API
app.get('/api/guestbook', (req, res) => {
  const guestbook = readGuestbook();
  res.json(guestbook);
});

// 방명록 작성 API
app.post('/api/guestbook', (req, res) => {
  const { name, answer } = req.body;
  
  if (!answer) {
    return res.status(400).json({ error: '답변을 입력해주세요.' });
  }
  
  const guestbook = readGuestbook();
  const newEntry = {
    id: Date.now().toString(),
    name: (name || '익명').trim(),
    answer: answer.trim(),
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString('ko-KR')
  };
  
  guestbook.unshift(newEntry); // 최신 항목을 맨 위에 추가
  saveGuestbook(guestbook);
  
  res.json({ success: true, entry: newEntry });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`전자 방명록 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

