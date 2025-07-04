// 플로팅 리스트 팝업 생성
function createFloatingListPopup({ flagUrl, country, missionaryList }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'floating-popup floating-list-popup';
    wrapper.innerHTML = `
        <div class="popup-header">
            <img src="${flagUrl}" alt="국기" class="popup-flag">
            <span class="popup-country">${country}</span>
        </div>
        <ul class="popup-missionary-list">
            ${missionaryList.map(missionary => `<li class="missionary-item-clickable"><span class="missionary-name">${missionary.name}</span> <span class="popup-city">(${missionary.city})</span></li>`).join('')}
        </ul>
    `;
    
    // 선교사 리스트 항목 클릭 이벤트 추가 (이름과 도시 모두 포함)
    const listItems = wrapper.querySelectorAll('.missionary-item-clickable');
    listItems.forEach((listItem, index) => {
        listItem.addEventListener('click', () => {
            const missionary = missionaryList[index];
            showMissionaryDetail(missionary.name);
        });
    });
    
    return wrapper;
}

// 플로팅 이름 팝업 생성
function createFloatingNamePopup({ name, city, ministry }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'floating-popup floating-name-popup';
    wrapper.innerHTML = `
        <div class="popup-header">
            <span class="popup-name">${name}</span>
            <span class="popup-city">(${city})</span>
        </div>
        <div class="popup-ministry">${ministry}</div>
    `;
    return wrapper;
}

// 플로팅 팝업 닫기
function closeFloatingPopup() {
    const existingPopup = document.querySelector('.floating-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
}

// 선교사 상세정보 표시
function showMissionaryDetail(missionaryName) {
    // 기존 플로팅 팝업 닫기
    closeFloatingPopup();
    
    // 전역 변수에서 선교사 정보 찾기 (missionaries 배열에서 직접 찾기)
    let missionaryInfo = null;
    
    // MissionaryMap 객체에서 선교사 데이터 찾기
    if (window.MissionaryMap?.state?.missionaries) {
        missionaryInfo = window.MissionaryMap.state.missionaries.find(m => 
            m.name && m.name.trim() === missionaryName.trim()
        );
        
        if (!missionaryInfo) {
            // 부분 매칭 시도
            missionaryInfo = window.MissionaryMap.state.missionaries.find(m => 
                m.name && m.name.includes(missionaryName.trim())
            );
        }
    } else {
        console.error('MissionaryMap.state.missionaries가 없습니다.');
    }
    
    if (missionaryInfo) {
        // 사이드바와 동일한 방식으로 UIManager의 showDetailPopup 사용
        if (window.UIManager && window.UIManager.showDetailPopup) {
            const latlng = window.MissionaryMap?.getLatLng?.(missionaryInfo, missionaryInfo.country) || [0, 0];
            window.UIManager.showDetailPopup(missionaryInfo.name, latlng);
        } else {
            console.error('UIManager.showDetailPopup 함수를 찾을 수 없습니다.');
        }
    } else {
        console.error(`선교사 정보를 찾을 수 없습니다: ${missionaryName}`);
    }
}

// 플로팅 기도 팝업 순회 관리자 (시안 B: 따뜻한 감성 스타일)
class FloatingPrayerManager {
    constructor() {
        this.currentIndex = 0;
        this.interval = null;
        this.isRunning = false;
        this.isPaused = false;
        this.missionaries = [];
    }

    // 순회 시작
    startRotation() {
        if (this.isRunning) return;
        
        // 선교사 데이터 가져오기
        this.missionaries = window.MissionaryMap?.state?.missionaries || [];
        
        if (this.missionaries.length === 0) {
            return;
        }

        this.isRunning = true;
        this.currentIndex = 0;
        
        // 첫 번째 팝업 즉시 표시
        this.showNextPrayerPopup();
        
        // 4초마다 다음 팝업 표시 (따뜻한 느낌을 위해 조금 더 길게)
        this.interval = setInterval(() => {
            this.showNextPrayerPopup();
        }, 4000);
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
    }

    // 다음 기도 팝업 표시
    showNextPrayerPopup() {
        if (this.missionaries.length === 0) return;
        
        // 현재 팝업 닫기
        this.closeCurrentPopup();
        
        // 다음 선교사 선택
        const missionary = this.missionaries[this.currentIndex];

        // 디버깅: 팝업 데이터 로그
        console.log('popup data:', {
            flagUrl: this.getFlagUrl(missionary.country),
            name: missionary.name,
            country: missionary.country,
            missionary
        });
        
        // 기도 팝업 생성 및 표시
        const popupElement = createMinimalPrayerPopup({
            flagUrl: this.getFlagUrl(missionary.country),
            name: missionary.name,
            country: missionary.country,
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
        
        // 다음 인덱스로 이동
        this.currentIndex = (this.currentIndex + 1) % this.missionaries.length;
    }

    // 현재 팝업 닫기
    closeCurrentPopup() {
        const existingPopup = document.querySelector('.minimal-prayer-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    // 국기 URL 생성
    getFlagUrl(country) {
        const flagCode = window.MissionaryMap?.constants?.COUNTRY_FLAGS?.[country];
        return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : '';
    }

    // 말풍선 위치 설정 (마커 위에 표시)
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
        const tailHeight = 12; // CSS에서 설정한 꼬리 높이
        const tailLeftOffset = 40; // 꼬리표가 왼쪽에서 40px 지점에 위치 (30px + 10px 중심)

        // 말풍선 위치 설정 (꼬리 끝이 마커에 위치하도록 계산)
        // 꼬리표가 하단 왼쪽에 있으므로, 마커 위치에서 꼬리 오프셋만큼 왼쪽으로 이동
        popupElement.style.position = 'absolute';
        popupElement.style.left = (point.x - tailLeftOffset) + 'px';
        popupElement.style.top = (point.y - popupHeight - tailHeight) + 'px';
        popupElement.style.zIndex = '9999';
        
        // 말풍선이 화면 밖으로 나가지 않도록 조정
        const rect = popupElement.getBoundingClientRect();
        const mapRect = document.getElementById('map').getBoundingClientRect();
        
        // 왼쪽 경계 체크
        if (rect.left < mapRect.left + 10) {
            popupElement.style.left = (mapRect.left + 10) + 'px';
        }
        
        // 오른쪽 경계 체크
        if (rect.right > mapRect.right - 10) {
            popupElement.style.left = (mapRect.right - rect.width - 10) + 'px';
        }
        
        // 위쪽 경계 체크
        if (rect.top < mapRect.top + 10) {
            popupElement.style.top = (mapRect.top + 10) + 'px';
        }
        
        // 아래쪽 경계 체크
        if (rect.bottom > mapRect.bottom - 10) {
            popupElement.style.top = (mapRect.bottom - rect.height - 10) + 'px';
        }
    }

    // 순회 일시정지
    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            // 마우스 오버 시에는 현재 팝업을 유지하고 순환만 중지
        }
    }

    // 순회 재개
    resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            
            // 현재 팝업을 유지하고 4초 후부터 다음 팝업 표시
            this.interval = setInterval(() => {
                this.showNextPrayerPopup();
            }, 4000);
        }
    }

    // 순회 상태 확인
    isActive() {
        return this.isRunning && !this.isPaused;
    }
}

// 전역 순회 관리자 인스턴스
window.floatingPrayerManager = new FloatingPrayerManager();

// 시안 A: 미니멀 카드 스타일의 기도 팝업 생성
function createMinimalPrayerPopup({ flagUrl, name, country, missionary }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'minimal-prayer-popup';
    
    // 우선 기존 summary(로컬/RealtimeDB)로 초기화
    let prayer = getMissionaryPrayerTopic(name);
    
    wrapper.innerHTML = `
        <div class="close-button" title="기도 팝업 닫기">×</div>
        <div class="profile-section">
            <div class="profile-image-container">
                <img src="${flagUrl}" alt="국기" class="popup-flag">
            </div>
            <div class="name-info">
                <span class="popup-name">${name}</span>
                <span class="popup-country">${country}</span>
            </div>
        </div>
        <div class="prayer-content">
            <div class="prayer-title">기도 요청</div>
            <div class="popup-prayer">${prayer}</div>
            <div class="prayer-icon clickable-prayer-icon" title="기도에 동참하기">🙏</div>
        </div>
    `;

    // Firestore에서 missionaryName으로 최신 뉴스레터 summary 가져오기
    if (window.firebase && window.firebase.firestore) {
        try {
            window.firebase.firestore()
                .collection('newsletters')
                .where('missionaryName', '==', name)
                .orderBy('date', 'desc')
                .limit(1)
                .get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        const doc = snapshot.docs[0];
                        const data = doc.data();
                        if (data.summary && data.summary.trim() !== '') {
                            const summary = data.summary.length > 60 ? data.summary.substring(0, 60) + '...' : data.summary;
                            const prayerElem = wrapper.querySelector('.popup-prayer');
                            if (prayerElem) prayerElem.textContent = summary;
                        }
                    }
                })
                .catch(err => {
                    console.warn('Firestore summary fetch error:', err);
                });
        } catch (e) {
            console.warn('Firestore summary fetch exception:', e);
        }
    }
    
    // 마우스 오버/아웃 이벤트 추가 (순환 제어)
    wrapper.addEventListener('mouseenter', () => {
        if (window.floatingPrayerManager) {
            window.floatingPrayerManager.pause();
        }
    });
    
    wrapper.addEventListener('mouseleave', () => {
        if (window.floatingPrayerManager) {
            window.floatingPrayerManager.resume();
        }
    });
    
    // 닫기 버튼 클릭 이벤트 추가
    const closeButton = wrapper.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 팝업 닫기 애니메이션
            wrapper.style.animation = 'minimal-fade-out 0.3s ease-out forwards';
            
            setTimeout(() => {
                if (window.floatingPrayerManager) {
                    window.floatingPrayerManager.closeCurrentPopup();
                    
                    // 닫기 버튼 클릭 시 항상 순환 재시작
                    if (window.floatingPrayerManager.isRunning) {
                        // 일시정지 상태 해제 후 순환 재개
                        window.floatingPrayerManager.isPaused = false;
                        
                        // 즉시 다음 팝업 표시
                        window.floatingPrayerManager.showNextPrayerPopup();
                        
                        // 4초마다 순환하는 인터벌 재시작
                        if (window.floatingPrayerManager.interval) {
                            clearInterval(window.floatingPrayerManager.interval);
                        }
                        window.floatingPrayerManager.interval = setInterval(() => {
                            window.floatingPrayerManager.showNextPrayerPopup();
                        }, 4000);
                        
                        console.log('닫기 버튼 클릭으로 기도 팝업 순환 재시작');
                    }
                }
            }, 300);
        });
    }
    
    // 기도손 클릭 이벤트 추가
    const prayerIcon = wrapper.querySelector('.prayer-icon');
    if (prayerIcon) {
        prayerIcon.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 클릭 피드백 효과
            prayerIcon.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                prayerIcon.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 150);
            
            // 선교사 데이터 생성
            const missionaryData = {
                name: name,
                country: country,
                city: missionary && missionary.city ? missionary.city : '',
                flagUrl: flagUrl
            };
            
            // 기도 클릭 처리
            if (window.handlePrayerClick) {
                try {
                    // 로딩 상태 표시
                    prayerIcon.style.opacity = '0.7';
                    prayerIcon.style.pointerEvents = 'none';
                    
                    const success = await window.handlePrayerClick(missionaryData);
                    if (success) {
                        // 기도 안내 팝업 표시
                        showPrayerNotification(name);
                        
                        // 성공 피드백 - 초록 그라디언트 유지하면서 밝기만 조정
                        prayerIcon.style.filter = 'brightness(1.3) saturate(1.2)';
                        prayerIcon.style.transform = 'translate(-50%, -50%) scale(1.15)';
                        
                        setTimeout(() => {
                            prayerIcon.style.filter = 'none';
                            prayerIcon.style.transform = 'translate(-50%, -50%) scale(1)';
                        }, 1000);
                    } else {
                        // 실패 피드백 - 살짝 어둡게 표시
                        prayerIcon.style.filter = 'brightness(0.7) saturate(0.8)';
                        prayerIcon.style.transform = 'translate(-50%, -50%) scale(0.95)';
                        
                        setTimeout(() => {
                            prayerIcon.style.filter = 'none';
                            prayerIcon.style.transform = 'translate(-50%, -50%) scale(1)';
                        }, 1000);
                    }
                } catch (error) {
                    console.error('기도 클릭 처리 중 오류:', error);
                    
                    // 오류 피드백 - 살짝 어둡게 표시
                    prayerIcon.style.filter = 'brightness(0.7) saturate(0.8)';
                    prayerIcon.style.transform = 'translate(-50%, -50%) scale(0.95)';
                    
                    setTimeout(() => {
                        prayerIcon.style.filter = 'none';
                        prayerIcon.style.transform = 'translate(-50%, -50%) scale(1)';
                    }, 1000);
                } finally {
                    // 로딩 상태 해제
                    prayerIcon.style.opacity = '1';
                    prayerIcon.style.pointerEvents = 'auto';
                }
            } else {
                console.warn('PrayerClick 모듈이 로드되지 않았습니다.');
                
                // 모듈 없음 피드백 - 회색으로 표시
                prayerIcon.style.filter = 'grayscale(1) brightness(0.8)';
                prayerIcon.style.transform = 'translate(-50%, -50%) scale(0.95)';
                
                setTimeout(() => {
                    prayerIcon.style.filter = 'none';
                    prayerIcon.style.transform = 'translate(-50%, -50%) scale(1)';
                }, 1000);
            }
        });
    }
    
    return wrapper;
}

// 선교사 이름으로 기도제목 가져오기 (실시간 데이터 사용)
function getMissionaryPrayerTopic(missionaryName) {
    // 전역 선교사 데이터에서 찾기
    if (window.MissionaryMap?.state?.missionaries) {
        const missionary = window.MissionaryMap.state.missionaries.find(m => 
            m.name && m.name.trim() === missionaryName.trim()
        );
        
        if (missionary) {
            // 최신 뉴스레터 요약이 있으면 사용, 없으면 기본 기도제목 사용
            if (missionary.summary && missionary.summary.trim() !== '') {
                return missionary.summary.length > 60 ? 
                    missionary.summary.substring(0, 60) + '...' : 
                    missionary.summary;
            } else if (missionary.prayerTopic && missionary.prayerTopic.trim() !== '') {
                return missionary.prayerTopic.length > 60 ? 
                    missionary.prayerTopic.substring(0, 60) + '...' : 
                    missionary.prayerTopic;
            }
        }
    }
    
    // 데이터를 찾을 수 없는 경우 기본 메시지
    return '하나님의 인도하심과 사역의 열매를 위해 기도해 주세요.';
}

// 기도 안내 팝업 큐 관리
let prayerNotificationQueue = [];
let isProcessingQueue = false;

// 기도 안내 팝업 표시 함수 (큐 시스템 적용)
function showPrayerNotification(missionaryName) {
    // 큐에 추가
    prayerNotificationQueue.push(missionaryName);
    
    // 큐 처리 시작
    if (!isProcessingQueue) {
        processNotificationQueue();
    }
}

// 기도 안내 팝업 큐 처리
function processNotificationQueue() {
    if (prayerNotificationQueue.length === 0) {
        isProcessingQueue = false;
        return;
    }
    
    isProcessingQueue = true;
    const missionaryName = prayerNotificationQueue.shift();
    
    const notification = document.getElementById('prayer-notification');
    const messageElement = notification?.querySelector('.prayer-message');
    
    if (!notification || !messageElement) {
        console.warn('기도 안내 팝업 요소를 찾을 수 없습니다.');
        // 다음 큐 처리
        setTimeout(() => processNotificationQueue(), 100);
        return;
    }
    
    // 메시지 설정
    messageElement.textContent = `${missionaryName} 선교사님을 위해 기도합니다!`;
    
    // 기존 타이머가 있으면 제거
    if (notification.hideTimer) {
        clearTimeout(notification.hideTimer);
    }
    
    // 팝업 표시
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    // 1.5초 후 자동 숨김 (빠른 순환을 위해 시간 단축)
    notification.hideTimer = setTimeout(() => {
        hidePrayerNotification();
        // 0.3초 후 다음 큐 처리
        setTimeout(() => processNotificationQueue(), 300);
    }, 1500);
}

// 기도 안내 팝업 숨김 함수
function hidePrayerNotification() {
    const notification = document.getElementById('prayer-notification');
    if (notification) {
        notification.classList.remove('show');
        notification.classList.add('hidden');
        
        // 타이머 정리
        if (notification.hideTimer) {
            clearTimeout(notification.hideTimer);
            notification.hideTimer = null;
        }
    }
}

// 기도 안내 팝업 큐 상태 확인
function getPrayerNotificationQueueStatus() {
    return {
        queueLength: prayerNotificationQueue.length,
        isProcessing: isProcessingQueue,
        currentQueue: [...prayerNotificationQueue]
    };
}

// 기도 안내 팝업 큐 초기화
function clearPrayerNotificationQueue() {
    prayerNotificationQueue = [];
    isProcessingQueue = false;
    hidePrayerNotification();
    
}

// 전역 함수로 등록
window.createMinimalPrayerPopup = createMinimalPrayerPopup;
window.createFloatingListPopup = createFloatingListPopup;
window.createFloatingNamePopup = createFloatingNamePopup;
window.closeFloatingPopup = closeFloatingPopup;
window.showMissionaryDetail = showMissionaryDetail;
window.getMissionaryPrayerTopic = getMissionaryPrayerTopic;
window.showPrayerNotification = showPrayerNotification;
window.hidePrayerNotification = hidePrayerNotification;
window.getPrayerNotificationQueueStatus = getPrayerNotificationQueueStatus;
window.clearPrayerNotificationQueue = clearPrayerNotificationQueue;

// 기도 팝업 순회 관련 전역 함수들 (새로운 어댑터가 자동으로 대체)
window.startPrayerRotation = () => window.floatingPrayerManager.startRotation();
window.stopPrayerRotation = () => window.floatingPrayerManager.stopRotation();
window.isPrayerRotationActive = () => window.floatingPrayerManager.isActive();

// 새로운 기도 팝업 모듈 활성화 (어댑터가 자동으로 처리)
console.log('기존 기도 팝업 시스템 로드됨 - 새로운 모듈과 호환됨'); 