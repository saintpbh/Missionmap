# 🔥 Firebase 연결 가이드

## 📋 설정 단계

### 1. Firebase 프로젝트 설정
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. `prokworldmap` 프로젝트 선택 (또는 새 프로젝트 생성)
3. 다음 서비스들을 활성화:
   - **Authentication** (이메일/비밀번호)
   - **Firestore Database**
   - **Storage**
   - **Hosting**

### 2. Firebase 설정 정보 업데이트
`js/firebase-config.js` 파일에서 다음 정보를 실제 프로젝트 정보로 교체:

```javascript
const firebaseConfig = {
  apiKey: "실제_API_키",
  authDomain: "실제_도메인.firebaseapp.com",
  projectId: "실제_프로젝트_ID",
  storageBucket: "실제_스토리지_버킷.appspot.com",
  messagingSenderId: "실제_메시징_ID",
  appId: "실제_앱_ID",
  measurementId: "실제_분석_ID"
};
```

### 3. 관리자 계정 생성
Firebase Console에서:
1. **Authentication** → **Users** → **Add user**
2. 관리자 이메일과 비밀번호 입력
3. **Firestore Database** → **Rules**에서 관리자 권한 설정

### 4. 보안 규칙 배포
터미널에서 다음 명령 실행:
```bash
cd Admin
firebase login
firebase deploy --only firestore:rules,storage
```

### 5. 호스팅 배포
```bash
firebase deploy --only hosting
```

## 🗄️ 데이터베이스 구조

### Firestore Collections

#### `missionaries` (선교사 정보)
```javascript
{
  id: "missionary_001",
  name: "홍길동",
  country: "일본",
  mission: "교회개척",
  flag: "🇯🇵",
  email: "hong@example.com",
  phone: "+81-123-456-789",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `newsletters` (뉴스레터)
```javascript
{
  id: "newsletter_001",
  missionaryId: "missionary_001",
  missionaryName: "홍길동",
  country: "일본",
  flag: "🇯🇵",
  date: "2025-06-27",
  summary: "한줄 요약",
  content: "소식 내용",
  isUrgent: false,
  photos: [
    {
      id: "photo_001",
      name: "사진1.jpg",
      size: 1024000,
      type: "image/jpeg",
      url: "https://...",
      path: "photos/1234567890_사진1.jpg"
    }
  ],
  documents: [
    {
      id: "doc_001",
      name: "문서.pdf",
      size: 2048000,
      type: "application/pdf",
      url: "https://...",
      path: "documents/1234567890_문서.pdf"
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `users` (사용자 계정)
```javascript
{
  id: "user_001",
  email: "admin@example.com",
  displayName: "관리자",
  role: "admin",
  createdAt: Timestamp,
  lastLoginAt: Timestamp
}
```

#### `files` (파일 메타데이터)
```javascript
{
  id: "file_001",
  name: "파일명.jpg",
  size: 1024000,
  type: "image/jpeg",
  url: "https://...",
  path: "photos/1234567890_파일명.jpg",
  uploadedAt: Timestamp,
  uploadedBy: "user_001"
}
```

### Storage Bucket 구조
```
📁 photos/          # 사역사진 (최대 5MB)
📁 documents/       # PDF/문서 (최대 10MB)
📁 newsletters/     # 뉴스레터 첨부파일
```

## 🔐 보안 규칙

### Firestore Rules
- 관리자만 선교사, 뉴스레터, 파일 데이터 읽기/쓰기 가능
- 사용자는 본인 데이터만 접근 가능

### Storage Rules
- 관리자만 파일 업로드/다운로드 가능
- 파일 크기 및 타입 제한 적용

## 🚀 배포 명령어

### 전체 배포
```bash
firebase deploy
```

### 선택적 배포
```bash
# 호스팅만
firebase deploy --only hosting

# Firestore 규칙만
firebase deploy --only firestore:rules

# Storage 규칙만
firebase deploy --only storage

# 함수만
firebase deploy --only functions
```

## 🔧 개발 환경

### 로컬 에뮬레이터 사용
```bash
# 에뮬레이터 설치
npm install -g firebase-tools

# 에뮬레이터 시작
firebase emulators:start

# 특정 포트에서 시작
firebase emulators:start --port 8080
```

### 에레이터 설정
`firebase.json`에서 에뮬레이터 설정:
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## 📱 사용법

### 1. 로그인
- 관리자 계정으로 로그인
- 권한 확인 후 기능 활성화

### 2. 뉴스레터 작성
- 선교사 선택
- 뉴스레터 정보 입력
- 사진/문서 업로드
- 임시저장 또는 등록

### 3. 데이터 관리
- 실시간 동기화
- 오프라인 지원
- 자동 백업

## ⚠️ 주의사항

1. **API 키 보안**: 클라이언트 사이드에서 API 키가 노출되므로 도메인 제한 설정 필수
2. **파일 크기**: 업로드 파일 크기 제한 준수
3. **권한 관리**: 관리자 권한은 신중하게 부여
4. **데이터 백업**: 정기적인 데이터 백업 권장

## 🆘 문제 해결

### 일반적인 오류
1. **권한 오류**: 관리자 권한 확인
2. **네트워크 오류**: 인터넷 연결 확인
3. **파일 업로드 실패**: 파일 크기 및 형식 확인

### 로그 확인
브라우저 개발자 도구에서 콘솔 로그 확인 