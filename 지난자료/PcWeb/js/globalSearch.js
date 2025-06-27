console.log('GlobalSearch 파일 로드 시작');

// 전체보기 검색 시스템 - 재구성 버전
class GlobalSearch {
    constructor() {
        this.isActive = false;
        this.searchResults = [];
        this.activeLabels = [];
        
        console.log('GlobalSearch: 생성자 호출');
        this.init();
    }
    
    init() {
        this.setupDOM();
        this.setupEvents();
        console.log('GlobalSearch: 초기화 완료');
    }
    
    setupDOM() {
        this.elements = {
            titleContainer: document.querySelector('.title-flip-inner'),
            titleFront: document.querySelector('.title-front'),
            searchInput: document.getElementById('missionary-search'),
            clearBtn: document.getElementById('search-clear'),
            closeBtn: document.getElementById('search-close-btn')
        };
        console.log('GlobalSearch: DOM 요소 준비 완료');
    }
    
    setupEvents() {
        if (this.elements.titleFront) {
            this.elements.titleFront.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSearch();
            });
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.closeSearch();
            });
        }
        
        console.log('GlobalSearch: 이벤트 설정 완료');
    }
    
    toggleSearch() {
        if (this.isActive) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }
    
    openSearch() {
        if (!this.isDataReady()) {
            console.log('GlobalSearch: 데이터가 아직 준비되지 않음');
            return;
        }
        
        this.isActive = true;
        
        if (this.elements.titleContainer) {
            this.elements.titleContainer.style.transform = 'rotateY(180deg)';
        }
        
        setTimeout(() => {
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
            }
        }, 300);
        
        console.log('GlobalSearch: 검색 모드 활성화');
    }
    
    closeSearch() {
        this.isActive = false;
        
        if (this.elements.titleContainer) {
            this.elements.titleContainer.style.transform = 'rotateY(0deg)';
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.elements.searchInput.blur();
        }
        
        this.clearResults();
        console.log('GlobalSearch: 검색 모드 비활성화');
    }
    
    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.elements.searchInput.focus();
        }
        this.clearResults();
    }
    
    handleSearch(term) {
        const searchTerm = term.trim();
        
        if (searchTerm.length === 0) {
            this.clearResults();
            return;
        }
        
        const results = this.searchMissionaries(searchTerm);
        this.searchResults = results;
        
        console.log(`GlobalSearch: "${searchTerm}" 검색 결과: ${results.length}명`);
        
        if (results.length > 0) {
            this.displayResults(results, searchTerm);
        }
    }
    
    searchMissionaries(term) {
        const searchTerm = term.toLowerCase();
        const results = [];
        
        const countryTable = document.getElementById('missionary-table-country');
        if (countryTable) {
            const rows = countryTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const nameCell = row.querySelector('.missionary-name');
                const countryCell = row.querySelector('.country-click');
                
                if (nameCell && countryCell) {
                    const name = nameCell.textContent.trim();
                    const country = countryCell.textContent.trim();
                    
                    if (name.toLowerCase().includes(searchTerm) || 
                        country.toLowerCase().includes(searchTerm)) {
                        
                        results.push({
                            name: name,
                            country: country
                        });
                    }
                }
            });
        }
        
        return results.slice(0, 12);
    }
    
    displayResults(results, searchTerm) {
        this.clearResults();
        
        results.forEach((result, index) => {
            this.highlightMarkerOnMap(result, index, searchTerm);
        });
        
        this.showResultCounter(results.length);
    }
    
    highlightMarkerOnMap(result, index, searchTerm) {
        if (window.MissionaryMap && window.MissionaryMap.globalMarkers) {
            const marker = this.findMarkerByName(result.name);
            
            if (marker) {
                this.addPulseEffect(marker);
                
                const mapPoint = window.MissionaryMap.map.latLngToContainerPoint(marker.getLatLng());
                this.createFloatingLabel(result, mapPoint, index, searchTerm);
            }
        }
    }
    
    findMarkerByName(name) {
        if (!window.MissionaryMap || !window.MissionaryMap.globalMarkers) return null;
        
        return window.MissionaryMap.globalMarkers.find(marker => {
            const popup = marker.getPopup();
            if (popup) {
                const content = popup.getContent();
                return content && content.includes(name);
            }
            return false;
        });
    }
    
    addPulseEffect(marker) {
        const markerElement = marker.getElement();
        if (markerElement) {
            markerElement.classList.add('search-matched');
        }
    }
    
    createFloatingLabel(result, point, index, searchTerm) {
        const label = document.createElement('div');
        label.className = 'floating-search-label';
        label.style.cssText = `
            position: absolute;
            left: ${point.x}px;
            top: ${point.y - 60}px;
            background: rgba(255,255,255,0.95);
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            color: #333;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            transform: translateX(-50%) scale(0);
            animation: labelFadeIn 0.3s ease forwards;
            animation-delay: ${index * 0.1}s;
            cursor: pointer;
        `;
        
        label.innerHTML = `
            <div style="font-weight: 600;">${result.name}</div>
            <div style="opacity: 0.7; font-size: 11px;">${result.country}</div>
        `;
        
        document.body.appendChild(label);
        this.activeLabels.push(label);
        
        label.addEventListener('click', () => {
            this.selectResult(result);
        });
    }
    
    showResultCounter(count) {
        const existingCounter = document.querySelector('.search-result-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
        
        const counter = document.createElement('div');
        counter.className = 'search-result-counter';
        counter.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            z-index: 1001;
        `;
        counter.textContent = `${count}명 발견`;
        
        if (this.elements.searchInput && this.elements.searchInput.parentElement) {
            this.elements.searchInput.parentElement.style.position = 'relative';
            this.elements.searchInput.parentElement.appendChild(counter);
        }
    }
    
    selectResult(result) {
        console.log('GlobalSearch: 선교사 선택:', result.name);
        
        if (window.MissionaryMap && typeof window.MissionaryMap.showDetailPopup === 'function') {
            const marker = this.findMarkerByName(result.name);
            if (marker) {
                const latlng = marker.getLatLng();
                window.MissionaryMap.showDetailPopup(result.name, [latlng.lat, latlng.lng]);
            }
        }
        
        this.closeSearch();
    }
    
    clearResults() {
        this.activeLabels.forEach(label => {
            if (label.parentNode) {
                label.parentNode.removeChild(label);
            }
        });
        this.activeLabels = [];
        
        if (window.MissionaryMap && window.MissionaryMap.globalMarkers) {
            window.MissionaryMap.globalMarkers.forEach(marker => {
                const markerElement = marker.getElement();
                if (markerElement) {
                    markerElement.classList.remove('search-matched');
                }
            });
        }
        
        const counter = document.querySelector('.search-result-counter');
        if (counter) {
            counter.remove();
        }
    }
    
    isDataReady() {
        const countryTable = document.getElementById('missionary-table-country');
        if (!countryTable) return false;
        
        const rows = countryTable.querySelectorAll('tbody tr');
        return rows.length > 0;
    }
}

// CSS 스타일 추가
const searchStyles = document.createElement('style');
searchStyles.textContent = `
    @keyframes labelFadeIn {
        from {
            opacity: 0;
            transform: translateX(-50%) scale(0);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
        }
    }
    
    .search-matched {
        animation: searchPulse 2s infinite;
        z-index: 1000 !important;
    }
    
    @keyframes searchPulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
            filter: drop-shadow(0 0 8px #ffd700);
        }
    }
    
    .floating-search-label:hover {
        transform: translateX(-50%) scale(1.05) !important;
    }
`;
document.head.appendChild(searchStyles);

// 페이지 로드 후 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.globalSearchInstance = new GlobalSearch();
        console.log('GlobalSearch: 시스템 준비 완료');
    }, 1000);
});

console.log('GlobalSearch 파일 로드 완료'); 