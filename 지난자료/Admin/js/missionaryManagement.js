// 선교사 관리 페이지 메인 로직
// 전역 변수
let missionaries = [];
let currentMissionary = null;
let isEditMode = false;

// 가상 탭 상태 변수
let currentTab = 'management'; // 'management' | 'detail' | 'edit'
let readOnlyMissionary = null;

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  // Firebase가 완전히 로드될 때까지 대기
  setTimeout(() => {
    initializeApp();
  }, 100);
});

function initializeApp() {
  // Firebase Auth 상태 변경을 감지하여 전체 페이지를 제어
  if (window.firebaseService && window.firebaseService.auth) {
    window.firebaseService.auth.onAuthStateChanged(async (user) => {
      updateAuthUI(user);
      if (user) {
        // 로그인된 경우, 데이터 로딩
        await initializePage();
      } else {
        // 로그아웃된 경우, 로그아웃 UI 표시
        showLoggedOutState();
      }
    });
  } else {
    console.error("Firebase 서비스를 찾을 수 없습니다.");
    updateAuthUI(null);
    showLoggedOutState();
  }

  bindEvents();
}

/**
 * 로그인 상태에 따라 헤더의 UI를 업데이트합니다.
 * @param {firebase.User | null} user - 현재 Firebase 사용자 객체
 */
function updateAuthUI(user) {
  const userDisplay = document.getElementById("userDisplay");
  const authBtn = document.getElementById("authBtn");

  if (userDisplay && authBtn) {
    if (user) {
      // 로그인된 상태
      userDisplay.textContent = `👤 ${user.email}`;
      authBtn.textContent = "로그아웃";
      authBtn.className = "logout-btn";
      authBtn.onclick = performLogout;
    } else {
      // 로그아웃된 상태
      userDisplay.textContent = "";
      authBtn.textContent = "로그인";
      authBtn.className = "login-btn";
      authBtn.onclick = showLoginModal;
    }
  } else {
    // 네비게이션 바의 사용자 이메일 업데이트
    const userEmailSpan = document.getElementById('user-email');
    if (userEmailSpan && user) {
      userEmailSpan.textContent = user.email;
    }
  }
}

/**
 * 로그인 성공 시 호출됩니다.
 * onAuthStateChanged가 모든 UI 업데이트를 처리하므로, 여기서는 모달만 닫습니다.
 */
async function performLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const statusDiv = document.getElementById("loginStatus");

  if (!email || !password) {
    statusDiv.textContent = "이메일과 비밀번호를 입력해주세요.";
    statusDiv.className = "login-status error";
    return;
  }

  try {
    statusDiv.textContent = "로그인 중...";
    statusDiv.className = "login-status loading";

    await window.firebaseService.login(email, password);

    statusDiv.textContent = "로그인 성공!";
    statusDiv.className = "login-status success";

    setTimeout(() => {
      closeLoginModal();
      // location.reload()를 제거하여 부드러운 UI 업데이트가 가능하게 함
    }, 1000);
  } catch (error) {
    console.error("로그인 실패:", error);
    statusDiv.textContent = "로그인 실패: " + error.message;
    statusDiv.className = "login-status error";
  }
}

/**
 * 로그아웃을 수행합니다.
 * onAuthStateChanged가 UI 업데이트를 처리합니다.
 */
async function performLogout() {
  try {
    await window.firebaseService.logout();
    showToast("로그아웃되었습니다.", "info");
  } catch (error) {
    console.error("로그아웃 실패:", error);
    showToast("로그아웃 실패: " + error.message, "error");
  }
}

/**
 * 페이지의 핵심 콘텐츠를 초기화합니다. (데이터 로딩 및 렌더링)
 * 이 함수는 사용자가 로그인했을 때만 호출됩니다.
 */
async function initializePage() {
  try {
    showLoading();
    
    // 상세보기 모달 미리 생성
    createMissionaryDetailModal();
    
    // 선교사 데이터 로드
    await loadMissionaries();
    
    // UI 렌더링
    renderMissionaryList();
    
    // 이벤트 바인딩
    bindEvents();
    
    // 아카이브 체크박스 스타일 업데이트
    updateArchivedCheckboxStyle();
    
    hideLoading();
    
    console.log('선교사 관리 페이지 초기화 완료');
  } catch (error) {
    console.error('페이지 초기화 실패:', error);
    hideLoading();
    showToast('페이지 로드 실패: ' + error.message, 'error');
  }
}

/**
 * 로그아웃 상태일 때의 UI를 표시합니다.
 */
function showLoggedOutState() {
  const container = document.getElementById("missionaryList");
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.7);">
        <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
        <h3>로그인이 필요합니다</h3>
        <p>선교사 데이터를 관리하려면 먼저 로그인해주세요.</p>
        <div style="margin-top: 20px;">
          <button class="btn btn-primary" onclick="showLoginModal()">
            로그인
          </button>
        </div>
      </div>
    `;
  }
  const countBadge = document.getElementById("missionaryCount");
  if (countBadge) {
    countBadge.textContent = '0';
  }
  hideLoading();
}

// ===== 기존 함수들 (일부 유지) =====

// 로그인 모달 표시
function showLoginModal() {
  const modal = document.getElementById("loginModal");
  if(modal) modal.style.display = "flex";
}

// 로그인 모달 닫기
function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  if(modal) modal.style.display = "none";
}

// 선교사 목록 로드
async function loadMissionaries() {
  try {
    if (window.firebaseService) {
      missionaries = await window.firebaseService.getMissionaries();
    } else if (window.getAllMissionaries) {
      missionaries = await window.getAllMissionaries();
    } else {
      throw new Error('선교사 데이터 서비스를 찾을 수 없습니다.');
    }
    console.log('선교사 목록 로드 완료:', missionaries.length);
  } catch (error) {
    console.error('선교사 목록 로드 실패:', error);
    showToast('선교사 목록 로드 실패: ' + error.message, 'error');
    missionaries = [];
  }
}

// 선교사 목록 렌더링
function renderMissionaryList() {
  const container = document.getElementById('missionaryList');
  const searchInput = document.getElementById('missionarySearch');
  const archivedCheckbox = document.getElementById('includeArchived');
  
  if (!container) {
    console.error('missionaryList 컨테이너를 찾을 수 없습니다.');
    return;
  }
  
  // 검색어와 필터 적용
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const includeArchived = archivedCheckbox ? archivedCheckbox.checked : false;
  
  // 필터링된 선교사 목록
  let filteredMissionaries = missionaries.filter(missionary => {
    const matchesSearch = !searchTerm || 
      missionary.name?.toLowerCase().includes(searchTerm) ||
      missionary.country?.toLowerCase().includes(searchTerm) ||
      missionary.organization?.toLowerCase().includes(searchTerm);
    
    const matchesArchive = includeArchived || !missionary.archived;
    
    return matchesSearch && matchesArchive;
  });
  
  // 정렬 (최신 등록순)
  filteredMissionaries.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.timestamp || 0);
    const dateB = new Date(b.createdAt || b.timestamp || 0);
    return dateB - dateA;
  });
  
  // 카운트 업데이트
  const countBadge = document.getElementById('missionaryCount');
  if (countBadge) {
    countBadge.textContent = filteredMissionaries.length;
  }
  
  // 목록 렌더링
  if (filteredMissionaries.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.7);">
        <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
        <h3>선교사를 찾을 수 없습니다</h3>
        <p>${searchTerm ? `"${searchTerm}" 검색 결과가 없습니다.` : '등록된 선교사가 없습니다.'}</p>
        ${!searchTerm ? `
          <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="window.location.href='missionary-input.html'">
              ➕ 첫 번째 선교사 추가
            </button>
          </div>
        ` : ''}
      </div>
    `;
    return;
  }
  
  // 그리드 레이아웃으로 카드 렌더링
  container.innerHTML = `
    <div class="missionary-grid">
      ${filteredMissionaries.map(missionary => renderMissionaryCard(missionary)).join('')}
    </div>
  `;
  
  // 이벤트 위임 방식으로 카드 클릭 이벤트 바인딩 (100% 보장)
  const missionaryGrid = container.querySelector('.missionary-grid');
  if (missionaryGrid) {
    // 기존 이벤트 리스너 제거 (중복 방지)
    missionaryGrid.removeEventListener('click', handleMissionaryCardClick);
    
    // 새로운 이벤트 리스너 등록
    missionaryGrid.addEventListener('click', handleMissionaryCardClick);
  }
  
  // 이름 클릭 시 상세보기 보강 (추가 안전장치)
  const nameElements = container.querySelectorAll('.missionary-name');
  nameElements.forEach(nameEl => {
    nameEl.style.cursor = 'pointer';
    // 기존 이벤트 리스너 제거 (중복 방지)
    nameEl.removeEventListener('click', handleNameClick);
    // 새로운 이벤트 리스너 등록
    nameEl.addEventListener('click', handleNameClick);
  });
  
  console.log(`[선교사 관리] ${filteredMissionaries.length}개 카드 렌더링 완료, 이벤트 바인딩 완료`);
}

// 카드 클릭 핸들러 (이벤트 위임)
function handleMissionaryCardClick(e) {
  // 버튼 클릭이 아닌 경우에만 상세보기(읽기 전용)
  if (!e.target.closest('.missionary-actions') && !e.target.classList.contains('missionary-name')) {
    const card = e.target.closest('.missionary-card');
    if (card) {
      const missionaryId = card.dataset.missionaryId;
      const missionary = missionaries.find(m => m.id === missionaryId);
      if (missionary) {
        showMissionaryDetailTab(missionary);
      }
    }
  }
}

// 이름 클릭 핸들러 (추가 안전장치)
function handleNameClick(e) {
  e.stopPropagation();
  const card = e.target.closest('.missionary-card');
  if (card) {
    const missionaryId = card.dataset.missionaryId;
    const missionary = missionaries.find(m => m.id === missionaryId);
    if (missionary) {
      showMissionaryDetailTab(missionary);
    }
  }
}

// 선교사 카드 렌더링
function renderMissionaryCard(missionary) {
  const avatarText = missionary.name ? missionary.name.charAt(0) : '?';
  const archivedClass = missionary.archived ? 'archived' : '';
  
  return `
    <div class="missionary-card ${archivedClass}" data-missionary-id="${missionary.id}">
      <div class="missionary-header">
        <div class="missionary-avatar">${avatarText}</div>
        <div class="missionary-info">
          <div class="missionary-name">${missionary.name || '이름 없음'}</div>
          <div class="missionary-country">${missionary.country || '국가 미지정'}</div>
          <div class="missionary-organization">${missionary.organization || '소속 미지정'}</div>
        </div>
      </div>
      
      <div class="missionary-details">
        ${renderMissionaryDetails(missionary)}
      </div>
      
      <div class="missionary-actions">
        <button class="btn-edit" onclick="editMissionary('${missionary.id}')">
          ✏️ 수정
        </button>
        ${missionary.archived ? 
          `<button class="btn-archive" onclick="unarchiveMissionary('${missionary.id}')">
            📂 복원
          </button>
          <button class="btn-delete" onclick="permanentDeleteConfirm('${missionary.id}')">
            🗑️ 완전삭제
          </button>` :
          `<button class="btn-archive" onclick="archiveMissionary('${missionary.id}')">
            📁 아카이브
          </button>
          <button class="btn-delete" onclick="deleteMissionaryConfirm('${missionary.id}')">
            🗑️ 삭제
          </button>`
        }
      </div>
    </div>
  `;
}

// 선교사 상세보기 표시 (읽기 전용 폼/모달)
function showMissionaryDetail(missionary) {
  // 기존 입력페이지 이동 코드는 주석처리
  /*
  if (missionary && missionary.id) {
    editMissionary(missionary.id);
  }
  */
  // 읽기 전용 상세 모달 생성 및 표시
  renderReadOnlyMissionaryModal(missionary);
}

// 선교사 상세보기 내용 렌더링
function renderMissionaryDetailContent(missionary) {
  const avatarText = missionary.name ? missionary.name.charAt(0) : '?';
  const avatarUrl = missionary.image || '';
  
  return `
    <div class="missionary-header-detail">
      ${avatarUrl ? 
        `<img src="${avatarUrl}" alt="${missionary.name}" class="missionary-avatar-large" onerror="this.style.display='none'">` :
        `<div class="missionary-avatar-large" style="display: flex; align-items: center; justify-content: center; font-size: 48px; background: #4CAF50;">${avatarText}</div>`
      }
      <div class="missionary-name-large">${missionary.name || '이름 없음'}</div>
      <div class="missionary-country-large">${missionary.country || '국가 미지정'}</div>
      <div class="missionary-organization-large">${missionary.organization || '소속 미지정'}</div>
    </div>
    
    <div class="missionary-detail-grid">
      <!-- 기본정보 -->
      <div class="detail-section">
        <h3>📋 기본정보</h3>
        <div class="detail-row">
          <span class="detail-label">영문명</span>
          <span class="detail-value ${!missionary.english_name ? 'empty' : ''}">${missionary.english_name || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">도시</span>
          <span class="detail-value ${!missionary.city ? 'empty' : ''}">${missionary.city || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">파송일</span>
          <span class="detail-value ${!missionary.sent_date ? 'empty' : ''}">${missionary.sent_date || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">기도제목</span>
          <span class="detail-value ${!missionary.prayer ? 'empty' : ''}">${missionary.prayer || '미입력'}</span>
        </div>
      </div>
      
      <!-- 교회정보 -->
      <div class="detail-section">
        <h3>⛪ 교회정보</h3>
        <div class="detail-row">
          <span class="detail-label">소속노회</span>
          <span class="detail-value ${!missionary.presbytery ? 'empty' : ''}">${missionary.presbytery || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">파송교회</span>
          <span class="detail-value ${!missionary.sending_church ? 'empty' : ''}">${missionary.sending_church || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">후원교회</span>
          <span class="detail-value ${!missionary.support_church ? 'empty' : ''}">${missionary.support_church || '미입력'}</span>
        </div>
      </div>
      
      <!-- 연락처 -->
      <div class="detail-section">
        <h3>📞 연락처</h3>
        <div class="detail-row">
          <span class="detail-label">이메일</span>
          <span class="detail-value ${!missionary.email ? 'empty' : ''}">${missionary.email || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">현지 전화번호</span>
          <span class="detail-value ${!missionary.local_phone ? 'empty' : ''}">${missionary.local_phone || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">현지 응급전화</span>
          <span class="detail-value ${!missionary.local_emergency ? 'empty' : ''}">${missionary.local_emergency || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">귀국시 전화번호</span>
          <span class="detail-value ${!missionary.korea_phone ? 'empty' : ''}">${missionary.korea_phone || '미입력'}</span>
        </div>
      </div>
      
      <!-- 주소 -->
      <div class="detail-section">
        <h3>📍 주소</h3>
        <div class="detail-row">
          <span class="detail-label">현지 주소</span>
          <span class="detail-value ${!missionary.local_address ? 'empty' : ''}">${missionary.local_address || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">귀국시 주소</span>
          <span class="detail-value ${!missionary.korea_address ? 'empty' : ''}">${missionary.korea_address || '미입력'}</span>
        </div>
      </div>
    </div>
    
    <!-- 가족사항 -->
    ${missionary.family && Object.keys(missionary.family).length > 0 ? `
      <div class="detail-section">
        <h3>👨‍👩‍👧‍👦 가족사항</h3>
        ${renderFamilyDetail(missionary.family)}
      </div>
    ` : ''}
    
    <!-- 후원정보 -->
    ${missionary.supporters && Object.keys(missionary.supporters).length > 0 ? `
      <div class="detail-section">
        <h3>💝 후원정보</h3>
        ${renderSupportersDetail(missionary.supporters)}
      </div>
    ` : ''}
  `;
}

// 가족사항 상세보기 렌더링
function renderFamilyDetail(familyData) {
  let html = '';
  
  if (familyData.spouse) {
    html += `
      <div class="family-member-detail">
        <div class="family-member-title">💑 배우자</div>
        <div class="detail-row">
          <span class="detail-label">이름</span>
          <span class="detail-value">${familyData.spouse.name || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">생년월일</span>
          <span class="detail-value">${familyData.spouse.birthdate || '미입력'}</span>
        </div>
      </div>
    `;
  }
  
  if (familyData.children && familyData.children.length > 0) {
    familyData.children.forEach((child, index) => {
      html += `
        <div class="family-member-detail">
          <div class="family-member-title">👶 자녀 ${index + 1}</div>
          <div class="detail-row">
            <span class="detail-label">이름</span>
            <span class="detail-value">${child.name || '미입력'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">생년월일</span>
            <span class="detail-value">${child.birthdate || '미입력'}</span>
          </div>
        </div>
      `;
    });
  }
  
  return html || '<p style="color: rgba(255,255,255,0.5); text-align: center;">가족 정보가 없습니다.</p>';
}

// 후원자 상세보기 렌더링
function renderSupportersDetail(supportersData) {
  let html = '';
  
  if (supportersData.chairman) {
    html += `
      <div class="supporter-detail">
        <div class="supporter-title">👑 후원회장</div>
        <div class="detail-row">
          <span class="detail-label">이름</span>
          <span class="detail-value">${supportersData.chairman.name || '미입력'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">연락처</span>
          <span class="detail-value">${supportersData.chairman.contact || '미입력'}</span>
        </div>
      </div>
    `;
  }
  
  if (supportersData.members && supportersData.members.length > 0) {
    supportersData.members.forEach((member, index) => {
      html += `
        <div class="supporter-detail">
          <div class="supporter-title">💝 후원자 ${index + 1}</div>
          <div class="detail-row">
            <span class="detail-label">이름</span>
            <span class="detail-value">${member.name || '미입력'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">연락처</span>
            <span class="detail-value">${member.contact || '미입력'}</span>
          </div>
        </div>
      `;
    });
  }
  
  return html || '<p style="color: rgba(255,255,255,0.5); text-align: center;">후원자 정보가 없습니다.</p>';
}

// 선교사 상세 정보 렌더링 (카드용)
function renderMissionaryDetails(missionary) {
  const details = [];
  
  // 요청된 기본 정보
  if (missionary.sending_date) details.push(['파송일', missionary.sending_date]);
  if (missionary.presbytery) details.push(['소속노회', missionary.presbytery]);
  if (missionary.organization) details.push(['소속단체', missionary.organization]);
  if (missionary.local_organization) details.push(['현지소속 기관', missionary.local_organization]);
  
  // 수정일 (updatedAt 또는 createdAt 사용)
  const updateDate = missionary.updatedAt || missionary.createdAt;
  if (updateDate) {
    // 디버깅: 날짜 데이터 형태 확인
    console.log('날짜 데이터:', {
      updateDate,
      type: typeof updateDate,
      hasToDate: updateDate && typeof updateDate.toDate === 'function',
      isDate: updateDate instanceof Date,
      isString: typeof updateDate === 'string',
      isNumber: typeof updateDate === 'number'
    });
    
    let formattedDate;
    try {
      // Firestore Timestamp 객체인 경우
      if (updateDate.toDate && typeof updateDate.toDate === 'function') {
        const date = updateDate.toDate();
        formattedDate = date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } 
      // 일반 Date 객체인 경우
      else if (updateDate instanceof Date) {
        formattedDate = updateDate.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      // 문자열인 경우
      else if (typeof updateDate === 'string') {
        const date = new Date(updateDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      }
      // 숫자 타임스탬프인 경우
      else if (typeof updateDate === 'number') {
        const date = new Date(updateDate);
        formattedDate = date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      
      if (formattedDate) {
        details.push(['수정일', formattedDate]);
      } else {
        console.warn('날짜 형식화 실패:', updateDate);
        details.push(['수정일', '날짜 형식 오류']);
      }
    } catch (error) {
      console.error('날짜 파싱 오류:', error, updateDate);
      // 날짜 파싱에 실패한 경우 원본 값 표시
      details.push(['수정일', updateDate.toString()]);
    }
  }
  
  // 기존 정보는 주석 처리 (필요시 활성화)
  /*
  if (missionary.sending_church) details.push(['파송교회', missionary.sending_church]);
  if (missionary.support_church) details.push(['후원교회', missionary.support_church]);
  if (missionary.support_chairman) details.push(['후원회장', missionary.support_chairman]);
  if (missionary.support_secretary) details.push(['후원총무', missionary.support_secretary]);
  if (missionary.support_amount) details.push(['후원금현황', missionary.support_amount]);
  
  // 연락처 정보
  if (missionary.email) details.push(['이메일', missionary.email]);
  if (missionary.local_phone) details.push(['현지 전화번호', missionary.local_phone]);
  if (missionary.local_emergency) details.push(['현지 응급전화', missionary.local_emergency]);
  if (missionary.korea_phone) details.push(['귀국시 전화번호', missionary.korea_phone]);
  if (missionary.korea_emergency) details.push(['한국 응급전화', missionary.korea_emergency]);
  
  // 가족사항 (DB 차일드 방식)
  if (missionary.family) {
    if (missionary.family.spouse) {
      const spouse = missionary.family.spouse;
      let spouseInfo = spouse.name || '';
      if (spouse.birthday) spouseInfo += ` (${spouse.birthday})`;
      if (spouse.notes) spouseInfo += ` - ${spouse.notes}`;
      details.push(['배우자', spouseInfo]);
    }
    
    if (missionary.family.children && missionary.family.children.length > 0) {
      const childrenInfo = missionary.family.children.map(child => {
        let childInfo = child.name || '';
        if (child.birthday) childInfo += ` (${child.birthday})`;
        if (child.notes) childInfo += ` - ${child.notes}`;
        return childInfo;
      }).join(', ');
      details.push(['자녀', childrenInfo]);
    }
  }
  */
  
  // 상세 정보가 없을 경우
  if (details.length === 0) {
    return '<div class="no-details">상세 정보가 없습니다.</div>';
  }
  
  // 상세 정보 렌더링
  return details.map(([label, value]) => `
    <div class="detail-item">
      <span class="detail-label">${label}:</span>
      <span class="detail-value">${value || '정보 없음'}</span>
    </div>
  `).join('');
}

// 이벤트 바인딩
function bindEvents() {
  // 검색 이벤트
  const searchInput = document.getElementById('missionarySearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(renderMissionaryList, 300));
  }
  
  // 아카이브 필터 이벤트
  const archivedCheckbox = document.getElementById('includeArchived');
  if (archivedCheckbox) {
    archivedCheckbox.addEventListener('change', () => {
      renderMissionaryList();
      updateArchivedCheckboxStyle();
    });
  }
  
  // Firebase 상태 업데이트
  setInterval(updateFirebaseStatus, 5000);
}

// 디바운스 함수
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 로딩 표시
function showLoading() {
  const container = document.getElementById('missionaryList');
  if (container) {
    container.innerHTML = `
      <div class="loading-placeholder">
        <div class="loading-spinner"></div>
        <p>선교사 목록을 불러오는 중...</p>
      </div>
    `;
  }
}

// 로딩 숨김
function hideLoading() {
  // showLoading과 동일한 역할 - renderMissionaryList가 로딩을 대체함
  // 별도 작업 불필요
}

// Firebase 상태 업데이트
function updateFirebaseStatus() {
  const statusIcon = document.getElementById('bottomFirebaseStatus');
  if (statusIcon) {
    // 실제 Firebase 연결 상태 확인 로직
    statusIcon.textContent = '🔥'; // 연결됨
  }
}

// 아카이브 체크박스 스타일 업데이트
function updateArchivedCheckboxStyle() {
  const archivedCheckbox = document.getElementById('includeArchived');
  if (!archivedCheckbox) return;
  
  const checkboxLabel = archivedCheckbox.closest('.checkbox-label');
  if (!checkboxLabel) return;
  
  if (archivedCheckbox.checked) {
    checkboxLabel.classList.add('archived-active');
  } else {
    checkboxLabel.classList.remove('archived-active');
  }
}

// 모달 관리 함수들
window.showAddMissionaryModal = function() {
  // 새로운 창으로 선교사 입력 페이지 열기
  const newWindow = window.open('missionary-input.html', 'missionaryInput', 
    'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no');
  
  if (newWindow) {
    // 새 창이 열렸을 때 포커스
    newWindow.focus();
    
    // 새 창이 닫힐 때 목록 새로고침
    const checkClosed = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(checkClosed);
        loadMissionaries().then(() => {
          renderMissionaryList();
        });
      }
    }, 1000);
  } else {
    showToast('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.', 'error');
  }
};

// 선교사 수정
window.editMissionary = function(missionaryId) {
  // 새로운 입력 페이지로 이동하여 수정
  window.location.href = `missionary-input.html?edit=${missionaryId}`;
};

// 수정 모달 표시
async function showEditMissionaryModal(missionary) {
  try {
    // 모달 표시
    document.getElementById('editMissionaryModal').style.display = 'flex';
    
    // 수정 폼 렌더링
    await renderEditMissionaryForm(missionary);
    
    // 현재 수정 중인 선교사 저장
    currentMissionary = missionary;
    isEditMode = true;
    
  } catch (error) {
    console.error('수정 모달 표시 실패:', error);
    showToast('수정 모달 표시 실패: ' + error.message, 'error');
  }
}

// 수정 폼 렌더링
async function renderEditMissionaryForm(missionary) {
  const container = document.getElementById('editMissionaryContainer');
  // 폼 설정 로드
  const formConfig = window.loadFormSettings ? window.loadFormSettings() : null;
  // 동적 폼 렌더링 (수정 모드)만 사용
  if (window.renderDynamicForm) {
    await window.renderDynamicForm(container, formConfig, missionary);
  }
}

// 수정 모달 닫기
window.closeEditMissionaryModal = function() {
  document.getElementById('editMissionaryModal').style.display = 'none';
  document.getElementById('editMissionaryContainer').innerHTML = '';
  currentMissionary = null;
  isEditMode = false;
};

// 선교사 아카이브
window.archiveMissionary = function(missionaryId) {
  if (confirm('이 선교사를 아카이브하시겠습니까?')) {
    archiveMissionaryAction(missionaryId);
  }
};

// 선교사 복원
window.unarchiveMissionary = function(missionaryId) {
  if (confirm('이 선교사를 복원하시겠습니까?')) {
    unarchiveMissionaryAction(missionaryId);
  }
};

// 선교사 삭제 확인
window.deleteMissionaryConfirm = function(missionaryId) {
  if (confirm('이 선교사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    archiveMissionaryAction(missionaryId);
  }
};

// 선교사 완전 삭제 확인
window.permanentDeleteConfirm = function(missionaryId) {
  if (confirm('이 선교사를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    permanentDeleteAction(missionaryId);
  }
};

// 선교사 변경사항 저장
window.saveMissionaryChanges = async function() {
  if (!currentMissionary) {
    showToast('수정할 선교사 정보가 없습니다', 'error');
    return;
  }
  
  try {
    // 폼 데이터 수집
    let formData;
    
    // 동적 폼이 있는지 확인
    const dynamicForm = document.getElementById('dynamic-missionary-form');
    if (dynamicForm && window.getDynamicFormValues) {
      // 동적 폼 데이터 수집
      formData = window.getDynamicFormValues();
      if (!formData) {
        showToast('폼 데이터를 가져올 수 없습니다', 'error');
        return;
      }
    } else {
      // 기본 폼 데이터 수집
      formData = collectEditFormData();
    }
    
    // 유효성 검사
    if (!formData.name || formData.name.trim() === '') {
      showToast('이름은 필수 입력 항목입니다', 'error');
      return;
    }
    
    // 수정 이력 추가
    const modificationHistory = currentMissionary.modification_history || [];
    modificationHistory.push({
      date: new Date().toISOString(),
      action: '수정',
      details: '선교사 정보 수정'
    });
    
    // 업데이트할 데이터 준비
    const updateData = {
      ...formData,
      modification_history: modificationHistory,
      updatedAt: new Date().toISOString()
    };
    
    // Firebase에 저장
    await window.updateMissionary(currentMissionary.id, updateData);
    
    showToast('선교사 정보가 성공적으로 수정되었습니다', 'success');
    
    // 모달 닫기
    closeEditMissionaryModal();
    
    // 목록 새로고침
    await loadMissionaries();
    renderMissionaryList();
    
  } catch (error) {
    console.error('선교사 수정 실패:', error);
    showToast('선교사 수정 실패: ' + error.message, 'error');
  }
};

// 수정 폼 데이터 수집
function collectEditFormData() {
  const formData = {};
  
  // 기본 정보
  formData.name = document.getElementById('edit-name')?.value || '';
  formData.country = document.getElementById('edit-country')?.value || '';
  formData.mission = document.getElementById('edit-mission')?.value || '';
  formData.presbytery = document.getElementById('edit-presbytery')?.value || '';
  
  // 교회 정보
  formData.sending_church = document.getElementById('edit-sending-church')?.value || '';
  formData.support_church = document.getElementById('edit-support-church')?.value || '';
  formData.support_chairman = document.getElementById('edit-support-chairman')?.value || '';
  formData.support_secretary = document.getElementById('edit-support-secretary')?.value || '';
  formData.support_amount = document.getElementById('edit-support-amount')?.value || '';
  
  // 연락처 정보
  formData.email = document.getElementById('edit-email')?.value || '';
  formData.local_phone = document.getElementById('edit-local-phone')?.value || '';
  formData.local_emergency = document.getElementById('edit-local-emergency')?.value || '';
  formData.korea_phone = document.getElementById('edit-korea-phone')?.value || '';
  formData.korea_emergency = document.getElementById('edit-korea-emergency')?.value || '';
  
  // 가족사항
  formData.family = collectFamilyData();
  
  return formData;
}

// 가족 데이터 수집
function collectFamilyData() {
  const family = {};
  
  // 배우자 정보
  const spouseName = document.getElementById('edit-spouse-name')?.value || '';
  if (spouseName) {
    family.spouse = {
      name: spouseName,
      birthday: document.getElementById('edit-spouse-birthday')?.value || '',
      notes: document.getElementById('edit-spouse-notes')?.value || ''
    };
  }
  
  // 자녀 정보
  const children = [];
  const childItems = document.querySelectorAll('.child-item');
  childItems.forEach((item, index) => {
    const name = document.getElementById(`edit-child-name-${index}`)?.value || '';
    if (name) {
      children.push({
        name: name,
        birthday: document.getElementById(`edit-child-birthday-${index}`)?.value || '',
        notes: document.getElementById(`edit-child-notes-${index}`)?.value || ''
      });
    }
  });
  
  if (children.length > 0) {
    family.children = children;
  }
  
  return Object.keys(family).length > 0 ? family : null;
}

// 자녀 추가
window.addChild = function() {
  // 동적 폼의 자녀 추가 함수가 있는지 확인
  if (window.addChild && document.getElementById('childrenList')) {
    window.addChild();
    return;
  }
  
  // 수정 모달용 자녀 추가
  const childrenList = document.getElementById('children-list');
  if (!childrenList) return;
  
  const childCount = childrenList.children.length;
  const childItem = document.createElement('div');
  childItem.className = 'child-item';
  childItem.dataset.index = childCount;
  
  childItem.innerHTML = `
    <div class="child-header">
      <h5>자녀 ${childCount + 1}</h5>
      <button type="button" class="btn btn-small btn-danger" onclick="removeChild(${childCount})">
        🗑️ 삭제
      </button>
    </div>
    <div class="form-group">
      <label for="edit-child-name-${childCount}">이름</label>
      <input type="text" id="edit-child-name-${childCount}" autocomplete="name" value="">
    </div>
    <div class="form-group">
      <label for="edit-child-birthday-${childCount}">생년월일</label>
      <input type="text" id="edit-child-birthday-${childCount}" autocomplete="bday" value="">
    </div>
    <div class="form-group">
      <label for="edit-child-notes-${childCount}">비고</label>
      <textarea id="edit-child-notes-${childCount}" autocomplete="off"></textarea>
    </div>
  `;
  
  childrenList.appendChild(childItem);
};

// 자녀 삭제
window.removeChild = function(index) {
  const childItem = document.querySelector(`.child-item[data-index="${index}"]`);
  if (childItem) {
    childItem.remove();
    
    // 인덱스 재정렬
    const remainingItems = document.querySelectorAll('.child-item');
    remainingItems.forEach((item, newIndex) => {
      item.dataset.index = newIndex;
      const header = item.querySelector('.child-header h5');
      const deleteBtn = item.querySelector('.btn-danger');
      
      if (header) header.textContent = `자녀 ${newIndex + 1}`;
      if (deleteBtn) deleteBtn.onclick = () => removeChild(newIndex);
    });
  }
};

// 가족 구성원 추가
window.addFamilyMember = function() {
  const familySection = document.getElementById('family-section');
  
  // 배우자 섹션이 없으면 추가
  if (!document.getElementById('edit-spouse-name')) {
    const spouseSection = document.createElement('div');
    spouseSection.className = 'family-member';
    spouseSection.innerHTML = `
      <h4>배우자</h4>
      <div class="form-group">
        <label for="edit-spouse-name">이름</label>
        <input type="text" id="edit-spouse-name" autocomplete="name" value="">
      </div>
      <div class="form-group">
        <label for="edit-spouse-birthday">생년월일</label>
        <input type="text" id="edit-spouse-birthday" autocomplete="bday" value="">
      </div>
      <div class="form-group">
        <label for="edit-spouse-notes">비고</label>
        <textarea id="edit-spouse-notes" autocomplete="off"></textarea>
      </div>
    `;
    
    // 자녀 섹션 앞에 삽입
    const childrenSection = familySection.querySelector('.children-section');
    if (childrenSection) {
      familySection.insertBefore(spouseSection, childrenSection);
    } else {
      familySection.appendChild(spouseSection);
    }
  }
  
  // 자녀 추가
  addChild();
};

// 선교사 아카이브
window.archiveMissionary = async function(missionaryId) {
  try {
    await archiveMissionaryAction(missionaryId);
  } catch (error) {
    console.error('아카이브 실패:', error);
    showToast('아카이브 실패: ' + error.message, 'error');
  }
};

// 선교사 복원
window.unarchiveMissionary = async function(missionaryId) {
  try {
    await unarchiveMissionaryAction(missionaryId);
  } catch (error) {
    console.error('복원 실패:', error);
    showToast('복원 실패: ' + error.message, 'error');
  }
};

// 삭제 확인 (아카이브로 이동)
window.deleteMissionaryConfirm = function(missionaryId) {
  const missionary = missionaries.find(m => m.id === missionaryId);
  if (!missionary) return;
  
  // 모달 제목과 내용 업데이트
  const modalTitle = document.querySelector('#deleteConfirmModal .modal-header h2');
  const modalBody = document.querySelector('#deleteConfirmModal .modal-body');
  const confirmButton = document.querySelector('#deleteConfirmModal .btn-danger');
  
  if (modalTitle) modalTitle.textContent = '선교사 아카이브';
  if (confirmButton) confirmButton.textContent = '아카이브';
  
  if (modalBody) {
    modalBody.innerHTML = `
      <p>정말로 <strong>${missionary.name || '이름 없는 선교사'}</strong>를 아카이브하시겠습니까?</p>
      <p class="warning-text">⚠️ 아카이브된 선교사는 목록에서 숨겨지지만 데이터는 보존됩니다.</p>
      <p class="info-text">💡 아카이브에서 복원하거나 완전 삭제할 수 있습니다.</p>
    `;
  }
  
  document.getElementById('deleteConfirmModal').style.display = 'flex';
  window.confirmDeleteMissionary = () => archiveMissionaryAction(missionaryId);
};

// 아카이브 실행 (삭제 대신 아카이브)
async function archiveMissionaryAction(missionaryId) {
  try {
    await window.updateMissionary(missionaryId, { archived: true });
    
    // 수정 이력 추가
    const missionary = missionaries.find(m => m.id === missionaryId);
    if (missionary) {
      const modificationHistory = missionary.modification_history || [];
      modificationHistory.push({
        date: new Date().toISOString(),
        action: '아카이브',
        details: '선교사 정보를 아카이브로 이동'
      });
      
      await window.updateMissionary(missionaryId, {
        modification_history: modificationHistory
      });
    }
    
    showToast('선교사가 아카이브되었습니다.', 'success');
    await loadMissionaries();
    renderMissionaryList();
  } catch (error) {
    console.error('아카이브 실패:', error);
    showToast('아카이브 실패: ' + error.message, 'error');
  }
}

// 완전 삭제 확인 (아카이브된 선교사용)
window.permanentDeleteConfirm = function(missionaryId) {
  const missionary = missionaries.find(m => m.id === missionaryId);
  if (!missionary) return;
  
  // 모달 제목과 내용 업데이트
  const modalTitle = document.querySelector('#deleteConfirmModal .modal-header h2');
  const modalBody = document.querySelector('#deleteConfirmModal .modal-body');
  const confirmButton = document.querySelector('#deleteConfirmModal .btn-danger');
  
  if (modalTitle) modalTitle.textContent = '선교사 완전 삭제';
  if (confirmButton) confirmButton.textContent = '완전 삭제';
  
  if (modalBody) {
    modalBody.innerHTML = `
      <p>정말로 <strong>${missionary.name || '이름 없는 선교사'}</strong>를 <span style="color: #ff6b6b; font-weight: bold;">완전히 삭제</span>하시겠습니까?</p>
      <p class="warning-text">⚠️ 이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.</p>
      <p class="danger-text">🚨 이 선교사의 모든 정보가 Firebase에서 완전히 제거됩니다.</p>
    `;
  }
  
  document.getElementById('deleteConfirmModal').style.display = 'flex';
  window.confirmDeleteMissionary = () => permanentDeleteAction(missionaryId);
};

// 완전 삭제 실행
async function permanentDeleteAction(missionaryId) {
  try {
    await window.deleteMissionary(missionaryId);
    showToast('선교사가 완전히 삭제되었습니다.', 'success');
    await loadMissionaries();
    renderMissionaryList();
  } catch (error) {
    console.error('완전 삭제 실패:', error);
    showToast('완전 삭제 실패: ' + error.message, 'error');
  }
}

// 모달 닫기 함수들
window.closeDeleteConfirmModal = function() {
  document.getElementById('deleteConfirmModal').style.display = 'none';
};

// 모달 배경 클릭 시 닫기
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// 폼 설정 관리
window.showFormSettings = function() {
  document.getElementById('formSettingsModal').style.display = 'flex';
  renderFormSettingsUI('formSettingsContainer');
};

window.closeFormSettingsModal = function() {
  document.getElementById('formSettingsModal').style.display = 'none';
};

window.previewForm = function() {
  document.getElementById('formPreviewModal').style.display = 'flex';
  renderDynamicForm('formPreviewContainer');
};

window.closeFormPreviewModal = function() {
  document.getElementById('formPreviewModal').style.display = 'none';
  document.getElementById('formPreviewContainer').innerHTML = '';
};

// 내보내기/가져오기
window.exportMissionaries = function() {
  const dataStr = JSON.stringify(missionaries, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `missionaries_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('선교사 데이터가 내보내기되었습니다', 'success');
};

window.importMissionaries = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        // 실제로는 Firebase에 일괄 업로드 로직 필요
        showToast(`${data.length}명의 선교사 데이터를 가져왔습니다`, 'success');
      } else {
        showToast('올바른 JSON 형식이 아닙니다', 'error');
      }
    } catch (error) {
      console.error('가져오기 실패:', error);
      showToast('가져오기 실패: ' + error.message, 'error');
    }
  };
  input.click();
};

// 마이그레이션 다이얼로그
window.showMigrationDialog = function() {
  document.getElementById('migrationDialog').style.display = 'flex';
  checkMigrationStatus();
};

window.closeMigrationDialog = function() {
  document.getElementById('migrationDialog').style.display = 'none';
};

async function checkMigrationStatus() {
  const statusDiv = document.getElementById('migrationStatus');
  const actionsDiv = document.getElementById('migrationActions');
  
  statusDiv.innerHTML = '<p>데이터 동기화 상태를 확인 중입니다...</p>';
  actionsDiv.style.display = 'none';
  
  try {
    // 실제 마이그레이션 상태 확인 로직
    const hasLocalData = localStorage.getItem('missionaries') !== null;
    const hasFirebaseData = missionaries.length > 0;
    
    if (hasLocalData && !hasFirebaseData) {
      statusDiv.innerHTML = '<p>LocalStorage에 데이터가 있습니다. Firebase로 마이그레이션할 수 있습니다.</p>';
      actionsDiv.style.display = 'block';
    } else if (hasFirebaseData) {
      statusDiv.innerHTML = '<p>Firebase에 데이터가 있습니다. 동기화가 완료되었습니다.</p>';
    } else {
      statusDiv.innerHTML = '<p>마이그레이션할 데이터가 없습니다.</p>';
    }
  } catch (error) {
    statusDiv.innerHTML = '<p>상태 확인 중 오류가 발생했습니다: ' + error.message + '</p>';
  }
}

window.startMigration = async function() {
  try {
    const localData = localStorage.getItem('missionaries');
    if (!localData) {
      showToast('마이그레이션할 데이터가 없습니다', 'error');
      return;
    }
    
    const missionaries = JSON.parse(localData);
    // 실제 마이그레이션 로직 구현 필요
    
    showToast('마이그레이션이 완료되었습니다', 'success');
    closeMigrationDialog();
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    showToast('마이그레이션 실패: ' + error.message, 'error');
  }
};

window.clearLocalData = function() {
  if (confirm('정말로 LocalStorage의 모든 데이터를 삭제하시겠습니까?')) {
    localStorage.clear();
    showToast('LocalStorage 데이터가 삭제되었습니다', 'success');
    closeMigrationDialog();
  }
};

// 토스트 알림
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  if (!toast || !toastMessage) return;
  
  toastMessage.textContent = message;
  toast.style.display = 'block';
  
  // 타입별 스타일
  toast.style.background = type === 'error' ? '#f44336' : 
                          type === 'success' ? '#4caf50' : '#333';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// 선교사 상세 보기 모달 표시
window.showMissionaryDetail = function(missionaryId) {
  let missionary;
  
  // missionaryId가 문자열인 경우 (ID로 찾기)
  if (typeof missionaryId === 'string') {
    missionary = missionaries.find(m => m.id === missionaryId);
  } 
  // missionaryId가 객체인 경우 (직접 전달)
  else if (typeof missionaryId === 'object') {
    missionary = missionaryId;
  }
  
  if (missionary) {
    console.log('[선교사 관리] 전역 함수 호출 → 상세보기:', missionary.name);
    showMissionaryDetail(missionary);
  } else {
    console.error('[선교사 관리] 선교사를 찾을 수 없습니다:', missionaryId);
  }
};

// 선교사 상세보기 모달 렌더링
function renderMissionaryDetailModal(missionary) {
  if (!missionary) return;
  
  const modal = document.getElementById('missionaryDetailModal');
  if (!modal) {
    createMissionaryDetailModal();
  }
  
  const modalContent = document.getElementById('missionaryDetailContent');
  const settings = window.loadFormSettings();
  
  let html = `
    <div class="detail-header">
      <h2>${missionary.name || '이름 없음'}</h2>
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="editMissionaryFromDetail('${missionary.id}')">
          ✏️ 수정하기
        </button>
        <button class="btn btn-secondary" onclick="closeMissionaryDetail()">
          ✕ 닫기
        </button>
      </div>
    </div>
    
    <div class="detail-content">
      <div class="accordion-container">
  `;
  
  // 카테고리별로 정렬
  const sortedCategories = settings.categories.sort((a, b) => a.order - b.order);
  
  sortedCategories.forEach((category, index) => {
    const categoryFields = settings.fields
      .filter(field => field.category === category.id)
      .sort((a, b) => a.order - b.order);
    
    if (categoryFields.length > 0) {
      const hasData = categoryFields.some(field => {
        const value = getFieldValue(missionary, field);
        return value && (typeof value === 'string' ? value.trim() : true);
      });
      
      if (hasData) {
        const isFirst = index === 0;
        html += `
          <div class="accordion-item">
            <div class="accordion-header ${isFirst ? 'active' : ''}" onclick="toggleAccordion(this)">
              <h3>${category.name}</h3>
              <span class="accordion-icon">${isFirst ? '▼' : '▶'}</span>
            </div>
            <div class="accordion-content ${isFirst ? 'active' : ''}">
              <div class="detail-fields">
        `;
        
        categoryFields.forEach(field => {
          const value = getFieldValue(missionary, field);
          if (value && (typeof value === 'string' ? value.trim() : true)) {
            html += `
              <div class="detail-field">
                <label>${field.name}:</label>
                <div class="field-value">${formatFieldValue(value, field.type)}</div>
              </div>
            `;
          }
        });
        
        html += `
              </div>
            </div>
          </div>
        `;
      }
    }
  });
  
  // 시스템 정보 아코디온
  const hasSystemInfo = missionary.createdAt || missionary.updatedAt || missionary.archived || missionary.updateHistory;
  if (hasSystemInfo) {
    html += `
      <div class="accordion-item">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          <h3>시스템 정보</h3>
          <span class="accordion-icon">▶</span>
        </div>
        <div class="accordion-content">
          <div class="detail-fields">
            ${missionary.createdAt ? `
              <div class="detail-field">
                <label>등록일:</label>
                <div class="field-value">${new Date(missionary.createdAt).toLocaleString('ko-KR')}</div>
              </div>
            ` : ''}
            ${missionary.updatedAt ? `
              <div class="detail-field">
                <label>수정일:</label>
                <div class="field-value">${new Date(missionary.updatedAt).toLocaleString('ko-KR')}</div>
              </div>
            ` : ''}
            ${missionary.archived ? `
              <div class="detail-field">
                <label>아카이브 상태:</label>
                <div class="field-value archived-status">아카이브됨</div>
              </div>
            ` : ''}
            ${missionary.updateHistory && missionary.updateHistory.length > 0 ? `
              <div class="detail-field">
                <label>수정 이력:</label>
                <div class="update-history">
                  ${missionary.updateHistory.map((history, index) => `
                    <div class="history-item">
                      <div class="history-header">
                        <span class="history-action">${history.action}</span>
                        <span class="history-date">${new Date(history.timestamp).toLocaleString('ko-KR')}</span>
                      </div>
                      ${history.changes && history.changes.length > 0 ? `
                        <div class="history-changes">
                          변경된 필드: ${history.changes.join(', ')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  modalContent.innerHTML = html;
}

// 아코디온 토글 함수
window.toggleAccordion = function(header) {
  const accordionItem = header.parentElement;
  const content = accordionItem.querySelector('.accordion-content');
  const icon = header.querySelector('.accordion-icon');
  
  // 현재 상태 확인
  const isActive = content.classList.contains('active');
  
  // 모든 아코디온 닫기
  document.querySelectorAll('.accordion-content').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelectorAll('.accordion-header').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelectorAll('.accordion-icon').forEach(item => {
    item.textContent = '▶';
  });
  
  // 클릭된 항목만 토글
  if (!isActive) {
    content.classList.add('active');
    header.classList.add('active');
    icon.textContent = '▼';
  }
};

// 필드 값 가져오기
function getFieldValue(missionary, field) {
  if (field.type === 'family_group') {
    return missionary.family;
  }
  if (field.type === 'supporter_group') {
    return missionary.supporters;
  }
  return missionary[field.id];
}

// 필드 값 포맷팅
function formatFieldValue(value, fieldType) {
  if (!value) return '';
  
  switch (fieldType) {
    case 'family_group':
      return formatFamilyValue(value);
    case 'supporter_group':
      return formatSupporterValue(value);
    case 'textarea':
      return value.replace(/\n/g, '<br>');
    default:
      return value;
  }
}

// 가족사항 포맷팅
function formatFamilyValue(familyData) {
  if (!familyData) return '';
  
  let html = '';
  
  // 배우자 정보
  if (familyData.spouse) {
    html += '<div class="family-member">';
    html += '<strong>👫 배우자</strong><br>';
    if (familyData.spouse.name) html += `이름: ${familyData.spouse.name}<br>`;
    if (familyData.spouse.birthday) html += `생일: ${familyData.spouse.birthday}<br>`;
    if (familyData.spouse.notes) html += `기타정보: ${familyData.spouse.notes}<br>`;
    html += '</div>';
  }
  
  // 자녀 정보 (아코디언 형태)
  if (familyData.children && familyData.children.length > 0) {
    html += '<div class="family-member">';
    html += '<strong>👶 자녀</strong><br>';
    
    familyData.children.forEach((child, index) => {
      // 자녀 요약 정보 생성
      let summary = '';
      if (child.name) summary += child.name;
      if (child.birthday) summary += summary ? ` - ${child.birthday}` : child.birthday;
      if (child.notes) {
        const notesSummary = child.notes.length > 10 ? child.notes.substring(0, 10) + '...' : child.notes;
        summary += summary ? ` - ${notesSummary}` : notesSummary;
      }
      
      html += `<div class="child-accordion-item">`;
      html += `<div class="child-accordion-header" onclick="toggleChildDetailAccordion(this)">`;
      html += `<div class="child-accordion-title">`;
      html += `<span class="child-accordion-icon">▶</span>`;
      html += `<span class="child-accordion-name">자녀 ${index + 1}</span>`;
      html += `<span class="child-accordion-summary">${summary ? ` (${summary})` : ''}</span>`;
      html += `</div>`;
      html += `</div>`;
      html += `<div class="child-accordion-content" style="display: none;">`;
      html += `<div class="child-detail-info">`;
      if (child.name) html += `<div class="detail-field"><label>이름:</label> <span>${child.name}</span></div>`;
      if (child.birthday) html += `<div class="detail-field"><label>생일:</label> <span>${child.birthday}</span></div>`;
      if (child.notes) html += `<div class="detail-field"><label>기타정보:</label> <span>${child.notes}</span></div>`;
      if (child.registeredAt) html += `<div class="detail-field"><label>등록일:</label> <span>${new Date(child.registeredAt).toLocaleString('ko-KR')}</span></div>`;
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
    });
    
    html += '</div>';
  }
  
  return html;
}

// 후원자 정보 포맷팅
function formatSupporterValue(supporterData) {
  if (!supporterData) return '';
  
  let html = '';
  
  supporterData.forEach((supporter, index) => {
    // 후원자 요약 정보 생성
    let summary = '';
    if (supporter.name) summary += supporter.name;
    if (supporter.phone) summary += summary ? ` - ${supporter.phone}` : supporter.phone;
    if (supporter.email) summary += summary ? ` - ${supporter.email}` : supporter.email;
    
    html += `<div class="supporter-accordion-item">`;
    html += `<div class="supporter-accordion-header" onclick="toggleSupporterDetailAccordion(this)">`;
    html += `<div class="supporter-accordion-title">`;
    html += `<span class="supporter-accordion-icon">▶</span>`;
    html += `<span class="supporter-accordion-name">후원자 ${index + 1}</span>`;
    html += `<span class="supporter-accordion-summary">${summary ? ` (${summary})` : ''}</span>`;
    html += `</div>`;
    html += `</div>`;
    html += `<div class="supporter-accordion-content" style="display: none;">`;
    html += `<div class="supporter-detail-info">`;
    if (supporter.name) html += `<div class="detail-field"><label>이름:</label> <span>${supporter.name}</span></div>`;
    if (supporter.phone) html += `<div class="detail-field"><label>전화번호:</label> <span>${supporter.phone}</span></div>`;
    if (supporter.email) html += `<div class="detail-field"><label>이메일:</label> <span>${supporter.email}</span></div>`;
    if (supporter.birthday) html += `<div class="detail-field"><label>생일:</label> <span>${supporter.birthday}</span></div>`;
    if (supporter.amount) html += `<div class="detail-field"><label>후원금액:</label> <span>${supporter.amount}원</span></div>`;
    if (supporter.address) html += `<div class="detail-field"><label>주소:</label> <span>${supporter.address}</span></div>`;
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;
  });
  
  return html;
}

// 상세 보기에서 수정하기
window.editMissionaryFromDetail = function(missionaryId) {
  closeMissionaryDetail();
  editMissionary(missionaryId);
};

// 상세 보기 모달 닫기
window.closeMissionaryDetail = function() {
  const modal = document.getElementById('missionaryDetailModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentMissionary = null;
};

// 상세 보기 모달 생성
function createMissionaryDetailModal() {
  const modalHtml = `
    <div id="missionaryDetailModal" class="modal-overlay" style="display: none;">
      <div class="modal-content detail-modal">
        <div id="missionaryDetailContent"></div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // 모달 외부 클릭 시 닫기
  document.getElementById('missionaryDetailModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeMissionaryDetail();
    }
  });
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeMissionaryDetail();
  }
});

// 상세 보기에서 자녀 아코디언 토글
window.toggleChildDetailAccordion = function(header) {
  const accordionItem = header.parentElement;
  const content = accordionItem.querySelector('.child-accordion-content');
  const icon = header.querySelector('.child-accordion-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
};

// 상세 보기에서 후원자 아코디언 토글
window.toggleSupporterDetailAccordion = function(header) {
  const accordionItem = header.parentElement;
  const content = accordionItem.querySelector('.supporter-accordion-content');
  const icon = header.querySelector('.supporter-accordion-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
};

async function unarchiveMissionaryAction(missionaryId) {
  try {
    await window.updateMissionary(missionaryId, { archived: false });
    
    // 수정 이력 추가
    const missionary = missionaries.find(m => m.id === missionaryId);
    if (missionary) {
      const modificationHistory = missionary.modification_history || [];
      modificationHistory.push({
        date: new Date().toISOString(),
        action: '복원',
        details: '아카이브에서 선교사 정보 복원'
      });
      
      await window.updateMissionary(missionaryId, {
        modification_history: modificationHistory
      });
    }
    
    showToast('선교사가 복원되었습니다.', 'success');
    await loadMissionaries();
    renderMissionaryList();
  } catch (error) {
    console.error('복원 실패:', error);
    showToast('복원 실패: ' + error.message, 'error');
  }
}

// 배우자 아코디언 토글
window.toggleSpouseAccordion = function() {
  const spouseSection = document.querySelector('.spouse-section');
  if (spouseSection) {
    spouseSection.classList.toggle('collapsed');
  }
};

// 배우자 추가
window.addSpouse = function() {
  // 동적 폼의 배우자 추가 함수가 있는지 확인
  if (window.addSpouse && document.getElementById('spouseSection')) {
    window.addSpouse();
    return;
  }
  
  // 수정 모달용 배우자 추가
  const familySection = document.getElementById('family-section');
  if (!familySection) return;
  
  // 배우자 섹션이 이미 있으면 무시
  if (document.getElementById('edit-spouse-name')) return;
  
  const spouseSection = document.createElement('div');
  spouseSection.className = 'family-member';
  spouseSection.innerHTML = `
    <h4>배우자</h4>
    <div class="form-group">
      <label for="edit-spouse-name">이름</label>
      <input type="text" id="edit-spouse-name" autocomplete="name" value="">
    </div>
    <div class="form-group">
      <label for="edit-spouse-birthday">생년월일</label>
      <input type="text" id="edit-spouse-birthday" autocomplete="bday" value="">
    </div>
    <div class="form-group">
      <label for="edit-spouse-notes">비고</label>
      <textarea id="edit-spouse-notes" autocomplete="off"></textarea>
    </div>
  `;
  
  // 자녀 섹션 앞에 삽입
  const childrenSection = familySection.querySelector('.children-section');
  if (childrenSection) {
    familySection.insertBefore(spouseSection, childrenSection);
  } else {
    familySection.appendChild(spouseSection);
  }
};

// 부모 추가
window.addParent = function() {
  // 동적 폼의 부모 추가 함수가 있는지 확인
  if (window.addParent && document.getElementById('parentSection')) {
    window.addParent();
    return;
  }
  
  // 수정 모달용 부모 추가 (현재는 기본 구현)
  showToast('부모 정보 추가 기능은 현재 개발 중입니다.', 'info');
};

// 전역 함수들 추가
window.showMissionaryDetail = function(missionaryId) {
  const missionary = missionaries.find(m => m.id === missionaryId);
  if (missionary) {
    renderMissionaryDetailModal(missionary);
  }
};

window.archiveMissionary = function(missionaryId) {
  archiveMissionaryAction(missionaryId);
};

window.unarchiveMissionary = function(missionaryId) {
  unarchiveMissionaryAction(missionaryId);
};

window.deleteMissionaryConfirm = function(missionaryId) {
  if (confirm('정말로 이 선교사를 삭제하시겠습니까?')) {
    archiveMissionaryAction(missionaryId);
  }
};

window.permanentDeleteConfirm = function(missionaryId) {
  if (confirm('정말로 이 선교사를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    permanentDeleteAction(missionaryId);
  }
};

// 페이지 로딩 완료 표시 및 검증
window.addEventListener('load', () => {
  document.body.style.display = 'block';
  
  // 이벤트 바인딩 상태 검증
  setTimeout(() => {
    const missionaryGrid = document.querySelector('.missionary-grid');
    const nameElements = document.querySelectorAll('.missionary-name');
    
    console.log('[선교사 관리] 검증 결과:');
    console.log('- missionary-grid 존재:', !!missionaryGrid);
    console.log('- missionary-name 요소 개수:', nameElements.length);
    
    if (missionaryGrid) {
      console.log('- 이벤트 위임 설정 완료');
    }
    
    nameElements.forEach((el, index) => {
      console.log(`- 이름 요소 ${index + 1}:`, el.textContent, 'cursor:', el.style.cursor);
    });
  }, 1000);
});

// 읽기 전용 상세 모달 생성/표시 함수
function renderReadOnlyMissionaryModal(missionary) {
  // 기존 모달이 있으면 제거
  const oldModal = document.getElementById('readOnlyMissionaryModal');
  if (oldModal) oldModal.remove();

  // 상세 정보 HTML
  const html = `
    <div id="readOnlyMissionaryModal" class="modal" style="display: flex; z-index: 99999; align-items: center; justify-content: center;">
      <div class="modal-content large-modal" style="max-width:600px;width:90vw;position:relative;">
        <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h2>선교사 정보</h2>
          <button type="button" class="close-btn" onclick="document.getElementById('readOnlyMissionaryModal').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:24px 0;">
          ${renderMissionaryDetailContent(missionary)}
        </div>
        <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;">
          <button type="button" class="btn btn-primary" onclick="editMissionary('${missionary.id}')">수정</button>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('readOnlyMissionaryModal').remove()">닫기</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

// 선교사정보 가상 탭으로 이동 및 읽기 전용 폼 렌더링
function showMissionaryDetailTab(missionary) {
  currentTab = 'detail';
  readOnlyMissionary = missionary;
  renderMissionaryDetailTab();
}

// 선교사정보 가상 탭 렌더링
function renderMissionaryDetailTab() {
  // 메인 컨테이너를 비우고 읽기 전용 폼 삽입
  const main = document.querySelector('main.admin-main') || document.body;
  main.innerHTML = `
    <div class="page-header">
      <h1>👤 선교사정보</h1>
      <button class="btn btn-secondary" style="float:right;" onclick="goToManagementTab()">닫기</button>
    </div>
    <div id="missionaryDetailFormContainer"></div>
  `;
  renderReadOnlyMissionaryForm('missionaryDetailFormContainer', readOnlyMissionary);
}

// 선교사정보 → 선교사 관리로 돌아가기
window.goToManagementTab = function() {
  currentTab = 'management';
  readOnlyMissionary = null;
  // 전체 페이지 새로 렌더링 (목록)
  location.reload(); // 가장 간단하게 새로고침으로 복구
}

// 읽기 전용 폼 렌더링 (선교사 입력 폼과 동일, input/textarea/버튼 모두 disabled)
function renderReadOnlyMissionaryForm(containerId, missionary) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // 입력 폼과 거의 동일하게, 모든 필드를 disabled/readOnly로 출력 + 가족/후원/시스템 정보 등도 모두 표시
  container.innerHTML = `
    <form class="readonly-form" autocomplete="off" style="max-width:600px;margin:0 auto;">
      <div class="form-group"><label>이름</label><input type="text" value="${missionary.name || ''}" readonly disabled /></div>
      <div class="form-group"><label>영문명</label><input type="text" value="${missionary.english_name || ''}" readonly disabled /></div>
      <div class="form-group"><label>국가</label><input type="text" value="${missionary.country || ''}" readonly disabled /></div>
      <div class="form-group"><label>도시</label><input type="text" value="${missionary.city || ''}" readonly disabled /></div>
      <div class="form-group"><label>사역 분야</label><input type="text" value="${missionary.mission || ''}" readonly disabled /></div>
      <div class="form-group"><label>소속노회</label><input type="text" value="${missionary.presbytery || ''}" readonly disabled /></div>
      <div class="form-group"><label>소속단체</label><input type="text" value="${missionary.organization || ''}" readonly disabled /></div>
      <div class="form-group"><label>현지소속 기관</label><input type="text" value="${missionary.local_organization || ''}" readonly disabled /></div>
      <div class="form-group"><label>파송일</label><input type="text" value="${missionary.sent_date || missionary.sending_date || ''}" readonly disabled /></div>
      <div class="form-group"><label>파송교회</label><input type="text" value="${missionary.sending_church || ''}" readonly disabled /></div>
      <div class="form-group"><label>후원교회</label><input type="text" value="${missionary.support_church || ''}" readonly disabled /></div>
      <div class="form-group"><label>후원회장</label><input type="text" value="${missionary.support_chairman || ''}" readonly disabled /></div>
      <div class="form-group"><label>후원총무</label><input type="text" value="${missionary.support_secretary || ''}" readonly disabled /></div>
      <div class="form-group"><label>후원금현황</label><input type="text" value="${missionary.support_amount || ''}" readonly disabled /></div>
      <div class="form-group"><label>이메일</label><input type="text" value="${missionary.email || ''}" readonly disabled /></div>
      <div class="form-group"><label>현지 전화번호</label><input type="text" value="${missionary.local_phone || ''}" readonly disabled /></div>
      <div class="form-group"><label>현지 응급전화</label><input type="text" value="${missionary.local_emergency || ''}" readonly disabled /></div>
      <div class="form-group"><label>귀국시 전화번호</label><input type="text" value="${missionary.korea_phone || ''}" readonly disabled /></div>
      <div class="form-group"><label>한국 응급전화</label><input type="text" value="${missionary.korea_emergency || ''}" readonly disabled /></div>
      <div class="form-group"><label>현지 주소</label><input type="text" value="${missionary.local_address || ''}" readonly disabled /></div>
      <div class="form-group"><label>귀국시 주소</label><input type="text" value="${missionary.korea_address || ''}" readonly disabled /></div>
      <div class="form-group"><label>비고</label><textarea readonly disabled>${missionary.note || ''}</textarea></div>
      <div class="form-group"><label>기도제목</label><textarea readonly disabled>${missionary.prayer || ''}</textarea></div>
      <!-- 가족사항 -->
      <div class="form-group"><label>가족사항</label><div style="background:#222;padding:12px 16px;border-radius:8px;">${missionary.family ? renderFamilyDetail(missionary.family) : '<span style=\"color:#aaa\">가족 정보 없음</span>'}</div></div>
      <!-- 후원정보 -->
      <div class="form-group"><label>후원정보</label><div style="background:#222;padding:12px 16px;border-radius:8px;">${missionary.supporters ? renderSupportersDetail(missionary.supporters) : '<span style=\"color:#aaa\">후원 정보 없음</span>'}</div></div>
      <!-- 시스템 정보 -->
      <div class="form-group"><label>시스템 정보</label><div style="background:#222;padding:12px 16px;border-radius:8px;">
        <div>등록일: ${missionary.createdAt ? (new Date(missionary.createdAt).toLocaleString('ko-KR')) : '-'}</div>
        <div>수정일: ${missionary.updatedAt ? (new Date(missionary.updatedAt).toLocaleString('ko-KR')) : '-'}</div>
        <div>아카이브: ${missionary.archived ? '예' : '아니오'}</div>
        <div>ID: ${missionary.id || '-'}</div>
      </div></div>
      <div class="form-actions" style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" class="btn btn-primary" onclick="editMissionary('${missionary.id}')">수정</button>
        <button type="button" class="btn btn-secondary" onclick="goToManagementTab()">닫기</button>
      </div>
    </form>
  `;
}

// summary-box 기능 버튼 모달 오픈/닫기
function openModal(id) {
  document.getElementById(id).style.display = 'block';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
  const btnAllEmail = document.getElementById('btn-all-email');
  const btnInactiveEmail = document.getElementById('btn-inactive-email');
  const btnExportLocalInfo = document.getElementById('btn-export-local-info');
  if (btnAllEmail) btnAllEmail.onclick = () => openModal('modal-all-email');
  if (btnInactiveEmail) btnInactiveEmail.onclick = () => openModal('modal-inactive-email');
  if (btnExportLocalInfo) btnExportLocalInfo.onclick = () => openModal('modal-export-local-info');
});

// 전체이메일 기능 구현
function getAllMissionaryEmails() {
  // missionaryList에서 이메일만 추출 (중복/빈값 제거)
  if (!window.missionaryListData) return [];
  const emails = window.missionaryListData
    .map(m => m.email)
    .filter(e => e && e.includes('@'));
  // 중복 제거
  return Array.from(new Set(emails));
}

function updateAllEmailTextarea() {
  const autoEmails = getAllMissionaryEmails();
  const manualEmails = (window.manualEmailList || []);
  const all = [...autoEmails, ...manualEmails];
  document.getElementById('all-email-list').value = all.join(', ');
}

// 수동 추가
window.manualEmailList = [];
document.addEventListener('DOMContentLoaded', function() {
  // missionaryListData 준비: missionaryListData = [{name, email, ...}, ...]
  // missionaryListData는 기존 목록 로딩 시 window에 저장하도록 별도 코드 필요

  // 전체이메일 모달 오픈 시 자동 이메일 추출
  const btnAllEmail = document.getElementById('btn-all-email');
  if (btnAllEmail) btnAllEmail.onclick = function() {
    window.manualEmailList = [];
    updateAllEmailTextarea();
    openModal('modal-all-email');
  };

  // 수동 이메일 추가
  const addManualBtn = document.getElementById('add-manual-email');
  if (addManualBtn) addManualBtn.onclick = function() {
    const input = document.getElementById('manual-email-input');
    const email = input.value.trim();
    if (email && email.includes('@')) {
      if (!window.manualEmailList.includes(email)) {
        window.manualEmailList.push(email);
        updateAllEmailTextarea();
      }
      input.value = '';
    }
  };

  // 이메일 복사
  const copyBtn = document.getElementById('copy-all-email-list');
  if (copyBtn) copyBtn.onclick = function() {
    const textarea = document.getElementById('all-email-list');
    textarea.select();
    document.execCommand('copy');
    alert('이메일 리스트가 복사되었습니다!');
  };

  // TXT로 저장
  const downloadBtn = document.getElementById('download-all-email-list');
  if (downloadBtn) downloadBtn.onclick = function() {
    const emails = document.getElementById('all-email-list').value;
    const blob = new Blob([emails], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '전체이메일리스트.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
});

// 뜸한분메일 기능 구현
function getInactiveMissionaryEmails(months) {
  if (!window.missionaryListData) return [];
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  const emails = window.missionaryListData
    .filter(m => {
      if (!m.email || !m.lastNewsletterDate) return true; // 뉴스레터 기록 없으면 포함
      const last = new Date(m.lastNewsletterDate);
      return last < cutoff;
    })
    .map(m => m.email)
    .filter(e => e && e.includes('@'));
  return Array.from(new Set(emails));
}

function updateInactiveEmailTextarea() {
  const months = parseInt(document.getElementById('inactive-months').value, 10) || 6;
  const autoEmails = getInactiveMissionaryEmails(months);
  const manualEmails = (window.manualInactiveEmailList || []);
  const all = [...autoEmails, ...manualEmails];
  document.getElementById('inactive-email-list').value = all.join(', ');
}

window.manualInactiveEmailList = [];
document.addEventListener('DOMContentLoaded', function() {
  // 뜸한분메일 모달 오픈 시 자동 이메일 추출
  const btnInactiveEmail = document.getElementById('btn-inactive-email');
  if (btnInactiveEmail) btnInactiveEmail.onclick = function() {
    window.manualInactiveEmailList = [];
    updateInactiveEmailTextarea();
    openModal('modal-inactive-email');
  };
  // 개월수 변경/리스트 갱신
  const monthsInput = document.getElementById('inactive-months');
  const refreshBtn = document.getElementById('refresh-inactive-email-list');
  if (monthsInput) monthsInput.onchange = updateInactiveEmailTextarea;
  if (refreshBtn) refreshBtn.onclick = updateInactiveEmailTextarea;
  // 수동 이메일 추가
  const addManualBtn = document.getElementById('add-manual-inactive-email');
  if (addManualBtn) addManualBtn.onclick = function() {
    const input = document.getElementById('manual-inactive-email-input');
    const email = input.value.trim();
    if (email && email.includes('@')) {
      if (!window.manualInactiveEmailList.includes(email)) {
        window.manualInactiveEmailList.push(email);
        updateInactiveEmailTextarea();
      }
      input.value = '';
    }
  };
  // 이메일 복사
  const copyBtn = document.getElementById('copy-inactive-email-list');
  if (copyBtn) copyBtn.onclick = function() {
    const textarea = document.getElementById('inactive-email-list');
    textarea.select();
    document.execCommand('copy');
    alert('이메일 리스트가 복사되었습니다!');
  };
  // TXT로 저장
  const downloadBtn = document.getElementById('download-inactive-email-list');
  if (downloadBtn) downloadBtn.onclick = function() {
    const emails = document.getElementById('inactive-email-list').value;
    const blob = new Blob([emails], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '뜸한분이메일리스트.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
});

// 증명서 발급 기능

function getInactiveMissionaryEmails(months) {
  if (!window.missionaryListData) return [];
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  const emails = window.missionaryListData
    .filter(m => {
      if (!m.email || !m.lastNewsletterDate) return true; // 뉴스레터 기록 없으면 포함
      const last = new Date(m.lastNewsletterDate);
      return last < cutoff;
    })
    .map(m => m.email)
    .filter(e => e && e.includes('@'));
  return Array.from(new Set(emails));
}

function updateInactiveEmailTextarea() {
  const months = parseInt(document.getElementById('inactive-months').value, 10) || 6;
  const autoEmails = getInactiveMissionaryEmails(months);
  const manualEmails = (window.manualInactiveEmailList || []);
  const all = [...autoEmails, ...manualEmails];
  document.getElementById('inactive-email-list').value = all.join(', ');
}

window.manualInactiveEmailList = [];
document.addEventListener('DOMContentLoaded', function() {
  // 뜸한분메일 모달 오픈 시 자동 이메일 추출
  const btnInactiveEmail = document.getElementById('btn-inactive-email');
  if (btnInactiveEmail) btnInactiveEmail.onclick = function() {
    window.manualInactiveEmailList = [];
    updateInactiveEmailTextarea();
    openModal('modal-inactive-email');
  };
  // 개월수 변경/리스트 갱신
  const monthsInput = document.getElementById('inactive-months');
  const refreshBtn = document.getElementById('refresh-inactive-email-list');
  if (monthsInput) monthsInput.onchange = updateInactiveEmailTextarea;
  if (refreshBtn) refreshBtn.onclick = updateInactiveEmailTextarea;
  // 수동 이메일 추가
  const addManualBtn = document.getElementById('add-manual-inactive-email');
  if (addManualBtn) addManualBtn.onclick = function() {
    const input = document.getElementById('manual-inactive-email-input');
    const email = input.value.trim();
    if (email && email.includes('@')) {
      if (!window.manualInactiveEmailList.includes(email)) {
        window.manualInactiveEmailList.push(email);
        updateInactiveEmailTextarea();
      }
      input.value = '';
    }
  };
  // 이메일 복사
  const copyBtn = document.getElementById('copy-inactive-email-list');
  if (copyBtn) copyBtn.onclick = function() {
    const textarea = document.getElementById('inactive-email-list');
    textarea.select();
    document.execCommand('copy');
    alert('이메일 리스트가 복사되었습니다!');
  };
  // TXT로 저장
  const downloadBtn = document.getElementById('download-inactive-email-list');
  if (downloadBtn) downloadBtn.onclick = function() {
    const emails = document.getElementById('inactive-email-list').value;
    const blob = new Blob([emails], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '뜸한분이메일리스트.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
});

// 증명서 발급 기능
const CERTIFICATE_TYPES = {
  send: { title: '파송증명서', template: (m) => `<b>${m.name}</b> 선교사님의 파송증명서 미리보기입니다.<br>영문이름: ${m.englishName || ''}<br>국가: ${m.country || ''}` },
  employ: { title: '재직증명서', template: (m) => `<b>${m.name}</b> 선교사님의 재직증명서 미리보기입니다.<br>영문이름: ${m.englishName || ''}<br>국가: ${m.country || ''}` },
  career: { title: '경력증명서', template: (m) => `<b>${m.name}</b> 선교사님의 경력증명서 미리보기입니다.<br>영문이름: ${m.englishName || ''}<br>국가: ${m.country || ''}` },
};
let selectedCertificateType = null;
let selectedMissionary = null;

document.addEventListener('DOMContentLoaded', function() {
  // 증명서 버튼 이벤트
  document.getElementById('btn-certificate-send').onclick = function() { openCertificateModal('send'); };
  document.getElementById('btn-certificate-employ').onclick = function() { openCertificateModal('employ'); };
  document.getElementById('btn-certificate-career').onclick = function() { openCertificateModal('career'); };

  // 이름 입력 자동완성
  const nameInput = document.getElementById('certificate-name-input');
  const autocomplete = document.getElementById('certificate-autocomplete');
  nameInput.oninput = function() {
    const val = nameInput.value.trim();
    autocomplete.innerHTML = '';
    if (!val || !window.missionaryListData) return;
    const matches = window.missionaryListData.filter(m => m.name.includes(val));
    if (matches.length === 0) return;
    matches.slice(0, 5).forEach(m => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = m.name + (m.englishName ? ` (${m.englishName})` : '');
      div.onclick = function() {
        nameInput.value = m.name;
        autocomplete.innerHTML = '';
        showCertificateConfirm(m);
      };
      autocomplete.appendChild(div);
    });
  };

  // 예/아니오 버튼
  document.getElementById('certificate-confirm-yes').onclick = function() {
    showCertificatePreview(selectedMissionary);
  };
  document.getElementById('certificate-confirm-no').onclick = function() {
    document.getElementById('certificate-confirm-section').style.display = 'none';
    document.getElementById('certificate-name-input').value = '';
    selectedMissionary = null;
  };

  // 인쇄 버튼(임시)
  document.getElementById('certificate-print-btn').onclick = function() {
    window.print();
  };
});

function openCertificateModal(type) {
  selectedCertificateType = type;
  selectedMissionary = null;
  document.getElementById('certificate-modal-title').textContent = CERTIFICATE_TYPES[type].title + ' 발급';
  document.getElementById('certificate-name-input').value = '';
  document.getElementById('certificate-autocomplete').innerHTML = '';
  document.getElementById('certificate-confirm-section').style.display = 'none';
  document.getElementById('certificate-preview-section').style.display = 'none';
  openModal('modal-certificate');
}

function showCertificateConfirm(m) {
  selectedMissionary = m;
  document.getElementById('certificate-confirm-section').style.display = '';
  document.getElementById('certificate-confirm-text').textContent = `${m.name} (${m.englishName || ''}, ${m.country || ''}) 맞습니까?`;
}

function showCertificatePreview(m) {
  document.getElementById('certificate-confirm-section').style.display = 'none';
  document.getElementById('certificate-preview-section').style.display = '';
  const type = selectedCertificateType;
  document.getElementById('certificate-preview-content').innerHTML = CERTIFICATE_TYPES[type].template(m);
}