// setup.js - 설정 및 뉴스레터 업로드 모달 관리 (Shoelace 기반)

document.addEventListener('DOMContentLoaded', function() {
    const settingsBtn = document.getElementById('settingsBtn');
    
    // 모달 동적 생성 (Shoelace 컴포넌트 사용)
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
      <sl-dialog label="설정 및 업로드" class="settings-dialog">
        <sl-tab-group>
          <sl-tab slot="nav" panel="display-settings">화면설정</sl-tab>
          <sl-tab slot="nav" panel="missionary-upload">정보 업로드</sl-tab>

          <sl-tab-panel name="display-settings" class="settings-panel">
              <div class="setting-section">
                <strong class="section-title">긴급뉴스</strong>
                <sl-switch id="news-toggle">긴급뉴스 자동표시</sl-switch>
                <sl-input type="number" id="news-interval-input" label="체크 주기(분)" value="10" min="1" max="120" help-text="뉴스가 있는지 확인하는 간격입니다."></sl-input>
                <sl-input type="number" id="news-speed-input" label="뉴스 속도(초)" value="100" min="15" max="360" help-text="한 바퀴 도는 시간입니다."></sl-input>
                <sl-input type="number" id="news-fontsize-input" label="자막 크기(px)" value="18" min="14" max="60"></sl-input>
                <sl-input type="number" id="news-width-input" label="뉴스바 길이(%)" value="80" min="30" max="95"></sl-input>
                <sl-input type="number" id="news-height-input" label="뉴스바 높이(px)" value="50" min="30" max="100"></sl-input>
                <div class="color-picker-group">
                    <label>자막색 <sl-color-picker id="news-text-color" value="#ffffff" no-label></sl-color-picker></label>
                    <label>배경색 <sl-color-picker id="news-bg-color" value="#1a73ff" no-label></sl-color-picker></label>
                </div>
              </div>
              <sl-divider></sl-divider>
              <div class="setting-section">
                  <strong class="section-title">파송현황 테이블</strong>
                  <sl-switch id="country-table-toggle" checked>국가별 파송현황</sl-switch>
                  <sl-switch id="presbytery-table-toggle" checked>노회별 파송현황</sl-switch>
              </div>
              <sl-divider></sl-divider>
              <div class="setting-section">
                  <strong class="section-title">전체보기 자동재생</strong>
                  <sl-radio-group id="autoplay-mode-group" label="재생 방식" value="fixed">
                      <sl-radio-button value="fixed">지도 고정 (기본)</sl-radio-button>
                      <sl-radio-button value="pan">지도 자동 이동</sl-radio-button>
                  </sl-radio-group>
                  <div class="sl-input__help-text" style="margin-top: 8px;">'지도 자동 이동' 선택 시, 기도제목 없이 간단한 선교사 명단만 표시됩니다.</div>
              </div>
          </sl-tab-panel>

          <sl-tab-panel name="missionary-upload" class="settings-panel">
              <div class="setting-section">
                  <strong class="section-title">선교사 정보</strong>
                  <sl-input id="missionary-name-input" label="선교사 이름"></sl-input>
                  <sl-textarea id="missionary-prayer-input" label="기도제목" resize="auto"></sl-textarea>
                  <sl-input type="date" id="missionary-date-input" label="날짜"></sl-input>
              </div>
              <sl-divider></sl-divider>
              <div class="setting-section">
                  <strong class="section-title">뉴스레터 PDF</strong>
                  <input type="file" id="newsletter-pdf" name="newsletter-pdf" accept="application/pdf" style="margin-bottom: 1rem;">
                  <div style="display: flex; gap: var(--sl-spacing-small);">
                    <sl-button variant="primary" id="newsletter-upload-btn">업로드</sl-button>
                    <sl-button id="newsletter-link-btn">외부링크 넣기</sl-button>
                  </div>
              </div>
          </sl-tab-panel>
        </sl-tab-group>
        <sl-button slot="footer" variant="primary" class="dialog-close-btn">닫기</sl-button>
      </sl-dialog>
    `;
    document.body.appendChild(modalContainer);

    const dialog = modalContainer.querySelector('.settings-dialog');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => dialog.show());
    }
    dialog.querySelector('.dialog-close-btn').addEventListener('click', () => dialog.hide());
    
    // --- 이벤트 리스너 설정 (Shoelace 맞춤) ---

    // 뉴스 토글
    const newsToggle = document.getElementById('news-toggle');
    newsToggle.checked = localStorage.getItem('news-toggle') === 'on';
    newsToggle.addEventListener('sl-change', () => {
        localStorage.setItem('news-toggle', newsToggle.checked ? 'on' : 'off');
        window.fetchNewsFromSheet?.();
    });

    // 테이블 토글
    ['country-table-toggle', 'presbytery-table-toggle'].forEach(id => {
        const toggle = document.getElementById(id);
        const tableId = id.replace('-toggle', '');
        toggle.checked = localStorage.getItem(id) !== 'off';
        toggle.addEventListener('sl-change', () => {
            localStorage.setItem(id, toggle.checked ? 'on' : 'off');
            document.getElementById(tableId).style.display = toggle.checked ? '' : 'none';
        });
        document.getElementById(tableId).style.display = toggle.checked ? '' : 'none';
    });
    
    // 자동재생 모드 설정
    const autoplayGroup = document.getElementById('autoplay-mode-group');
    autoplayGroup.value = localStorage.getItem('autoplay-mode') || 'fixed'; // UI에 저장된 값 반영
    autoplayGroup.addEventListener('sl-change', () => {
        const newMode = autoplayGroup.value;
        localStorage.setItem('autoplay-mode', newMode);
        // MissionaryMap에 변경사항 전파
        if (window.MissionaryMap && typeof window.MissionaryMap.setAutoplayMode === 'function') {
            window.MissionaryMap.setAutoplayMode(newMode);
        }
    });
    
    // 각종 설정값 적용 (Input)
    const setupInput = (id, storageKey, callback) => {
        const input = document.getElementById(id);
        if(!input) return;
        input.value = localStorage.getItem(storageKey) || input.value;
        input.addEventListener('sl-change', () => {
            localStorage.setItem(storageKey, input.value);
            callback?.(input.value);
        });
    };
    
    setupInput('news-interval-input', 'news-check-interval');
    setupInput('news-speed-input', 'news-speed', val => {
      const speedMs = parseInt(val, 10) * 1000;
      window.setNewsSpeed?.(speedMs);
    });
    setupInput('news-fontsize-input', 'news-fontsize');
    setupInput('news-width-input', 'news-width');
    setupInput('news-height-input', 'news-height');

    // 색상 적용
    const applyColors = () => {
        const textColor = document.getElementById('news-text-color').value;
        const bgColor = document.getElementById('news-bg-color').value;
        localStorage.setItem('news-text-color', textColor);
        localStorage.setItem('news-bg-color', bgColor);
        document.documentElement.style.setProperty('--news-bar-text', textColor);
        document.documentElement.style.setProperty('--news-bar-bg', bgColor);
    };
    document.getElementById('news-text-color').addEventListener('sl-change', applyColors);
    document.getElementById('news-bg-color').addEventListener('sl-change', applyColors);
    
}); 