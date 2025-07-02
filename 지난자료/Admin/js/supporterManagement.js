// 후원자 관리 페이지 JavaScript

class SupporterManagement {
  constructor() {
    this.supporters = [];
    this.missionaries = [];
    this.filteredSupporters = [];
    this.currentSupporter = null;
    this.isEditMode = false;
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.setupMissionarySearch();
    this.renderSupporterList();
    this.updateStats();
  }

  // 데이터 로드
  async loadData() {
    try {
      // 선교사 데이터 로드
      this.missionaries = await this.getAllMissionaries();
      
      // 후원자 데이터 수집 (모든 선교사의 후원자 정보)
      this.supporters = this.collectAllSupporters();
      this.filteredSupporters = [...this.supporters];
      
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      this.showToast('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    }
  }

  // 모든 선교사 데이터 가져오기
  async getAllMissionaries() {
    try {
      const snapshot = await firebase.firestore().collection('missionaries').get();
      const missionaries = [];
      snapshot.forEach(doc => {
        missionaries.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return missionaries.filter(m => m.status !== 'archived' && m.status !== '아카이브');
    } catch (error) {
      console.error('선교사 데이터 가져오기 오류:', error);
      return [];
    }
  }

  // 모든 후원자 데이터 수집
  collectAllSupporters() {
    const allSupporters = [];
    
    this.missionaries.forEach(missionary => {
      // supporters 배열이 있는 경우 (새로운 형식)
      if (missionary.supporters && Array.isArray(missionary.supporters)) {
        missionary.supporters.forEach(supporter => {
          allSupporters.push({
            ...supporter,
            missionaryId: missionary.id,
            missionaryName: missionary.name,
            missionaryCountry: missionary.country
          });
        });
      }
      // supporters 객체가 있는 경우 (기존 형식)
      else if (missionary.supporters && typeof missionary.supporters === 'object') {
        if (missionary.supporters.members && Array.isArray(missionary.supporters.members)) {
          missionary.supporters.members.forEach(supporter => {
            allSupporters.push({
              ...supporter,
              missionaryId: missionary.id,
              missionaryName: missionary.name,
              missionaryCountry: missionary.country
            });
          });
        }
        if (missionary.supporters.chairman && missionary.supporters.chairman.name) {
          allSupporters.push({
            ...missionary.supporters.chairman,
            missionaryId: missionary.id,
            missionaryName: missionary.name,
            missionaryCountry: missionary.country
          });
        }
      }
      // 개별 후원자 필드가 있는 경우
      else {
        if (missionary.support_chairman && missionary.support_chairman.trim()) {
          allSupporters.push({
            name: missionary.support_chairman,
            missionaryId: missionary.id,
            missionaryName: missionary.name,
            missionaryCountry: missionary.country,
            type: 'chairman'
          });
        }
        if (missionary.support_secretary && missionary.support_secretary.trim()) {
          allSupporters.push({
            name: missionary.support_secretary,
            missionaryId: missionary.id,
            missionaryName: missionary.name,
            missionaryCountry: missionary.country,
            type: 'secretary'
          });
        }
      }
    });
    
    return allSupporters;
  }

  // 선교사 실시간 검색 기능 설정
  setupMissionarySearch() {
    const searchInput = document.getElementById('missionarySearch');
    const resultsContainer = document.getElementById('missionarySearchResults');
    const hiddenInput = document.getElementById('missionaryId');
    
    if (!searchInput || !resultsContainer || !hiddenInput) return;
    
    let searchTimeout;
    let selectedIndex = -1;
    let searchResults = [];
    
    // 입력 이벤트
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 1) {
        resultsContainer.style.display = 'none';
        hiddenInput.value = '';
        return;
      }
      
      searchTimeout = setTimeout(() => {
        this.performMissionarySearch(query, resultsContainer, hiddenInput);
      }, 300);
    });
    
    // 키보드 이벤트
    searchInput.addEventListener('keydown', (e) => {
      if (!resultsContainer.style.display || resultsContainer.style.display === 'none') return;
      
      const items = resultsContainer.querySelectorAll('.search-result-item');
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
          this.updateSearchSelection(items, selectedIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, -1);
          this.updateSearchSelection(items, selectedIndex);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && items[selectedIndex]) {
            this.selectMissionary(items[selectedIndex], searchInput, hiddenInput, resultsContainer);
          }
          break;
        case 'Escape':
          resultsContainer.style.display = 'none';
          selectedIndex = -1;
          break;
      }
    });
    
    // 포커스 아웃 이벤트
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        resultsContainer.style.display = 'none';
        selectedIndex = -1;
      }, 200);
    });
  }
  
  // 선교사 검색 수행
  performMissionarySearch(query, resultsContainer, hiddenInput) {
    const results = this.missionaries.filter(missionary => 
      missionary.name && missionary.name.toLowerCase().includes(query.toLowerCase()) ||
      missionary.country && missionary.country.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // 최대 10개 결과
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="search-result-item">검색 결과가 없습니다.</div>';
    } else {
      resultsContainer.innerHTML = results.map(missionary => `
        <div class="search-result-item" data-missionary-id="${missionary.id}" data-missionary-name="${missionary.name}">
          <div class="search-result-name">${missionary.name}</div>
          <div class="search-result-country">${missionary.country}</div>
        </div>
      `).join('');
      
      // 클릭 이벤트 추가
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          this.selectMissionary(item, document.getElementById('missionarySearch'), hiddenInput, resultsContainer);
        });
      });
    }
    
    resultsContainer.style.display = 'block';
  }
  
  // 검색 결과 선택 업데이트
  updateSearchSelection(items, selectedIndex) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedIndex);
    });
  }
  
  // 선교사 선택
  selectMissionary(item, searchInput, hiddenInput, resultsContainer) {
    const missionaryId = item.dataset.missionaryId;
    const missionaryName = item.dataset.missionaryName;
    
    searchInput.value = missionaryName;
    hiddenInput.value = missionaryId;
    resultsContainer.style.display = 'none';
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 검색 버튼
    document.getElementById('btn-search').addEventListener('click', () => {
      this.performSearch();
    });

    // 초기화 버튼
    document.getElementById('btn-clear').addEventListener('click', () => {
      this.clearSearch();
    });

    // 후원자 추가 버튼
    document.getElementById('btn-add-supporter').addEventListener('click', () => {
      this.openAddModal();
    });

    // 새로고침 버튼
    document.getElementById('btn-refresh').addEventListener('click', () => {
      this.refreshData();
    });

    // 내보내기 버튼
    document.getElementById('btn-export').addEventListener('click', () => {
      this.exportData();
    });

    // 검색 입력 필드 엔터 키 이벤트
    ['searchMissionary', 'searchSupporter', 'searchCountry'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.performSearch();
          }
        });
      }
    });
  }

  // 검색 수행
  performSearch() {
    const missionaryQuery = document.getElementById('searchMissionary').value.toLowerCase();
    const supporterQuery = document.getElementById('searchSupporter').value.toLowerCase();
    const countryQuery = document.getElementById('searchCountry').value.toLowerCase();

    this.filteredSupporters = this.supporters.filter(supporter => {
      const missionaryMatch = !missionaryQuery || 
        (supporter.missionaryName && supporter.missionaryName.toLowerCase().includes(missionaryQuery));
      
      const supporterMatch = !supporterQuery || 
        (supporter.name && supporter.name.toLowerCase().includes(supporterQuery));
      
      const countryMatch = !countryQuery || 
        (supporter.missionaryCountry && supporter.missionaryCountry.toLowerCase().includes(countryQuery));

      return missionaryMatch && supporterMatch && countryMatch;
    });

    this.renderSupporterList();
    this.updateStats();
  }

  // 검색 초기화
  clearSearch() {
    document.getElementById('searchMissionary').value = '';
    document.getElementById('searchSupporter').value = '';
    document.getElementById('searchCountry').value = '';
    
    this.filteredSupporters = [...this.supporters];
    this.renderSupporterList();
    this.updateStats();
  }

  // 후원자 리스트 렌더링
  renderSupporterList() {
    const container = document.getElementById('supporterList');
    if (!container) return;

    if (this.filteredSupporters.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💝</div>
          <p>검색 결과가 없습니다.</p>
        </div>
      `;
      return;
    }

    const html = this.filteredSupporters.map(supporter => this.renderSupporterItem(supporter)).join('');
    container.innerHTML = html;
  }

  // 후원자 아이템 렌더링
  renderSupporterItem(supporter) {
    return `
      <div class="supporter-item" data-supporter-id="${supporter.id || 'temp_' + Date.now()}">
        <div class="supporter-header">
          <div class="supporter-info">
            <div class="supporter-name">${supporter.name || '이름 없음'}</div>
            <div class="supporter-relation">${supporter.relation || '관계 정보 없음'}</div>
            <div class="supporter-missionary">👤 ${supporter.missionaryName} (${supporter.missionaryCountry})</div>
          </div>
          <div class="supporter-actions">
            <button class="btn btn-small" onclick="supporterManager.editSupporter('${supporter.id || 'temp_' + Date.now()}')">
              ✏️ 수정
            </button>
            <button class="btn btn-small btn-danger" onclick="supporterManager.deleteSupporter('${supporter.id || 'temp_' + Date.now()}')">
              🗑️ 삭제
            </button>
          </div>
        </div>
        <div class="supporter-details">
          <div class="detail-item">
            <div class="detail-label">연락처</div>
            <div class="detail-value ${!supporter.contact ? 'empty' : ''}">${supporter.contact || '미입력'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">후원금액</div>
            <div class="detail-value ${!supporter.amount ? 'empty' : ''}">${supporter.amount ? supporter.amount + '원' : '미입력'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">비고</div>
            <div class="detail-value ${!supporter.notes ? 'empty' : ''}">${supporter.notes || '미입력'}</div>
          </div>
        </div>
      </div>
    `;
  }

  // 통계 업데이트
  updateStats() {
    document.getElementById('searchResultCount').textContent = this.filteredSupporters.length;
    document.getElementById('totalSupporterCount').textContent = this.supporters.length;
  }

  // 후원자 추가 모달 열기
  openAddModal() {
    this.isEditMode = false;
    this.currentSupporter = null;
    
    document.getElementById('modalTitle').textContent = '후원자 추가';
    document.getElementById('supporterForm').reset();
    document.getElementById('missionarySearch').value = '';
    document.getElementById('missionaryId').value = '';
    document.getElementById('supporterModal').style.display = 'flex';
  }

  // 후원자 수정 모달 열기
  editSupporter(supporterId) {
    this.isEditMode = true;
    this.currentSupporter = this.filteredSupporters.find(s => s.id === supporterId);
    
    if (!this.currentSupporter) {
      this.showToast('후원자를 찾을 수 없습니다.', 'error');
      return;
    }
    
    document.getElementById('modalTitle').textContent = '후원자 수정';
    this.fillSupporterForm(this.currentSupporter);
    document.getElementById('supporterModal').style.display = 'flex';
  }

  // 폼에 후원자 데이터 채우기
  fillSupporterForm(supporter) {
    document.getElementById('supporterName').value = supporter.name || '';
    document.getElementById('supporterRelation').value = supporter.relation || '';
    document.getElementById('supporterContact').value = supporter.contact || '';
    document.getElementById('supporterAmount').value = supporter.amount || '';
    document.getElementById('supporterNotes').value = supporter.notes || '';
    
    // 선교사 정보 설정
    const missionary = this.missionaries.find(m => m.id === supporter.missionaryId);
    if (missionary) {
      document.getElementById('missionarySearch').value = missionary.name || '';
      document.getElementById('missionaryId').value = missionary.id || '';
    } else {
      document.getElementById('missionarySearch').value = '';
      document.getElementById('missionaryId').value = '';
    }
  }

  // 후원자 저장
  async saveSupporter() {
    const form = document.getElementById('supporterForm');
    const formData = new FormData(form);
    
    const supporterData = {
      name: formData.get('name'),
      relation: formData.get('relation'),
      contact: formData.get('contact'),
      amount: formData.get('amount'),
      notes: formData.get('notes'),
      missionaryId: formData.get('missionaryId')
    };

    // 유효성 검사
    if (!supporterData.name || !supporterData.missionaryId) {
      this.showToast('후원자 이름과 지원 선교사를 입력해주세요.', 'error');
      return;
    }

    try {
      if (this.isEditMode) {
        await this.updateSupporterInFirestore(supporterData);
      } else {
        await this.addSupporterToFirestore(supporterData);
      }
      
      this.closeSupporterModal();
      await this.refreshData();
      this.showToast(this.isEditMode ? '후원자가 수정되었습니다.' : '후원자가 추가되었습니다.', 'success');
      
    } catch (error) {
      console.error('후원자 저장 오류:', error);
      this.showToast('저장 중 오류가 발생했습니다.', 'error');
    }
  }

  // Firestore에 후원자 추가
  async addSupporterToFirestore(supporterData) {
    const missionary = this.missionaries.find(m => m.id === supporterData.missionaryId);
    if (!missionary) throw new Error('선교사를 찾을 수 없습니다.');

    // 기존 supporters 배열에 추가
    const existingSupporters = missionary.supporters || [];
    const newSupporter = {
      id: 'supporter_' + Date.now(),
      ...supporterData,
      missionaryName: missionary.name,
      missionaryCountry: missionary.country
    };
    
    existingSupporters.push(newSupporter);
    
    await firebase.firestore().collection('missionaries').doc(missionary.id).update({
      supporters: existingSupporters
    });
  }

  // Firestore에서 후원자 수정
  async updateSupporterInFirestore(supporterData) {
    if (!this.currentSupporter) throw new Error('수정할 후원자 정보가 없습니다.');

    const missionary = this.missionaries.find(m => m.id === supporterData.missionaryId);
    if (!missionary) throw new Error('선교사를 찾을 수 없습니다.');

    const existingSupporters = missionary.supporters || [];
    const supporterIndex = existingSupporters.findIndex(s => s.id === this.currentSupporter.id);
    
    if (supporterIndex === -1) throw new Error('후원자를 찾을 수 없습니다.');

    existingSupporters[supporterIndex] = {
      ...existingSupporters[supporterIndex],
      ...supporterData,
      missionaryName: missionary.name,
      missionaryCountry: missionary.country
    };

    await firebase.firestore().collection('missionaries').doc(missionary.id).update({
      supporters: existingSupporters
    });
  }

  // 후원자 삭제
  deleteSupporter(supporterId) {
    const supporter = this.filteredSupporters.find(s => s.id === supporterId);
    if (!supporter) {
      this.showToast('후원자를 찾을 수 없습니다.', 'error');
      return;
    }

    document.getElementById('deleteSupporterName').textContent = supporter.name;
    document.getElementById('deleteModal').style.display = 'flex';
    this.currentSupporter = supporter;
  }

  // 삭제 확인
  async confirmDeleteSupporter() {
    if (!this.currentSupporter) return;

    try {
      await this.deleteSupporterFromFirestore(this.currentSupporter);
      this.closeDeleteModal();
      await this.refreshData();
      this.showToast('후원자가 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('후원자 삭제 오류:', error);
      this.showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  // Firestore에서 후원자 삭제
  async deleteSupporterFromFirestore(supporter) {
    const missionary = this.missionaries.find(m => m.id === supporter.missionaryId);
    if (!missionary) throw new Error('선교사를 찾을 수 없습니다.');

    const existingSupporters = missionary.supporters || [];
    const filteredSupporters = existingSupporters.filter(s => s.id !== supporter.id);

    await firebase.firestore().collection('missionaries').doc(missionary.id).update({
      supporters: filteredSupporters
    });
  }

  // 데이터 새로고침
  async refreshData() {
    await this.loadData();
    this.renderSupporterList();
    this.updateStats();
  }

  // 데이터 내보내기
  exportData() {
    const data = this.filteredSupporters.map(supporter => ({
      '후원자 이름': supporter.name,
      '관계': supporter.relation,
      '연락처': supporter.contact,
      '후원금액': supporter.amount,
      '비고': supporter.notes,
      '지원 선교사': supporter.missionaryName,
      '선교사 국가': supporter.missionaryCountry
    }));

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `후원자목록_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // CSV 변환
  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return '\ufeff' + csvContent; // BOM for Korean
  }

  // 모달 닫기
  closeSupporterModal() {
    document.getElementById('supporterModal').style.display = 'none';
    this.currentSupporter = null;
  }

  closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    this.currentSupporter = null;
  }

  // 토스트 메시지
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// 전역 함수들
window.supporterManager = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.supporterManager = new SupporterManagement();
});

// 전역 함수 등록
window.saveSupporter = () => window.supporterManager?.saveSupporter();
window.closeSupporterModal = () => window.supporterManager?.closeSupporterModal();
window.closeDeleteModal = () => window.supporterManager?.closeDeleteModal();
window.confirmDeleteSupporter = () => window.supporterManager?.confirmDeleteSupporter();
