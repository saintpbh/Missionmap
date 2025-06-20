// missionaryMap.js
const MissionaryMap = {
    // ===== 상태 및 설정 =====
    state: {
        isPaused: false,
        isAnimOn: true,
        isByAutoRotate: false,
        fixedCountry: null,
        globalMarkerIndex: 0,
        currentDetailPopup: null, // UIManager가 관리하지만, 상태는 여기서 추적
        autoplayMode: 'fixed', // 'pan' or 'fixed'
    },
    map: null,
    globalMarkers: [],
    fixedCountryMarkers: [],
    timers: {
        floating: null,
        rotation: null,
        prayerTopicRotation: null
    },
    constants: {
        FLOAT_COUNT: 1,
        FLOAT_DISPLAY_TIME: 3000,
        FLOAT_INTERVAL: 3500,
        PRESBYTERY_FLOAT_DURATION: 5000,
        PRESBYTERY_PAUSE_EXTRA: 7000,
        POPUP_ROTATE_INTERVAL: 8000,
        LATLNGS: {
            "일본": [36.2048, 138.2529], "중국": [35.8617, 104.1954], "대만": [23.6978, 120.9605], "몽골": [46.8625, 103.8467], "러시아": [61.5240, 105.3188],
            "필리핀": [12.8797, 121.7740], "태국": [15.8700, 100.9925], "캄보디아": [12.5657, 104.9910], "라오스": [19.8563, 102.4955], "인도": [20.5937, 78.9629],
            "인도네시아": [-0.7893, 113.9213], "파키스탄": [30.3753, 69.3451], "동티모르": [-8.8742, 125.7275], "네팔": [28.3949, 84.1240], "말레이시아": [4.2105, 101.9758],
            "뉴질랜드": [-40.9006, 174.8860], "호주": [-25.2744, 133.7751], "이스라엘": [31.0461, 34.8516], "독일": [51.1657, 10.4515], "헝가리": [47.1625, 19.5033],
            "불가리아": [42.7339, 25.4858], "부르키나파소": [12.2383, -1.5616], "케냐": [0.0236, 37.9062], "모리타니": [21.0079, -10.9408], "라이베리아": [6.4281, -9.4295],
            "말라위": [-13.2543, 34.3015], "우간다": [1.3733, 32.2903], "미국": [37.0902, -95.7129], "쿠바": [21.5218, -77.7812]
        },
        COUNTRY_FLAGS: {
            "일본": "jp", "중국": "cn", "대만": "tw", "몽골": "mn", "러시아": "ru", "필리핀": "ph", "태국": "th", "캄보디아": "kh", "라오스": "la", "인도": "in",
            "인도네시아": "id", "파키스탄": "pk", "동티모르": "tl", "네팔": "np", "말레이시아": "my", "뉴질랜드": "nz", "호주": "au", "이스라엘": "il", "독일": "de",
            "헝가리": "hu", "불가리아": "bg", "부르키나파소": "bf", "케냐": "ke", "모리타니": "mr", "라이베리아": "lr", "말라위": "mw", "우간다": "ug", "미국": "us", "쿠바": "cu"
        }
    },

    // === 초기화 ===
    init() {
        this.state.autoplayMode = localStorage.getItem('autoplay-mode') || 'fixed';
        UIManager.initialize(this, DataManager);
        this.initMap();
        this.initEventListeners();
        
        DataManager.fetchData((err) => {
            if (!err) {
                this.renderAll();
                this.startIntervals();
            }
        });
    },

    initMap() {
        this.map = L.map(UIManager.elements.mapContainer, {
            zoomControl: false
        }).setView([12.2383, -1.5616], 3);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);
        
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        const legend = L.control({position: 'topright'});
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-legend-box');
            div.innerHTML = `<span class="legend-news">📰✨</span> <span>최근 2개월 소식</span>`;
            return div;
        };
        legend.addTo(this.map);
    },

    initEventListeners() {
        UIManager.elements.titleLogo.addEventListener('click', () => {
            this.toggleAnimation();
            if (this.map) {
                this.map.setView([12.2383, -1.5616], 3, {animate: true});
            }
        });
        UIManager.elements.countryTable.addEventListener('click', (e) => {
            const countryCell = e.target.closest('.country-click');
            if (countryCell) {
                e.stopPropagation();
                this.enterFixedCountryMode(countryCell.dataset.country);
            }
        });
        UIManager.elements.presbyteryTable.addEventListener('click', (e) => {
            const presbyteryCell = e.target.closest('.presbytery-click');
            if (presbyteryCell) {
                e.stopPropagation();
                this.showPresbyteryPopups(presbyteryCell.dataset.presbytery);
            }
        });
        this.map.on('click', () => { 
            if (this.state.currentDetailPopup) {
                UIManager.closeDetailPopup();
            } else if (!this.state.fixedCountry) {
                this.restoreGlobalMode(); 
            }
        });
        this.map.on('zoomend moveend', () => { if (this.state.fixedCountry) this.repositionFixedPopups(); });
        UIManager.elements.countryExitBtn.addEventListener('click', () => this.restoreGlobalMode());
        UIManager.elements.fullscreenBtn.addEventListener('click', () => document.documentElement.requestFullscreen());
        UIManager.elements.exitFullscreenBtn.addEventListener('click', () => document.exitFullscreen());
        document.addEventListener('fullscreenchange', () => UIManager.toggleFullscreenButtons());
    },

    renderAll() {
        this.stopPrayerTopicRotation();
        UIManager.renderCountryTable();
        UIManager.renderPresbyteryTable();
        UIManager.renderGlobalMarkers();
    },

    startIntervals() {
        this.timers.floating = setInterval(() => this.showFloatingMissionaries(), this.constants.FLOAT_INTERVAL);
        this.timers.rotation = setInterval(() => this.rotateGlobalPopups(), this.constants.POPUP_ROTATE_INTERVAL);
    },

    showDetailPopup(name, latlngArray) {
        UIManager.showDetailPopup(name, latlngArray);
    },

    closeDetailPopup() {
        UIManager.closeDetailPopup();
    },
    
    createMarker(latlng, popupContent) {
        const marker = L.marker(latlng).bindPopup(popupContent);
        marker.addTo(this.map);
        return marker;
    },

    clearMarkers(type) {
        const markers = type === 'global' ? this.globalMarkers : this.fixedCountryMarkers;
        
        // 마커 클러스터 레이어 제거
        this.map.eachLayer((layer) => {
            if (layer instanceof L.MarkerClusterGroup) {
                this.map.removeLayer(layer);
            }
        });
        
        // 개별 마커 제거
        markers.forEach(m => {
            if (this.map.hasLayer(m)) {
                this.map.removeLayer(m);
            }
        });
        
        if (type === 'global') {
            this.globalMarkers = [];
        } else {
            this.fixedCountryMarkers = [];
        }
    },

    setMarkers(type, markers) {
        if (type === 'global') {
            this.globalMarkers = markers;
        } else {
            this.fixedCountryMarkers = markers;
        }
    },

    positionPopup(latlngArray) {
        if (!this.state.currentDetailPopup) return;
        const popupEl = UIManager.elements.detailPopupContainer;
        /* 위치 계산은 CSS에서 중앙 고정으로 처리하므로, 표시 여부만 제어 */
        popupEl.style.display = 'block';
    },

    showFloatingMissionaries() {
        if (this.state.isPaused || !this.state.isAnimOn || this.state.fixedCountry) return;

        // 기존 플로팅 요소 제거 (한 번에 하나만 표시)
        document.querySelectorAll('.floating-missionary').forEach(el => el.remove());

        const missionaries = DataManager.state.missionaries;
        if (missionaries.length === 0) return;

        for (let i = 0; i < this.constants.FLOAT_COUNT; i++) {
            const randomIndex = Math.floor(Math.random() * missionaries.length);
            const item = missionaries[randomIndex];
            const latlng = this.getLatLng(item, item.country);
            if (this.map.getBounds().contains(latlng)) {
                const point = this.map.latLngToContainerPoint(latlng);
                const element = UIManager.createFloatingElement(item, point);
                UIManager.animateFloatingElement(element, this.constants.FLOAT_DISPLAY_TIME);
            }
        }
    },

    showPresbyteryPopups(presbytery) {
        if (this.state.isPaused || !this.state.isAnimOn) this.toggleAnimation();
        this.state.isPaused = true;
        
        const members = DataManager.getPresbyteryMembers(presbytery);
        if (!members || members.length === 0) {
            this.state.isPaused = false;
            return;
        }

        let memberIndex = 0;
        const showNext = () => {
            if (memberIndex >= members.length || !this.state.isPaused) {
                this.state.isPaused = false;
                return;
            }
            const member = members[memberIndex];
            const latlng = this.getLatLng(member, member.country);
            
            this.map.flyTo(latlng, this.map.getZoom() < 5 ? 5 : this.map.getZoom(), { duration: 1 });
            
            setTimeout(() => {
                const point = this.map.latLngToContainerPoint(latlng);
                const element = UIManager.createFloatingElement(member, point, 'presbytery-float');
                UIManager.animateFloatingElement(element, this.constants.PRESBYTERY_FLOAT_DURATION);
            }, 1000);
            
            memberIndex++;
            setTimeout(showNext, this.constants.PRESBYTERY_FLOAT_DURATION);
        };
        showNext();

        setTimeout(() => { 
            if (this.state.isPaused) this.state.isPaused = false; 
        }, members.length * this.constants.PRESBYTERY_FLOAT_DURATION + this.constants.PRESBYTERY_PAUSE_EXTRA);
    },

    rotateGlobalPopups() {
        if (this.state.isPaused || !this.state.isAnimOn || this.state.fixedCountry || this.globalMarkers.length === 0) return;
        
        this.state.isByAutoRotate = true;
        
        const currentMarker = this.globalMarkers[this.state.globalMarkerIndex];
        if (currentMarker && currentMarker.isPopupOpen()) {
            currentMarker.closePopup();
        }
        
        // 1. 기도제목 플로팅 팝업 표시
        const countryData = this.globalMarkers[this.state.globalMarkerIndex].countryData;
        if (countryData && countryData.names.length > 0) {
            const randomMissionaryName = countryData.names[Math.floor(Math.random() * countryData.names.length)];
            const missionaryInfo = DataManager.getMissionaryInfo(randomMissionaryName);
            if(missionaryInfo) {
                const latlng = this.getLatLng(missionaryInfo, missionaryInfo.country);
                if (this.map.getBounds().contains(latlng)) {
                    const point = this.map.latLngToContainerPoint(latlng);
                    const element = UIManager.createFloatingElement(missionaryInfo, point);
                    element.style.opacity = '1';
                    setTimeout(() => {
                        if (element && element.parentNode) {
                            element.style.opacity = '0';
                            setTimeout(() => element.remove(), 500);
                        }
                    }, this.constants.FLOAT_DISPLAY_TIME);
                }
            }
        }

        this.state.globalMarkerIndex = (this.state.globalMarkerIndex + 1) % this.globalMarkers.length;
        const nextMarker = this.globalMarkers[this.state.globalMarkerIndex];

        // 2. 잠시 후 국가 명단 팝업 표시
        const popupDelay = this.constants.FLOAT_DISPLAY_TIME + 500;
        setTimeout(() => {
            if (!this.state.fixedCountry && this.state.isAnimOn && !this.state.isPaused) {
                if (this.state.autoplayMode !== 'fixed') {
                    this.map.panTo(nextMarker.getLatLng(), { animate: true, duration: 1 });
                }
                const panDelay = this.state.autoplayMode === 'fixed' ? 100 : 1000;
                setTimeout(() => {
                    if (!this.state.fixedCountry) {
                        this.stopPrayerTopicRotation();
                        nextMarker.openPopup();
                    }
                }, panDelay);
            }
        }, popupDelay);
    },

    enterFixedCountryMode(country) {
        if (!country) return;
        this.stopPrayerTopicRotation();
        this.state.isPaused = true;
        this.state.fixedCountry = country;
        
        UIManager.elements.countryExitBtn.classList.add('visible');
        
        this.clearMarkers('global');
        this.clearMarkers('fixed');
        
        const countryData = DataManager.getCountryStats()[country];
        if (!countryData) return;

        // 마커 클러스터 그룹 생성 (겹침 방지)
        const markerCluster = L.markerClusterGroup({
            disableClusteringAtZoom: 10, // 줌 레벨 10 이상에서는 클러스터링 해제
            maxClusterRadius: 50, // 클러스터 반경 축소
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });

        const fixedMarkers = [];
        countryData.names.forEach(name => {
            const missionary = DataManager.getMissionaryInfo(name);
            const latlng = this.getLatLng(missionary, country);
            const marker = this.createFixedMarker(missionary, latlng);
            
            // 마커 위에 선교사 이름을 툴팁으로 표시 (항상 보이게)
            marker.bindTooltip(name, {
                permanent: true,
                direction: 'top',
                offset: [0, -10],
                className: 'missionary-name-tooltip'
            });
            
            markerCluster.addLayer(marker);
            fixedMarkers.push(marker);
        });
        
        this.map.addLayer(markerCluster);
        this.setMarkers('fixed', fixedMarkers);

        // 해당 국가 중심으로 줌 레벨 6으로 확대
        const countryLatlng = this.constants.LATLNGS[country];
        if (countryLatlng) {
            this.map.setView(countryLatlng, 6, { animate: true, duration: 1 });
        } else if (fixedMarkers.length > 0) {
            const group = new L.featureGroup(fixedMarkers);
            this.map.fitBounds(group.getBounds().pad(0.3));
            this.map.setZoom(Math.min(this.map.getZoom(), 6));
        }
    },
    
    repositionFixedPopups() {
        if (this.state.currentDetailPopup) {
            const nameEl = this.state.currentDetailPopup.querySelector('.cover-overlay h2');
            if (!nameEl) return;
            const name = nameEl.textContent.replace(' 선교사', '').trim();
            const info = DataManager.getMissionaryInfo(name);
            if (info) {
                const latlng = this.getLatLng(info, info.country);
                this.positionPopup(latlng);
            }
        }
    },

    createFixedMarker(missionary, latlng) {
        const marker = L.marker(latlng, { title: missionary.name });
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            this.showDetailPopup(missionary.name, latlng);
        });
        
        // 툴팁 클릭 이벤트 추가 (이름 클릭 시 상세정보 표시)
        marker.on('tooltipopen', (e) => {
            const tooltipEl = e.tooltip.getElement();
            if (tooltipEl) {
                tooltipEl.addEventListener('click', (clickEvent) => {
                    clickEvent.stopPropagation();
                    this.showDetailPopup(missionary.name, latlng);
                });
                tooltipEl.style.cursor = 'pointer';
            }
        });
        
        marker.addTo(this.map);
        return marker;
    },

    restoreGlobalMode() {
        this.stopPrayerTopicRotation();
        this.state.fixedCountry = null;
        this.state.isPaused = false;
        this.state.isByAutoRotate = false;

        UIManager.closeDetailPopup();
        UIManager.elements.countryExitBtn.classList.remove('visible');

        this.clearMarkers('fixed');
        UIManager.renderGlobalMarkers();

        // 부르키나파소 중심으로 줌아웃
        const bfLatLng = this.constants.LATLNGS['부르키나파소'] || [12.2383, -1.5616];
        this.map.setView(bfLatLng, 3, { animate: true, duration: 1 });
    },

    toggleAnimation() {
        this.state.isAnimOn = !this.state.isAnimOn;
        const logo = UIManager.elements.titleLogo.querySelector('img');
        if (logo) {
            logo.style.animation = this.state.isAnimOn ? 'logo-glow 2s infinite' : 'none';
        }
    },

    getLatLng(item, country) {
        if (item && item.lat && item.lng) {
            return [parseFloat(item.lat), parseFloat(item.lng)];
        }
        return this.constants.LATLNGS[country] || [0, 0];
    },

    isRecent(updateDate) {
        return window.isRecent(updateDate);
    },

    setAutoplayMode(mode) {
        this.state.autoplayMode = mode;
        this.renderAll();
    },

    startPrayerTopicRotation(popup) {
        this.stopPrayerTopicRotation();

        const entryElements = popup.getContent().querySelectorAll('.missionary-entry');
        if (entryElements.length === 0) return;

        let currentIndex = 0;

        const rotate = () => {
            entryElements.forEach((entry, index) => {
                entry.classList.toggle('active', index === currentIndex);
            });
            currentIndex = (currentIndex + 1) % entryElements.length;
        };

        rotate();
        this.timers.prayerTopicRotation = setInterval(rotate, this.constants.POPUP_ROTATE_INTERVAL);
    },

    stopPrayerTopicRotation() {
        if (this.timers.prayerTopicRotation) {
            clearInterval(this.timers.prayerTopicRotation);
            this.timers.prayerTopicRotation = null;
        }
    }
};

window.MissionaryMap = MissionaryMap;

document.addEventListener('DOMContentLoaded', () => {
    MissionaryMap.init();
});