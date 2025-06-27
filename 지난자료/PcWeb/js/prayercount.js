// prayercount.js
// Firebase에서 실시간 중보기도자(접속자) 수를 가져오는 모듈 (window 방식)

// Firebase App 및 Database SDK가 이미 로드되어 있다고 가정
// (mobile.html에서 CDN 또는 별도 스크립트로 로드 필요)

window.initPrayerCount = function(firebaseApp, onCountChange) {
  if (!firebaseApp || !window.firebase) return;
  const db = window.firebase.database();
  // 1. 고유 ID 생성 (브라우저별, 세션별)
  let userId = sessionStorage.getItem('prayerUserId');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('prayerUserId', userId);
  }
  const userRef = db.ref('prayerUsers/' + userId);

  // 2. 접속 시 true 기록
  userRef.set(true);

  // 3. onDisconnect로 자동 삭제
  userRef.onDisconnect().remove();

  // 4. prayerCount는 prayerUsers 하위 노드 개수로 계산
  const usersRef = db.ref('prayerUsers');
  let lastCount = null;
  usersRef.on('value', (snapshot) => {
    const users = snapshot.val() || {};
    const count = Object.keys(users).length;
    const prayerCountDiv = document.getElementById('prayer-count-info');
    if (prayerCountDiv) {
      prayerCountDiv.innerHTML = `<span class="prayer-icon">🙏</span>현재 <span class="prayer-count-number">${count}</span>명의 중보기도자가 함께 기도하고 있습니다.`;
      // 숫자 글로우 애니메이션
      const numberSpan = prayerCountDiv.querySelector('.prayer-count-number');
      if (numberSpan) {
        numberSpan.style.animation = 'none';
        void numberSpan.offsetWidth;
        numberSpan.style.animation = 'prayerNumberGlow 1.2s';
        // 숫자가 증가할 때 stun 효과
        if (lastCount !== null && count > lastCount) {
          numberSpan.classList.add('stun');
          setTimeout(() => numberSpan.classList.remove('stun'), 700);
        }
      }
    }
    if (typeof onCountChange === 'function') onCountChange(count);
    lastCount = count;
  });
};

window.removePrayerCountListener = function(firebaseApp) {
  // (옵션) 리스너 해제용, 필요시 구현
}; 