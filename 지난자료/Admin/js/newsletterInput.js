// 뉴스레터 입력 페이지 기능
let selectedMissionaryData = null;
let missionariesData = [];

document.addEventListener('DOMContentLoaded', function() {
  console.log('📰 뉴스레터 입력 페이지 초기화 시작');
  
  // Firebase 연결 상태 확인
  const isFirebaseAvailable = typeof firebase !== 'undefined' && firebase.apps.length > 0;
  const useFirebase = isFirebaseAvailable && window.firebaseService;
  
  console.log('Firebase 사용 여부:', useFirebase);
  
  // DOM 요소들
  const elements = {
    missionarySearch: document.getElementById('missionarySearch'),
    autocompleteDropdown: document.getElementById('autocompleteDropdown'),
    selectedMissionary: document.getElementById('selectedMissionary'),
    selectedName: document.getElementById('selectedName'),
    selectedCountry: document.getElementById('selectedCountry'),
    selectedMission: document.getElementById('selectedMission'),
    newsletterDate: document.getElementById('newsletterDate'),
    isUrgent: document.getElementById('isUrgent'),
    newsletterSummary: document.getElementById('newsletterSummary'),
    newsletterContent: document.getElementById('newsletterContent'),
    summaryCharCount: document.getElementById('summaryCharCount'),
    contentCharCount: document.getElementById('contentCharCount'),
    newsletterForm: document.getElementById('newsletterForm'),
    firebaseStatus: document.getElementById('firebaseStatus')
  };

  // 초기화
  initPage();

  async function initPage() {
    try {
      // Firebase 상태 표시
      showFirebaseStatus();
      
      // 오늘 날짜 설정
      setCurrentDate();
      
      // 선교사 데이터 로드
      await loadMissionariesData();
      
      // 이벤트 리스너 설정
      setupEventListeners();
      
      // 글자 수 카운터 초기화
      updateCharCounts();
      
      // 임시저장 데이터 복원
      restoreDraft();
      
      console.log('✅ 뉴스레터 입력 페이지 초기화 완료');
      
    } catch (error) {
      console.error('❌ 페이지 초기화 중 오류:', error);
      showToast('페이지 초기화 중 오류가 발생했습니다.', 'error');
    }
  }

  // Firebase 상태 표시
  function showFirebaseStatus() {
    if (!elements.firebaseStatus) return;
    
    if (useFirebase) {
      elements.firebaseStatus.textContent = '🔥';
      elements.firebaseStatus.className = 'firebase-status-icon connected';
      elements.firebaseStatus.title = 'Firebase 연결됨 - 클라우드 모드';
    } else {
      elements.firebaseStatus.textContent = '🪵';
      elements.firebaseStatus.className = 'firebase-status-icon disconnected';
      elements.firebaseStatus.title = 'LocalStorage 모드 - 로컬 저장소 사용';
    }
  }

  // 선교사 데이터 로드
  async function loadMissionariesData() {
    try {
      if (useFirebase && window.getAllMissionaries) {
        console.log('📡 Firebase에서 선교사 데이터 로드 중...');
        missionariesData = await window.getAllMissionaries();
        console.log(`✅ Firebase에서 ${missionariesData.length}명의 선교사 데이터 로드 완료`);
      } else {
        console.log('📦 LocalStorage에서 선교사 데이터 로드 중...');
        const stored = localStorage.getItem('missionaries');
        missionariesData = stored ? JSON.parse(stored) : [];
        console.log(`✅ LocalStorage에서 ${missionariesData.length}명의 선교사 데이터 로드 완료`);
      }
    } catch (error) {
      console.error('❌ 선교사 데이터 로드 실패:', error);
      missionariesData = [];
      showToast('선교사 데이터를 불러오는데 실패했습니다.', 'error');
    }
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 선교사 검색
    if (elements.missionarySearch) {
      elements.missionarySearch.addEventListener('input', handleMissionarySearch);
      elements.missionarySearch.addEventListener('focus', handleMissionarySearch);
      elements.missionarySearch.addEventListener('keydown', handleKeyboardNavigation);
    }
    
    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', handleOutsideClick);
    
    // 글자 수 카운터
    if (elements.newsletterSummary) {
      elements.newsletterSummary.addEventListener('input', updateCharCounts);
    }
    if (elements.newsletterContent) {
      elements.newsletterContent.addEventListener('input', updateCharCounts);
    }
    
    // 폼 제출
    if (elements.newsletterForm) {
      elements.newsletterForm.addEventListener('submit', handleFormSubmit);
    }

    // 임시저장 (5분마다)
    setInterval(saveDraft, 5 * 60 * 1000);
  }

  // 선교사 검색 처리
  function handleMissionarySearch() {
    const query = elements.missionarySearch.value.trim().toLowerCase();
    
    if (query.length < 1) {
      hideAutocompleteDropdown();
      return;
    }

    const results = missionariesData.filter(missionary => 
      missionary.name && missionary.name.toLowerCase().includes(query)
    ).slice(0, 10); // 최대 10개 결과

    if (results.length > 0) {
      showAutocompleteDropdown(results);
    } else {
      hideAutocompleteDropdown();
    }
  }

  // 자동완성 드롭다운 표시
  function showAutocompleteDropdown(results) {
    if (!elements.autocompleteDropdown) return;
    
    const html = results.map((missionary, index) => `
      <div class="autocomplete-item" data-index="${index}" onclick="selectMissionary(${JSON.stringify(missionary).replace(/"/g, '&quot;')})">
        <div class="missionary-name">${missionary.name}</div>
        <div class="missionary-details">${missionary.country || ''} | ${missionary.mission || ''}</div>
      </div>
    `).join('');
    
    elements.autocompleteDropdown.innerHTML = html;
    elements.autocompleteDropdown.style.display = 'block';
  }

  // 자동완성 드롭다운 숨기기
  function hideAutocompleteDropdown() {
    if (elements.autocompleteDropdown) {
      elements.autocompleteDropdown.style.display = 'none';
    }
  }

  // 선교사 선택
  window.selectMissionary = function(missionary) {
    selectedMissionaryData = missionary;
    
    if (elements.selectedName) elements.selectedName.textContent = missionary.name || '';
    if (elements.selectedCountry) elements.selectedCountry.textContent = missionary.country || '';
    if (elements.selectedMission) elements.selectedMission.textContent = missionary.mission || '';
    
    if (elements.selectedMissionary) elements.selectedMissionary.style.display = 'block';
    if (elements.missionarySearch) elements.missionarySearch.value = '';
    
    hideAutocompleteDropdown();
    console.log('✅ 선교사 선택:', missionary.name);
  };

  // 선교사 선택 해제
  window.clearMissionarySelection = function() {
    selectedMissionaryData = null;
    
    if (elements.selectedMissionary) elements.selectedMissionary.style.display = 'none';
    if (elements.missionarySearch) elements.missionarySearch.value = '';
    
    console.log('🗑️ 선교사 선택 해제');
  };

  // 키보드 네비게이션
  function handleKeyboardNavigation(e) {
    const dropdown = elements.autocompleteDropdown;
    if (!dropdown || dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.autocomplete-item');
    const currentActive = dropdown.querySelector('.autocomplete-item.active');
    let currentIndex = currentActive ? parseInt(currentActive.dataset.index) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentIndex = Math.min(currentIndex + 1, items.length - 1);
      highlightItem(currentIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentIndex = Math.max(currentIndex - 1, 0);
      highlightItem(currentIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentActive) {
        currentActive.click();
      }
    } else if (e.key === 'Escape') {
      hideAutocompleteDropdown();
    }
  }

  // 아이템 하이라이트
  function highlightItem(index) {
    const dropdown = elements.autocompleteDropdown;
    if (!dropdown) return;

    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach(item => item.classList.remove('active'));
    
    if (items[index]) {
      items[index].classList.add('active');
    }
  }

  // 외부 클릭 처리
  function handleOutsideClick(e) {
    if (!elements.missionarySearch || !elements.autocompleteDropdown) return;
    
    if (!elements.missionarySearch.contains(e.target) && !elements.autocompleteDropdown.contains(e.target)) {
      hideAutocompleteDropdown();
    }
  }

  // 현재 날짜 설정
  function setCurrentDate() {
    if (elements.newsletterDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.newsletterDate.value = today;
    }
  }

  // 글자 수 카운터 업데이트
  function updateCharCounts() {
    if (elements.newsletterSummary && elements.summaryCharCount) {
      const summaryLength = elements.newsletterSummary.value.length;
      elements.summaryCharCount.textContent = summaryLength;
      elements.summaryCharCount.style.color = summaryLength > 200 ? 'red' : '';
    }

    if (elements.newsletterContent && elements.contentCharCount) {
      const contentLength = elements.newsletterContent.value.length;
      elements.contentCharCount.textContent = contentLength;
      elements.contentCharCount.style.color = contentLength > 5000 ? 'red' : '';
    }
  }

  // 폼 제출 처리
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    try {
      submitButton.disabled = true;
      submitButton.textContent = '저장 중...';

      const newsletterData = {
        id: generateNewsletterId(),
        missionaryId: selectedMissionaryData?.id || '',
        missionaryName: selectedMissionaryData?.name || '',
        date: elements.newsletterDate.value,
        isUrgent: elements.isUrgent.checked,
        summary: elements.newsletterSummary.value.trim(),
        content: elements.newsletterContent.value.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveNewsletter(newsletterData);
      
      showToast('뉴스레터가 성공적으로 저장되었습니다!', 'success');
      
      // 폼 초기화
      setTimeout(() => {
        resetForm();
      }, 1000);

    } catch (error) {
      console.error('❌ 뉴스레터 저장 실패:', error);
      showToast('뉴스레터 저장에 실패했습니다.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }

  // 폼 검증
  function validateForm() {
    if (!selectedMissionaryData) {
      showToast('선교사를 선택해주세요.', 'warning');
      elements.missionarySearch.focus();
      return false;
    }

    if (!elements.newsletterDate.value) {
      showToast('발행일을 입력해주세요.', 'warning');
      elements.newsletterDate.focus();
      return false;
    }

    if (!elements.newsletterContent.value.trim()) {
      showToast('본문 내용을 입력해주세요.', 'warning');
      elements.newsletterContent.focus();
      return false;
    }

    if (elements.newsletterSummary.value.length > 200) {
      showToast('요약은 200자 이하로 입력해주세요.', 'warning');
      elements.newsletterSummary.focus();
      return false;
    }

    if (elements.newsletterContent.value.length > 5000) {
      showToast('본문 내용은 5000자 이하로 입력해주세요.', 'warning');
      elements.newsletterContent.focus();
      return false;
    }

    return true;
  }

  // 뉴스레터 ID 생성
  function generateNewsletterId() {
    return 'newsletter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 뉴스레터 저장
  async function saveNewsletter(data) {
    if (useFirebase) {
      await saveNewsletterToFirebase(data);
    } else {
      await saveNewsletterToLocalStorage(data);
    }
  }

  // Firebase에 저장
  async function saveNewsletterToFirebase(data) {
    try {
      if (window.firebaseService) {
        // Firebase 서비스를 사용하여 저장 (선교사 정보 자동 업데이트 포함)
        await window.firebaseService.addNewsletter(data);
        console.log('✅ Firebase 서비스를 통해 뉴스레터 저장 완료:', data.id);
      } else {
        // 기존 방식으로 저장
        const db = firebase.firestore();
        await db.collection('newsletters').doc(data.id).set(data);
        console.log('✅ Firebase에 뉴스레터 저장 완료:', data.id);
      }
    } catch (error) {
      console.error('❌ Firebase 저장 실패:', error);
      throw error;
    }
  }

  // LocalStorage에 저장
  async function saveNewsletterToLocalStorage(data) {
    try {
      const stored = localStorage.getItem('newsletters');
      const newsletters = stored ? JSON.parse(stored) : [];
      
      // 기존 뉴스레터 업데이트 또는 새로 추가
      const existingIndex = newsletters.findIndex(n => n.id === data.id);
      if (existingIndex >= 0) {
        newsletters[existingIndex] = data;
      } else {
        newsletters.push(data);
      }
      
      localStorage.setItem('newsletters', JSON.stringify(newsletters));
      console.log('✅ LocalStorage에 뉴스레터 저장 완료:', data.id);
    } catch (error) {
      console.error('❌ LocalStorage 저장 실패:', error);
      throw error;
    }
  }

  // 임시저장
  function saveDraft() {
    if (!elements.newsletterContent.value.trim()) return;

    const draftData = {
      missionaryData: selectedMissionaryData,
      date: elements.newsletterDate.value,
      isUrgent: elements.isUrgent.checked,
      summary: elements.newsletterSummary.value,
      content: elements.newsletterContent.value,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('newsletter_draft', JSON.stringify(draftData));
    console.log('💾 임시저장 완료');
  }

  // 임시저장 데이터 복원
  function restoreDraft() {
    try {
      const draft = localStorage.getItem('newsletter_draft');
      if (!draft) return;

      const draftData = JSON.parse(draft);
      const savedTime = new Date(draftData.savedAt);
      const now = new Date();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

      // 24시간 이내의 임시저장만 복원
      if (hoursDiff > 24) {
        localStorage.removeItem('newsletter_draft');
        return;
      }

      if (confirm('임시저장된 데이터가 있습니다. 복원하시겠습니까?')) {
        if (draftData.missionaryData) {
          window.selectMissionary(draftData.missionaryData);
        }
        if (draftData.date) elements.newsletterDate.value = draftData.date;
        if (draftData.isUrgent) elements.isUrgent.checked = draftData.isUrgent;
        if (draftData.summary) elements.newsletterSummary.value = draftData.summary;
        if (draftData.content) elements.newsletterContent.value = draftData.content;
        
        updateCharCounts();
        console.log('✅ 임시저장 데이터 복원 완료');
      }
    } catch (error) {
      console.error('❌ 임시저장 복원 실패:', error);
      localStorage.removeItem('newsletter_draft');
    }
  }

  // 폼 초기화
  window.resetForm = function() {
    if (confirm('모든 입력 내용이 삭제됩니다. 계속하시겠습니까?')) {
      elements.newsletterForm.reset();
      window.clearMissionarySelection();
      setCurrentDate();
      updateCharCounts();
      localStorage.removeItem('newsletter_draft');
      console.log('🗑️ 폼 초기화 완료');
    }
  };

  // 토스트 메시지 표시
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  console.log('📰 뉴스레터 입력 모듈 로드 완료');
});

// 전역 함수들을 window 객체에 등록
window.selectMissionary = window.selectMissionary || function() {};
window.clearMissionarySelection = window.clearMissionarySelection || function() {};
window.resetForm = window.resetForm || function() {}; 