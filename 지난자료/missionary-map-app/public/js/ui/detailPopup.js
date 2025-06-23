// 기도 애니메이션 설정 - 쉽게 변경 가능하도록 분리
const PRAYER_CONFIG = {
    // 펄스 링 설정
    pulseRing: {
        enabled: true,
        color: 'rgba(76, 175, 80, 0.4)', // 그린 계열
        maxScale: 2.5,
        duration: 800
    },
    
    // 토스트 메시지 설정
    toast: {
        enabled: true,
        position: 'top', // 'top', 'center', 'bottom'
        duration: 3000,
        style: 'slide' // 'slide', 'fade', 'bounce'
    },

    // 대안 애니메이션 (나중에 쉽게 변경)
    alternatives: {
        morphButton: false, // 🙏 → ✓ 변형
        glitchEffect: false // 글리치 효과
    }
};

// 토스트 메시지 생성 및 표시
function showPrayerToast(name, location) {
    const existingToast = document.querySelector('.prayer-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'prayer-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">🙏</span>
            <div class="toast-text">
                <div class="toast-main">${name}님을 위해 기도합니다</div>
                <div class="toast-sub">${location} 사역을 축복해 주세요</div>
            </div>
        </div>
    `;

    document.body.appendChild(toast);
    
    // 애니메이션 실행
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // 자동 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, PRAYER_CONFIG.toast.duration);
}

// 펄스 링 애니메이션
function createPulseRing(button) {
    const ring = document.createElement('div');
    ring.className = 'pulse-ring';
    button.appendChild(ring);

    // 애니메이션 실행
    requestAnimationFrame(() => {
        ring.style.transform = `scale(${PRAYER_CONFIG.pulseRing.maxScale})`;
        ring.style.opacity = '0';
    });

    // 링 제거
    setTimeout(() => {
        ring.remove();
    }, PRAYER_CONFIG.pulseRing.duration);
}

// 기도 버튼 클릭 핸들러
function handlePrayerClick(button, name, location) {
    // 펄스 링 애니메이션
    if (PRAYER_CONFIG.pulseRing.enabled) {
        createPulseRing(button);
    }

    // 토스트 메시지 표시
    if (PRAYER_CONFIG.toast.enabled) {
        showPrayerToast(name, location);
    }

    // 버튼 상태 변경 (짧은 피드백)
    button.classList.add('prayed');
    setTimeout(() => {
        button.classList.remove('prayed');
    }, 1000);
}

// 메인 상세보기 팝업 함수
function showDetailPopup(name, latlngArray, missionaryData, elements) {
    const info = missionaryData[name];
    if (!info) {
        console.error(`선교사 정보를 찾을 수 없습니다: ${name}`);
        return;
    }

    const popup = elements.detailPopup;
    if (!popup) {
        console.error("Detail popup DOM 요소를 찾을 수 없습니다.");
        return;
    }
    
    // 팝업 컨텐츠 생성 및 삽입
    const container = popup.querySelector('.popup-content-placeholder');
    if (container) {
        container.innerHTML = '';
        const content = createPopupContent(info);
        container.appendChild(content);
    } else {
        const oldContent = popup.querySelector('.detail-popup-modern');
        if (oldContent) oldContent.remove();
        const newContent = createPopupContent(info);
        popup.appendChild(newContent);
    }

    // 팝업을 열 때마다 항상 중앙으로 위치를 리셋합니다.
    const popupModern = popup.querySelector('.detail-popup-modern');
    if (popupModern) {
        // 드래그 위치 정보를 리셋
        popupModern.translateX = 0;
        popupModern.translateY = 0;
        
        // --- START: 사이드바 감지 및 위치 조정 로직 ---
        const sidebarPanel = document.getElementById('sidebar-panel');
        // 사이드바가 존재하는지, 그리고 'open' 클래스를 가지고 있는지 확인
        const isSidebarOpen = sidebarPanel && sidebarPanel.classList.contains('open');

        let initialTransform = 'translate(-50%, -50%)'; // 기본 중앙 정렬

        if (isSidebarOpen) {
            const sidebarWidth = sidebarPanel.offsetWidth;
            // 사이드바 너비의 절반만큼 오른쪽으로 이동시킵니다.
            const offsetX = sidebarWidth / 2;
            initialTransform = `translate(calc(-50% + ${offsetX}px), -50%)`;
        }
        
        // 계산된 초기 위치를 적용합니다.
        popupModern.style.transform = initialTransform;
        // --- END: 사이드바 감지 및 위치 조정 로직 ---

        // top, left는 CSS에 의해 50%로 고정되어야 하므로 JS 수정을 제거합니다.
        popupModern.style.top = '';
        popupModern.style.left = '';
    }

    // 이벤트 리스너 설정
    setupPopupEventListeners(elements, name, `${info.country}, ${info.city || ''}`, info.news_url);

    // 팝업 보이기 (CSS의 .visible 클래스로 제어)
    popup.classList.add('visible');
}

// 이벤트 리스너 설정 함수
function setupPopupEventListeners(elements, name, location, newsUrl) {
    const popup = elements.detailPopup;
    const popupModern = popup.querySelector('.detail-popup-modern');

    if (!popupModern) {
        console.error("setupPopupEventListeners: .detail-popup-modern 요소를 찾을 수 없습니다.");
        return;
    }

    // 닫기 버튼
    const closeBtn = popupModern.querySelector('.close-btn-modern');
    if (closeBtn) {
        // 기존 리스너 제거 (중복 방지)
        const newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);

        const handleClose = () => {
             closeDetailPopup(elements);
        };
        newBtn.addEventListener('click', handleClose);
    }
    
    // 드래그 기능 추가 (창 전체를 핸들로 사용)
    dragElement(popupModern, popupModern);

    // 기도 버튼
    const prayerBtn = popupModern.querySelector('.prayer-btn');
    if (prayerBtn) {
        // 기존 리스너 제거
        const newPrayerBtn = prayerBtn.cloneNode(true);
        prayerBtn.parentNode.replaceChild(newPrayerBtn, prayerBtn);
        
        newPrayerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePrayerClick(newPrayerBtn, name, location);
        });
    }

    // 뉴스레터 링크
    const prayerLink = popupModern.querySelector('.prayer-link');
    if (prayerLink && newsUrl) {
         // 기존 리스너 제거
        const newPrayerLink = prayerLink.cloneNode(true);
        prayerLink.parentNode.replaceChild(newPrayerLink, prayerLink);

        newPrayerLink.addEventListener('click', (e) => {
            e.stopPropagation();
            const newsletterUrl = decodeURIComponent(newPrayerLink.dataset.newsletter);
            if (window.MissionaryMap && window.MissionaryMap.showNewsletter) {
                window.MissionaryMap.showNewsletter(newsletterUrl);
            }
        });
    }

    // ESC 키로 닫기
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeDetailPopup(elements);
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    // 기존 리스너가 있다면 제거 후 새로 등록
    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
}

// 팝업 닫기 함수 (단순화)
function closeDetailPopup(elements) {
    if (elements && elements.detailPopup) {
        elements.detailPopup.classList.remove('visible');
    }
}

// 드래그 기능 함수 (Transform 방식 사용)
function dragElement(elmnt, handle) {
    let pos3 = 0, pos4 = 0;
    
    // 드래그 위치 초기화
    if (elmnt.translateX === undefined) elmnt.translateX = 0;
    if (elmnt.translateY === undefined) elmnt.translateY = 0;

    const dragMouseDown = (e) => {
        if (e.target.closest('button, a, input, .prayer-section')) {
            return;
        }
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    };

    handle.onmousedown = dragMouseDown;

    const elementDrag = (e) => {
        e.preventDefault();
        const pos1 = pos3 - e.clientX; // deltaX
        const pos2 = pos4 - e.clientY; // deltaY
        pos3 = e.clientX;
        pos4 = e.clientY;

        // 누적된 이동 거리 업데이트
        elmnt.translateX -= pos1;
        elmnt.translateY -= pos2;
        
        // 중앙 정렬(-50%, -50%)과 드래그 이동(px)을 함께 적용
        elmnt.style.transform = `translate(-50%, -50%) translate(${elmnt.translateX}px, ${elmnt.translateY}px)`;
    };

    const closeDragElement = () => {
        document.onmouseup = null;
        document.onmousemove = null;
    };
}

function createPopupContent(info) {
    const sentDate = info.sent_date ? new Date(info.sent_date) : null;
    const sentYear = sentDate ? sentDate.getFullYear() : '정보 없음';
    const imgSrc = info.image && info.image.trim() ? info.image.trim() : "https://via.placeholder.com/320x180.png?text=No+Photo";
    const newsUrl = info.NewsLetter ? info.NewsLetter.trim() : '';
    const location = `${info.country || '정보없음'}, ${info.city || ''}`.replace(/, $/, '');
    
    let prayerHtml = info.prayer || '현지 정착과 건강을 위해';
    if (newsUrl) {
        prayerHtml = `<span class="prayer-link" data-newsletter="${encodeURIComponent(newsUrl)}">${prayerHtml}</span>`;
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'detail-popup-modern';
    contentDiv.innerHTML = `
        <button class="close-btn-modern" aria-label="닫기">✕</button>
        
        <!-- 헤더 섹션 -->
        <div class="popup-header">
            <div class="missionary-avatar">
                <img src="${imgSrc}" alt="${info.name}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/80x80/e8f5e8/4a90e2?text=👤';">
            </div>
            <div class="missionary-info">
                <h2 class="missionary-name">${info.name}</h2>
                <p class="missionary-location">📍 ${location}</p>
            </div>
            <button class="prayer-btn" data-name="${info.name}" data-location="${location}">
                <span class="prayer-emoji">🙏</span>
            </button>
        </div>

        <!-- 정보 섹션 -->
        <div class="popup-body">
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-icon">📅</span>
                    <div class="info-content">
                        <div class="info-label">파송년도</div>
                        <div class="info-value">${sentYear}년</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <span class="info-icon">🏢</span>
                    <div class="info-content">
                        <div class="info-label">소속기관</div>
                        <div class="info-value">${info.organization || '정보 없음'}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <span class="info-icon">⛪</span>
                    <div class="info-content">
                        <div class="info-label">노회</div>
                        <div class="info-value">${info.presbytery || '정보 없음'}</div>
                    </div>
                </div>
            </div>

            <!-- 기도제목 섹션 -->
            <div class="prayer-section">
                <h3 class="section-title">🙏 기도제목</h3>
                <p class="prayer-content">${prayerHtml}</p>
            </div>
        </div>
    `;
    return contentDiv;
}

// 설정 변경 함수 (외부에서 호출 가능)
function updatePrayerConfig(newConfig) {
    Object.assign(PRAYER_CONFIG, newConfig);
}

// 현재 설정 반환 함수
function getPrayerConfig() {
    return { ...PRAYER_CONFIG };
}

// window 객체에 함수들 등록
window.showDetailPopup = showDetailPopup;
window.closeDetailPopup = closeDetailPopup;
window.updatePrayerConfig = updatePrayerConfig;
window.getPrayerConfig = getPrayerConfig;

console.log('detailPopup 모듈 로드 완료 - window 객체에 함수들 등록됨'); 