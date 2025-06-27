// prok-pages/js/dataManager.js
const DataManager = {
    state: {
        missionaries: [],
        missionaryInfo: {},
        countryStats: {},
        presbyteryStats: {},
        presbyteryMembers: {},
        isDataReady: false,
        prayerCount: 0,
        prayerUsers: {},
        dataReadyListeners: []
    },

    // 중복 초기화 방지를 위한 플래그
    _prayerCountInitialized: false,
    _userKey: null,
    _prayerCountListener: null,

    // Firebase 초기화
    initFirebase() {
        if (!window.firebase) {
            console.error('Firebase SDK가 로드되지 않았습니다.');
            return;
        }
        
        this.database = window.firebase.database();
        console.log('DataManager: Firebase 초기화 완료');
    },

    // 데이터 로딩
    fetchData(callback) {
        console.log('DataManager: 데이터 로딩 시작...');
        
        if (!this.database) {
            this.initFirebase();
        }

        // 선교사 데이터 로딩
        this.database.ref('missionaries').once('value')
            .then((snapshot) => {
                const missionaries = [];
                snapshot.forEach((childSnapshot) => {
                    missionaries.push({
                        ...childSnapshot.val(),
                        _id: childSnapshot.key
                    });
                });
                
                console.log('DataManager: 선교사 데이터 로딩 완료', missionaries.length, '명');
                this.processData(missionaries);
                
                // 중보기도자 카운트 초기화 (한 번만)
                if (!this._prayerCountInitialized) {
                    this.initPrayerCount();
                }
                
                this.state.isDataReady = true;
                if (callback) callback();
                this.notifyDataReady();
            })
            .catch((error) => {
                console.error('DataManager: 데이터 로딩 실패:', error);
                if (callback) callback(error);
            });
    },

    // 데이터 처리
    processData(data) {
        this.state.missionaries = data.filter(item => {
            return item.name && 
                   item.name.trim() !== '' && 
                   item.name.trim().length > 0 &&
                   item.country && 
                   item.country.trim() !== '';
        }).map((item, index) => ({
            ...item,
            newsletter: item.newsletter || item.NewsLetter,
            sentDate: item.sentDate || item.sent_date,
            englishName: item.englishName || item.english_name,
            _searchText: this.buildSearchText(item)
        }));
            
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

        console.log('DataManager: 데이터 처리 완료', this.state.missionaries.length, '명의 선교사');
    },

    // 중보기도자 카운트 초기화 (중복 방지)
    initPrayerCount() {
        if (this._prayerCountInitialized) {
            console.log('DataManager: 중보기도자 카운트가 이미 초기화되었습니다.');
            return;
        }
        
        console.log('DataManager: 중보기도자 카운트 초기화 시작');
        this._prayerCountInitialized = true;
        
        this._userKey = this.generateUserKey();
        console.log('DataManager: 사용자 키 생성:', this._userKey);
        
        // 현재 사용자를 prayerUsers에 등록
        this.database.ref('prayerUsers').child(this._userKey).set({
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            page: window.location.pathname
        }).then(() => {
            console.log('DataManager: 사용자 등록 완료');
        }).catch((error) => {
            console.error('DataManager: 사용자 등록 실패:', error);
        });

        // 기존 리스너가 있으면 제거
        if (this._prayerCountListener) {
            this.database.ref('prayerUsers').off('value', this._prayerCountListener);
        }

        // 실시간 중보기도자 수 감시
        this._prayerCountListener = (snapshot) => {
            const count = snapshot.numChildren();
            this.state.prayerCount = count;
            this.state.prayerUsers = snapshot.val() || {};
            
            console.log('DataManager: 중보기도자 수 업데이트:', count, '명');
            console.log('DataManager: 활성 사용자 목록:', Object.keys(this.state.prayerUsers));
            this.updatePrayerCountDisplay(count);
        };
        
        this.database.ref('prayerUsers').on('value', this._prayerCountListener);

        // 페이지 언로드 시 사용자 제거
        const beforeUnloadHandler = () => {
            if (this.database && this._userKey) {
                this.database.ref('prayerUsers').child(this._userKey).remove();
                console.log('DataManager: 사용자 제거됨');
            }
        };
        
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // 주기적으로 사용자 상태 갱신 (연결 유지)
        const updateInterval = setInterval(() => {
            if (this.database && this._userKey) {
                this.database.ref('prayerUsers').child(this._userKey).update({
                    timestamp: Date.now()
                });
            }
        }, 30000); // 30초마다

        // 오래된 사용자 정리 (5분 이상 비활성)
        const cleanupInterval = setInterval(() => {
            this.cleanupInactiveUsers();
        }, 60000); // 1분마다
        
        console.log('DataManager: 중보기도자 카운트 초기화 완료');
    },

    // 사용자 키 생성
    generateUserKey() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 비활성 사용자 정리
    cleanupInactiveUsers() {
        const now = Date.now();
        const inactiveThreshold = 5 * 60 * 1000; // 5분

        Object.keys(this.state.prayerUsers).forEach(userKey => {
            const user = this.state.prayerUsers[userKey];
            if (now - user.timestamp > inactiveThreshold) {
                this.database.ref('prayerUsers').child(userKey).remove();
                console.log('DataManager: 비활성 사용자 제거:', userKey);
            }
        });
    },

    // 중보기도자 수 표시 업데이트
    updatePrayerCountDisplay(count) {
        console.log('DataManager: updatePrayerCountDisplay 호출됨, count:', count);
        
        const prayerCountElements = document.querySelectorAll('.prayer-count, .prayer-count-number');
        console.log('DataManager: 찾은 중보기도자 수 요소들:', prayerCountElements.length, '개');
        
        prayerCountElements.forEach((element, index) => {
            console.log(`DataManager: 요소 ${index} 업데이트:`, element.textContent, '→', count);
            element.textContent = count;
        });

        // 모바일 스와이퍼의 중보기도자 수도 업데이트
        if (window.updateMobilePrayerCount) {
            console.log('DataManager: window.updateMobilePrayerCount 호출');
            window.updateMobilePrayerCount(count);
        } else {
            console.log('DataManager: window.updateMobilePrayerCount 함수를 찾을 수 없습니다.');
        }
        
        console.log('DataManager: 중보기도자 수 표시 업데이트 완료');
    },

    // 검색용 텍스트 생성
    buildSearchText(missionary) {
        const fields = [
            missionary.name,
            missionary.country,
            missionary.city,
            missionary.organization,
            missionary.presbytery
        ];
        return fields.filter(Boolean).join(' ').toLowerCase();
    },

    // 통합 검색 함수
    search(term) {
        if (!term || term.trim().length === 0) {
            return [];
        }

        const searchTerm = term.toLowerCase().trim();
        
        const results = this.state.missionaries.filter(missionary => {
            const nameMatch = missionary.name && missionary.name.toLowerCase().includes(searchTerm);
            const countryMatch = missionary.country && missionary.country.toLowerCase().includes(searchTerm);
            const cityMatch = missionary.city && missionary.city.toLowerCase().includes(searchTerm);
            const orgMatch = missionary.organization && missionary.organization.toLowerCase().includes(searchTerm);
            const presbyMatch = missionary.presbytery && missionary.presbytery.toLowerCase().includes(searchTerm);
            
            return nameMatch || countryMatch || cityMatch || orgMatch || presbyMatch;
        });

        console.log(`DataManager: "${term}" 검색 결과: ${results.length}명`);
        return results.slice(0, 12);
    },

    // 데이터 준비 완료 리스너 등록
    onDataReady(callback) {
        if (this.state.isDataReady) {
            callback();
        } else {
            this.state.dataReadyListeners.push(callback);
        }
    },

    // 데이터 준비 완료 알림
    notifyDataReady() {
        this.state.dataReadyListeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('DataManager: 리스너 실행 오류:', error);
            }
        });
        this.state.dataReadyListeners = [];
    },

    getMissionaryInfo(name) {
        return this.state.missionaryInfo[name];
    },

    getCountryStats() {
        return this.state.countryStats;
    },

    getPresbyteryStats() {
        return this.state.presbyteryStats;
    },

    getPresbyteryMembers(presbytery) {
        return this.state.presbyteryMembers[presbytery] || [];
    },

    getPrayerCount() {
        return this.state.prayerCount;
    }
}; 