# 한국기독교장로회 선교사 파송지도

전 세계에 파송된 한국기독교장로회 선교사들의 현황을 시각적으로 보여주는 인터랙티브 지도 애플리케이션입니다.

## 주요 기능

### 🌍 전체보기 모드
- 세계 지도에 국가별 선교사 파송 현황 표시
- 자동 플레이 기능으로 선교사 기도제목 순환 표시
- 국가 마커 클릭 시 해당 국가 선교사 리스트 팝업

### 🎯 국가별 보기 모드  
- 특정 국가 선택 시 줌 레벨 6으로 확대
- 각 선교사별 개별 위치에 마커 표시
- 마커 위에 선교사 이름 툴팁 표시 (겹침 방지)
- 마커 클러스터링으로 깔끔한 표시

### 📋 선교사 상세정보
- 선교사 이름 클릭 시 상세정보 카드 표시 (화면 중앙)
- 사진, 파송지역, 소속기관, 파송일, 최근 업데이트 정보
- 기도제목 및 소식지 링크 제공

### ⚙️ 기타 기능
- 국가별/노회별 파송현황 테이블
- 플로팅 선교사 기도 팝업 (애니메이션)
- 반응형 디자인 (데스크톱/모바일)
- 최근 소식 뱃지 표시

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **지도**: Leaflet.js + MarkerCluster
- **UI Components**: Shoelace Design System
- **데이터**: Google Sheets (CSV Export)
- **서버**: Node.js (Optional)

## 설치 및 실행

### 1. 클론 및 설치
```bash
git clone [repository-url]
cd missionary-map-app
npm install
```

### 2. 개발 서버 실행
```bash
# Node.js 서버 사용
npm start

# 또는 Python 서버 사용
python3 -m http.server 8000
```

### 3. 브라우저에서 확인
```
http://localhost:8000
```

## 프로젝트 구조

```
missionary-map-app/
├── public/
│   ├── css/
│   │   └── styles.css          # 메인 스타일시트
│   ├── js/
│   │   ├── dataManager.js      # 데이터 관리
│   │   ├── uiManager.js        # UI 관리  
│   │   ├── missionaryMap.js    # 메인 컨트롤러
│   │   ├── setup.js            # 설정 관리
│   │   ├── news.js             # 뉴스 기능
│   │   ├── utils.js            # 유틸리티
│   │   └── newsletterPopup.js  # 소식지 팝업
│   ├── pdfs/                   # 소식지 PDF 파일
│   ├── index.html              # 메인 HTML
│   └── logo.svg                # 로고 파일
├── server.js                   # Node.js 서버
├── package.json                # 의존성 관리
└── README.md                   # 프로젝트 문서
```

## 데이터 소스

Google Sheets를 통해 선교사 정보를 관리하며, CSV 형태로 실시간 데이터를 가져옵니다.

**필수 컬럼:**
- `name`: 선교사 이름
- `country`: 파송 국가
- `city`: 파송 도시
- `organization`: 소속 기관
- `presbytery`: 소속 노회
- `dispatchDate`: 파송일
- `lastUpdate`: 최근 업데이트일
- `prayer`: 기도제목
- `lat`, `lng`: 위도/경도 (선택사항)
- `image`: 사진 URL (선택사항)
- `NewsLetter`: 소식지 링크 (선택사항)

## 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 라이선스

MIT License

## 개발자

한국기독교장로회 해외선교부
