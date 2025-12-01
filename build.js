const fs = require('fs');
const path = require('path');

let terser, CleanCSS;
try {
    terser = require('terser');
    CleanCSS = require('clean-css');
} catch (e) {
    console.error('필요한 패키지가 설치되지 않았습니다. npm install을 실행하세요.');
    process.exit(1);
}

// dist 폴더 생성
const distDir = path.join(__dirname, 'dist');
const distPublicDir = path.join(distDir, 'public');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
}

// HTML 파일 복사
const htmlContent = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
// script2.js를 script2.min.js로, style.css를 style.min.css로 변경
const modifiedHtml = htmlContent
    .replace(/script2\.js/g, 'script2.min.js')
    .replace(/style\.css/g, 'style.min.css');
fs.writeFileSync(path.join(distPublicDir, 'index.html'), modifiedHtml);

// 이미지 파일들 복사
const imageFiles = ['BioLog.png', 'BioLog2.PNG', 'IMG_6114.JPG', 'IMG_6116.JPG'];
imageFiles.forEach(file => {
    const srcPath = path.join(__dirname, 'public', file);
    const destPath = path.join(distPublicDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
    }
});

// JavaScript 파일 난독화 및 압축
async function minifyJS() {
    const jsFiles = ['script2.js'];
    
    for (const file of jsFiles) {
        const filePath = path.join(__dirname, 'public', file);
        const code = fs.readFileSync(filePath, 'utf8');
        
        const result = await terser.minify(code, {
            compress: {
                drop_console: false, // console.log 유지하려면 false
                drop_debugger: true,
                pure_funcs: ['console.log'], // console.log 제거하려면 이렇게
            },
            mangle: {
                toplevel: true, // 전역 변수명 난독화
                properties: false, // 속성명은 난독화하지 않음 (DOM API 때문)
            },
            format: {
                comments: false, // 주석 제거
            },
        });
        
        const outputPath = path.join(distPublicDir, file.replace('.js', '.min.js'));
        fs.writeFileSync(outputPath, result.code);
        console.log(`✓ ${file} → ${file.replace('.js', '.min.js')} (${(result.code.length / code.length * 100).toFixed(1)}% 압축)`);
    }
}

// CSS 파일 압축
function minifyCSS() {
    const cssFiles = ['style.css'];
    
    cssFiles.forEach(file => {
        const filePath = path.join(__dirname, 'public', file);
        const code = fs.readFileSync(filePath, 'utf8');
        
        const result = new CleanCSS({
            level: 2, // 최적화 레벨 (0-2)
            format: false, // 압축된 형식
        }).minify(code);
        
        const outputPath = path.join(distPublicDir, file.replace('.css', '.min.css'));
        fs.writeFileSync(outputPath, result.styles);
        console.log(`✓ ${file} → ${file.replace('.css', '.min.css')} (${(result.styles.length / code.length * 100).toFixed(1)}% 압축)`);
    });
}

// server.js 복사 (서버 파일은 그대로)
fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(distDir, 'server.js'));

// data 폴더 복사
const distDataDir = path.join(distDir, 'data');
if (!fs.existsSync(distDataDir)) {
    fs.mkdirSync(distDataDir, { recursive: true });
}
if (fs.existsSync(path.join(__dirname, 'data', 'guestbook.json'))) {
    fs.copyFileSync(
        path.join(__dirname, 'data', 'guestbook.json'),
        path.join(distDataDir, 'guestbook.json')
    );
}

// package.json 복사
fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(distDir, 'package.json'));

// 실행
(async () => {
    console.log('빌드 시작...\n');
    await minifyJS();
    minifyCSS();
    console.log('\n✓ 빌드 완료! dist 폴더를 확인하세요.');
    console.log('  - dist/public: 압축된 프론트엔드 파일');
    console.log('  - dist/server.js: 서버 파일');
    console.log('  - dist/data: 데이터 파일');
})();

