// familyManager.js - 간단한 가족사항 관리 시스템 (일렬 나열 방식)

// (중복 선언 제거) 이미 db, collection, getDocs는 firebase-config.js 등에서 선언되어 있다고 가정합니다.
// const { collection, getDocs } = firebase.firestore;
// const db = firebase.firestore();

// 자동 저장 타이머 초기화
window.autoSaveTimers = {};

// 기존 아코디언 방식 함수들 (주석 처리)
/*
window.toggleFamilyAccordion = function(type) {
  const content = document.getElementById(`${type}-content`);
  const accordion = document.querySelector(`.family-accordion[data-type="${type}"]`);
  const icon = accordion.querySelector('.accordion-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
};

window.addFamilyMember = function(type) {
  // 기존 아코디언 방식 코드...
};

window.removeFamilyMember = function(type, memberId) {
  // 기존 아코디언 방식 코드...
};

window.saveFamilyMember = function(type, memberId) {
  // 기존 아코디언 방식 코드...
};

window.autoSaveFamilyMember = function(type, memberId) {
  // 기존 아코디언 방식 코드...
};

window.checkDuplicateName = async function(inputElement, type) {
  // 기존 아코디언 방식 코드...
};

window.updateFamilySummary = function(type) {
  // 기존 아코디언 방식 코드...
};

window.updateFamilyMemberNumbers = function(type) {
  // 기존 아코디언 방식 코드...
};
*/

// 새로운 간단한 가족사항 관리 함수들 (일렬 나열 방식)

// 가족 구성원 추가 (간단한 방식)
window.addFamilyMemberSimple = function(type) {
  const container = document.getElementById(`${type}-container`);
  const memberCount = container.children.length;
  const memberId = `${type}_${memberCount + 1}`;
  
  let memberHtml = '';
  let title = '';
  
  switch(type) {
    case 'spouse':
      title = '배우자';
      memberHtml = `
        <div class="family-member-simple" data-type="${type}" data-id="${memberId}">
          <div class="member-header-simple">
            <span class="member-title">${title}</span>
            <div class="member-actions-simple">
              <button type="button" class="btn-remove-simple" onclick="removeFamilyMemberSimple('${type}', '${memberId}')" title="삭제">🗑️</button>
            </div>
          </div>
          <div class="member-form-simple">
            <div class="form-row-simple">
              <div class="form-group-simple">
                <label for="${type}_name_${memberCount + 1}">이름</label>
                <input type="text" id="${type}_name_${memberCount + 1}" name="${type}_name_${memberCount + 1}" 
                       autocomplete="name" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')" 
                       onblur="checkDuplicateNameSimple(this, '${type}')">
              </div>
              <div class="form-group-simple">
                <label for="${type}_birthday_${memberCount + 1}">생년월일</label>
                <input type="text" id="${type}_birthday_${memberCount + 1}" name="${type}_birthday_${memberCount + 1}" 
                       autocomplete="bday" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')">
              </div>
            </div>
            <div class="form-group-simple">
              <label for="${type}_notes_${memberCount + 1}">비고</label>
              <textarea id="${type}_notes_${memberCount + 1}" name="${type}_notes_${memberCount + 1}" 
                        autocomplete="off" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')"></textarea>
            </div>
            <div class="member-save-actions">
              <button type="button" class="btn-save-member" onclick="saveFamilyMemberSimple('${type}', '${memberId}')" title="저장하기">
                💾 저장하기
              </button>
            </div>
          </div>
        </div>
      `;
      break;
      
    case 'parents':
      title = `부모 ${memberCount + 1}`;
      memberHtml = `
        <div class="family-member-simple" data-type="${type}" data-id="${memberId}">
          <div class="member-header-simple">
            <span class="member-title">${title}</span>
            <div class="member-actions-simple">
              <button type="button" class="btn-remove-simple" onclick="removeFamilyMemberSimple('${type}', '${memberId}')" title="삭제">🗑️</button>
            </div>
          </div>
          <div class="member-form-simple">
            <div class="form-row-simple">
              <div class="form-group-simple">
                <label for="${type}_name_${memberCount + 1}">이름</label>
                <input type="text" id="${type}_name_${memberCount + 1}" name="${type}_name_${memberCount + 1}" 
                       autocomplete="name" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')" 
                       onblur="checkDuplicateNameSimple(this, '${type}')">
              </div>
              <div class="form-group-simple">
                <label for="${type}_birthday_${memberCount + 1}">생년월일</label>
                <input type="text" id="${type}_birthday_${memberCount + 1}" name="${type}_birthday_${memberCount + 1}" 
                       autocomplete="bday" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')">
              </div>
            </div>
            <div class="form-group-simple">
              <label for="${type}_notes_${memberCount + 1}">비고</label>
              <textarea id="${type}_notes_${memberCount + 1}" name="${type}_notes_${memberCount + 1}" 
                        autocomplete="off" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')"></textarea>
            </div>
            <div class="member-save-actions">
              <button type="button" class="btn-save-member" onclick="saveFamilyMemberSimple('${type}', '${memberId}')" title="저장하기">
                💾 저장하기
              </button>
            </div>
          </div>
        </div>
      `;
      break;
      
    case 'children':
      title = `자녀 ${memberCount + 1}`;
      memberHtml = `
        <div class="family-member-simple" data-type="${type}" data-id="${memberId}">
          <div class="member-header-simple">
            <span class="member-title">${title}</span>
            <div class="member-actions-simple">
              <button type="button" class="btn-remove-simple" onclick="removeFamilyMemberSimple('${type}', '${memberId}')" title="삭제">🗑️</button>
            </div>
          </div>
          <div class="member-form-simple">
            <div class="form-row-simple">
              <div class="form-group-simple">
                <label for="${type}_name_${memberCount + 1}">이름</label>
                <input type="text" id="${type}_name_${memberCount + 1}" name="${type}_name_${memberCount + 1}" 
                       autocomplete="name" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')" 
                       onblur="checkDuplicateNameSimple(this, '${type}')">
              </div>
              <div class="form-group-simple">
                <label for="${type}_birthday_${memberCount + 1}">생년월일</label>
                <input type="text" id="${type}_birthday_${memberCount + 1}" name="${type}_birthday_${memberCount + 1}" 
                       autocomplete="bday" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')">
              </div>
            </div>
            <div class="form-group-simple">
              <label for="${type}_notes_${memberCount + 1}">비고</label>
              <textarea id="${type}_notes_${memberCount + 1}" name="${type}_notes_${memberCount + 1}" 
                        autocomplete="off" oninput="autoSaveFamilyMemberSimple('${type}', '${memberId}')"></textarea>
            </div>
            <div class="member-save-actions">
              <button type="button" class="btn-save-member" onclick="saveFamilyMemberSimple('${type}', '${memberId}')" title="저장하기">
                💾 저장하기
              </button>
            </div>
          </div>
        </div>
      `;
      break;
  }
  
  container.insertAdjacentHTML('beforeend', memberHtml);
  updateFamilyMemberNumbersSimple(type);
};

// 가족 구성원 삭제 (간단한 방식)
window.removeFamilyMemberSimple = function(type, memberId) {
  const member = document.querySelector(`[data-type="${type}"][data-id="${memberId}"]`);
  if (member) {
    member.remove();
    updateFamilyMemberNumbersSimple(type);
  }
};

// 가족 구성원 저장 (간단한 방식)
window.saveFamilyMemberSimple = function(type, memberId) {
  const member = document.querySelector(`[data-type="${type}"][data-id="${memberId}"]`);
  if (!member) return;
  
  const nameInput = member.querySelector(`input[name*="_name_"]`);
  const birthdayInput = member.querySelector(`input[name*="_birthday_"]`);
  const notesInput = member.querySelector(`textarea[name*="_notes_"]`);
  
  const memberData = {
    name: nameInput ? nameInput.value.trim() : '',
    birthday: birthdayInput ? birthdayInput.value.trim() : '',
    notes: notesInput ? notesInput.value.trim() : ''
  };
  
  // 저장 버튼에 로딩 상태 적용
  const saveBtn = member.querySelector('.btn-save-member');
  if (saveBtn) {
    saveBtn.classList.add('saving');
    saveBtn.textContent = '⏳';
    saveBtn.title = '저장 중...';
    
    // 로딩 애니메이션
    member.classList.add('loading');
  }
  
  // 임시 저장 (비동기 처리 시뮬레이션)
  setTimeout(() => {
    saveFamilyDataToTemp(type, memberId, memberData);
    
    // 저장 완료 피드백
    if (saveBtn) {
      saveBtn.classList.remove('saving');
      saveBtn.textContent = '✅';
      saveBtn.title = '저장됨';
      saveBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
      
      // 1초 후 원래 상태로 복원
      setTimeout(() => {
        saveBtn.textContent = '💾';
        saveBtn.title = '저장';
        saveBtn.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
      }, 1000);
    }
    
    // 로딩 상태 제거
    member.classList.remove('loading');
    
    // 성공 토스트 메시지
    showSaveSuccessToast(`${type === 'spouse' ? '배우자' : type === 'parents' ? '부모' : '자녀'} 정보가 저장되었습니다.`);
    
  }, 500); // 500ms 지연으로 저장 중임을 시각적으로 표현
};

// 자동 저장 (간단한 방식)
window.autoSaveFamilyMemberSimple = function(type, memberId) {
  // 디바운스 처리 (500ms 후 저장)
  clearTimeout(window.autoSaveTimers[memberId]);
  window.autoSaveTimers[memberId] = setTimeout(() => {
    saveFamilyMemberSimple(type, memberId);
  }, 500);
};

// 저장 성공 토스트 메시지
window.showSaveSuccessToast = function(message) {
  // 기존 토스트가 있다면 제거
  const existingToast = document.querySelector('.save-success-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 새 토스트 생성
  const toast = document.createElement('div');
  toast.className = 'save-success-toast';
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">✅</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  
  // 스타일 적용
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  
  // 토스트 내용 스타일
  const toastContent = toast.querySelector('.toast-content');
  toastContent.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 500;
  `;
  
  // 아이콘 스타일
  const toastIcon = toast.querySelector('.toast-icon');
  toastIcon.style.cssText = `
    font-size: 16px;
  `;
  
  // 메시지 스타일
  const toastMessage = toast.querySelector('.toast-message');
  toastMessage.style.cssText = `
    white-space: nowrap;
  `;
  
  // DOM에 추가
  document.body.appendChild(toast);
  
  // 애니메이션 시작
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
};

// 중복 이름 확인 (간단한 방식)
window.checkDuplicateNameSimple = async function(inputElement, type) {
  const name = inputElement.value.trim();
  if (!name) return;
  
  try {
    const missionaries = await getAllMissionaries();
    const duplicates = missionaries.filter(m => {
      if (type === 'spouse' && m.family?.spouse?.name === name) return true;
      if (type === 'parents' && m.family?.parents?.some(p => p.name === name)) return true;
      if (type === 'children' && m.family?.children?.some(c => c.name === name)) return true;
      return false;
    });
    
    if (duplicates.length > 0) {
      const duplicate = duplicates[0];
      const confirmMessage = `"${name}"님은 이미 등록된 ${duplicate.name} 선교사님의 ${type === 'spouse' ? '배우자' : type === 'parents' ? '부모' : '자녀'}로 등록되어 있습니다.\n\n선교사: ${duplicate.name}\n국가: ${duplicate.country || '미입력'}\n생년월일: ${duplicate.sent_date || '미입력'}\n\n같은 사람입니까?`;
      
      if (confirm(confirmMessage)) {
        // 기존 데이터로 자동 채우기
        const existingData = type === 'spouse' ? duplicate.family?.spouse : 
                           type === 'parents' ? duplicate.family?.parents?.find(p => p.name === name) :
                           duplicate.family?.children?.find(c => c.name === name);
        
        if (existingData) {
          const member = inputElement.closest('.family-member-simple');
          const birthdayInput = member.querySelector(`input[name*="_birthday_"]`);
          const notesInput = member.querySelector(`textarea[name*="_notes_"]`);
          
          if (birthdayInput) birthdayInput.value = existingData.birthday || '';
          if (notesInput) notesInput.value = existingData.notes || '';
          
          saveFamilyMemberSimple(type, member.dataset.id);
        }
      }
    }
  } catch (error) {
    console.error('중복 이름 확인 중 오류:', error);
  }
};

// 가족 구성원 번호 업데이트 (간단한 방식)
window.updateFamilyMemberNumbersSimple = function(type) {
  const container = document.getElementById(`${type}-container`);
  const members = container.querySelectorAll('.family-member-simple');
  
  members.forEach((member, index) => {
    const title = member.querySelector('.member-title');
    if (title) {
      if (type === 'spouse') {
        title.textContent = '배우자';
      } else if (type === 'parents') {
        title.textContent = `부모 ${index + 1}`;
      } else if (type === 'children') {
        title.textContent = `자녀 ${index + 1}`;
      }
    }
  });
};

// 임시 저장
window.saveFamilyDataToTemp = function(type, memberId, data) {
  const tempKey = `family_temp_${type}_${memberId}`;
  localStorage.setItem(tempKey, JSON.stringify(data));
};

// 임시 데이터 로드
window.loadFamilyDataFromTemp = function(type, memberId) {
  const tempKey = `family_temp_${type}_${memberId}`;
  const data = localStorage.getItem(tempKey);
  return data ? JSON.parse(data) : null;
};

// 전체 가족 데이터 수집 (간단한 방식)
window.collectAllFamilyData = function() {
  const familyData = {
    spouse: {},
    parents: [],
    children: []
  };
  
  // 배우자 데이터
  const spouseMember = document.querySelector('[data-type="spouse"]');
  if (spouseMember) {
    const nameInput = spouseMember.querySelector(`input[name*="_name_"]`);
    const birthdayInput = spouseMember.querySelector(`input[name*="_birthday_"]`);
    const notesInput = spouseMember.querySelector(`textarea[name*="_notes_"]`);
    
    if (nameInput && nameInput.value.trim()) {
      familyData.spouse = {
        name: nameInput.value.trim(),
        birthday: birthdayInput ? birthdayInput.value.trim() : '',
        notes: notesInput ? notesInput.value.trim() : ''
      };
    }
  }
  
  // 부모 데이터
  const parentMembers = document.querySelectorAll('[data-type="parents"]');
  parentMembers.forEach(member => {
    const nameInput = member.querySelector(`input[name*="_name_"]`);
    const birthdayInput = member.querySelector(`input[name*="_birthday_"]`);
    const notesInput = member.querySelector(`textarea[name*="_notes_"]`);
    
    if (nameInput && nameInput.value.trim()) {
      familyData.parents.push({
        name: nameInput.value.trim(),
        birthday: birthdayInput ? birthdayInput.value.trim() : '',
        notes: notesInput ? notesInput.value.trim() : ''
      });
    }
  });
  
  // 자녀 데이터
  const childMembers = document.querySelectorAll('[data-type="children"]');
  childMembers.forEach(member => {
    const nameInput = member.querySelector(`input[name*="_name_"]`);
    const birthdayInput = member.querySelector(`input[name*="_birthday_"]`);
    const notesInput = member.querySelector(`textarea[name*="_notes_"]`);
    
    if (nameInput && nameInput.value.trim()) {
      familyData.children.push({
        name: nameInput.value.trim(),
        birthday: birthdayInput ? birthdayInput.value.trim() : '',
        notes: notesInput ? notesInput.value.trim() : ''
      });
    }
  });
  
  return familyData;
};

// 모든 선교사 데이터 가져오기 (중복 확인용)
window.getAllMissionaries = async function() {
  try {
    // Firebase가 초기화되지 않은 경우 빈 배열 반환
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.warn('Firebase가 초기화되지 않았습니다. 중복 확인을 건너뜁니다.');
      return [];
    }
    
    const { collection, getDocs } = firebase.firestore;
    const db = firebase.firestore();
    
    const missionariesRef = collection(db, 'missionaries');
    const snapshot = await getDocs(missionariesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('선교사 데이터 로드 오류:', error);
    return [];
  }
};
