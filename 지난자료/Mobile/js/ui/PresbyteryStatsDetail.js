// 노회별 파송현황 상세 전체화면(공통 모듈 활용)
(function() {
  function getPresbyteryStats() {
    return (window.DataManager && window.DataManager.getPresbyteryStats && Object.keys(window.DataManager.getPresbyteryStats()).length > 0)
      ? window.DataManager.getPresbyteryStats()
      : (window.cachedPresbyteryStats || {});
  }
  function getPresbyteryRowsHtml(stats) {
    const members = (window.DataManager && window.DataManager.state && window.DataManager.state.missionaries && window.DataManager.state.missionaries.length > 0)
      ? window.DataManager.state.missionaries
      : (window.cachedMissionaries || []);
    const presbyteries = Object.keys(stats).sort((a,b)=>a.localeCompare(b,'ko'));
    return presbyteries.map(presbytery => {
      const missionaryList = members.filter(m => m.presbytery === presbytery);
      const countrySet = new Set(missionaryList.map(m => m.country).filter(Boolean));
      return `<tr><td style='width:30%;'>${presbytery}</td><td style='text-align:left;width:20%;'><b>${stats[presbytery]}</b></td><td class='country-cell' style='width:50%;'>${[...countrySet].join(', ')}</td></tr>`;
    }).join('');
  }
  window.showPresbyteryStatsDetail = function() {
    window.showSendingStatsScreen({
      screenId: 'presbytery-stats-screen',
      cardClass: 'sending-glass-card',
      closeBtnClass: 'sending-glass-close-btn',
      titleHtml: '<div class="sending-glass-title"><span class="sending-icon">👑</span>노회별 파송현황</div>',
      tableHeadHtml: '<tr><th style="width:30%;">노회</th><th style="width:20%;">인원</th><th class="country-cell" style="width:50%;text-align:center;">국가</th></tr>',
      getStats: getPresbyteryStats,
      getRowsHtml: getPresbyteryRowsHtml,
      extraStyle: 'height:95vh;'
    });
  }
})(); 