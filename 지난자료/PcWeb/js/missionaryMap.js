// missionaryMap.js
// 주요 함수/객체를 window에 등록하는 방식으로 변환

// 의존성 함수는 window.함수명으로 접근
// 예: window.isRecent(...), window.getLatLng(...)

// 기존 import 구문 제거
// import { fetchData } from './dataFetcher.js';
// import { isRecent, getLatLng } from './utils.js';
// import { showDetailPopup, closeDetailPopup } from './ui/detailPopup.js';
// import { showNewsletter } from './ui/newsletterPopup.js';
// import { createFloatingElement, animateFloatingElement } from './ui/floatingMissionary.js';

window.MissionaryMap = class MissionaryMap {
    constructor() {
        this.state = {
            isPaused: false,
            isAnimOn: true,
            isByAutoRotate: false,
            fixedCountry: null,
            globalMarkerIndex: 0,
            missionaries: [],
            missionaryInfo: {},
            countryStats: {},
            presbyteryStats: {},
            presbyteryMembers: {},
        };
        
        this.elements = {
            mapContainer: document.getElementById('map'),
            detailPopup: document.getElementById('detailPopup'),
            titleLogo: document.getElementById('titleLogo'),
            countryTable: document.getElementById('missionary-table-country'),
            presbyteryTable: document.getElementById('missionary-table-presbytery'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
            countryExitBtn: document.getElementById('country-exit-btn'),
        };

        this.map = null;
        this.globalMarkers = [];
        this.fixedCountryMarkers = [];
        this.fixedCountryPopups = [];
        this.timers = {};

        this.constants = {
            DATA_URL: 'https://docs.google.com/spreadsheets/d/1OXDGD7a30n5C--ReXdYRoKqiYNLt9aqY5ffxYN0bZF8/export?format=csv',
            FLOAT_COUNT: 1,
            FLOAT_DISPLAY_TIME: 3000,
            FLOAT_INTERVAL: 3500,
            PRESBYTERY_FLOAT_DURATION: 5000,
            PRESBYTERY_PAUSE_EXTRA: 7000,
            POPUP_ROTATE_INTERVAL: 3000,
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
        };

        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.fetchData();
    }

    initMap() {
        this.map = L.map(this.elements.mapContainer).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.map);
        const legend = L.control({position: 'topright'});
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-legend-box');
            div.innerHTML = `<span class="legend-orange"></span> <span>최근 2개월 소식</span>`;
            return div;
        };
        legend.addTo(this.map);
    }

    initEventListeners() {
        if (this.elements.titleLogo) {
            this.elements.titleLogo.addEventListener('click', () => this.toggleAnimation());
        }
        if (this.elements.countryTable) {
            this.elements.countryTable.addEventListener('click', (e) => {
                const countryCell = e.target.closest('.country-click');
                if (countryCell) this.enterFixedCountryMode(countryCell.dataset.country);
            });
        }
        if (this.elements.presbyteryTable) {
            this.elements.presbyteryTable.addEventListener('click', (e) => {
                const presbyteryCell = e.target.closest('.presbytery-click');
                if (presbyteryCell) this.showPresbyteryPopups(presbyteryCell.dataset.presbytery);
            });
        }
        if (this.elements.detailPopup) {
            this.elements.detailPopup.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-btn')) this.closeDetailPopup();
            });
        }
        if (this.map) {
            this.map.on('click', () => { if (this.state.fixedCountry) this.restoreGlobalMode(); });
            this.map.on('zoomend moveend', () => { if (this.state.fixedCountry) this.repositionFixedPopups(); });
        }
        if (this.elements.countryExitBtn) {
            this.elements.countryExitBtn.addEventListener('click', () => this.restoreGlobalMode());
        }
        if (this.elements.fullscreenBtn) {
            this.elements.fullscreenBtn.addEventListener('click', () => document.documentElement.requestFullscreen());
        }
        if (this.elements.exitFullscreenBtn) {
            this.elements.exitFullscreenBtn.addEventListener('click', () => document.exitFullscreen());
        }
        document.addEventListener('fullscreenchange', () => this.toggleFullscreenButtons());
    }

    fetchData() {
        window.fetchData((err, data) => {
            if (err) {
                console.error('데이터 로딩 실패:', err);
                return;
            }
            const missionaries = data.missionaries || [];
            const news = data.news || [];
            this.processData(missionaries);
            this.renderAll();
            this.startIntervals();
            // 필요시 news 데이터도 활용 가능
        });
    }

    processData(data) {
        this.state.missionaries = data.filter(item => item.name && item.country);
        this.state.missionaries.forEach(item => {
            this.state.missionaryInfo[item.name] = item;
            if(item.country) {
                this.state.countryStats[item.country] = this.state.countryStats[item.country] || { count: 0, names: [], cities: [] };
                this.state.countryStats[item.country].count++;
                this.state.countryStats[item.country].names.push(item.name);
                this.state.countryStats[item.country].cities.push(item.city && item.city.trim() ? item.city : null);
            }
            if(item.presbytery) {
                this.state.presbyteryStats[item.presbytery] = (this.state.presbyteryStats[item.presbytery] || 0) + 1;
                this.state.presbyteryMembers[item.presbytery] = this.state.presbyteryMembers[item.presbytery] || [];
                this.state.presbyteryMembers[item.presbytery].push(item);
            }
        });
    }

    renderAll() {
        this.renderCountryTable();
        this.renderPresbyteryTable();
        this.renderGlobalMarkers();
    }

    startIntervals() {
        this.timers.floating = setInterval(() => this.showFloatingMissionaries(), this.constants.FLOAT_INTERVAL);
        this.timers.rotation = setInterval(() => this.rotateGlobalPopups(), this.constants.POPUP_ROTATE_INTERVAL);
    }

    renderCountryTable() {
        const countries = Object.keys(this.state.countryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = countries.map(country => {
            const flagCode = this.constants.COUNTRY_FLAGS[country];
            const flagImg = flagCode ? `<img class="flag-icon" src="https://flagcdn.com/w40/${flagCode}.png" alt="">` : '';
            return `<tr>
                <td>${flagImg}</td>
                <td class="bold country-click" data-country="${country}">${country}</td>
                <td style="text-align:right;">${this.state.countryStats[country].count}</td>
            </tr>`;
        }).join('');
        this.elements.countryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">국가별 파송현황</div>
            <table><thead><tr><th></th><th>국가</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    }

    renderPresbyteryTable() {
        const presbyteries = Object.keys(this.state.presbyteryStats).sort((a, b) => a.localeCompare(b, 'ko'));
        const tableRows = presbyteries.map(p => `
            <tr>
                <td class="bold presbytery-click" data-presbytery="${p}">${p}</td>
                <td style="text-align:right;">${this.state.presbyteryStats[p]}</td>
            </tr>`).join('');
        this.elements.presbyteryTable.innerHTML = `<div style="font-weight:bold;font-size:1.15em;margin-bottom:6px;text-align:center;">노회별 파송현황</div>
            <table><thead><tr><th>노회</th><th>인원</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    }

    renderGlobalMarkers() {
        this.globalMarkers = Object.entries(this.state.countryStats).map(([country, stats]) => {
            const latlng = this.constants.LATLNGS[country] || [0,0];
            const flag = this.constants.COUNTRY_FLAGS[country] ? `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";
            const popupContent = `${flag}<b>${country}</b><br>` + stats.names.map(name => {
                const info = this.state.missionaryInfo[name] || {};
                const recentStyle = isRecent(info.lastUpdate) ? "style='color: orange; font-weight: bold'" : "";
                return `<div class='popup-list' ${recentStyle} data-name="${name}" data-latlng="${latlng.join(',')}">${name}</div>`;
            }).join("");
            const marker = L.marker(latlng).addTo(this.map).bindPopup(popupContent);
            marker.on('popupopen', () => {
                if (!this.state.isByAutoRotate) this.state.isPaused = true;
                this.state.isByAutoRotate = false;
            });
            marker.on('popupclose', () => { this.state.isPaused = false; });
            return marker;
        });

        // 팝업 내부의 클릭 이벤트 처리
        this.map.on('popupopen', (e) => {
            const popup = e.popup;
            popup.getElement().addEventListener('click', (e) => {
                const target = e.target.closest('.popup-list');
                if (target) {
                    const name = target.dataset.name;
                    const latlng = target.dataset.latlng.split(',').map(Number);
                    this.showDetailPopup(name, latlng);
                }
            });
        });
    }

    showDetailPopup(name, latlng) {
        showDetailPopup(name, latlng, this.state.missionaryInfo, this.elements);
        this.state.isPaused = true;
    }

    closeDetailPopup() {
        closeDetailPopup(this.elements);
        this.state.isPaused = false;
    }

    showFloatingMissionaries() {
        if(this.state.isPaused || this.state.fixedCountry) return;
        const missionaries = this.state.missionaries.sort((a,b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
        if(missionaries.length === 0) return;
        document.querySelectorAll('.floating-missionary-wrapper.auto').forEach(el => el.remove());
        for(let c = 0; c < this.constants.FLOAT_COUNT; c++) {
            const item = missionaries[(this.state.globalMarkerIndex + c) % missionaries.length];
            const latlng = this.constants.LATLNGS[item.country];
            if (!latlng) continue;
            const point = this.map.latLngToContainerPoint([ latlng[0] + (Math.random()-0.5)*3, latlng[1] + (Math.random()-0.5)*3 ]);
            const wrapper = createFloatingElement(item, point, this.state, this.constants, 'auto');
            this.elements.mapContainer.appendChild(wrapper);
            animateFloatingElement(wrapper, this.state, this.constants);
        }
    }

    showPresbyteryPopups(presbytery) {
        if(this.state.fixedCountry) return;
        this.state.isPaused = true;
        clearTimeout(this.timers.presbytery);
        const members = this.state.presbyteryMembers[presbytery] || [];
        document.querySelectorAll('.floating-missionary-wrapper').forEach(div => div.remove());
        const countryGroups = members.reduce((acc, item) => {
            acc[item.country] = acc[item.country] || [];
            acc[item.country].push(item);
            return acc;
        }, {});
        Object.values(countryGroups).forEach(group => {
            group.forEach((item, i) => {
                const latlng = this.constants.LATLNGS[item.country];
                if (!latlng) return;
                const point = this.map.latLngToContainerPoint([latlng[0] + (Math.random()-0.5)*2.4, latlng[1] + (Math.random()-0.5)*2.4]);
                const wrapper = createFloatingElement(item, point, this.state, this.constants, 'presbytery-floating');
                wrapper.style.top = `${point.y - 60 + i * 45}px`;
                this.elements.mapContainer.appendChild(wrapper);
                animateFloatingElement(wrapper, this.state, this.constants, this.constants.PRESBYTERY_FLOAT_DURATION);
            });
        });
        this.timers.presbytery = setTimeout(() => { this.state.isPaused = false; }, this.constants.PRESBYTERY_FLOAT_DURATION + this.constants.PRESBYTERY_PAUSE_EXTRA);
    }

    rotateGlobalPopups() {
        if (!this.state.isPaused && this.globalMarkers.length > 0 && !this.state.fixedCountry) {
            if (this.map.getContainer().querySelector('.leaflet-popup-content')) {
                this.globalMarkers.forEach(m => m.closePopup());
            }
            this.state.isByAutoRotate = true;
            this.globalMarkers[this.state.globalMarkerIndex].openPopup();
            this.state.globalMarkerIndex = (this.state.globalMarkerIndex + 1) % this.globalMarkers.length;
        }
    }

    enterFixedCountryMode(country) {
        this.state.fixedCountry = country;
        this.state.isPaused = true;
        document.querySelectorAll('.floating-missionary-wrapper').forEach(div => div.remove());
        this.globalMarkers.forEach(m => this.map.removeLayer(m));
        this.closeDetailPopup();
        this.clearFixedCountryElements();
        const latlng = this.constants.LATLNGS[country] || [20,0];
        this.state.lastCountryLatLng = latlng;
        this.map.setView(latlng, 5, {animate: true});
        const countryMissionaries = this.state.missionaries.filter(item => item.country === country);
        const coordMap = {};
        countryMissionaries.forEach(item => {
            const mLatLng = getLatLng(item, country, this.constants);
            const key = mLatLng.join(',');
            if (!coordMap[key]) coordMap[key] = [];
            coordMap[key].push(item);
        });
        countryMissionaries.forEach(item => {
            const mLatLng = getLatLng(item, country, this.constants);
            const key = mLatLng.join(',');
            const group = coordMap[key];
            const idx = group.indexOf(item);
            const n = group.length;
            const marker = L.marker(mLatLng).addTo(this.map);
            this.fixedCountryMarkers.push(marker);
            const point = this.map.latLngToContainerPoint(mLatLng);
            let yOffset = 0;
            if (n > 1) {
                yOffset = (idx - (n - 1) / 2) * 55;
            }
            const popupPoint = { x: point.x, y: point.y + yOffset };
            const popupLatLng = this.map.containerPointToLatLng([popupPoint.x, popupPoint.y]);
            const popup = this.createFixedPopup(item, popupLatLng, key, idx);
            this.elements.mapContainer.appendChild(popup);
            this.fixedCountryPopups.push(popup);
        });
        this.elements.countryExitBtn.classList.add('visible');
    }

    repositionFixedPopups() {
        const country = this.state.fixedCountry;
        if (!country) return;
        const countryMissionaries = this.state.missionaries.filter(item => item.country === country);
        const coordMap = {};
        countryMissionaries.forEach(item => {
            const mLatLng = getLatLng(item, country, this.constants);
            const key = mLatLng.join(',');
            if (!coordMap[key]) coordMap[key] = [];
            coordMap[key].push(item);
        });
        this.fixedCountryPopups.forEach(popup => {
            const key = popup.dataset.coordKey;
            const idx = parseInt(popup.dataset.groupIdx, 10);
            const group = coordMap[key] || [];
            const n = group.length;
            const mLatLng = key.split(',').map(Number);
            const point = this.map.latLngToContainerPoint(mLatLng);
            let yOffset = 0;
            if (n > 1) {
                yOffset = (idx - (n - 1) / 2) * 55;
            }
            popup.style.left = `${point.x - 70}px`;
            popup.style.top = `${point.y + yOffset - 20}px`;
        });
    }

    createFixedPopup(item, latlng, key, idx) {
        const point = this.map.latLngToContainerPoint(latlng);
        const wrapper = document.createElement("div");
        wrapper.className = "floating-missionary-wrapper";
        wrapper.style.left = `${point.x - 70}px`;
        wrapper.style.top = `${point.y - 20}px`;
        wrapper.dataset.latlng = JSON.stringify(latlng);
        wrapper.dataset.coordKey = key;
        wrapper.dataset.groupIdx = idx;
        const contentClass = isRecent(item.lastUpdate) ? 'recent' : '';
        wrapper.innerHTML = `
        <div class="floating-missionary-content ${contentClass}" style="pointer-events:all;background:#fffde4;">
            <div class="name" style="cursor:pointer; color:#00509e; font-weight:bold;"
                data-name="${item.name}">${item.name}</div>
        </div>`;
        
        // 클릭 이벤트 추가
        wrapper.querySelector('.name').addEventListener('click', () => {
            this.showDetailPopupByName(item.name);
        });
        
        return wrapper;
    }

    restoreGlobalMode() {
        if(!this.state.fixedCountry) return;
        this.clearFixedCountryElements();
        this.globalMarkers.forEach(m => m.addTo(this.map));
        this.state.isPaused = false;
        this.state.fixedCountry = null;
        this.elements.countryExitBtn.classList.remove('visible');
        const latlng = this.state.lastCountryLatLng || [20, 0];
        this.map.setView(latlng, 3, {animate: true});
    }

    clearFixedCountryElements() {
        this.fixedCountryMarkers.forEach(m => this.map.removeLayer(m));
        this.fixedCountryMarkers = [];
        this.fixedCountryPopups.forEach(div => div.remove());
        this.fixedCountryPopups = [];
    }

    showDetailPopupByName(name) {
        const country = this.state.fixedCountry;
        let latlng = [20, 0];
        if (country) {
            const item = this.state.missionaries.find(m => m.name === name && m.country === country);
            if (item) latlng = getLatLng(item, country, this.constants);
        }
        this.showDetailPopup(name, latlng);
    }

    toggleAnimation() {
        this.state.isAnimOn = !this.state.isAnimOn;
        this.elements.titleLogo.classList.toggle('anim-off', !this.state.isAnimOn);
    }

    toggleFullscreenButtons() {
        const isFull = !!document.fullscreenElement;
        this.elements.fullscreenBtn.classList.toggle('hidden', isFull);
        this.elements.exitFullscreenBtn.classList.toggle('hidden', !isFull);
        if (this.map && this.map.invalidateSize) {
            setTimeout(() => this.map.invalidateSize(), 400);
        }
    }

    showNewsletter(newsletterUrlEncoded) {
        showNewsletter(newsletterUrlEncoded);
    }
}

// 인스턴스 생성 및 전역 객체에 할당
const missionaryMap = new MissionaryMap(); 