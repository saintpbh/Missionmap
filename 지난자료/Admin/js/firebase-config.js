// Firebase 설정 및 초기화
// ✅ 실제 Firebase 설정 정보 적용됨

const firebaseConfig = {
  apiKey: "AIzaSyCrJIhyTYQ4bTUW4jarFqluD97xKao2kF0",
  authDomain: "prokworldmap.firebaseapp.com",
  databaseURL: "https://prokworldmap-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prokworldmap",
  storageBucket: "prokworldmap.appspot.com",
  messagingSenderId: "728381830842",
  appId: "1:728381830842:web:ea9541db40f3710891f483",
  measurementId: "G-0MK0N145WP"
};

// Firebase 초기화 (중복 설정 방지)
let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

// Firebase 서비스 초기화
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();
const storage = firebase.storage();
let analytics = null;

// Analytics는 선택적으로 초기화 (오류 방지)
try {
  if (firebase.analytics) {
    analytics = firebase.analytics();
  }
} catch (error) {
  console.warn('Firebase Analytics 초기화 실패:', error);
}

// Firestore 설정 (merge: true로 기존 설정과 병합)
try {
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    merge: true
  });
} catch (error) {
  console.warn('Firestore 설정 경고:', error);
}

// 개발 환경에서 에뮬레이터 사용 (선택사항)
if (location.hostname === 'localhost') {
  // db.useEmulator('localhost', 8080);
  // auth.useEmulator('http://localhost:9099');
  // storage.useEmulator('localhost', 9199);
}

// Firebase 서비스 내보내기
window.firebaseServices = {
  auth,
  db,
  rtdb,
  storage,
  analytics
};

// 인증 상태 변경 리스너
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('사용자 로그인:', user.email);
    console.log('사용자 UID:', user.uid); // UID 출력 추가
    // 관리자 권한 확인
    user.getIdTokenResult().then((idTokenResult) => {
      if (idTokenResult.claims.admin) {
        console.log('관리자 권한 확인됨');
        window.isAdmin = true;
      } else {
        console.log('일반 사용자 권한');
        window.isAdmin = false;
      }
    });
  } else {
    console.log('사용자 로그아웃');
    window.isAdmin = false;
  }
  
  // Firebase 상태 아이콘 업데이트
  updateFirebaseStatusIcon();
});

// Firebase 상태 아이콘 업데이트 함수
function updateFirebaseStatusIcon() {
  const statusIcon = document.getElementById('firebaseStatus');
  const bottomStatusIcon = document.getElementById('bottomFirebaseStatus');
  
  const isFirebaseAvailable = typeof firebase !== 'undefined' && firebase.apps.length > 0;
  const useFirebase = isFirebaseAvailable && window.firebaseService;
  
  if (useFirebase) {
    if (statusIcon) {
      statusIcon.textContent = '🔥';
      statusIcon.className = 'firebase-status-icon connected';
      statusIcon.title = 'Firebase 연결됨 - 클라우드 모드';
    }
    if (bottomStatusIcon) {
      bottomStatusIcon.textContent = '🔥';
      bottomStatusIcon.className = 'bottom-firebase-status connected';
      bottomStatusIcon.title = 'Firebase 연결됨';
    }
  } else {
    if (statusIcon) {
      statusIcon.textContent = '🪵';
      statusIcon.className = 'firebase-status-icon disconnected';
      statusIcon.title = 'LocalStorage 모드 - 로컬 저장소 사용';
    }
    if (bottomStatusIcon) {
      bottomStatusIcon.textContent = '🪵';
      bottomStatusIcon.className = 'bottom-firebase-status disconnected';
      bottomStatusIcon.title = 'LocalStorage 모드';
    }
  }
}

// 전역 함수로 내보내기
window.updateFirebaseStatusIcon = updateFirebaseStatusIcon;

// 에러 핸들링
auth.onAuthStateChanged((user) => {
  // 인증 에러 처리
}, (error) => {
  console.error('인증 에러:', error);
  showToast('인증 오류가 발생했습니다.', 'error');
});

// Firestore 에러 핸들링
db.enableNetwork().catch((error) => {
  console.error('Firestore 연결 에러:', error);
  showToast('데이터베이스 연결 오류가 발생했습니다.', 'error');
});

// Storage 에러 핸들링
