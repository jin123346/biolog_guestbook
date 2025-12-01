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

// 최대 저장 개수 설정 (최신 항목만 메인 파일에 유지, 오래된 항목은 별도 파일로 보관)
const MAX_ENTRIES = 2000; // 필요시 이 값을 변경하세요 (예: 500, 3000 등)

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

// 기존 백업 파일 목록 가져오기
function getArchiveFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const files = fs.readdirSync(DATA_DIR);
  return files
    .filter(file => file.startsWith('guestbook_archive_') && file.endsWith('.json'))
    .map(file => path.join(DATA_DIR, file))
    .sort();
}

// 가장 최근 백업 파일 가져오기
function getLatestArchiveFile() {
  const archiveFiles = getArchiveFiles();
  return archiveFiles.length > 0 ? archiveFiles[archiveFiles.length - 1] : null;
}

// 오래된 데이터를 별도 파일로 보관 (1000개 단위로 묶어서 저장)
function archiveOldData(oldData) {
  if (!oldData || oldData.length === 0) return;
  
  // 가장 최근 백업 파일 확인
  const latestArchive = getLatestArchiveFile();
  let archiveData = [];
  
  // 기존 백업 파일이 있으면 읽어오기
  if (latestArchive) {
    try {
      const existingData = fs.readFileSync(latestArchive, 'utf8');
      archiveData = JSON.parse(existingData);
    } catch (error) {
      console.error('백업 파일 읽기 오류:', error);
      archiveData = [];
    }
  }
  
  // 새 데이터를 기존 백업 데이터에 추가
  archiveData = archiveData.concat(oldData);
  
  // 1000개 단위로 묶어서 저장
  while (archiveData.length >= MAX_ENTRIES) {
    // 1000개씩 잘라서 새 백업 파일로 저장
    const chunk = archiveData.slice(0, MAX_ENTRIES);
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
    const archiveFileName = `guestbook_archive_${dateStr}.json`;
    const archiveFilePath = path.join(DATA_DIR, archiveFileName);
    
    fs.writeFileSync(archiveFilePath, JSON.stringify(chunk, null, 2), 'utf8');
    console.log(`오래된 데이터 ${chunk.length}개를 ${archiveFileName} 파일로 보관했습니다.`);
    
    // 저장한 부분 제거
    archiveData = archiveData.slice(MAX_ENTRIES);
  }
  
  // 남은 데이터가 있으면 최신 백업 파일에 추가 저장
  if (archiveData.length > 0) {
    if (latestArchive) {
      // 기존 최신 백업 파일에 추가
      fs.writeFileSync(latestArchive, JSON.stringify(archiveData, null, 2), 'utf8');
    } else {
      // 새 백업 파일 생성
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
      const archiveFileName = `guestbook_archive_${dateStr}.json`;
      const archiveFilePath = path.join(DATA_DIR, archiveFileName);
      fs.writeFileSync(archiveFilePath, JSON.stringify(archiveData, null, 2), 'utf8');
      console.log(`오래된 데이터 ${archiveData.length}개를 ${archiveFileName} 파일로 보관했습니다.`);
    }
  }
}

// 방명록 데이터 저장
function saveGuestbook(data) {
  // 최대 개수 제한: 최신 항목만 메인 파일에 유지
  if (data.length > MAX_ENTRIES) {
    // 오래된 데이터를 별도 파일로 보관
    const oldData = data.slice(MAX_ENTRIES);
    archiveOldData(oldData);
    
    // 최신 데이터만 메인 파일에 저장
    const limitedData = data.slice(0, MAX_ENTRIES);
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(limitedData, null, 2), 'utf8');
  } else {
    // 최대 개수 이하면 그대로 저장
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(data, null, 2), 'utf8');
  }
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
  
  let guestbook = readGuestbook();
  const newEntry = {
    id: Date.now().toString(),
    name: (name || '익명').trim(),
    answer: answer.trim(),
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString('ko-KR')
  };
  
  guestbook.unshift(newEntry); // 최신 항목을 맨 위에 추가
  
  // saveGuestbook 함수에서 자동으로 오래된 데이터를 별도 파일로 보관
  saveGuestbook(guestbook);
  
  res.json({ success: true, entry: newEntry });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`전자 방명록 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

