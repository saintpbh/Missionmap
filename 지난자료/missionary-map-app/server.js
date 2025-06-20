const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors());

// 정적 파일 서빙
app.use(express.static('public'));

// multer 설정 - PDF 파일 업로드
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/pdfs';
        // 폴더가 없으면 생성
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 원본 파일명 유지하되, 중복 시 타임스탬프 추가
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const nameWithoutExt = path.basename(originalName, ext);
        const timestamp = Date.now();
        
        // 파일이 이미 존재하는지 확인
        const filePath = path.join('public/pdfs', originalName);
        if (fs.existsSync(filePath)) {
            cb(null, `${nameWithoutExt}_${timestamp}${ext}`);
        } else {
            cb(null, originalName);
        }
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // PDF 파일만 허용
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 제한
    }
});

// 파일 업로드 API
app.post('/upload', upload.single('newsletter-pdf'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: '파일이 선택되지 않았습니다.' 
            });
        }

        const fileName = req.file.filename;
        const filePath = `/pdfs/${fileName}`;
        const fullUrl = `${req.protocol}://${req.get('host')}${filePath}`;

        res.json({
            success: true,
            message: '파일이 성공적으로 업로드되었습니다.',
            fileName: fileName,
            filePath: filePath,
            fullUrl: fullUrl
        });

    } catch (error) {
        console.error('업로드 에러:', error);
        res.status(500).json({ 
            success: false, 
            message: '파일 업로드 중 오류가 발생했습니다.' 
        });
    }
});

// 업로드된 파일 목록 조회 API
app.get('/files', (req, res) => {
    try {
        const pdfDir = 'public/pdfs';
        if (!fs.existsSync(pdfDir)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(pdfDir)
            .filter(file => file.toLowerCase().endsWith('.pdf'))
            .map(file => ({
                name: file,
                path: `/pdfs/${file}`,
                url: `${req.protocol}://${req.get('host')}/pdfs/${file}`
            }));

        res.json({ files: files });
    } catch (error) {
        console.error('파일 목록 조회 에러:', error);
        res.status(500).json({ 
            success: false, 
            message: '파일 목록 조회 중 오류가 발생했습니다.' 
        });
    }
});

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`PDF 파일은 public/pdfs 폴더에 저장됩니다.`);
}); 