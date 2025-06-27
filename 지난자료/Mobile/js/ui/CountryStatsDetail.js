// 국가별 파송현황 상세 전체화면(공통 모듈 활용)
(function() {
  // countryFlags.json을 비동기로 불러와서 window.countryFlagEmojiMap에 캐싱
  async function loadCountryFlagEmojis() {
    if (window.countryFlagEmojiMap) return window.countryFlagEmojiMap;
    try {
      const res = await fetch('js/countryFlags.json');
      const arr = await res.json();
      const map = {};
      arr.forEach(item => { map[item.name] = item.emoji; });
      window.countryFlagEmojiMap = map;
      return map;
    } catch (e) {
      window.countryFlagEmojiMap = {};
      return {};
    }
  }

  function getCountryStats() {
    return (window.DataManager && window.DataManager.getCountryStats && Object.keys(window.DataManager.getCountryStats()).length > 0)
      ? window.DataManager.getCountryStats()
      : (window.cachedCountryStats || {});
  }

  // 비동기 렌더링 지원
  async function renderCountryRows(stats, tbody) {
    const countries = Object.keys(stats).sort((a,b)=>a.localeCompare(b,'ko'));
    const flagMap = await loadCountryFlagEmojis();
    tbody.innerHTML = countries.map(country => {
      const emoji = flagMap[country] || '🌐';
      return `<tr><td style='font-size:1.5em;'>${emoji}</td><td>${country}</td><td style='text-align:right;'><b>${stats[country]}</b></td></tr>`;
    }).join('');
  }

  window.showCountryStatsDetail = function() {
    window.showSendingStatsScreen({
      screenId: 'country-stats-screen',
      cardClass: 'sending-glass-card',
      closeBtnClass: 'sending-glass-close-btn',
      titleHtml: '<div class="sending-glass-title"><span class="sending-icon">🌍</span>국가별 파송현황</div>',
      tableHeadHtml: '<tr><th>국기</th><th>국가</th><th style="text-align:right;">인원</th></tr>',
      getStats: getCountryStats,
      getRowsHtml: function(stats) { return '<tr><td colspan=3>로딩중...</td></tr>'; }, // 임시
      afterRender: function() {
        const stats = getCountryStats();
        const tbody = document.querySelector('#country-stats-screen #country-stats-screen-tbody, #country-stats-screen-tbody, #country-stats-screen tbody');
        if (tbody) renderCountryRows(stats, tbody);
      }
    });
  }
})(); 