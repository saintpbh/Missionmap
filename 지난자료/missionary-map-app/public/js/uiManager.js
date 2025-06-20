// public/js/uiManager.js
const UIManager = {
    elements: {
        mapContainer: document.getElementById('map'),
        detailPopupContainer: document.getElementById('detailPopupContainer'),
        titleLogo: document.getElementById('titleLogo'),
        countryTable: document.getElementById('missionary-table-country'),
        presbyteryTable: document.getElementById('missionary-table-presbytery'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
        countryExitBtn: document.getElementById('country-exit-btn'),
    },
    
    // 이 UI 매니저를 초기화하고 필요한 참조를 설정합니다.
    initialize(mapController, dataManager) {
        this.mapController = mapController;
        this.dataManager = dataManager;
    },

    renderCountryTable() {
        const countryStats = this.dataManager.getCountryStats();
        const countries = Object.keys(countryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = countries.map(country => {
            const flagCode = this.mapController.constants.COUNTRY_FLAGS[country];
            const flagImg = flagCode ? `<img class="flag-icon" src="https://flagcdn.com/w40/${flagCode}.png" alt="">` : '';
            return `<tr>
                <td>${flagImg}</td>
                <td class="bold country-click" data-country="${country}">${country}</td>
                <td style="text-align:right;">${countryStats[country].count}</td>
            </tr>`;
        }).join('');
        this.elements.countryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">국가별 파송현황</div>
            <table><thead><tr><th></th><th>국가</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    },

    renderPresbyteryTable() {
        const presbyteryStats = this.dataManager.getPresbyteryStats();
        const presbyteries = Object.keys(presbyteryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = presbyteries.map(p => `
            <tr>
                <td class="bold presbytery-click" data-presbytery="${p}">${p}</td>
                <td style="text-align:right;">${presbyteryStats[p]}</td>
            </tr>`).join('');
        this.elements.presbyteryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">노회별 파송현황</div>
            <table><thead><tr><th>노회</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    },

    renderGlobalMarkers() {
        this.mapController.clearMarkers('global');
        const countryStats = this.dataManager.getCountryStats();
        const autoplayMode = this.mapController.state.autoplayMode;

        const newMarkers = Object.entries(countryStats).map(([country, stats]) => {
            const latlng = this.mapController.constants.LATLNGS[country] || [0, 0];
            const flag = this.mapController.constants.COUNTRY_FLAGS[country] ? `<img class='flag-icon' src='https://flagcdn.com/w40/${this.mapController.constants.COUNTRY_FLAGS[country]}.png'>` : "";

            // 팝업 내용을 HTML 문자열로 생성
            let popupHTML = `${flag}<b>${country}</b><br>`;
            
            // 선교사 이름 목록 HTML 생성
            stats.names.forEach(name => {
                const info = this.dataManager.getMissionaryInfo(name) || {};
                const isRecent = window.isRecent(info.lastUpdate);
                const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';
                const boldClass = isRecent ? ' recent-bold' : '';
                const entryClass = autoplayMode === 'fixed' ? `missionary-entry${boldClass}` : `popup-list ${boldClass}`;
                popupHTML += `<div class="${entryClass}" data-name="${name}"><div class="missionary-name">${name}${recentIcon}</div></div>`;
            });

            const marker = this.mapController.createMarker(latlng, popupHTML);
            marker.countryData = stats;

            // 팝업 오픈 후 이벤트 리스너 추가
            marker.on('popupopen', (e) => {
                // 선교사 이름 클릭 이벤트 추가
                const popup = e.popup;
                const popupContent = popup.getElement();
                if (popupContent) {
                    const nameElements = popupContent.querySelectorAll('[data-name]');
                    nameElements.forEach(el => {
                        el.addEventListener('click', (clickEvent) => {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                            const name = el.dataset.name;
                            const info = this.dataManager.getMissionaryInfo(name) || {};
                            const latlngForPopup = this.mapController.getLatLng(info, info.country);
                            this.mapController.showDetailPopup(name, latlngForPopup);
                        });
                    });
                }

                if (!this.mapController.state.isByAutoRotate) {
                    this.mapController.state.isPaused = true;
                }
                this.mapController.state.isByAutoRotate = false;
                
                if (this.mapController.state.autoplayMode === 'fixed') {
                    this.mapController.startPrayerTopicRotation(popup);
                }
            });
            marker.on('popupclose', () => {
                this.mapController.state.isPaused = false;
                this.mapController.stopPrayerTopicRotation();
            });
            return marker;
        });
        this.mapController.setMarkers('global', newMarkers);
    },
    
    showDetailPopup(name, latlngArray) {
        this.closeDetailPopup();

        const info = this.dataManager.getMissionaryInfo(name) || {};
        const card = document.createElement('sl-card');
        card.className = 'detail-popup-card fancy';

        let pdfButton = '';
        if (info.NewsLetter && info.NewsLetter.trim() !== '') {
            let newsUrl = info.NewsLetter.trim();
            if (!/^https?:\/\//.test(newsUrl)) newsUrl = `pdfs/${newsUrl}`;
            const encodedUrl = encodeURIComponent(newsUrl);
            pdfButton = `<sl-button size="small" variant="primary" pill class="newsletter-button" data-newsurl="${encodedUrl}">
                            <sl-icon slot="prefix" name="box-arrow-up-right"></sl-icon>소식지 보기
                         </sl-button>`;
        }

        const city = info.city && info.city.trim() ? info.city.trim() : '';
        const location = city ? `${info.country} · ${city}` : info.country;
        const imgSrc = info.image && info.image.trim() ? info.image.trim() : 'https://via.placeholder.com/600x280?text=Missionary';

        card.innerHTML = `
            <div class="detail-cover">
                <img src="${imgSrc}" alt="${name}" onerror="this.src='https://via.placeholder.com/600x280?text=Missionary';">
                <div class="cover-overlay">
                    <h2>${name}</h2>
                </div>
                <sl-icon-button name="x-lg" label="닫기" class="close-detail-popup"></sl-icon-button>
            </div>
            <div class="detail-popup-body">
                <div class="info-grid">
                    <div><sl-icon name="geo-alt-fill"></sl-icon> ${location}</div>
                    <div><sl-icon name="building"></sl-icon> ${info.organization || '정보없음'}</div>
                    <div><sl-icon name="calendar3"></sl-icon> ${info.dispatchDate || '정보없음'}</div>
                    <div><sl-icon name="clock-history"></sl-icon> ${info.lastUpdate || '정보없음'} ${window.isRecent(info.lastUpdate) ? '<span class="recent-badge">NEW</span>' : ''}</div>
                </div>
                <hr>
                <h3 style="margin:8px 0 6px;">기도제목</h3>
                <p class="prayer-topics">${info.prayer || '기도제목이 없습니다.'}</p>
            </div>
            <div class="detail-popup-footer">${pdfButton}</div>
        `;

        this.elements.detailPopupContainer.appendChild(card);
        this.mapController.state.currentDetailPopup = card;

        card.querySelector('.close-detail-popup').addEventListener('click', () => this.closeDetailPopup());
        const newsBtn = card.querySelector('.newsletter-button');
        if (newsBtn && window.showNewsletter) {
            newsBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                window.showNewsletter(newsBtn.dataset.newsurl);
            });
        }
        this.mapController.positionPopup(latlngArray);
    },

    closeDetailPopup() {
        if (this.mapController.state.currentDetailPopup) {
            this.mapController.state.currentDetailPopup.remove();
            this.mapController.state.currentDetailPopup = null;
        }
        this.elements.detailPopupContainer.style.display = 'none';
    },

    toggleFullscreenButtons() {
        const isFullscreen = document.fullscreenElement !== null;
        this.elements.fullscreenBtn.classList.toggle('hidden', isFullscreen);
        this.elements.exitFullscreenBtn.classList.toggle('hidden', !isFullscreen);
    },

    createFloatingElement(item, point, extraClass = '') {
        const floatingEl = document.createElement('div');
        floatingEl.className = `floating-missionary ${extraClass}`;
        
        const prayerTopic = item.prayer || '현지 정착과 건강을 위해 기도해주세요.';
        const isRecent = window.isRecent(item.lastUpdate);
        const recentClass = isRecent ? 'recent' : '';

        const latlng = this.mapController.getLatLng(item, item.country);

        const contentEl = document.createElement('div');
        contentEl.className = `floating-missionary-content ${recentClass}`;
        contentEl.style.pointerEvents = 'all';
        contentEl.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/128/149/149071.png" alt="icon">
            <div>
                <div class="name">${item.name}</div>
                <div class="prayer">${prayerTopic}</div>
            </div>
        `;
        contentEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.mapController.showDetailPopup(item.name, latlng);
        });

        floatingEl.appendChild(contentEl);
        floatingEl.style.left = `${point.x - 80}px`;
        floatingEl.style.top = `${point.y - 40}px`;

        this.elements.mapContainer.appendChild(floatingEl);
        return floatingEl;
    },

    animateFloatingElement(element, duration) {
        element.style.animation = `floatUpAndFade ${duration / 1000}s ease-out forwards`;
        setTimeout(() => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, duration);
    }
}; 