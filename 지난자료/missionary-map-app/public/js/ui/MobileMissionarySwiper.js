// MobileMissionarySwiper.js
(function() {
    // 모바일 감지
    function isMobile() {
        return window.innerWidth <= 600;
    }

    // 모바일 모드 진입 시 기존 팝업 숨기기 및 모바일 UI 활성화
    function activateMobileSwiper(missionaries) {
        console.log('activateMobileSwiper 호출됨, 선교사 수:', missionaries.length);
        
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
                    ${missionaries.map((m, index) => `
                        <div class="swiper-slide">
                            <div class="missionary-card" data-missionary-index="${index}" data-country="${m.country || ''}">
                                <div class="missionary-avatar"><img src="${m.image || 'https://via.placeholder.com/90'}" alt="${m.name}"></div>
                                <div class="missionary-name">${m.name}</div>
                                <div class="missionary-location">${m.country}${m.city ? ', ' + m.city : ''}</div>
                                <div class="missionary-info-row">
                                    <span>파송년도: ${m.dispatchDate || '-'}</span>
                                    <span>노회: ${m.organization || '-'}</span>
                                </div>
                                <button class="prayer-btn" data-missionary-index="${index}">🙏</button>
                                <div class="prayer-section">${m.prayer || '기도제목이 없습니다.'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        console.log('Swiper HTML 생성 완료, 초기화 시작');

        // Swiper 초기화
        const swiper = new Swiper('.swiper', {
            direction: 'vertical',
            slidesPerView: 1,
            spaceBetween: 0,
            mousewheel: true,
            pagination: false,
            allowTouchMove: true,
        });

        console.log('Swiper 초기화 완료');

        // 각 카드에 국가별 배경 적용
        applyCountryBackgrounds(missionaries);

        // 이벤트 리스너 설정
        setupMobileSwiperEvents(container, missionaries);

        // 닫기 버튼
        container.querySelector('.close-mobile-swiper').onclick = function() {
            container.classList.remove('active');
            document.body.classList.remove('mobile-mode');
        };
    }

    // 각 카드에 국가별 배경 적용
    function applyCountryBackgrounds(missionaries) {
        if (!window.CountryBackgrounds) {
            console.warn('CountryBackgrounds 모듈이 로드되지 않았습니다.');
            return;
        }

        console.log('국가별 배경 적용 시작...');
        
        missionaries.forEach((missionary, index) => {
            const cardElement = document.querySelector(`[data-missionary-index="${index}"]`);
            if (cardElement && missionary.country) {
                // CountryBackgrounds를 사용하여 카드 배경 설정
                window.CountryBackgrounds.setCardBackground(cardElement, missionary);
                console.log(`${missionary.name} 카드에 ${missionary.country} 배경 적용`);
            }
        });

        console.log('국가별 배경 적용 완료');
    }

    // 모바일 스와이퍼 이벤트 설정
    function setupMobileSwiperEvents(container, missionaries) {
        // 카드 클릭 이벤트 (상세보기 열기)
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.missionary-card');
            if (card) {
                const index = parseInt(card.dataset.missionaryIndex);
                const missionary = missionaries[index];
                if (missionary && window.showMobileDetailPopup) {
                    window.showMobileDetailPopup(missionary);
                }
            }
        });

        // 기도 버튼 클릭 이벤트
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('prayer-btn')) {
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                const index = parseInt(e.target.dataset.missionaryIndex);
                const missionary = missionaries[index];
                if (missionary) {
                    handleMobileCardPrayer(e.target, missionary.name, `${missionary.country}${missionary.city ? ', ' + missionary.city : ''}`);
                }
            }
        });
    }

    // 모바일 카드 기도 버튼 핸들러
    function handleMobileCardPrayer(button, name, location) {
        // 펄스 애니메이션
        button.classList.add('prayed');
        setTimeout(() => {
            button.classList.remove('prayed');
        }, 600);

        // 토스트 메시지 표시
        showMobileCardToast(name, location);

        // 햅틱 피드백 (지원하는 경우)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }

    // 모바일 카드 토스트 메시지
    function showMobileCardToast(name, location) {
        const existingToast = document.querySelector('.mobile-card-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'mobile-card-toast';
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 50px;
            font-size: 0.9rem;
            z-index: 1000003;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        `;
        toast.innerHTML = `
            <span style="font-size: 1.2rem;">🙏</span>
            <span>${name}님을 위해 기도합니다</span>
        `;

        document.body.appendChild(toast);
        
        // 애니메이션 실행
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // 자동 제거
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 400);
        }, 3000);
    }

    // 전역에서 호출할 수 있도록 window에 등록
    window.showMobileMissionarySwiper = activateMobileSwiper;
})();

// --- 자동 모바일 Swiper 진입/종료 로직 ---
(function() {
    let swiperActive = false;
    function tryShowMobileSwiper() {
        console.log('tryShowMobileSwiper 호출됨, 화면 너비:', window.innerWidth);
        
        if (window.innerWidth <= 600 && window.showMobileMissionarySwiper && !swiperActive) {
            const missionaries = (window.DataManager?.state?.missionaries || []).slice().sort((a, b) => {
                const dateA = new Date(a.lastUpdate || 0);
                const dateB = new Date(b.lastUpdate || 0);
                return dateB - dateA;
            });
            
            console.log('자동 모바일 스와이퍼 시도, 선교사 수:', missionaries.length);
            
            if (missionaries.length > 0) {
                window.showMobileMissionarySwiper(missionaries);
                swiperActive = true;
                console.log('자동 모바일 스와이퍼 활성화됨');
            }
        }
        if (window.innerWidth > 600 && swiperActive) {
            const container = document.getElementById('mobile-missionary-swiper');
            if (container) container.classList.remove('active');
            document.body.classList.remove('mobile-mode');
            swiperActive = false;
            console.log('자동 모바일 스와이퍼 비활성화됨');
        }
    }
    window.addEventListener('resize', tryShowMobileSwiper);
    window.addEventListener('DOMContentLoaded', () => {
        console.log('MobileMissionarySwiper DOMContentLoaded 이벤트');
        if (window.DataManager && window.DataManager.onDataReady) {
            window.DataManager.onDataReady(tryShowMobileSwiper);
        } else {
            tryShowMobileSwiper();
        }
    });
})(); 