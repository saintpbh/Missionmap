// utils.js
// 모든 유틸 함수는 window에 등록

// 예시: 기존에 export function foo() 였다면 아래처럼 변환
// window.foo = function() { ... }

// 실제 함수 내용을 아래에 추가해 주세요.

window.isRecent = function(updateDate) {
    if (!updateDate) return false;
    const days = (new Date() - new Date(updateDate)) / (1000 * 60 * 60 * 24);
    return days < 60;
}

window.getLatLng = function(item, country, constants) {
    if (item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng)) {
        return [parseFloat(item.lat), parseFloat(item.lng)];
    }
    if (constants.CITY_LATLNGS && item.city && constants.CITY_LATLNGS[item.city]) {
        return constants.CITY_LATLNGS[item.city];
    }
    return constants.LATLNGS[country] || [20, 0];
}

// Firebase에서 missionaries, news 데이터를 불러오는 fetchData 함수
window.fetchData = function(callback) {
  if (!window.firebase || !window.firebase.database) {
    callback(new Error('Firebase not initialized'));
    return;
  }
  const db = window.firebase.database();
  db.ref('missionaries').once('value')
    .then(snapshot => {
      const missionaries = [];
      snapshot.forEach(child => {
        missionaries.push(child.val());
      });
      db.ref('news').once('value')
        .then(newsSnap => {
          const news = [];
          newsSnap.forEach(child => {
            news.push(child.val());
          });
          callback(null, { missionaries, news });
        });
    })
    .catch(err => callback(err));
};

// 국가명 → 대륙명 매핑 객체
window.continentMap = {
  // 동북아시아
  "일본": "동북아시아", "중국": "동북아시아", "대만": "동북아시아", "몽골": "동북아시아", "한국": "동북아시아",
  // 동남아시아
  "필리핀": "동남아시아", "태국": "동남아시아", "캄보디아": "동남아시아", "라오스": "동남아시아", "인도네시아": "동남아시아", "말레이시아": "동남아시아", "동티모르": "동남아시아", "베트남": "동남아시아", "싱가포르": "동남아시아",
  // 서남아시아
  "인도": "서남아시아", "파키스탄": "서남아시아", "네팔": "서남아시아", "이스라엘": "서남아시아", "방글라데시": "서남아시아", "스리랑카": "서남아시아", "아프가니스탄": "서남아시아",
  // 유럽
  "러시아": "유럽", "독일": "유럽", "헝가리": "유럽", "불가리아": "유럽",
  // 아메리카
  "미국": "아메리카", "쿠바": "아메리카",
  // 아프리카
  "부르키나파소": "아프리카", "케냐": "아프리카", "모리타니": "아프리카", "라이베리아": "아프리카", "말라위": "아프리카", "우간다": "아프리카",
  // 오세아니아
  "호주": "오세아니아", "뉴질랜드": "오세아니아"
};

// 국가명으로 대륙명 반환
window.getContinentByCountry = function(country) {
  return window.continentMap[country] || "기타";
}; 