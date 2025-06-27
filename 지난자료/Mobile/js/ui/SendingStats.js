// 파송현황(국가별/노회별) 공통 화면/데이터 관리
(function() {
  function showSendingStatsScreen({
    screenId,
    cardClass,
    closeBtnClass,
    titleHtml,
    tableHeadHtml,
    getStats,
    getRowsHtml,
    extraStyle,
    afterRender
  }) {
    const screen = document.getElementById(screenId);
    if (!screen) return;
    document.getElementById('mobile-landing').style.display = 'none';
    screen.style.display = 'flex';
    screen.innerHTML = `
      <div class="${cardClass}" style="position:relative;${extraStyle||''}">
        <button class="${closeBtnClass}" id="close-${screenId}" style="position:absolute;top:12px;right:16px;">✕</button>
        ${titleHtml}
        <div class="sending-glass-table-wrapper" style="width:90%;margin:0 auto;overflow-y:auto;height:100%;">
          <table class="sending-glass-table" style="width:100%;">
            <thead>${tableHeadHtml}</thead>
            <tbody id="${screenId}-tbody"></tbody>
          </table>
        </div>
      </div>
    `;
    // 닫기 버튼
    screen.querySelector(`#close-${screenId}`).onclick = function() {
      screen.style.display = 'none';
      document.getElementById('mobile-landing').style.display = '';
    };
    // 데이터 렌더링
    const tbody = screen.querySelector(`#${screenId}-tbody`);
    const stats = getStats();
    tbody.innerHTML = getRowsHtml(stats);
    // afterRender 콜백이 있으면 호출
    if (typeof afterRender === 'function') {
      setTimeout(() => afterRender(), 0);
    }
  }
  window.showSendingStatsScreen = showSendingStatsScreen;
})(); 