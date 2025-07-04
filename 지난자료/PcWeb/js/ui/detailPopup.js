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

// 팝업 위치 저장/복원을 위한 유틸리티 함수들
const POPUP_POSITION_KEY = 'missionaryDetailPopupPosition';

// 저장된 팝업 위치 가져오기
function getSavedPopupPosition() {
    try {
        const saved = localStorage.getItem(POPUP_POSITION_KEY);
        if (saved) {
            const position = JSON.parse(saved);
            // 유효한 위치인지 확인 (화면 크기 내에 있는지)
            if (position && typeof position.x === 'number' && typeof position.y === 'number') {
                return position;
            }
        }
    } catch (error) {
        console.warn('저장된 팝업 위치를 불러오는데 실패했습니다:', error);
    }
    return null;
}

// 팝업 위치 저장하기
function savePopupPosition(x, y) {
    try {
        const position = { x, y, timestamp: Date.now() };
        localStorage.setItem(POPUP_POSITION_KEY, JSON.stringify(position));
    } catch (error) {
        console.warn('팝업 위치를 저장하는데 실패했습니다:', error);
    }
}

// 저장된 위치가 유효한지 확인 (화면 크기 변경 시 대응)
function isValidSavedPosition(position) {
    if (!position) return false;
    
    const popup = document.querySelector('.detail-popup-modern');
    if (!popup) return true; // 팝업이 없으면 일단 유효하다고 가정
    
    const popupRect = popup.getBoundingClientRect();
    const maxX = window.innerWidth - popupRect.width;
    const maxY = window.innerHeight - popupRect.height;
    
    return position.x >= 0 && position.x <= maxX && 
           position.y >= 0 && position.y <= maxY;
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

// 기도 버튼 클릭 핸들러 (이름 충돌 방지를 위해 함수명 변경)
async function handleDetailPopupPrayerClick(button, name, location) {
    
    // 펄스 링 애니메이션
    if (PRAYER_CONFIG.pulseRing.enabled) {
        createPulseRing(button);
    }

    // 버튼 상태 변경 (짧은 피드백)
    button.classList.add('prayed');
    setTimeout(() => {
        button.classList.remove('prayed');
    }, 1000);

    // PrayerClick 모듈과 연동하여 Firebase에 기도 기록 및 지도에 기도손 표시
    if (window.handlePrayerClick) {
        try {
            // 선교사 데이터 생성 (PrayerClick 모듈에서 요구하는 형식)
            // location이 undefined이거나 빈 문자열인 경우 처리
            const safeLocation = location || '';
            const locationParts = safeLocation.split(',');
            
            // 실제 전달받은 매개변수 사용 (기본값 대신)
            const missionaryData = {
                name: name, // 매개변수 그대로 사용
                country: locationParts[0]?.trim() || '', // 위치에서 국가 추출
                city: locationParts[1]?.trim() || '', // 위치에서 도시 추출
                flagUrl: '' // 국기 URL은 handlePrayerClick에서 생성
            };
            

            
            // 데이터 유효성 사전 검증
            if (!missionaryData.name || !missionaryData.country) {
                console.error('상세 팝업에서 필수 데이터 누락:', {
                    name: missionaryData.name,
                    country: missionaryData.country,
                    originalLocation: location
                });
                return;
            }
            
            // 로딩 상태 표시
            const originalText = button.innerHTML;
            button.style.opacity = '0.7';
            button.style.pointerEvents = 'none';
            
            const success = await window.handlePrayerClick(missionaryData);
            
            if (success) {
                // 기도 안내 팝업 표시
                if (window.showPrayerNotification) {
                    window.showPrayerNotification(name);
                } else {
                    console.warn('showPrayerNotification 함수를 찾을 수 없습니다.');
                    // 직접 팝업 표시 시도
                    const notification = document.getElementById('prayer-notification');
                    const messageElement = notification?.querySelector('.prayer-message');
                    if (notification && messageElement) {
                        messageElement.textContent = `${name} 선교사님을 위해 기도합니다!`;
                        notification.classList.remove('hidden');
                        notification.classList.add('show');
                        
                        setTimeout(() => {
                            notification.classList.remove('show');
                            notification.classList.add('hidden');
                        }, 2000);
                    } else {
                        console.error('기도 안내 팝업 요소를 찾을 수 없습니다.');
                    }
                }
                
                // 성공 피드백 - 버튼 색상 변경
                button.style.background = 'rgba(34, 197, 94, 0.2)';
                button.style.borderColor = 'rgba(34, 197, 94, 0.4)';
                button.style.color = 'rgba(34, 197, 94, 1)';
                
                setTimeout(() => {
                    button.style.background = '';
                    button.style.borderColor = '';
                    button.style.color = '';
                }, 2000);
            } else {
                // 실패 피드백
                button.style.background = 'rgba(239, 68, 68, 0.2)';
                button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                
                setTimeout(() => {
                    button.style.background = '';
                    button.style.borderColor = '';
                }, 2000);
            }
            
            // 로딩 상태 해제
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            
        } catch (error) {
            console.error('기도 클릭 처리 중 오류:', error);
            
            // 오류 피드백
            button.style.background = 'rgba(239, 68, 68, 0.2)';
            button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            
            setTimeout(() => {
                button.style.background = '';
                button.style.borderColor = '';
            }, 2000);
            
            // 로딩 상태 해제
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    } else {
        console.warn('PrayerClick 모듈이 로드되지 않았습니다.');
    }
}

// SVG 아바타 생성 함수
function createAvatarSVG(name, size = 80) {
    const initials = name ? name.charAt(0).toUpperCase() : '?';
    const colors = ['#4a90e2', '#7ed321', '#f5a623', '#d0021b', '#9013fe', '#50e3c2'];
    const color = colors[name ? name.charCodeAt(0) % colors.length : 0];
    
    // 안전한 base64 인코딩을 위한 함수
    function safeBtoa(str) {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            // 실패 시 기본 이니셜 사용
            const fallbackInitials = name ? name.charCodeAt(0).toString(16).toUpperCase() : '?';
            const fallbackSvg = `
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="${size}" height="${size}" fill="${color}" rx="${size/2}"/>
                    <text x="${size/2}" y="${size/2 + size/8}" font-family="Arial, sans-serif" font-size="${size/3}" 
                          fill="white" text-anchor="middle" dominant-baseline="middle">${fallbackInitials}</text>
                </svg>
            `;
            return btoa(unescape(encodeURIComponent(fallbackSvg)));
        }
    }
    
    const svgString = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" fill="${color}" rx="${size/2}"/>
            <text x="${size/2}" y="${size/2 + size/8}" font-family="Arial, sans-serif" font-size="${size/3}" 
                  fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
        </svg>
    `;
    
    return `data:image/svg+xml;base64,${safeBtoa(svgString)}`;
}

// Firestore에서 선교사 상세 정보 가져오기
async function fetchMissionaryDetails(name) {
    try {
        if (!window.firebase || !window.firebase.database) {
            console.warn('Firebase Database가 로드되지 않았습니다. 기존 데이터를 사용합니다.');
            return null;
        }

        // Realtime Database에서 선교사 기본 정보 가져오기
        const db = window.firebase.database();
        const missionarySnapshot = await db.ref('missionaries').orderByChild('name').equalTo(name).once('value');
        const missionaryData = missionarySnapshot.val();
        
        if (!missionaryData) {
            console.warn('선교사 데이터를 찾을 수 없습니다:', name);
            return null;
        }
        
        const missionaryId = Object.keys(missionaryData)[0];
        const missionary = missionaryData[missionaryId];
        
        // Realtime Database에서 최신 뉴스레터 가져오기 (있는 경우)
        let latestNewsletter = null;
        try {
            const newsletterSnapshot = await db.ref('newsletters').orderByChild('missionaryId').equalTo(missionaryId).once('value');
            const newsletterData = newsletterSnapshot.val();
            
            if (newsletterData) {
                // 가장 최신 뉴스레터 찾기
                const newsletters = Object.values(newsletterData);
                const sortedNewsletters = newsletters.sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);
                    return dateB - dateA;
                });
                
                if (sortedNewsletters.length > 0) {
                    latestNewsletter = sortedNewsletters[0];
                }
            }
        } catch (error) {
            console.warn('뉴스레터 데이터 가져오기 실패:', error);
        }
        
        return {
            ...missionary,
            id: missionaryId,
            latestNewsletter
        };
    } catch (error) {
        console.error('선교사 상세 정보 가져오기 실패:', error);
        return null;
    }
}

// 메인 상세보기 팝업 함수
window.showDetailPopup = async function(name, latlng, missionaryInfo, elements) {
    // Firestore에서 최신 데이터 가져오기
    const freshData = await fetchMissionaryDetails(name);
    const info = freshData || missionaryInfo[name] || {};
    
    const sentDate = info.sent_date ? new Date(info.sent_date) : null;
    const sentYear = sentDate ? sentDate.getFullYear() : '정보 없음';
    const imgSrc = info.image && info.image.trim() ? info.image.trim() : createAvatarSVG(name, 320);
    const newsUrl = info.NewsLetter ? info.NewsLetter.trim() : '';
    const location = `${info.country || '정보없음'}, ${info.city || ''}`.replace(/, $/, '');
    
    // 기도제목: 최신 뉴스레터 요약 우선, 없으면 기존 기도제목 사용
    let prayerHtml = '현지 정착과 건강을 위해';
    if (info.latestNewsletter && info.latestNewsletter.summary && info.latestNewsletter.summary.trim()) {
        prayerHtml = info.latestNewsletter.summary.trim();
    } else if (info.prayer && info.prayer.trim()) {
        prayerHtml = info.prayer.trim();
    } else if (info.latestNewsletterSummary && info.latestNewsletterSummary.trim()) {
        prayerHtml = info.latestNewsletterSummary.trim();
    }
    
    if (newsUrl) {
        prayerHtml = `<span class="prayer-link" data-newsletter="${encodeURIComponent(newsUrl)}">${prayerHtml}</span>`;
    }

    // 새로운 모던 디자인으로 팝업 구성
    elements.detailPopup.innerHTML = `
        <div class="detail-popup-modern">
            <button class="close-btn-modern" aria-label="닫기">✕</button>
            
            <!-- 헤더 섹션 -->
            <div class="popup-header">
                <div class="missionary-avatar">
                    <img src="${imgSrc}" alt="${name}" loading="lazy" 
                         onerror="this.src='${createAvatarSVG(name, 80)}';">
                </div>
                <div class="missionary-info">
                    <h2 class="missionary-name">${name}</h2>
                    <p class="missionary-location">📍 ${location}</p>
                </div>
                <button class="prayer-btn" data-name="${name}" data-location="${location}">
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

                <!-- 최신 뉴스레터 섹션 -->
                ${info.latestNewsletter ? `
                <div class="newsletter-section">
                    <h3 class="section-title">📰 최신 뉴스레터</h3>
                    <div class="newsletter-info">
                        <div class="newsletter-date">
                            <span class="info-icon">📅</span>
                            ${info.latestNewsletter.date ? new Date(info.latestNewsletter.date).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
                        </div>
                        ${info.latestNewsletter.title ? `
                        <div class="newsletter-title">
                            <span class="info-icon">📋</span>
                            ${info.latestNewsletter.title}
                        </div>
                        ` : ''}
                        ${info.latestNewsletter.content ? `
                        <div class="newsletter-content">
                            <span class="info-icon">📝</span>
                            <div class="content-preview">${info.latestNewsletter.content.substring(0, 100)}${info.latestNewsletter.content.length > 100 ? '...' : ''}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    // 이벤트 리스너 설정
    setupPopupEventListeners(elements, name, location, newsUrl);

    // 팝업 표시 및 위치 설정
    showPopup(elements);
}

// 이벤트 리스너 설정 함수
function setupPopupEventListeners(elements, name, location, newsUrl) {
    const popup = elements.detailPopup;
    const popupContent = popup.querySelector('.detail-popup-modern');

    // 닫기 버튼
    const closeBtn = popup.querySelector('.close-btn-modern');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeDetailPopup(elements));
    }

    // 기도 버튼
    const prayerBtn = popup.querySelector('.prayer-btn');
    if (prayerBtn) {
        prayerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // 버튼의 data 속성에서 정보 가져오기 (더 안전함)
            const missionaryName = prayerBtn.dataset.name || name;
            const missionaryLocation = prayerBtn.dataset.location || location;
            
            handleDetailPopupPrayerClick(prayerBtn, missionaryName, missionaryLocation);
        });
    }

    // 뉴스레터 링크
    const prayerLink = popup.querySelector('.prayer-link');
    if (prayerLink && newsUrl) {
        prayerLink.addEventListener('click', (e) => {
            e.stopPropagation();
            const newsletterUrl = decodeURIComponent(prayerLink.dataset.newsletter);
            if (window.MissionaryMap && window.MissionaryMap.showNewsletter) {
                window.MissionaryMap.showNewsletter(newsletterUrl);
            }
        });
    }

    // 드래그 기능 추가
    if (popupContent) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        popupContent.addEventListener('mousedown', (e) => {
            // 닫기 버튼이나 기도 버튼 클릭 시 드래그 방지
            if (e.target.closest('.close-btn-modern') || e.target.closest('.prayer-btn')) {
                return;
            }
            
            isDragging = true;
            popupContent.classList.add('dragging');
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = popupContent.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            // 화면 경계 체크
            const maxX = window.innerWidth - popupContent.offsetWidth;
            const maxY = window.innerHeight - popupContent.offsetHeight;
            
            const clampedLeft = Math.max(0, Math.min(newLeft, maxX));
            const clampedTop = Math.max(0, Math.min(newTop, maxY));
            
            popupContent.style.left = `${clampedLeft}px`;
            popupContent.style.top = `${clampedTop}px`;
            popupContent.style.transform = 'none';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                popupContent.classList.remove('dragging');
                
                // 드래그가 끝나면 현재 위치를 저장
                const rect = popupContent.getBoundingClientRect();
                savePopupPosition(rect.left, rect.top);
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
    document.addEventListener('keydown', handleKeyDown);
}

// 팝업 표시 함수
function showPopup(elements) {
    const popup = elements.detailPopup;
    
    // 팝업을 먼저 숨김 상태로 표시
    popup.style.display = "block";
    popup.classList.add('visible');
    
    // 부드러운 애니메이션을 위한 지연
    requestAnimationFrame(() => {
        popup.classList.add('animate-in');
    });

    // 위치 조정 (저장된 위치 우선)
    setTimeout(() => {
        positionPopup(elements);
    }, 16);
}

// 팝업 위치 조정 함수 (저장된 위치 우선)
function positionPopup(elements) {
    const popup = elements.detailPopup;
    const popupContent = popup.querySelector('.detail-popup-modern');
    const mapRect = elements.mapContainer.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    
    // 저장된 위치가 있는지 확인
    const savedPosition = getSavedPopupPosition();
    let x, y;
    
    if (savedPosition && isValidSavedPosition(savedPosition)) {
        // 저장된 위치 사용
        x = savedPosition.x;
        y = savedPosition.y;
    } else {
        // 기본 위치 계산 (중앙)
        x = mapRect.left + (mapRect.width - popupRect.width) / 2;
        y = mapRect.top + (mapRect.height - popupRect.height) / 2;
    
    // 모바일 최적화
    if (window.innerWidth < 700) {
        x = (window.innerWidth - popupRect.width) / 2;
        y = (window.innerHeight - popupRect.height) / 2;
    }
    
    // 화면 경계 체크
    x = Math.max(20, Math.min(x, window.innerWidth - popupRect.width - 20));
    y = Math.max(20, Math.min(y, window.innerHeight - popupRect.height - 20));
    }
    
    // 팝업 위치 설정
    if (popupContent) {
        popupContent.style.left = `${x}px`;
        popupContent.style.top = `${y}px`;
        popupContent.style.transform = 'none';
    } else {
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    }
}

// 팝업 닫기 함수
window.closeDetailPopup = function(elements) {
    const popup = elements.detailPopup;
    popup.classList.remove('animate-in');
    popup.classList.add('animate-out');
    
    setTimeout(() => {
        popup.classList.remove('visible', 'animate-out');
        popup.style.display = "none";
    }, 300);
}

// 저장된 팝업 위치 초기화 함수
window.resetPopupPosition = function() {
    try {
        localStorage.removeItem(POPUP_POSITION_KEY);
        return true;
    } catch (error) {
        console.warn('팝업 위치 초기화에 실패했습니다:', error);
        return false;
    }
}

// 현재 저장된 팝업 위치 가져오기 함수
window.getCurrentPopupPosition = function() {
    return getSavedPopupPosition();
}

// 설정 변경 함수 (외부에서 호출 가능)
window.updatePrayerConfig = function(newConfig) {
    Object.assign(PRAYER_CONFIG, newConfig);
}

// 현재 설정 반환 함수
window.getPrayerConfig = function() {
    return { ...PRAYER_CONFIG };
} 