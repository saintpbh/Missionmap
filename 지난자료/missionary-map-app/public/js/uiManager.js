// public/js/uiManager.js
const UIManager = {
    elements: {},
    
    // DOM 요소들을 지연 로딩으로 초기화
    initElements() {
        this.elements = {
            mapContainer: document.getElementById('map'),
            detailPopup: document.getElementById('detailPopup'),
            detailPopupContainer: document.getElementById('detailPopupContainer'),
            titleLogo: document.getElementById('titleLogo'),
            countryTable: document.getElementById('missionary-table-country'),
            presbyteryTable: document.getElementById('missionary-table-presbytery'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
            countryExitBtn: document.getElementById('country-exit-btn'),
            presbyteryExitBtn: document.getElementById('presbytery-exit-btn'),
            sidebarPanel: document.getElementById('sidebar-panel'),
            sidebarOverlay: document.getElementById('sidebar-overlay'),
            sidebarTitle: document.getElementById('sidebar-title'),
            sidebarList: document.getElementById('sidebar-list'),
            sidebarClose: document.querySelector('.sidebar-close'),
            sidebarSearch: document.querySelector('.sidebar-search sl-input'),
        };
        
        console.log('UIManager 요소 초기화 완료:', this.elements);
        
        // 중요한 요소들의 존재 여부 확인
        const criticalElements = ['mapContainer', 'detailPopup'];
        criticalElements.forEach(elementName => {
            if (!this.elements[elementName]) {
                console.error(`중요한 요소를 찾을 수 없습니다: ${elementName}`);
            }
        });
    },
    
    // 이 UI 매니저를 초기화하고 필요한 참조를 설정합니다.
    initialize(mapController, dataManager) {
        this.initElements(); // DOM 요소 초기화
        this.mapController = mapController;
        this.dataManager = dataManager;
        console.log('UIManager 초기화 완료');
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
        console.log('UIManager: renderGlobalMarkers 시작');
        this.mapController.clearMarkers('global');
        const countryStats = this.dataManager.getCountryStats();
        const autoplayMode = this.mapController.state.autoplayMode;

        console.log('UIManager: 국가 통계:', Object.keys(countryStats).length, '개국');

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
                
                // 선교사 ID를 data 속성에 추가 (마커 매핑용)
                const missionaryId = info._id || `missionary_${name}`;
                popupHTML += `<div class="${entryClass}" data-name="${name}" data-missionary-id="${missionaryId}" style="cursor: pointer;"><div class="missionary-name">${name}${recentIcon}</div></div>`;
            });

            const marker = L.marker(latlng).bindPopup(popupHTML);

            // DataManager에 마커-데이터 매핑 등록
            stats.names.forEach(name => {
                const missionary = this.dataManager.getMissionaryInfo(name);
                if (missionary && missionary._id) {
                    this.dataManager.linkMarkerToMissionary(marker, missionary);
                }
            });

            // 팝업 오픈 후 이벤트 리스너 추가
            marker.on('popupopen', (e) => {
                // 선교사 이름 클릭 이벤트 추가
                const popup = e.popup;
                const popupContent = popup.getElement();
                if (popupContent) {
                    const nameElements = popupContent.querySelectorAll('[data-name]');
                    nameElements.forEach(el => {
                        el.style.cursor = 'pointer';
                        el.addEventListener('click', (clickEvent) => {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                            const name = el.dataset.name;
                            console.log('선교사 이름 클릭:', name);
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

            // 마커를 직접 지도에 추가 (클러스터 사용 안함)
            marker.addTo(this.mapController.map);
            return marker;
        });

        this.mapController.setMarkers('global', newMarkers);
        
        console.log('UIManager: renderGlobalMarkers 완료, 마커 수:', newMarkers.length);
    },
    
    showDetailPopup(name, latlngArray) {
        // 모바일: Swiper 기반 카드 UI로 전환
        if (window.innerWidth <= 600 && window.showMobileMissionarySwiper) {
            // 최근 소식 순 정렬(내림차순)
            const missionaries = DataManager.state.missionaries.slice().sort((a, b) => {
                const dateA = new Date(a.lastUpdate || 0);
                const dateB = new Date(b.lastUpdate || 0);
                return dateB - dateA;
            });
            window.showMobileMissionarySwiper(missionaries);
            return;
        }
        // 데스크탑: 기존 모던 팝업
        this.showModernDetailPopup(name, latlngArray);
    },

    showModernDetailPopup(name, latlngArray) {
        // elements 객체에서 필요한 요소들 가져오기
        if (!this.elements.detailPopup) {
            console.error('detailPopup 요소가 초기화되지 않았습니다. DOM이 로드되지 않았을 수 있습니다.');
            // 폴백으로 다시 시도
            this.elements.detailPopup = document.getElementById('detailPopup');
            if (!this.elements.detailPopup) {
                console.error('detailPopup 요소를 찾을 수 없습니다. 기존 방식으로 폴백합니다.');
                this.showLegacyDetailPopup(name, latlngArray);
                return;
            }
        }
        
        const elements = {
            detailPopup: this.elements.detailPopup,
            mapContainer: this.elements.mapContainer,
        };
        
        const missionaryInfo = this.dataManager.state.missionaryInfo;
        
        // 새로운 detailPopup 모듈 사용
        if (window.showDetailPopup) {
            window.showDetailPopup(name, latlngArray, missionaryInfo, elements);
        } else {
            // 폴백: 기존 방식 사용
            console.warn('showDetailPopup 함수가 없습니다. 기존 방식으로 폴백합니다.');
            this.showLegacyDetailPopup(name, latlngArray);
        }
        
        this.mapController.state.currentDetailPopup = elements.detailPopup;
    },

    showLegacyDetailPopup(name, latlngArray) {
        this.closeDetailPopup();

        const info = this.dataManager.getMissionaryInfo(name) || {};
        const card = document.createElement('sl-card');
        card.className = 'detail-popup-card fancy';
        
        // 사이드바가 열려있으면 위치 조정
        const isSidebarOpen = this.elements.sidebarPanel.classList.contains('open');
        if (isSidebarOpen) {
            this.elements.detailPopupContainer.classList.add('sidebar-positioned');
        } else {
            this.elements.detailPopupContainer.classList.remove('sidebar-positioned');
        }

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
            const popup = this.elements.detailPopup;
            if (popup) {
                // 부드러운 사라짐 애니메이션을 위해 클래스 제거
                popup.classList.remove('visible');
                // 애니메이션이 끝난 후 display: none 처리 (선택사항, CSS에서 처리 가능)
            }
            this.mapController.state.currentDetailPopup = null;
        }
        
        // 레거시 컨테이너에 남아있을 수 있는 자식 요소 제거
        if (this.elements.detailPopupContainer) {
            while (this.elements.detailPopupContainer.firstChild) {
                this.elements.detailPopupContainer.removeChild(this.elements.detailPopupContainer.firstChild);
            }
        }
    },

    toggleFullscreenButtons() {
        const isFullscreen = !!document.fullscreenElement;
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
            console.log('플로팅 요소 클릭:', item.name);
            this.showDetailPopup(item.name, latlng);
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
    },

    // 사이드바 관련 메서드들
    openSidebar(title, missionaries) {
        this.elements.sidebarTitle.textContent = title;
        this.renderSidebarList(missionaries);
        this.elements.sidebarPanel.classList.add('open');
        this.elements.sidebarOverlay.classList.add('show');
        
        // 이벤트 리스너 추가
        this.elements.sidebarClose.addEventListener('click', () => this.closeSidebar());
        this.elements.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        
        // 검색 기능
        if (this.elements.sidebarSearch) {
            this.elements.sidebarSearch.addEventListener('sl-input', (e) => {
                this.filterSidebarList(e.target.value, missionaries);
            });
        }
    },

    closeSidebar() {
        this.elements.sidebarPanel.classList.remove('open');
        this.elements.sidebarOverlay.classList.remove('show');
        
        // 활성 상태 제거
        document.querySelectorAll('.sidebar-missionary-item.active').forEach(item => {
            item.classList.remove('active');
        });
        
        // 검색 입력 초기화
        if (this.elements.sidebarSearch) {
            this.elements.sidebarSearch.value = '';
        }
    },

    renderSidebarList(missionaries) {
        const listHTML = missionaries.map(missionary => {
            const isRecent = window.isRecent(missionary.lastUpdate);
            const recentBadge = isRecent ? '<span class="sidebar-recent-badge">NEW</span>' : '';
            const city = missionary.city && missionary.city.trim() ? missionary.city.trim() : '';
            const location = city ? `${missionary.country} · ${city}` : missionary.country;
            const avatarText = missionary.name.charAt(0);
            
            return `
                <div class="sidebar-missionary-item" data-name="${missionary.name}">
                    <div class="sidebar-missionary-avatar">${avatarText}</div>
                    <div class="sidebar-missionary-info">
                        <div class="sidebar-missionary-name">
                            ${missionary.name}
                            ${recentBadge}
                        </div>
                        <div class="sidebar-missionary-location">
                            <sl-icon name="geo-alt-fill"></sl-icon>
                            ${location}
                        </div>
                        <div class="sidebar-missionary-org">${missionary.organization || '정보없음'}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.sidebarList.innerHTML = listHTML;
        
        // 클릭 이벤트 추가
        this.elements.sidebarList.querySelectorAll('.sidebar-missionary-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 기존 활성 상태 제거
                document.querySelectorAll('.sidebar-missionary-item.active').forEach(activeItem => {
                    activeItem.classList.remove('active');
                });
                
                // 현재 아이템 활성화
                item.classList.add('active');
                
                const name = item.dataset.name;
                const missionary = missionaries.find(m => m.name === name);
                if (missionary) {
                    const latlng = this.mapController.getLatLng(missionary, missionary.country);
                    
                    // 해당 선교사의 국가로 지도 이동
                    this.mapController.map.flyTo(latlng, Math.max(this.mapController.map.getZoom(), 6), { 
                        animate: true, 
                        duration: 1.2 
                    });
                    
                    // 지도 이동 후 상세 팝업 표시
                    setTimeout(() => {
                        console.log('[사이드바] 선교사 클릭 → 상세 팝업:', name, latlng);
                        this.showDetailPopup(name, latlng);
                    }, 600);
                }
            });
        });
    },

    filterSidebarList(searchTerm, allMissionaries) {
        const filtered = allMissionaries.filter(missionary => 
            missionary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (missionary.country && missionary.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (missionary.city && missionary.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (missionary.organization && missionary.organization.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderSidebarList(filtered);
    }
}; 