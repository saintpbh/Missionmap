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
  console.log('fetchData: Firebase 데이터 로딩 시작...');
  
  if (!window.firebase || !window.firebase.database) {
    console.error('fetchData: Firebase SDK가 로드되지 않았습니다.');
    callback(new Error('Firebase not initialized'));
    return;
  }
  
  const db = window.firebase.database();
  
  // missionaries 데이터 가져오기 (Admin의 상세 데이터 포함)
  db.ref('missionaries').once('value')
    .then(snapshot => {
      console.log('fetchData: missionaries 데이터 로딩 완료');
      const missionaries = [];
      snapshot.forEach(child => {
        const data = child.val();
        if (data && data.name && data.name.trim() !== '') {
          // Admin에서 관리하는 상세 정보 포함
          const enhancedMissionary = {
            ...data,
            // 기도제목 (최신 뉴스레터 요약 또는 기본 기도제목)
            prayerTitle: data.latestNewsletterSummary || data.prayerTitle || data.prayer || '기도로 함께해 주세요',
            // 최신 뉴스레터 정보
            latestNewsletter: data.latestNewsletter || null,
            latestNewsletterDate: data.latestNewsletterDate || data.sentDate || null,
            // 상세 정보
            englishName: data.englishName || data.english_name || '',
            localPhone: data.localPhone || data.local_phone || '',
            localAddress: data.localAddress || data.local_address || '',
            organization: data.organization || data.organization_name || '',
            presbytery: data.presbytery || '',
            // 가족 정보
            family: data.family || [],
            // 후원자 정보
            supporters: data.supporters || [],
            // 상태 정보
            status: data.status || 'active',
            isActive: data.isActive !== false, // 기본값은 true
            // 메타데이터
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null
          };
          missionaries.push(enhancedMissionary);
        }
      });
      console.log(`fetchData: ${missionaries.length}명의 선교사 데이터 로드됨 (상세 정보 포함)`);
      
      // news 데이터 가져오기
      return db.ref('news').once('value').then(newsSnap => {
        console.log('fetchData: news 데이터 로딩 완료');
        const news = [];
        newsSnap.forEach(child => {
          const data = child.val();
          if (data) {
            news.push(data);
          }
        });
        console.log(`fetchData: ${news.length}개의 뉴스 데이터 로드됨`);
        return { missionaries, news };
      });
    })
    .then(data => {
      console.log('fetchData: 모든 데이터 로딩 완료 (Admin 상세 데이터 포함)');
      callback(null, data);
    })
    .catch(err => {
      console.error('fetchData: Firebase 데이터 로딩 실패:', err);
      callback(err);
    });
}; 