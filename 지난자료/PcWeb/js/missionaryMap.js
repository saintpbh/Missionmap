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
            autoplayMode: null,
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
            presbyteryExitBtn: document.getElementById('presbytery-exit-btn'),
        };

        this.map = null;
        this.globalMarkers = [];
        this.fixedCountryMarkers = [];
        this.fixedCountryPopups = [];
        this.timers = {};
        this.prayerRotationTimer = null;

        this.constants = {
            // Firebase Realtime Database 사용 (Google Sheets URL 제거)
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
        this.initPrayerCount();
    }

    initMap() {
        this.map = L.map(this.elements.mapContainer).setView([20, 0], 2);
        
        // 바다가 푸른색인 아름다운 지도 스타일로 변경
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
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
        if (this.elements.presbyteryExitBtn) {
            this.elements.presbyteryExitBtn.addEventListener('click', () => this.restoreGlobalMode());
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
        console.log('missionaryMap: Firebase에서 데이터 로딩 시작...');
        
        if (!window.firebase || !window.firebase.database) {
            console.error('missionaryMap: Firebase SDK가 로드되지 않았습니다.');
            return;
        }
        
        const db = window.firebase.database();
        
        // missionaries 데이터 가져오기
        db.ref('missionaries').once('value')
            .then(snapshot => {
                console.log('missionaryMap: missionaries 데이터 로딩 완료');
                const missionaries = [];
                snapshot.forEach(child => {
                    const data = child.val();
                    if (data && data.name && data.name.trim() !== '') {
                        missionaries.push(data);
                    }
                });
                
                console.log(`missionaryMap: ${missionaries.length}명의 선교사 데이터 로드됨`);
                
                // news 데이터 가져오기
                return db.ref('news').once('value').then(newsSnap => {
                    console.log('missionaryMap: news 데이터 로딩 완료');
                    const news = [];
                    newsSnap.forEach(child => {
                        const data = child.val();
                        if (data) {
                            news.push(data);
                        }
                    });
                    console.log(`missionaryMap: ${news.length}개의 뉴스 데이터 로드됨`);
                    return { missionaries, news };
                });
            })
            .then(data => {
                console.log('missionaryMap: 모든 데이터 로딩 완료');
                this.processData(data.missionaries);
                this.renderAll();
                this.startIntervals();
            })
            .catch(err => {
                console.error('missionaryMap: Firebase 데이터 로딩 실패:', err);
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
        // 기존 마커들 제거
        this.globalMarkers.forEach(marker => this.map.removeLayer(marker));
        this.globalMarkers = [];
        
        // 클러스터 그룹이 있다면 제거 (전체 보기에서는 클러스터 사용 안함)
        if (this.markerClusterGroup) {
            this.map.removeLayer(this.markerClusterGroup);
            this.markerClusterGroup = null;
        }
        
        const countryStats = this.state.countryStats;
        const autoplayMode = this.state.autoplayMode;

        console.log('MissionaryMap: 국가 통계:', Object.keys(countryStats).length, '개국');

        const newMarkers = Object.entries(countryStats).map(([country, stats]) => {
            const latlng = this.constants.LATLNGS[country] || [0, 0];
            const flag = this.constants.COUNTRY_FLAGS[country] ? `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";

            // 팝업 내용을 HTML 문자열로 생성
            let popupHTML = `${flag}<b>${country}</b><br>`;
            
            // 선교사 이름 목록 HTML 생성
            stats.names.forEach(name => {
                const info = this.state.missionaryInfo[name] || {};
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
                const missionary = this.state.missionaryInfo[name];
                if (missionary && missionary._id) {
                    // DataManager가 있는 경우에만 매핑
                    if (window.DataManager && window.DataManager.linkMarkerToMissionary) {
                        window.DataManager.linkMarkerToMissionary(marker, missionary);
                    }
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
                            const info = this.state.missionaryInfo[name] || {};
                            const latlngForPopup = this.getLatLng(info, info.country);
                            this.showDetailPopup(name, latlngForPopup);
                        });
                    });
                }

                if (!this.state.isByAutoRotate) {
                    this.state.isPaused = true;
                }
                this.state.isByAutoRotate = false;
                
                if (this.state.autoplayMode === 'fixed') {
                    this.startPrayerTopicRotation(popup);
                }
            });
            marker.on('popupclose', () => {
                this.state.isPaused = false;
                this.stopPrayerTopicRotation();
            });

            // 개별 마커를 지도에 직접 추가 (클러스터 사용 안함)
            marker.addTo(this.map);
            return marker;
        });

        this.globalMarkers = newMarkers;
        
        console.log('MissionaryMap: renderGlobalMarkers 완료, 마커 수:', newMarkers.length);
    }

    showDetailPopup(name, latlng) {
        if (window.showDetailPopup) {
            window.showDetailPopup(name, latlng, this.state.missionaryInfo, this.elements);
        }
        this.state.isPaused = true;
    }

    closeDetailPopup() {
        if (window.closeDetailPopup) {
            window.closeDetailPopup(this.elements);
        }
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
            const wrapper = window.createFloatingElement(item, point, this.state, this.constants, 'auto');
            this.elements.mapContainer.appendChild(wrapper);
            window.animateFloatingElement(wrapper, this.state, this.constants);
        }
    }

    showPresbyteryPopups(presbytery) {
        if(this.state.fixedCountry) return;
        this.state.isPaused = true;
        clearTimeout(this.timers.presbytery);
        
        // 기존 플로팅 요소들 제거
        document.querySelectorAll('.floating-missionary-wrapper').forEach(div => div.remove());
        
        // 전체 보기 마커들 제거
        this.globalMarkers.forEach(m => this.map.removeLayer(m));
        
        const members = this.state.presbyteryMembers[presbytery] || [];
        
        // 클러스터 그룹 생성 (노회별 보기에서 사용)
        if (!this.markerClusterGroup) {
            this.markerClusterGroup = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: function(cluster) {
                    const count = cluster.getChildCount();
                    let className = 'marker-cluster-';
                    if (count < 5) {
                        className += 'small';
                    } else if (count < 10) {
                        className += 'medium';
                    } else {
                        className += 'large';
                    }
                    
                    return L.divIcon({
                        html: `<div><span>${count}</span></div>`,
                        className: className,
                        iconSize: L.point(40, 40)
                    });
                }
            });
            this.map.addLayer(this.markerClusterGroup);
        }
        
        // 클러스터 그룹 초기화
        this.markerClusterGroup.clearLayers();
        
        // 노회별 선교사들을 개별 마커로 생성하여 클러스터에 추가
        const countryGroups = members.reduce((acc, item) => {
            acc[item.country] = acc[item.country] || [];
            acc[item.country].push(item);
            return acc;
        }, {});
        
        Object.entries(countryGroups).forEach(([country, group]) => {
            group.forEach((item, i) => {
                const latlng = this.constants.LATLNGS[item.country];
                if (!latlng) return;
                
                // 개별 선교사 마커 생성
                const marker = L.marker(latlng);
                
                // 팝업 내용 생성
                const flag = this.constants.COUNTRY_FLAGS[country] ? 
                    `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";
                const isRecent = window.isRecent(item.lastUpdate);
                const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';
                const boldClass = isRecent ? ' recent-bold' : '';
                
                const popupHTML = `
                    ${flag}<b>${item.name}${recentIcon}</b><br>
                    <div class="popup-list ${boldClass}" data-name="${item.name}" style="cursor: pointer;">
                        <div class="missionary-name">${item.city || '정보없음'}, ${country}</div>
                        <div class="missionary-org">${item.organization || '정보없음'}</div>
                    </div>
                `;
                
                marker.bindPopup(popupHTML);
                
                // 팝업 이벤트 리스너
                marker.on('popupopen', (e) => {
                    const popup = e.popup;
                    const popupContent = popup.getElement();
                    if (popupContent) {
                        const nameElement = popupContent.querySelector('[data-name]');
                        if (nameElement) {
                            nameElement.addEventListener('click', (clickEvent) => {
                                clickEvent.preventDefault();
                                clickEvent.stopPropagation();
                                const name = nameElement.dataset.name;
                                this.showDetailPopup(name, latlng);
                            });
                        }
                    }
                });
                
                // 클러스터에 마커 추가
                this.markerClusterGroup.addLayer(marker);
            });
        });
        
        // 사이드바에 해당 노회 선교사 목록 표시
        if (window.UIManager && window.UIManager.openSidebar) {
            window.UIManager.openSidebar(`${presbytery} 선교사 목록`, members);
        } else {
            console.warn('UIManager.openSidebar를 찾을 수 없습니다.');
        }
        
        // 노회별 보기 종료 버튼 표시
        if (this.elements.presbyteryExitBtn) {
            this.elements.presbyteryExitBtn.classList.add('visible');
        }
        
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
        
        // 전체 보기 마커들 제거
        this.globalMarkers.forEach(m => this.map.removeLayer(m));
        this.closeDetailPopup();
        this.clearFixedCountryElements();
        
        const latlng = this.constants.LATLNGS[country] || [20,0];
        this.state.lastCountryLatLng = latlng;
        this.map.setView(latlng, 5, {animate: true});
        
        const countryMissionaries = this.state.missionaries.filter(item => item.country === country);
        
        // 클러스터 그룹 생성 (국가별 보기에서 사용)
        if (!this.markerClusterGroup) {
            this.markerClusterGroup = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: function(cluster) {
                    const count = cluster.getChildCount();
                    let className = 'marker-cluster-';
                    if (count < 5) {
                        className += 'small';
                    } else if (count < 10) {
                        className += 'medium';
                    } else {
                        className += 'large';
                    }
                    
                    return L.divIcon({
                        html: `<div><span>${count}</span></div>`,
                        className: className,
                        iconSize: L.point(40, 40)
                    });
                }
            });
            this.map.addLayer(this.markerClusterGroup);
        }
        
        // 클러스터 그룹 초기화
        this.markerClusterGroup.clearLayers();
        
        // 국가별 선교사들을 개별 마커로 생성하여 클러스터에 추가
        const coordMap = {};
        countryMissionaries.forEach(item => {
            const mLatLng = this.getLatLng(item, country);
            const key = mLatLng.join(',');
            if (!coordMap[key]) coordMap[key] = [];
            coordMap[key].push(item);
        });
        
        countryMissionaries.forEach(item => {
            const mLatLng = this.getLatLng(item, country);
            const key = mLatLng.join(',');
            const group = coordMap[key];
            const idx = group.indexOf(item);
            const n = group.length;
            
            // 개별 선교사 마커 생성
            const marker = L.marker(mLatLng);
            
            // 팝업 내용 생성
            const flag = this.constants.COUNTRY_FLAGS[country] ? 
                `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";
            const isRecent = window.isRecent(item.lastUpdate);
            const recentIcon = isRecent ? ' <span class="recent-badge" title="최근 소식">📰✨</span>' : '';
            const boldClass = isRecent ? ' recent-bold' : '';
            
            const popupHTML = `
                ${flag}<b>${item.name}${recentIcon}</b><br>
                <div class="popup-list ${boldClass}" data-name="${item.name}" style="cursor: pointer;">
                    <div class="missionary-name">${item.city || '정보없음'}, ${country}</div>
                    <div class="missionary-org">${item.organization || '정보없음'}</div>
                </div>
            `;
            
            marker.bindPopup(popupHTML);
            
            // 팝업 이벤트 리스너
            marker.on('popupopen', (e) => {
                const popup = e.popup;
                const popupContent = popup.getElement();
                if (popupContent) {
                    const nameElement = popupContent.querySelector('[data-name]');
                    if (nameElement) {
                        nameElement.addEventListener('click', (clickEvent) => {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                            const name = nameElement.dataset.name;
                            this.showDetailPopup(name, mLatLng);
                        });
                    }
                }
            });
            
            // 클러스터에 마커 추가
            this.markerClusterGroup.addLayer(marker);
            this.fixedCountryMarkers.push(marker);
        });
        
        // 사이드바에 해당 국가 선교사 목록 표시
        if (window.UIManager && window.UIManager.openSidebar) {
            window.UIManager.openSidebar(`${country} 선교사 목록`, countryMissionaries);
        } else {
            console.warn('UIManager.openSidebar를 찾을 수 없습니다.');
        }
        
        this.elements.countryExitBtn.classList.add('visible');
        this.elements.presbyteryExitBtn.classList.add('visible');
    }

    repositionFixedPopups() {
        const country = this.state.fixedCountry;
        if (!country) return;
        const countryMissionaries = this.state.missionaries.filter(item => item.country === country);
        const coordMap = {};
        countryMissionaries.forEach(item => {
            const mLatLng = this.getLatLng(item, country);
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
        const contentClass = window.isRecent(item.lastUpdate) ? 'recent' : '';
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
        
        // 클러스터 그룹 제거
        if (this.markerClusterGroup) {
            this.map.removeLayer(this.markerClusterGroup);
            this.markerClusterGroup = null;
        }
        
        // 전체 보기 마커들 다시 표시
        this.globalMarkers.forEach(m => m.addTo(this.map));
        
        this.state.isPaused = false;
        this.state.fixedCountry = null;
        this.elements.countryExitBtn.classList.remove('visible');
        this.elements.presbyteryExitBtn.classList.remove('visible');
        
        // 사이드바 닫기
        if (window.UIManager && window.UIManager.closeSidebar) {
            window.UIManager.closeSidebar();
        } else {
            console.warn('UIManager.closeSidebar를 찾을 수 없습니다.');
        }
        
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
            if (item) latlng = this.getLatLng(item, country);
        }
        this.showDetailPopup(name, latlng);
    }

    toggleAnimation() {
        this.state.isAnimOn = !this.state.isAnimOn;
        this.elements.titleLogo.classList.toggle('anim-off', !this.state.isAnimOn);
    }

    toggleFullscreenButtons() {
        if (document.fullscreenElement) {
            this.elements.fullscreenBtn.classList.add('hidden');
            this.elements.exitFullscreenBtn.classList.remove('hidden');
        } else {
            this.elements.fullscreenBtn.classList.remove('hidden');
            this.elements.exitFullscreenBtn.classList.add('hidden');
        }
    }

    setAutoplayMode(mode) {
        console.log('MissionaryMap: 자동재생 모드 변경:', mode);
        
        // 기존 타이머 정리
        if (this.timers.rotation) {
            clearInterval(this.timers.rotation);
        }
        
        // 새로운 모드 설정
        this.state.autoplayMode = mode;
        
        // 모드에 따른 타이머 재시작
        if (mode === 'fixed') {
            // 지도 고정 모드: 기도제목 로테이션
            this.timers.rotation = setInterval(() => this.rotateGlobalPopups(), this.constants.POPUP_ROTATE_INTERVAL);
        } else if (mode === 'pan') {
            // 지도 자동 이동 모드: 간단한 팝업만 표시
            this.timers.rotation = setInterval(() => this.rotateSimplePopups(), this.constants.POPUP_ROTATE_INTERVAL);
        }
        
        // 현재 열린 팝업이 있다면 새 모드로 업데이트
        this.updateCurrentPopupMode();
    }

    rotateSimplePopups() {
        if (this.state.isPaused || this.state.fixedCountry) return;
        
        // 간단한 팝업만 표시 (기도제목 없이)
        this.globalMarkers.forEach((marker, index) => {
            const country = Object.keys(this.state.countryStats)[index];
            if (country) {
                const stats = this.state.countryStats[country];
                const flag = this.constants.COUNTRY_FLAGS[country] ? 
                    `<img class='flag-icon' src='https://flagcdn.com/w40/${this.constants.COUNTRY_FLAGS[country]}.png'>` : "";
                
                const simpleContent = `${flag}<b>${country}</b><br>${stats.names.join(', ')}`;
                marker.getPopup().setContent(simpleContent);
            }
        });
    }

    updateCurrentPopupMode() {
        // 현재 열린 팝업이 있다면 모드에 맞게 업데이트
        const openPopup = document.querySelector('.leaflet-popup');
        if (openPopup && this.state.autoplayMode === 'pan') {
            // 간단한 모드로 업데이트
            const popupContent = openPopup.querySelector('.leaflet-popup-content');
            if (popupContent) {
                // 기존 기도제목 관련 내용 제거
                const prayerElements = popupContent.querySelectorAll('.prayer-topic, .prayer-content');
                prayerElements.forEach(el => el.style.display = 'none');
            }
        }
    }

    // 기도제목 로테이션 시작
    startPrayerTopicRotation(popup) {
        if (this.prayerRotationTimer) {
            clearInterval(this.prayerRotationTimer);
        }
        
        this.prayerRotationTimer = setInterval(() => {
            if (popup && popup.getElement()) {
                const popupContent = popup.getElement().querySelector('.leaflet-popup-content');
                if (popupContent) {
                    const prayerElements = popupContent.querySelectorAll('.prayer-topic');
                    if (prayerElements.length > 1) {
                        const currentIndex = Array.from(prayerElements).findIndex(el => !el.style.display || el.style.display !== 'none');
                        const nextIndex = (currentIndex + 1) % prayerElements.length;
                        
                        prayerElements.forEach((el, index) => {
                            el.style.display = index === nextIndex ? 'block' : 'none';
                        });
                    }
                }
            }
        }, 3000);
    }

    // 기도제목 로테이션 중지
    stopPrayerTopicRotation() {
        if (this.prayerRotationTimer) {
            clearInterval(this.prayerRotationTimer);
            this.prayerRotationTimer = null;
        }
    }

    // 위도/경도 가져오기 함수
    getLatLng(item, country) {
        if (item.lat && item.lng) {
            return [parseFloat(item.lat), parseFloat(item.lng)];
        }
        if (item.latitude && item.longitude) {
            return [parseFloat(item.latitude), parseFloat(item.longitude)];
        }
        return this.constants.LATLNGS[country] || [0, 0];
    }

    showNewsletter(newsletterUrlEncoded) {
        if (window.showNewsletter) {
            window.showNewsletter(newsletterUrlEncoded);
        }
    }

    initPrayerCount() {
        // Firebase가 로드된 후 중보기도자 수 기능 초기화
        if (window.firebase && window.initPrayerCount) {
            try {
                window.initPrayerCount(window.firebase, (count) => {
                    console.log('중보기도자 수 업데이트:', count);
                });
                console.log('중보기도자 수 기능 초기화 완료');
            } catch (error) {
                console.error('중보기도자 수 기능 초기화 실패:', error);
            }
        } else {
            console.warn('Firebase 또는 initPrayerCount 함수가 로드되지 않았습니다.');
        }
    }
}

// 인스턴스 생성 및 전역 객체에 할당
const missionaryMap = new MissionaryMap(); 