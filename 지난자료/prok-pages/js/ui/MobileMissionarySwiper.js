let currentSwiper = null;
let currentPrayerCount = 0;

// 모바일 선교사 스와이퍼 표시
window.showMobileMissionarySwiper = function(missionaries) {
    console.log('MobileMissionarySwiper: 스와이퍼 시작', missionaries.length, '명');
    
    // 기존 스와이퍼가 있으면 제거
    if (currentSwiper) {
        currentSwiper.destroy(true, true);
        currentSwiper = null;
    }
    
    const container = document.getElementById('mobile-missionary-swiper');
    if (!container) {
        console.error('MobileMissionarySwiper: 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    // 중보기도자 수 가져오기
    currentPrayerCount = DataManager.getPrayerCount();
    
    // 스와이퍼 구조 생성
    container.innerHTML = `
        <style>
            .mobile-titlebar {
                width: 100vw;
                max-width: 400px;
                min-width: 320px;
                margin: 0 auto;
                background: #fff;
                border-radius: 20px 20px 0 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.07);
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                box-sizing: border-box;
            }
            .mobile-titlebar-inner {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 0 8px;
                justify-content: center;
            }
            .mobile-titlebar-logo {
                width: 28px;
                height: 28px;
                flex-shrink: 0;
            }
            .mobile-titlebar-title {
                font-size: 1.05rem;
                font-weight: 600;
                color: #222;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 200px;
            }
            .close-mobile-swiper {
                position: absolute;
                right: 8px;
                top: 8px;
                width: 28px;
                height: 28px;
                font-size: 1.1rem;
                flex-shrink: 0;
                background: rgba(0,0,0,0.08);
                border: none;
                border-radius: 50%;
                color: #333;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .prayer-count-display {
                position: absolute;
                left: 8px;
                top: 8px;
                background: linear-gradient(145deg, #4caf50, #43a047);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .prayer-count-number {
                font-weight: 700;
            }
            
            /* 반응형 미디어 쿼리 */
            @media (max-width: 400px) {
                .mobile-titlebar {
                    max-width: 95vw;
                    min-width: 320px;
                    width: 95vw;
                }
                .mobile-titlebar-title {
                    font-size: 1rem;
                    max-width: 180px;
                }
            }
            
            @media (max-width: 375px) {
                .mobile-titlebar {
                    max-width: 95vw;
                    min-width: 320px;
                    width: 95vw;
                }
                .mobile-titlebar-title {
                    font-size: 0.95rem;
                    max-width: 160px;
                }
                .mobile-titlebar-logo {
                    width: 26px;
                    height: 26px;
                }
            }
            
            @media (max-width: 350px) {
                .mobile-titlebar {
                    max-width: 100vw;
                    min-width: 320px;
                    width: 100vw;
                }
                .mobile-titlebar-title {
                    font-size: 0.9rem;
                    max-width: 150px;
                }
                .mobile-titlebar-logo {
                    width: 24px;
                    height: 24px;
                }
            }
        </style>
        <div class="mobile-titlebar">
            <div class="prayer-count-display">
                <span>🙏</span>
                <span class="prayer-count-number">${currentPrayerCount}</span>
            </div>
            <div class="mobile-titlebar-inner">
                <img src="logo.svg" alt="로고" class="mobile-titlebar-logo" />
                <span class="mobile-titlebar-title">한국기독교장로회 국제협력 선교사</span>
                <button class="close-mobile-swiper">✕</button>
            </div>
        </div>
        <div class="swiper">
            <div class="swiper-wrapper">
                ${missionaries.map((m, index) => `
                    <div class="swiper-slide">
                        <div class="missionary-card" data-missionary-index="${index}" data-country="${m.country || ''}" style="min-width:320px;max-width:400px;width:100vw;">
                            <div class="glass-overlay"></div>
                            <div class="missionary-info-header">
                                <div class="missionary-update-info">
                                    <span class="update-label">최신 소식</span>
                                    <span class="update-date">${formatMissionaryDate(m.lastUpdate)}</span>
                                </div>
                            </div>
                            <div class="missionary-avatar"><img src="${m.image || 'https://via.placeholder.com/90'}" alt="${m.name}"></div>
                            <div class="missionary-name">${m.name}</div>
                            <div class="missionary-location"><span class="emoji">📍</span> ${m.country}${m.city ? ', ' + m.city : ''}</div>
                            <div class="missionary-info-row vertical">
                                <span class="sent-year"><span class="emoji">📅</span> 파송년도: ${getSentYear(m)}</span>
                                <span class="organization"><span class="emoji">⛪️</span> 사역지: ${m.organization || '-'}</span>
                            </div>
                            <button class="prayer-btn" data-missionary-index="${index}">🙏</button>
                            <div class="prayer-section">${m.prayer || '기도제목이 없습니다.'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="next-card-indicator">🌏</div>
    `;
    
    // Swiper 초기화
    currentSwiper = new Swiper('.swiper', {
        direction: 'horizontal',
        loop: false,
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        effect: 'slide',
        speed: 300,
        autoplay: false,
        on: {
            init: function() {
                console.log('MobileMissionarySwiper: Swiper 초기화 완료');
            },
            slideChange: function() {
                console.log('MobileMissionarySwiper: 슬라이드 변경', this.activeIndex);
            }
        }
    });
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    console.log('MobileMissionarySwiper: 스와이퍼 생성 완료');
};

// 중보기도자 수 업데이트 함수
window.updateMobilePrayerCount = function(count) {
    currentPrayerCount = count;
    const prayerCountElements = document.querySelectorAll('.prayer-count-number');
    prayerCountElements.forEach(element => {
        element.textContent = count;
    });
    console.log('MobileMissionarySwiper: 중보기도자 수 업데이트:', count);
};

// 이벤트 리스너 설정
function setupEventListeners() {
    // 닫기 버튼
    const closeBtn = document.querySelector('.close-mobile-swiper');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (currentSwiper) {
                currentSwiper.destroy(true, true);
                currentSwiper = null;
            }
            const container = document.getElementById('mobile-missionary-swiper');
            if (container) {
                container.innerHTML = '';
            }
            console.log('MobileMissionarySwiper: 스와이퍼 닫힘');
        });
    }
    
    // 기도 버튼
    const prayerBtns = document.querySelectorAll('.prayer-btn');
    prayerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.missionaryIndex);
            const missionary = DataManager.state.missionaries[index];
            if (missionary) {
                handlePrayerClick(missionary, e.target);
            }
        });
    });
}

// 기도 버튼 클릭 처리
function handlePrayerClick(missionary, button) {
    console.log('MobileMissionarySwiper: 기도 버튼 클릭', missionary.name);
    
    // 버튼 애니메이션
    button.style.transform = 'scale(0.9)';
    button.style.transition = 'transform 0.1s';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 100);
    
    // 기도 알림 표시
    showPrayerNotification(missionary.name);
}

// 기도 알림 표시
function showPrayerNotification(missionaryName) {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.prayer-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = 'prayer-notification';
    notification.innerHTML = `
        <style>
            .prayer-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 30px;
                border-radius: 15px;
                font-size: 1.1rem;
                font-weight: 600;
                text-align: center;
                z-index: 10000;
                animation: prayerNotificationFade 2s ease-in-out;
            }
            @keyframes prayerNotificationFade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        </style>
        <div>🙏 ${missionaryName} 선교사를 위해 기도합니다</div>
    `;
    
    document.body.appendChild(notification);
    
    // 2초 후 자동 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 2000);
}

// 선교사 날짜 포맷팅
function formatMissionaryDate(dateString) {
    if (!dateString) return '정보 없음';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '정보 없음';
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '오늘';
        if (diffDays === 2) return '어제';
        if (diffDays <= 7) return `${diffDays - 1}일 전`;
        if (diffDays <= 30) return `${Math.floor(diffDays / 7)}주 전`;
        if (diffDays <= 365) return `${Math.floor(diffDays / 30)}개월 전`;
        
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('날짜 포맷팅 오류:', error);
        return '정보 없음';
    }
}

// 파송년도 추출
function getSentYear(missionary) {
    if (missionary.sentDate) {
        try {
            const date = new Date(missionary.sentDate);
            if (!isNaN(date.getTime())) {
                return date.getFullYear().toString();
            }
        } catch (error) {
            console.error('파송년도 추출 오류:', error);
        }
    }
    
    if (missionary.sentYear) {
        return missionary.sentYear.toString();
    }
    
    return '정보 없음';
}

console.log('MobileMissionarySwiper: 모듈 로드 완료'); 