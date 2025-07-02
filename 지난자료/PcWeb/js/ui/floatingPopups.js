// 플로팅 기도 팝업 생성
function createFloatingPrayerPopup({ flagUrl, name, country, prayer }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'floating-popup floating-prayer-popup';
    wrapper.innerHTML = `
        <div class="popup-header">
            <img src="${flagUrl}" alt="국기" class="popup-flag">
            <span class="popup-name">${name} <span class="popup-country">(${country})</span></span>
        </div>
        <div class="popup-prayer">${prayer}</div>
    `;
    return wrapper;
}

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
    
    // 전역 변수에서 선교사 정보 찾기
    const missionaryInfo = window.missionaryMapInstance?.state?.missionaryInfo?.[missionaryName];
    
    if (missionaryInfo) {
        // 사이드바와 동일한 방식으로 UIManager의 showDetailPopup 사용
        if (window.UIManager && window.UIManager.showDetailPopup) {
            const latlng = window.missionaryMapInstance?.getLatLng?.(missionaryInfo, missionaryInfo.country) || [0, 0];
            window.UIManager.showDetailPopup(missionaryName, latlng);
        } else {
            console.error('UIManager.showDetailPopup 함수를 찾을 수 없습니다.');
        }
    } else {
        console.error(`선교사 정보를 찾을 수 없습니다: ${missionaryName}`);
    }
}

// 전역 함수로 등록
window.createFloatingPrayerPopup = createFloatingPrayerPopup;
window.createFloatingListPopup = createFloatingListPopup;
window.createFloatingNamePopup = createFloatingNamePopup;
window.closeFloatingPopup = closeFloatingPopup;
window.showMissionaryDetail = showMissionaryDetail; 