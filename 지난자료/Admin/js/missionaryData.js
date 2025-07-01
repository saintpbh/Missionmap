// 선교사 데이터
const missionaryData = [
  {
    id: "missionary_001",
    name: "홍길동",
    country: "일본",
    mission: "교회개척",
    flag: "🇯🇵"
  },
  {
    id: "missionary_002", 
    name: "김선교",
    country: "몽골",
    mission: "어린이사역",
    flag: "🇲🇳"
  },
  {
    id: "missionary_003",
    name: "이사랑",
    country: "태국",
    mission: "의료선교",
    flag: "🇹🇭"
  },
  {
    id: "missionary_004",
    name: "박복음",
    country: "캄보디아",
    mission: "교육사역",
    flag: "🇰🇭"
  },
  {
    id: "missionary_005",
    name: "최희망",
    country: "라오스",
    mission: "청년사역",
    flag: "🇱🇦"
  },
  {
    id: "missionary_006",
    name: "정평화",
    country: "미얀마",
    mission: "구호사역",
    flag: "🇲🇲"
  },
  {
    id: "missionary_007",
    name: "강은혜",
    country: "베트남",
    mission: "여성사역",
    flag: "🇻🇳"
  },
  {
    id: "missionary_008",
    name: "윤사랑",
    country: "인도네시아",
    mission: "학생사역",
    flag: "🇮🇩"
  },
  {
    id: "missionary_009",
    name: "임소망",
    country: "필리핀",
    mission: "가족사역",
    flag: "🇵🇭"
  },
  {
    id: "missionary_010",
    name: "한빛",
    country: "말레이시아",
    mission: "청소년사역",
    flag: "🇲🇾"
  },
  {
    id: "missionary_011",
    name: "서기쁨",
    country: "싱가포르",
    mission: "비즈니스사역",
    flag: "🇸🇬"
  },
  {
    id: "missionary_012",
    name: "조평안",
    country: "브루나이",
    mission: "커뮤니티사역",
    flag: "🇧🇳"
  },
  {
    id: "missionary_013",
    name: "남은혜",
    country: "동티모르",
    mission: "개발사역",
    flag: "🇹🇱"
  },
  {
    id: "missionary_014",
    name: "백소망",
    country: "파푸아뉴기니",
    mission: "원주민사역",
    flag: "🇵🇬"
  },
  {
    id: "missionary_015",
    name: "구사랑",
    country: "피지",
    mission: "섬사역",
    flag: "🇫🇯"
  }
];

// 선교사 검색 함수
function searchMissionaries(query) {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return missionaryData.filter(missionary => 
    missionary.name.toLowerCase().includes(searchTerm) ||
    missionary.country.toLowerCase().includes(searchTerm) ||
    missionary.mission.toLowerCase().includes(searchTerm)
  );
}

// 선교사 ID로 찾기
function findMissionaryById(id) {
  return missionaryData.find(missionary => missionary.id === id);
}

// 선교사 이름으로 찾기
function findMissionaryByName(name) {
  return missionaryData.find(missionary => missionary.name === name);
}

// 모든 선교사 목록 가져오기 (정적 데이터)
function getStaticMissionaries() {
  return missionaryData;
}

// Firebase에서 모든 선교사 데이터 가져오기
async function getAllMissionaries() {
  try {
    const snapshot = await firebase.firestore().collection('missionaries').get();
    const missionaries = [];
    snapshot.forEach(doc => {
      missionaries.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return missionaries;
  } catch (error) {
    console.error('선교사 데이터 가져오기 오류:', error);
    return [];
  }
}

// Firebase에서 모든 뉴스레터 데이터 가져오기
async function getAllNewsletters() {
  try {
    const snapshot = await firebase.firestore().collection('newsletters').get();
    const newsletters = [];
    snapshot.forEach(doc => {
      newsletters.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return newsletters;
  } catch (error) {
    console.error('뉴스레터 데이터 가져오기 오류:', error);
    return [];
  }
}