/**
 * 기도 팝업 모듈 v2.0
 * 모던 글래스모피즘 디자인과 향상된 기능
 */

class PrayerPopupManager {
    constructor() {
        this.currentIndex = 0;
        this.interval = null;
        this.isRunning = false;
        this.isPaused = false;
        this.missionaries = [];
        this.currentPopup = null;
        this.animationDuration = 4000; // 4초
        this.fadeDuration = 300; // 페이드 애니메이션 시간
    }

    // 순회 시작
    startRotation() {
        if (this.isRunning) return;
        
        // 선교사 데이터 가져오기
        this.missionaries = window.MissionaryMap?.state?.missionaries || [];
        
        if (this.missionaries.length === 0) {
            console.warn('선교사 데이터가 없습니다.');
            return;
        }

        this.isRunning = true;
        this.currentIndex = 0;
        
        // 첫 번째 팝업 즉시 표시
        this.showNextPrayerPopup();
        
        // 인터벌 설정
        this.interval = setInterval(() => {
            this.showNextPrayerPopup();
        }, this.animationDuration);
        
        console.log('기도 팝업 순회 시작:', this.missionaries.length + '명의 선교사');
    }

    // 순회 중지
    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        this.isPaused = false;
        this.closeCurrentPopup();
        console.log('기도 팝업 순회 중지');
    }

    // 일시정지
    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isPaused = true;
        console.log('기도 팝업 일시정지');
    }

    // 재개
    resume() {
        if (this.isPaused && this.isRunning) {
            this.interval = setInterval(() => {
                this.showNextPrayerPopup();
            }, this.animationDuration);
            this.isPaused = false;
            console.log('기도 팝업 재개');
        }
    }

    // 다음 기도 팝업 표시
    showNextPrayerPopup() {
        if (this.missionaries.length === 0) return;
        
        // 현재 팝업 닫기
        this.closeCurrentPopup();
        
        // 다음 선교사 선택
        const missionary = this.missionaries[this.currentIndex];
        
        // 기도 팝업 생성 및 표시
        const popupElement = this.createPrayerPopup({
            flagUrl: this.getFlagUrl(missionary.country),
            name: missionary.name,
            country: missionary.country,
            city: missionary.city || '',
            missionary
        });
        
        // 팝업을 지도 컨테이너에 추가
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.appendChild(popupElement);
        } else {
            document.body.appendChild(popupElement);
        }
        
        // 마커 위치에 말풍선 표시
        this.setPopupPosition(popupElement, missionary);
        
        // 현재 팝업 참조 저장
        this.currentPopup = popupElement;
        
        // 다음 인덱스로 이동
        this.currentIndex = (this.currentIndex + 1) % this.missionaries.length;
    }

    // 현재 팝업 닫기
    closeCurrentPopup() {
        if (this.currentPopup) {
            this.currentPopup.remove();
            this.currentPopup = null;
        }
        
        // 기존 팝업도 정리 (안전장치)
        const existingPopup = document.querySelector('.prayer-popup-v2');
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    // 국기 URL 생성
    getFlagUrl(country) {
        const flagCode = window.MissionaryMap?.constants?.COUNTRY_FLAGS?.[country];
        return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : '';
    }

    // 말풍선 위치 설정
    setPopupPosition(popupElement, missionary) {
        if (!window.MissionaryMap?.map) return;
        
        // 선교사의 지도 좌표 가져오기
        const latlng = window.MissionaryMap.getLatLng(missionary, missionary.country);
        if (!latlng) return;
        
        // 지도 좌표를 화면 픽셀 좌표로 변환
        const point = window.MissionaryMap.map.latLngToContainerPoint(latlng);
        
        // 팝업의 실제 크기 가져오기
        const popupRect = popupElement.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;
        const tailHeight = 12;
        
        // 팝업 위치 계산 (마커 위에 배치)
        const left = point.x - (popupWidth / 2);
        const top = point.y - popupHeight - tailHeight - 10;
        
        // 화면 경계 체크
        const mapRect = window.MissionaryMap.map.getContainer().getBoundingClientRect();
        const adjustedLeft = Math.max(10, Math.min(left, mapRect.width - popupWidth - 10));
        const adjustedTop = Math.max(10, Math.min(top, mapRect.height - popupHeight - 10));
        
        // 팝업 위치 설정
        popupElement.style.left = adjustedLeft + 'px';
        popupElement.style.top = adjustedTop + 'px';
    }

    // 기도 팝업 생성
    createPrayerPopup({ flagUrl, name, country, city, missionary }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'prayer-popup-v2';
        
        // 기본 기도 내용
        let prayer = this.getMissionaryPrayerTopic(name);
        
        wrapper.innerHTML = `
            <div class="popup-close-btn" title="기도 팝업 닫기">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>
            
            <div class="popup-header">
                <div class="popup-avatar">
                    <img src="${flagUrl}" alt="${country} 국기" class="popup-flag">
                </div>
                <div class="popup-info">
                    <div class="popup-name">${name}</div>
                    <div class="popup-location">${country}${city ? ` · ${city}` : ''}</div>
                </div>
            </div>
            
            <div class="popup-content">
                <div class="popup-prayer-label">기도 요청</div>
                <div class="popup-prayer-text">${prayer}</div>
            </div>
            
            <div class="popup-action">
                <button class="prayer-action-btn" title="기도에 동참하기">
                    <span class="prayer-icon">🙏</span>
                    <span class="prayer-text">기도하기</span>
                </button>
            </div>
        `;

        // Firestore에서 최신 뉴스레터 요약 가져오기
        this.loadLatestNewsletterSummary(wrapper, name);
        
        // 이벤트 리스너 추가
        this.addEventListeners(wrapper, { name, country, city, missionary });
        
        return wrapper;
    }

    // Firestore에서 최신 뉴스레터 요약 로드
    async loadLatestNewsletterSummary(popupElement, missionaryName) {
        if (!window.firebase?.firestore) return;
        
        try {
            const snapshot = await window.firebase.firestore()
                .collection('newsletters')
                .where('missionaryName', '==', missionaryName)
                .orderBy('date', 'desc')
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                if (data.summary && data.summary.trim() !== '') {
                    const summary = data.summary.length > 80 ? 
                        data.summary.substring(0, 80) + '...' : data.summary;
                    
                    const prayerText = popupElement.querySelector('.popup-prayer-text');
                    if (prayerText) {
                        prayerText.textContent = summary;
                    }
                }
            }
        } catch (error) {
            console.warn('Firestore 요약 로드 오류:', error);
        }
    }

    // 이벤트 리스너 추가
    addEventListeners(popupElement, missionaryData) {
        // 마우스 오버/아웃 이벤트
        popupElement.addEventListener('mouseenter', () => {
            this.pause();
        });
        
        popupElement.addEventListener('mouseleave', () => {
            this.resume();
        });
        
        // 닫기 버튼 클릭
        const closeBtn = popupElement.querySelector('.popup-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closePopupWithAnimation(popupElement);
            });
        }
        
        // 기도하기 버튼 클릭
        const prayerBtn = popupElement.querySelector('.prayer-action-btn');
        if (prayerBtn) {
            prayerBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handlePrayerClick(prayerBtn, missionaryData);
            });
        }
    }

    // 애니메이션과 함께 팝업 닫기
    closePopupWithAnimation(popupElement) {
        popupElement.classList.add('popup-closing');
        
        setTimeout(() => {
            this.closeCurrentPopup();
            
            // 순환 재시작
            if (this.isRunning) {
                this.isPaused = false;
                this.showNextPrayerPopup();
                
                if (this.interval) {
                    clearInterval(this.interval);
                }
                this.interval = setInterval(() => {
                    this.showNextPrayerPopup();
                }, this.animationDuration);
            }
        }, this.fadeDuration);
    }

    // 기도 클릭 처리
    async handlePrayerClick(buttonElement, missionaryData) {
        // 클릭 피드백
        buttonElement.classList.add('prayer-clicked');
        
        try {
            // 로딩 상태
            buttonElement.disabled = true;
            buttonElement.classList.add('prayer-loading');
            
            // 기도 처리
            if (window.handlePrayerClick) {
                const success = await window.handlePrayerClick(missionaryData);
                
                if (success) {
                    // 성공 피드백
                    buttonElement.classList.add('prayer-success');
                    this.showPrayerNotification(missionaryData.name);
                } else {
                    // 실패 피드백
                    buttonElement.classList.add('prayer-error');
                }
            } else {
                buttonElement.classList.add('prayer-error');
            }
        } catch (error) {
            console.error('기도 처리 오류:', error);
            buttonElement.classList.add('prayer-error');
        } finally {
            // 상태 복원
            setTimeout(() => {
                buttonElement.disabled = false;
                buttonElement.classList.remove('prayer-clicked', 'prayer-loading', 'prayer-success', 'prayer-error');
            }, 1500);
        }
    }

    // 기도 알림 표시
    showPrayerNotification(missionaryName) {
        // 기존 알림 시스템 활용
        if (window.showPrayerNotification) {
            window.showPrayerNotification(missionaryName);
        }
    }

    // 선교사 기도 제목 가져오기
    getMissionaryPrayerTopic(missionaryName) {
        if (window.MissionaryMap?.state?.missionaries) {
            const missionary = window.MissionaryMap.state.missionaries.find(m => 
                m.name && m.name.trim() === missionaryName.trim()
            );
            
            if (missionary) {
                if (missionary.summary && missionary.summary.trim() !== '') {
                    return missionary.summary.length > 80 ? 
                        missionary.summary.substring(0, 80) + '...' : missionary.summary;
                }
                return missionary.prayer || '현지 사역과 복음 전파를 위해 기도해 주세요.';
            }
        }
        return '현지 사역과 복음 전파를 위해 기도해 주세요.';
    }

    // 상태 확인
    isActive() {
        return this.isRunning;
    }

    // 설정 업데이트
    updateSettings(settings) {
        if (settings.animationDuration) {
            this.animationDuration = settings.animationDuration;
        }
        if (settings.fadeDuration) {
            this.fadeDuration = settings.fadeDuration;
        }
    }
}

// 전역 함수들 (기존 호환성 유지)
function startPrayerRotation() {
    if (!window.prayerPopupManager) {
        window.prayerPopupManager = new PrayerPopupManager();
    }
    window.prayerPopupManager.startRotation();
}

function stopPrayerRotation() {
    if (window.prayerPopupManager) {
        window.prayerPopupManager.stopRotation();
    }
}

function isPrayerRotationActive() {
    return window.prayerPopupManager ? window.prayerPopupManager.isActive() : false;
}

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrayerPopupManager;
} 