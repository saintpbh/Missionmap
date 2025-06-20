// public/js/dataManager.js
const DataManager = {
    DATA_URL: 'https://docs.google.com/spreadsheets/d/1OXDGD7a30n5C--ReXdYRoKqiYNLt9aqY5ffxYN0bZF8/export?format=csv',
    
    state: {
        missionaries: [],
        missionaryInfo: {},
        countryStats: {},
        presbyteryStats: {},
        presbyteryMembers: {},
    },

    fetchData(callback) {
        Papa.parse(this.DATA_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                this.processData(results.data);
                if (callback) callback();
            },
            error: (err) => {
                console.error('데이터 로딩 실패:', err);
                if (callback) callback(err);
            }
        });
    },

    processData(data) {
        // 데이터 초기화
        this.state.missionaries = [];
        this.state.missionaryInfo = {};
        this.state.countryStats = {};
        this.state.presbyteryStats = {};
        this.state.presbyteryMembers = {};

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
        return this.state.presbyteryMembers[presbytery];
    },
}; 