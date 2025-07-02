// 대시보드 기능 구현
class Dashboard {
  constructor() {
    this.charts = {};
    this.activities = [];
    this.init();
  }

  async init() {
    await this.loadStatistics();
    await this.loadActivities();
    this.initCharts();
    this.checkSystemStatus();
    this.setupEventListeners();
  }

  // 통계 데이터 로딩
  async loadStatistics() {
    try {
      const missionaries = await getAllMissionaries();
      const newsletters = await getAllNewsletters();
      
      // 전체 선교사 수 (아카이브 제외)
      const activeMissionaries = missionaries.filter(m => m.status !== 'archived' && m.status !== '아카이브');
      const totalMissionaries = activeMissionaries.length;
      document.getElementById('totalMissionaries').textContent = totalMissionaries;
      
      // 활동 국가 수 (아카이브 제외)
      const countries = new Set(activeMissionaries.map(m => m.country).filter(Boolean));
      document.getElementById('activeCountries').textContent = countries.size;
      
      // 이번 달 뉴스레터 수
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyNewsletters = newsletters.filter(n => {
        const date = new Date(n.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length;
      document.getElementById('monthlyNewsletters').textContent = monthlyNewsletters;
      
      // 데이터 완성도 계산 (아카이브 제외)
      const completeness = this.calculateDataCompleteness(activeMissionaries);
      document.getElementById('dataCompleteness').textContent = `${completeness}%`;
      
      // 등록된 후원자 수 계산 (아카이브 제외)
      const totalSupporters = this.calculateTotalSupporters(activeMissionaries);
      document.getElementById('totalSupporters').textContent = totalSupporters;
      
      // 차트 데이터 준비 (아카이브 제외)
      await this.prepareChartData(activeMissionaries);
      
      // 국가별 테이블 렌더링 (아카이브 제외)
      this.renderCountryTable(activeMissionaries);
      
    } catch (error) {
      console.error('통계 로딩 오류:', error);
      this.showToast('통계 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    }
  }

  // 데이터 완성도 계산
  calculateDataCompleteness(missionaries) {
    if (missionaries.length === 0) return 0;
    
    const requiredFields = ['name', 'country', 'email', 'phone'];
    let totalCompleteness = 0;
    
    missionaries.forEach(missionary => {
      let fieldCount = 0;
      requiredFields.forEach(field => {
        if (missionary[field] && missionary[field].trim() !== '') {
          fieldCount++;
        }
      });
      totalCompleteness += (fieldCount / requiredFields.length) * 100;
    });
    
    return Math.round(totalCompleteness / missionaries.length);
  }

  // 등록된 후원자 수 계산
  calculateTotalSupporters(missionaries) {
    let totalSupporters = 0;
    
    missionaries.forEach(missionary => {
      // supporters 배열이 있는 경우 (새로운 형식)
      if (missionary.supporters && Array.isArray(missionary.supporters)) {
        totalSupporters += missionary.supporters.length;
      }
      // supporters 객체가 있는 경우 (기존 형식)
      else if (missionary.supporters && typeof missionary.supporters === 'object') {
        if (missionary.supporters.members && Array.isArray(missionary.supporters.members)) {
          totalSupporters += missionary.supporters.members.length;
        }
        if (missionary.supporters.chairman && missionary.supporters.chairman.name) {
          totalSupporters += 1;
        }
      }
      // 개별 후원자 필드가 있는 경우
      else {
        if (missionary.support_chairman && missionary.support_chairman.trim()) {
          totalSupporters += 1;
        }
        if (missionary.support_secretary && missionary.support_secretary.trim()) {
          totalSupporters += 1;
        }
      }
    });
    
    return totalSupporters;
  }

  // 차트 데이터 준비
  async prepareChartData(missionaries) {
    // 대륙별 분포 (아카이브 제외된 데이터)
    const continentData = {};
    missionaries.forEach(m => {
      let continent = this.getCountryContinent(m.country || '미지정');
      // 북미/남미 → 아메리카로 통합
      if (continent === '북미' || continent === '남미') continent = '아메리카';
      continentData[continent] = (continentData[continent] || 0) + 1;
    });
    // 월별 뉴스레터 등록 현황 (최근 12개월)
    const monthlyNewsletterData = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyNewsletterData[monthKey] = 0;
    }
    // 뉴스레터 데이터로 월별 집계
    const newsletters = await getAllNewsletters();
    newsletters.forEach(n => {
      if (n.createdAt || n.issueDate) {
        const date = new Date(n.createdAt || n.issueDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyNewsletterData.hasOwnProperty(monthKey)) {
          monthlyNewsletterData[monthKey]++;
        }
      }
    });
    this.chartData = {
      continents: continentData,
      monthly: monthlyNewsletterData
    };
  }

  // 국가-대륙 매핑 (아시아 세분화)
  getCountryContinent(country) {
    const continentMap = {
      // 동북아시아
      '한국': '동북아시아', '중국': '동북아시아', '일본': '동북아시아', '대만': '동북아시아', '몽골': '동북아시아',
      // 동남아시아
      '필리핀': '동남아시아', '태국': '동남아시아', '캄보디아': '동남아시아', '라오스': '동남아시아', '인도네시아': '동남아시아', '말레이시아': '동남아시아', '동티모르': '동남아시아', '베트남': '동남아시아', '싱가포르': '동남아시아',
      // 서남아시아
      '인도': '서남아시아', '파키스탄': '서남아시아', '네팔': '서남아시아', '이스라엘': '서남아시아', '방글라데시': '서남아시아', '스리랑카': '서남아시아', '아프가니스탄': '서남아시아',
      // 유럽
      '독일': '유럽', '프랑스': '유럽', '영국': '유럽', '이탈리아': '유럽', '스페인': '유럽',
      '네덜란드': '유럽', '벨기에': '유럽', '스위스': '유럽', '오스트리아': '유럽',
      '러시아': '유럽', '폴란드': '유럽', '체코': '유럽', '헝가리': '유럽', '불가리아': '유럽',
      // 북미
      '미국': '북미', '캐나다': '북미', '멕시코': '북미', '쿠바': '아메리카',
      // 남미
      '브라질': '남미', '아르헨티나': '남미', '칠레': '남미', '페루': '남미', '콜롬비아': '남미',
      '베네수엘라': '남미', '에콰도르': '남미', '볼리비아': '남미', '우루과이': '남미',
      // 아프리카
      '남아프리카공화국': '아프리카', '이집트': '아프리카', '나이지리아': '아프리카',
      '케냐': '아프리카', '에티오피아': '아프리카', '가나': '아프리카', '모로코': '아프리카',
      '탄자니아': '아프리카', '우간다': '아프리카', '짐바브웨': '아프리카',
      '부르키나파소': '아프리카', '말라위': '아프리카', '모리타니': '아프리카', '라이베리아': '아프리카',
      // 오세아니아
      '호주': '오세아니아', '뉴질랜드': '오세아니아', '파푸아뉴기니': '오세아니아'
    };
    return continentMap[country] || '기타';
  }

  // 국가별 테이블 렌더링 (대륙별 그룹화)
  renderCountryTable(missionaries) {
    const tableBody = document.getElementById('countryTableBody');
    if (!tableBody) return;

    // 국가별 데이터 집계
    const countryStats = {};
    const totalMissionaries = missionaries.length;

    missionaries.forEach(missionary => {
      const country = missionary.country || '미지정';
      if (!countryStats[country]) {
        countryStats[country] = {
          count: 0,
          active: 0,
          hasEmail: 0,
          hasPhone: 0,
          continent: this.getCountryContinent(country)
        };
      }
      
      countryStats[country].count++;
      
      // 연락처 정보 체크
      if (missionary.email) countryStats[country].hasEmail++;
      if (missionary.phone) countryStats[country].hasPhone++;
    });

    // 대륙별로 그룹화
    const continentGroups = {};
    Object.entries(countryStats).forEach(([country, stats]) => {
      const continent = stats.continent;
      if (!continentGroups[continent]) {
        continentGroups[continent] = [];
      }
      continentGroups[continent].push([country, stats]);
    });

    // 테이블 행 생성 (대륙별로)
    let rows = '';
    const continentOrder = ['동북아시아', '동남아시아', '서남아시아', '유럽', '아메리카', '오세아니아', '기타'];
    
    continentOrder.forEach(continent => {
      if (continentGroups[continent]) {
        // 대륙 헤더
        rows += `
          <tr class="continent-header">
            <td colspan="4"><strong>🌍 ${continent}</strong></td>
          </tr>
        `;
        
        // 해당 대륙의 국가들 (선교사 수 기준 내림차순)
        continentGroups[continent]
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([country, stats]) => {
            const percentage = ((stats.count / totalMissionaries) * 100).toFixed(1);
            const completeness = ((stats.hasEmail + stats.hasPhone) / (stats.count * 2) * 100);
            
            let statusClass = 'inactive';
            let statusText = '정보부족';
            
            if (completeness >= 80) {
              statusClass = 'active';
              statusText = '정보완료';
            } else if (completeness >= 40) {
              statusClass = 'partial';
              statusText = '정보부분';
            }

            rows += `
              <tr>
                <td class="country-name">　${country}</td>
                <td class="missionary-count">${stats.count}명</td>
                <td class="percentage">${percentage}%</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
              </tr>
            `;
          });
      }
    });

    tableBody.innerHTML = rows;
  }

  // 차트 초기화
  initCharts() {
    if (!this.chartData) return;
    // 대륙별 분포 차트
    const countryCtx = document.getElementById('countryChart');
    if (countryCtx) {
      this.charts.country = new Chart(countryCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(this.chartData.continents),
          datasets: [{
            data: Object.values(this.chartData.continents),
            backgroundColor: [
              '#3b82f6', // 동북아시아(진한 파랑)
              '#38bdf8', // 동남아시아(밝은 청록)
              '#06b6d4', // 서남아시아(청록)
              '#8b5cf6', // 유럽(보라)
              '#f59e0b', // 아메리카(주황)
              '#10b981', // 아프리카(초록)
              '#f97316', // 오세아니아(오렌지)
              '#6366f1'  // 기타(보라)
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
    
    // 월별 뉴스레터 등록 현황 차트
    const newsletterCtx = document.getElementById('newsletterChart');
    if (newsletterCtx) {
      const monthLabels = Object.keys(this.chartData.monthly).map(key => {
        const [year, month] = key.split('-');
        return `${year}년 ${month}월`;
      });
      
      this.charts.newsletter = new Chart(newsletterCtx, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            label: '뉴스레터 수',
            data: Object.values(this.chartData.monthly),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: '#10b981',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
    }
  }

  // 활동 내역 로딩
  async loadActivities() {
    try {
      const activities = await this.getRecentActivities();
      this.renderActivities(activities);
    } catch (error) {
      console.error('활동 내역 로딩 오류:', error);
      this.showToast('활동 내역을 불러오는 중 오류가 발생했습니다.', 'error');
    }
  }

  // 최근 활동 가져오기
  async getRecentActivities() {
    const activities = [];
    
    try {
      // 선교사 활동 (최근 10개)
      const missionaries = await getAllMissionaries();
      missionaries.slice(0, 10).forEach(m => {
        activities.push({
          type: 'add',
          title: `새 선교사 등록: ${m.name}`,
          time: m.createdAt || new Date().toISOString(),
          icon: '👥'
        });
      });
      
      // 뉴스레터 활동
      const newsletters = await getAllNewsletters();
      newsletters.slice(0, 5).forEach(n => {
        activities.push({
          type: 'newsletter',
          title: `뉴스레터 작성: ${n.title}`,
          time: n.createdAt || new Date().toISOString(),
          icon: '📝'
        });
      });
      
      // 시간순 정렬
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      return activities.slice(0, 15);
    } catch (error) {
      console.error('활동 데이터 가져오기 오류:', error);
      return [];
    }
  }

  // 활동 내역 렌더링
  renderActivities(activities) {
    const container = document.getElementById('activityList');
    if (!container) return;
    
    if (activities.length === 0) {
      container.innerHTML = '<p class="no-data">최근 활동이 없습니다.</p>';
      return;
    }
    
    container.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          ${activity.icon}
        </div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-time">${this.formatTime(activity.time)}</div>
        </div>
      </div>
    `).join('');
  }

  // 시간 포맷팅
  formatTime(timeString) {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}분 전`;
    } else if (hours < 24) {
      return `${hours}시간 전`;
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  }

  // 시스템 상태 확인
  async checkSystemStatus() {
    try {
      // Firebase 연결 상태 확인
      const firebaseStatus = document.getElementById('firebaseStatus');
      const databaseStatus = document.getElementById('databaseStatus');
      const storageStatus = document.getElementById('storageStatus');
      const lastSync = document.getElementById('lastSync');
      
      // Firebase 연결 테스트
      await firebase.firestore().collection('test').limit(1).get();
      firebaseStatus.textContent = '연결됨';
      firebaseStatus.className = 'status-value online';
      
      // 데이터베이스 상태
      const missionaries = await getAllMissionaries();
      databaseStatus.textContent = `${missionaries.length}개 문서`;
      databaseStatus.className = 'status-value online';
      
      // 스토리지 상태
      storageStatus.textContent = '정상';
      storageStatus.className = 'status-value online';
      
      // 마지막 동기화 시간
      const lastSyncTime = localStorage.getItem('lastSyncTime') || '없음';
      lastSync.textContent = lastSyncTime;
      lastSync.className = 'status-value online';
      
    } catch (error) {
      console.error('시스템 상태 확인 오류:', error);
      this.updateSystemStatus('offline');
    }
  }

  // 시스템 상태 업데이트
  updateSystemStatus(status) {
    const elements = ['firebaseStatus', 'databaseStatus', 'storageStatus'];
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = status === 'offline' ? '연결 안됨' : '확인 중...';
        element.className = `status-value ${status}`;
      }
    });
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 새로고침 버튼
    const refreshBtn = document.querySelector('.section-header .btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadActivities());
    }
  }

  // 토스트 메시지 표시
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.className = `toast ${type}`;
      toast.style.display = 'block';
      
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3000);
    }
  }
}

// 전역 함수들
window.showDataExport = function() {
  document.getElementById('dataExportModal').style.display = 'block';
};

window.closeDataExportModal = function() {
  document.getElementById('dataExportModal').style.display = 'none';
};

window.showSystemStatus = function() {
  document.getElementById('systemStatusModal').style.display = 'block';
  dashboard.checkSystemStatus();
};

window.closeSystemStatusModal = function() {
  document.getElementById('systemStatusModal').style.display = 'none';
};

window.refreshSystemStatus = function() {
  dashboard.checkSystemStatus();
};

window.refreshActivities = function() {
  dashboard.loadActivities();
};

window.exportData = async function() {
  try {
    const format = document.getElementById('exportFormat').value;
    const exportMissionaries = document.getElementById('exportMissionaries').checked;
    const exportNewsletters = document.getElementById('exportNewsletters').checked;
    const exportStatistics = document.getElementById('exportStatistics').checked;
    
    const data = {};
    
    if (exportMissionaries) {
      data.missionaries = await getAllMissionaries();
    }
    
    if (exportNewsletters) {
      data.newsletters = await getAllNewsletters();
    }
    
    if (exportStatistics) {
      data.statistics = {
        totalMissionaries: data.missionaries?.length || 0,
        totalNewsletters: data.newsletters?.length || 0,
        exportDate: new Date().toISOString()
      };
    }
    
    // 파일 다운로드
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missionary-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    dashboard.showToast('데이터가 성공적으로 내보내졌습니다.', 'success');
    closeDataExportModal();
    
  } catch (error) {
    console.error('데이터 내보내기 오류:', error);
    dashboard.showToast('데이터 내보내기 중 오류가 발생했습니다.', 'error');
  }
};

window.showSettings = function() {
  // 설정 페이지로 이동 또는 설정 모달 표시
  dashboard.showToast('설정 기능은 준비 중입니다.', 'info');
};

// 대시보드 클래스는 dashboard.html에서 초기화됩니다. 