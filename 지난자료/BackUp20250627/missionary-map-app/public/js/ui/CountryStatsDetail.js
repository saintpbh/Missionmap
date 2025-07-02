// 국가별 파송현황 상세 전체화면(글라스모피즘)
(function() {
  function showCountryStatsScreen() {
    const screen = document.getElementById('country-stats-screen');
    if (!screen) return;
    // 첫화면 숨기기
    document.getElementById('mobile-landing').style.display = 'none';
    screen.style.display = 'flex';
    screen.innerHTML = `
      <div class="glass-card" style="position:relative;">
        <button class="glass-close-btn" id="close-country-stats" style="position:absolute;top:12px;right:16px;">✕</button>
        <div class="glass-title">국가별 파송현황</div>
        <table class="glass-table">
          <thead><tr><th>국기</th><th>국가</th><th style='text-align:right;'>인원</th></tr></thead>
          <tbody id="country-stats-tbody"></tbody>
        </table>
      </div>
    `;
    // 닫기 버튼
    screen.querySelector('#close-country-stats').onclick = function() {
      screen.style.display = 'none';
      document.getElementById('mobile-landing').style.display = '';
    };
    // 데이터 렌더링
    const tbody = screen.querySelector('#country-stats-tbody');
    // DataManager가 없거나 데이터가 없으면 캐시 사용
    const stats = (window.DataManager && window.DataManager.getCountryStats && Object.keys(window.DataManager.getCountryStats()).length > 0)
      ? window.DataManager.getCountryStats()
      : (window.cachedCountryStats || {});
    // missionaryMap.js의 COUNTRY_FLAGS 우선 참조
    const flagMap = (window.CountryBackgrounds && window.CountryBackgrounds.COUNTRY_FLAGS) ? window.CountryBackgrounds.COUNTRY_FLAGS : (window.MissionaryMap?.constants?.COUNTRY_FLAGS || {});

    // 대륙별로 국가 분류
    const continents = ["아시아", "유럽", "아메리카", "아프리카", "오세아니아", "기타"];
    const continentCountries = {};
    Object.keys(stats).forEach(country => {
      const continent = window.getContinentByCountry ? window.getContinentByCountry(country) : "기타";
      if (!continentCountries[continent]) continentCountries[continent] = [];
      continentCountries[continent].push(country);
    });

    // 대륙별로 섹션 렌더링
    tbody.innerHTML = continents.map(continent => {
      const countries = (continentCountries[continent] || []).sort((a,b)=>a.localeCompare(b,'ko'));
      if (countries.length === 0) return '';
      const rows = countries.map(country => {
        const flagCode = flagMap[country];
        let flagImg = '';
        if (flagCode) {
          flagImg = `<img src='https://flagcdn.com/w40/${flagCode}.png' alt='' style='width:28px;height:20px;border-radius:3px;'>`;
        } else {
          flagImg = `<span style='font-size:1.3em;'>🌐</span>`;
        }
        // stats[country]가 객체면 count, 숫자면 그대로
        const count = typeof stats[country] === 'object' ? stats[country].count : stats[country];
        return `<tr><td>${flagImg}</td><td>${country}</td><td style='text-align:right;'><b>${count}</b></td></tr>`;
      }).join('');
      return `<tr><td colspan="3" style="background:#f5f5fa;font-weight:bold;font-size:1.1em;text-align:left;padding:8px 6px 4px 6px;">${continent}</td></tr>` + rows;
    }).join('');
  }
  window.showCountryStatsDetail = showCountryStatsScreen;
})(); 