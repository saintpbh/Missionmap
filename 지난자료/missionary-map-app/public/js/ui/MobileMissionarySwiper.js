// MobileMissionarySwiper.js
(function() {
    // 모바일 감지
    function isMobile() {
        return window.innerWidth <= 600;
    }

    // 모바일 모드 진입 시 기존 팝업 숨기기 및 모바일 UI 활성화
    function activateMobileSwiper(missionaries) {
        document.body.classList.add('mobile-mode');
        let container = document.getElementById('mobile-missionary-swiper');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mobile-missionary-swiper';
            document.body.appendChild(container);
        }
        container.classList.add('active');

        // Swiper 구조 생성
        container.innerHTML = `
            <button class="close-mobile-swiper">✕</button>
            <div class="swiper">
                <div class="swiper-wrapper">
                    ${missionaries.map(m => `
                        <div class="swiper-slide">
                            <div class="missionary-card">
                                <div class="missionary-avatar"><img src="${m.image || 'https://via.placeholder.com/90'}" alt="${m.name}"></div>
                                <div class="missionary-name">${m.name}</div>
                                <div class="missionary-location">${m.country}${m.city ? ', ' + m.city : ''}</div>
                                <div class="missionary-info-row">
                                    <span>파송년도: ${m.dispatchDate || '-'}</span>
                                    <span>노회: ${m.organization || '-'}</span>
                                </div>
                                <button class="prayer-btn">🙏</button>
                                <div class="prayer-section">${m.prayer || '기도제목이 없습니다.'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Swiper 초기화
        new Swiper('.swiper', {
            direction: 'vertical',
            slidesPerView: 1,
            spaceBetween: 0,
            mousewheel: true,
            pagination: false,
            allowTouchMove: true,
        });

        // 닫기 버튼
        container.querySelector('.close-mobile-swiper').onclick = function() {
            container.classList.remove('active');
            document.body.classList.remove('mobile-mode');
        };
    }

    // 전역에서 호출할 수 있도록 window에 등록
    window.showMobileMissionarySwiper = activateMobileSwiper;
})();

// --- 자동 모바일 Swiper 진입/종료 로직 ---
(function() {
    let swiperActive = false;
    function tryShowMobileSwiper() {
        if (window.innerWidth <= 600 && window.showMobileMissionarySwiper && !swiperActive) {
            const missionaries = (window.DataManager?.state?.missionaries || []).slice().sort((a, b) => {
                const dateA = new Date(a.lastUpdate || 0);
                const dateB = new Date(b.lastUpdate || 0);
                return dateB - dateA;
            });
            if (missionaries.length > 0) {
                window.showMobileMissionarySwiper(missionaries);
                swiperActive = true;
            }
        }
        if (window.innerWidth > 600 && swiperActive) {
            const container = document.getElementById('mobile-missionary-swiper');
            if (container) container.classList.remove('active');
            document.body.classList.remove('mobile-mode');
            swiperActive = false;
        }
    }
    window.addEventListener('resize', tryShowMobileSwiper);
    window.addEventListener('DOMContentLoaded', () => {
        if (window.DataManager && window.DataManager.onDataReady) {
            window.DataManager.onDataReady(tryShowMobileSwiper);
        } else {
            tryShowMobileSwiper();
        }
    });
})(); 