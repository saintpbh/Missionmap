// PcWeb Firebase 설정 및 초기화
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
const db = firebase.database();
const firestore = firebase.firestore();

// Firebase 서비스 내보내기
window.firebaseServices = {
  auth,
  db,
  firestore
};

console.log('PcWeb Firebase 초기화 완료');

// Firebase 연결 상태 확인
window.checkFirebaseConnection = function() {
  return new Promise((resolve, reject) => {
    if (!window.firebase || !window.firebase.database) {
      reject(new Error('Firebase SDK가 로드되지 않았습니다.'));
      return;
    }
    
    const db = window.firebase.database();
    db.ref('.info/connected').once('value')
      .then(snapshot => {
        const connected = snapshot.val();
        if (connected) {
          console.log('Firebase 연결됨');
          resolve(true);
        } else {
          console.log('Firebase 연결 안됨');
          reject(new Error('Firebase 연결 실패'));
        }
      })
      .catch(err => {
        console.error('Firebase 연결 확인 실패:', err);
        reject(err);
      });
  });
};

// 페이지 로드 시 Firebase 연결 확인
document.addEventListener('DOMContentLoaded', function() {
  window.checkFirebaseConnection()
    .then(() => {
      console.log('Firebase 연결 성공');
    })
    .catch(err => {
      console.error('Firebase 연결 실패:', err);
    });
}); 