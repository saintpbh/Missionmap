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

    // 테이블 토글 (완전히 안전한 방식)
    const initTableToggles = () => {
        console.log('setup.js: 테이블 토글 초기화 시작');
        
        // 테이블 ID 매핑
        const tableMapping = [
            { toggleId: 'country-table-toggle', tableId: 'missionary-table-country' },
            { toggleId: 'presbytery-table-toggle', tableId: 'missionary-table-presbytery' }
        ];
        
        // 완전히 안전한 테이블 표시/숨김 함수
        const setTableVisibility = (tableId, visible) => {
            try {
                const element = document.getElementById(tableId);
                if (!element) {
                    console.warn(`setup.js: 테이블 요소 없음: ${tableId}`);
                    return false;
                }
                
                // style 객체가 존재하는지 확인
                if (!element.style) {
                    console.warn(`setup.js: 테이블 요소에 style 속성 없음: ${tableId}`);
                    return false;
                }
                
                // display 속성을 안전하게 설정
                element.style.setProperty('display', visible ? '' : 'none');
                console.log(`setup.js: 테이블 ${tableId} -> ${visible ? '표시' : '숨김'}`);
                return true;
                
            } catch (error) {
                console.error(`setup.js: 테이블 ${tableId} 표시 설정 실패:`, error);
                return false;
            }
        };
        
        // 각 토글 설정
        tableMapping.forEach(({ toggleId, tableId }) => {
            try {
                const toggle = document.getElementById(toggleId);
                if (!toggle) {
                    console.warn(`setup.js: 토글 요소 없음: ${toggleId}`);
                    return;
                }
                
                // 초기 상태 설정
                const savedState = localStorage.getItem(toggleId);
                const isVisible = savedState !== 'off';
                toggle.checked = isVisible;
                
                // 이벤트 리스너
                toggle.addEventListener('sl-change', (event) => {
                    const newState = event.target.checked;
                    localStorage.setItem(toggleId, newState ? 'on' : 'off');
                    setTableVisibility(tableId, newState);
                });
                
                // 초기 표시 설정
                setTimeout(() => {
                    setTableVisibility(tableId, isVisible);
                }, 100);
                
            } catch (error) {
                console.error(`setup.js: 토글 ${toggleId} 설정 실패:`, error);
            }
        });
        
        console.log('setup.js: 테이블 토글 초기화 완료');
    };
    
    // DOM 준비 확인 및 초기화
    const waitForTablesAndInit = () => {
        const requiredTables = ['missionary-table-country', 'missionary-table-presbytery'];
        const allExist = requiredTables.every(id => {
            const element = document.getElementById(id);
            return element && element.style;
        });
        
        if (allExist) {
            initTableToggles();
        } else {
            console.log('setup.js: 테이블 요소 대기 중...');
            setTimeout(waitForTablesAndInit, 500);
        }
    };
    
    // 1초 후 초기화 시작
    setTimeout(waitForTablesAndInit, 1000);
    
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

    // 색상 적용 (안전하게)
    const applyColors = () => {
        try {
            const textColorEl = document.getElementById('news-text-color');
            const bgColorEl = document.getElementById('news-bg-color');
            
            if (textColorEl && bgColorEl) {
                const textColor = textColorEl.value;
                const bgColor = bgColorEl.value;
                localStorage.setItem('news-text-color', textColor);
                localStorage.setItem('news-bg-color', bgColor);
                document.documentElement.style.setProperty('--news-bar-text', textColor);
                document.documentElement.style.setProperty('--news-bar-bg', bgColor);
            }
        } catch (error) {
            console.error('setup.js: 색상 적용 중 오류:', error);
        }
    };
    
    // 색상 이벤트 리스너 추가 (안전하게)
    const textColorEl = document.getElementById('news-text-color');
    const bgColorEl = document.getElementById('news-bg-color');
    
    if (textColorEl) {
        textColorEl.addEventListener('sl-change', applyColors);
    }
    if (bgColorEl) {
        bgColorEl.addEventListener('sl-change', applyColors);
    }
    
}); 