// ui/detailPopup.js
export function showDetailPopup(name, latlng, missionaryInfo, elements) {
    const info = missionaryInfo[name] || {};
    const sentDate = info.sent_date ? new Date(info.sent_date) : null;
    const sentYear = sentDate ? sentDate.getFullYear() : '정보 없음';
    const imgSrc = info.image && info.image.trim() ? info.image.trim() : "https://via.placeholder.com/320x180.png?text=No+Photo";
    const newsUrl = info.NewsLetter ? info.NewsLetter.trim() : '';
    let prayerHtml = info.prayer || '현지 정착과 건강';
    if (newsUrl) {
        prayerHtml = `<span class="prayer-link" onclick="window.MissionaryMap.showNewsletter('${encodeURIComponent(newsUrl)}');event.stopPropagation();">${prayerHtml}</span>`;
    }
    elements.detailPopup.innerHTML = `
        <div class="close-btn">✖</div>
        <div class="popup-img-area">
            <img src="${imgSrc}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/320x180.png?text=No+Photo';">
        </div>
        <h3 style="margin-top: 10px;">${name}</h3>
        <p><strong>파송년도:</strong> ${sentYear}년</p>
        <p><strong>소속:</strong> ${info.organization || '정보 없음'}</p>
        <p><strong>기도제목:</strong> ${prayerHtml}</p>`;
    // 화면 중앙(모바일은 전체 가운데)에 위치하도록
    const popup = elements.detailPopup;
    popup.style.display = "block";
    popup.classList.add('visible');
    setTimeout(() => {
        const mapRect = elements.mapContainer.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        let x = mapRect.left + (mapRect.width - popupRect.width) / 2;
        let y = mapRect.top + (mapRect.height - popupRect.height) / 2;
        // 모바일: 화면 전체 중앙, PC: 지도의 중앙
        if (window.innerWidth < 700) {
            x = (window.innerWidth - popupRect.width) / 2;
            y = (window.innerHeight - popupRect.height) / 2;
        }
        popup.style.left = `${Math.max(10, x)}px`;
        popup.style.top = `${Math.max(10, y)}px`;
    }, 16);
}

export function closeDetailPopup(elements) {
    elements.detailPopup.classList.remove('visible');
    elements.detailPopup.style.display = "none";
}