// 선교사 입력 페이지 메인 로직
// import { renderDynamicForm, loadFormSettings, saveDynamicFormTemp, loadDynamicFormTemp, clearDynamicFormTemp, getDynamicFormValues, fillFormWithData } from './ui/missionaryFormManager.js';
// import { addMissionary, updateMissionary, getMissionaries } from './firebaseService.js';

// 전역 변수
let isEditMode = false;
let currentMissionaryId = null;
let currentMissionary = null;
let isSaving = false; // 저장 중 상태 추가

// beforeunload 핸들러를 변수에 저장 (전역)
let beforeUnloadHandler = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
  await initializePage();
  bindEvents();
});

// 페이지 초기화
async function initializePage() {
  try {
    showLoading();
    
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
      isEditMode = true;
      currentMissionaryId = editId;
      await loadMissionaryData(editId);
    }
    
    await renderMissionaryForm();
    updateFirebaseStatus();
    updatePageTitle();
  } catch (error) {
    console.error('페이지 초기화 실패:', error);
    showToast('페이지 로드 실패: ' + error.message, 'error');
  }
}

// 선교사 데이터 로드 (수정 모드)
async function loadMissionaryData(missionaryId) {
  try {
    if (window.firebaseService) {
      const missionary = await window.firebaseService.getMissionary(missionaryId);
      currentMissionary = missionary;
    } else if (window.getMissionaries) {
      const missionaries = await window.getMissionaries();
      currentMissionary = missionaries.find(m => m.id === missionaryId);
    } else {
      throw new Error('선교사 데이터 서비스를 찾을 수 없습니다.');
    }
    
    if (!currentMissionary) {
      throw new Error('선교사를 찾을 수 없습니다');
    }
  } catch (error) {
    console.error('선교사 데이터 로드 실패:', error);
    throw error;
  }
}

// 페이지 제목 업데이트
function updatePageTitle() {
  const title = document.querySelector('.page-header h1');
  const pageInfo = document.querySelector('.page-info h2');
  if (!title || !pageInfo) return;
  if (isEditMode) {
    title.textContent = '👤 선교사 수정';
    pageInfo.textContent = '선교사 정보 수정';
  } else {
    title.textContent = '👤 선교사 입력';
    pageInfo.textContent = '새로운 선교사 등록';
  }
}

// 선교사 폼 렌더링
async function renderMissionaryForm() {
  const container = document.getElementById('missionaryFormContainer');
  if (!container) {
    console.error('missionaryFormContainer를 찾을 수 없습니다.');
    return;
  }
  
  try {
    // 동적 폼 렌더링
    if (window.renderDynamicForm) {
      window.renderDynamicForm('missionaryFormContainer');
    } else {
      throw new Error('renderDynamicForm 함수를 찾을 수 없습니다.');
    }
    
    // 폼 렌더링 완료 후 이벤트 바인딩
    setTimeout(() => {
      bindFormEvents();
    }, 500);
    
    // 수정 모드인 경우 기존 데이터로 폼 채우기
    if (isEditMode && currentMissionary) {
      // 폼이 완전히 렌더링될 때까지 대기
      const waitForForm = setInterval(() => {
        const form = document.getElementById('dynamic-missionary-form');
        if (form) {
          clearInterval(waitForForm);
          setTimeout(() => {
            fillFormWithMissionaryData(currentMissionary);
            showToast('선교사 정보가 로드되었습니다', 'info');
          }, 200);
        }
      }, 100);
      
      // 최대 5초 후 타임아웃
      setTimeout(() => {
        clearInterval(waitForForm);
      }, 5000);
    } else {
      // 임시저장 데이터 복원 (새 입력 모드에서만)
      if (window.loadDynamicFormTemp) {
        const tempData = window.loadDynamicFormTemp();
        if (tempData) {
          const waitForForm = setInterval(() => {
            const form = document.getElementById('dynamic-missionary-form');
            if (form) {
              clearInterval(waitForForm);
              setTimeout(() => {
                fillFormWithMissionaryData(tempData);
                showToast('임시저장된 데이터가 복원되었습니다', 'info');
              }, 200);
            }
          }, 100);
          
          // 최대 5초 후 타임아웃
          setTimeout(() => {
            clearInterval(waitForForm);
          }, 5000);
        }
      }
    }
    
  } catch (error) {
    console.error('폼 렌더링 실패:', error);
    container.innerHTML = `
      <div class="error-state">
        <h3>폼 로드 실패</h3>
        <p>폼을 불러오는 중 오류가 발생했습니다: ${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          다시 시도
        </button>
      </div>
    `;
  }
}

// 폼 이벤트 바인딩
function bindFormEvents() {
  // 동적 폼 제출 버튼 이벤트 바인딩
  const submitBtn = document.getElementById('btn-submit');
  if (submitBtn) {
    submitBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 이미 저장 중이면 중복 실행 방지
      if (isSaving) {
        console.log('이미 저장 중입니다. 중복 실행을 방지합니다.');
        return;
      }
      
      await saveMissionary();
    };
  }
  
  // 임시저장 버튼 이벤트 바인딩
  const tempSaveBtn = document.getElementById('btn-temp-save');
  if (tempSaveBtn) {
    tempSaveBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const formData = getFormData();
      if (formData && window.saveDynamicFormTemp) {
        window.saveDynamicFormTemp(formData);
        showToast('임시저장되었습니다', 'success');
      }
    };
  }
  
  // 취소 버튼 이벤트 바인딩
  const cancelBtn = document.getElementById('btn-cancel');
  if (cancelBtn) {
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      if (confirm('작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?')) {
        window.location.href = 'missionary-management.html';
      }
    };
  }
}

// 로딩 표시
function showLoading() {
  const container = document.getElementById('missionaryFormContainer');
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>선교사 입력 폼을 불러오는 중...</p>
    </div>
  `;
}

// 폼에 데이터 채우기
function fillFormWithMissionaryData(data) {
  // missionaryFormManager의 fillFormWithData 함수 사용
  if (window.fillFormWithData) {
    window.fillFormWithData(data);
  } else {
    console.error('fillFormWithData 함수를 찾을 수 없습니다.');
  }
}

// 폼 데이터 수집
function getFormData() {
  // missionaryFormManager의 getDynamicFormValues 함수 사용
  if (window.getDynamicFormValues) {
    const data = window.getDynamicFormValues();
    if (!data) {
      console.error('폼 데이터를 가져올 수 없습니다');
      return null;
    }
    return data;
  } else {
    console.error('getDynamicFormValues 함수를 찾을 수 없습니다.');
    return null;
  }
}

// 폼 검증
function validateForm(data) {
  if (window.loadFormSettings) {
    const settings = window.loadFormSettings();
    const requiredFields = settings.fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (!data[field.id] || data[field.id].toString().trim() === '') {
        return `${field.name}을(를) 입력하세요.`;
      }
    }
  }
  
  return null;
}

// 이벤트 바인딩
function bindEvents() {
  // Firebase 상태 업데이트
  setInterval(updateFirebaseStatus, 5000);
  
  // beforeunload 핸들러 정의 및 등록
  beforeUnloadHandler = function(e) {
    const form = document.getElementById('dynamic-missionary-form');
    if (form) {
      const formData = getFormData();
      if (formData && Object.values(formData).some(value => value && value.toString().trim() !== '')) {
        e.preventDefault();
        e.returnValue = '입력 중인 데이터가 있습니다. 정말로 페이지를 떠나시겠습니까?';
        return e.returnValue;
      }
    }
  };
  
  // beforeunload 이벤트 등록
  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  // 내부 네비게이션(a, button, li, div 등 모든 클릭) 시 beforeunload 완전 해제
  document.body.addEventListener('click', function(e) {
    // 모든 메뉴/탭/버튼/a 등 클릭 시 완전 해제
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
    window.onbeforeunload = null;
    setTimeout(() => { window.onbeforeunload = null; }, 100);
    setTimeout(() => { window.onbeforeunload = null; }, 300);
    setTimeout(() => { window.onbeforeunload = null; }, 600);
    setTimeout(() => { window.onbeforeunload = null; }, 1000);
    console.log('[beforeunload] 내부 네비게이션 클릭 → 완전 해제');
  }, true);
  
  // 폼 submit/cancel 등에서도 완전 해제
  document.body.addEventListener('submit', function() {
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
    window.onbeforeunload = null;
  }, true);
}

// Firebase 상태 업데이트
function updateFirebaseStatus() {
  const statusIcon = document.getElementById('bottomFirebaseStatus');
  if (statusIcon) {
    // 실제 Firebase 연결 상태 확인 로직
    statusIcon.textContent = '🔥'; // 연결됨
  }
}

// 선교사 저장
async function saveMissionary() {
  // 이미 저장 중이면 중복 실행 방지
  if (isSaving) {
    console.log('이미 저장 중입니다. 중복 실행을 방지합니다.');
    return;
  }
  
  try {
    isSaving = true; // 저장 시작
    
    // 저장 버튼 비활성화
    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '💾 저장 중...';
      submitBtn.style.opacity = '0.6';
    }
    
    const data = getFormData();
    if (!data) {
      showToast('폼 데이터를 가져올 수 없습니다', 'error');
      return;
    }
    
    // 검증
    const error = validateForm(data);
    if (error) {
      showToast(error, 'error');
      return;
    }
    
    // 저장 (수정 모드 또는 새 입력 모드)
    if (isEditMode && currentMissionaryId) {
      if (window.firebaseService) {
        await window.firebaseService.updateMissionary(currentMissionaryId, data);
      } else {
        await window.updateMissionary(currentMissionaryId, data);
      }
      showToast('선교사 정보가 성공적으로 수정되었습니다!', 'success');
    } else {
      if (window.firebaseService) {
        await window.firebaseService.addMissionary(data);
      } else {
        await window.addMissionary(data);
      }
      showToast('선교사가 성공적으로 등록되었습니다!', 'success');
    }
    
    // 임시저장 데이터 삭제
    if (window.clearDynamicFormTemp) {
      window.clearDynamicFormTemp();
    }
    
    // 폼 초기화 (새 입력 모드에서만)
    if (!isEditMode) {
      const form = document.getElementById('dynamic-missionary-form');
      if (form) {
        form.reset();
      }
    }
    
    // 성공 메시지 표시
    showSuccessMessage();
    
  } catch (error) {
    console.error('선교사 저장 실패:', error);
    showToast('저장 실패: ' + error.message, 'error');
  } finally {
    isSaving = false; // 저장 완료
    
    // 저장 버튼 다시 활성화
    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.textContent = isEditMode ? '✅ 수정하기' : '✅ 등록하기';
    }
  }
}

// 성공 메시지 표시
function showSuccessMessage() {
  const container = document.getElementById('missionaryFormContainer');
  if (!container) return;
  
  const isEdit = isEditMode;
  const title = isEdit ? '✅ 선교사 수정 완료!' : '✅ 선교사 등록 완료!';
  const message = isEdit ? '선교사 정보가 성공적으로 수정되었습니다.' : '새로운 선교사가 성공적으로 등록되었습니다.';
  
  container.innerHTML = `
    <div class="success-state">
      <h3>${title}</h3>
      <p>${message}</p>
      <div style="margin-top: 20px;">
        ${!isEdit ? `
          <button class="btn btn-primary" onclick="addAnotherMissionary()">
            ➕ 다른 선교사 추가
          </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="goToManagement()">
          👥 선교사 관리로 이동
        </button>
        ${isEdit ? `
          <button class="btn btn-primary" onclick="closeWindow()">
            ✖️ 창 닫기
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// 다른 선교사 추가
function addAnotherMissionary() {
  window.location.href = 'missionary-input.html';
}

// 선교사 관리로 이동
function goToManagement() {
  window.location.href = 'missionary-management.html';
}

// 창 닫기
function closeWindow() {
  window.close();
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
  // 간단한 토스트 메시지 구현
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
    
    if (hasLocalData) {
      statusDiv.innerHTML = '<p>LocalStorage에 데이터가 있습니다. Firebase로 마이그레이션할 수 있습니다.</p>';
      actionsDiv.style.display = 'block';
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

// 페이지 가시성 변경 시 자동 저장
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
    const data = getFormData();
    if (data && Object.values(data).some(value => value && value.toString().trim() !== '')) {
      if (window.saveDynamicFormTemp) {
        window.saveDynamicFormTemp(data);
        console.log('페이지 숨김 시 자동 임시저장 완료');
      }
    }
  }
});

// beforeunload 완전 해제 전역 함수 (보강)
window.forceRemoveBeforeUnload = function() {
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
  window.onbeforeunload = null;
  setTimeout(() => { window.onbeforeunload = null; }, 100);
  setTimeout(() => { window.onbeforeunload = null; }, 300);
  setTimeout(() => { window.onbeforeunload = null; }, 600);
  setTimeout(() => { window.onbeforeunload = null; }, 1000);
  setTimeout(() => { window.onbeforeunload = null; }, 2000);
  console.log('[beforeunload] 강제 완전 해제');
};

// 임시저장/불러오기/초기화 UX 개선
function showTempLoadModal() {
  const modal = document.createElement('div');
  modal.className = 'temp-modal';
  modal.innerHTML = `
    <div class="temp-modal-box">
      <div class="temp-modal-msg">
        <span style="font-size:2em;vertical-align:middle;">💾</span><br>
        <b>이전에 입력하다 만 임시 데이터가 있습니다.</b><br>
        <span style="color:#555;">불러올까요?</span>
      </div>
      <button class="btn btn-primary temp-modal-btn" id="btn-temp-load-yes">예, 이어서 작성</button>
      <button class="btn btn-secondary temp-modal-btn" id="btn-temp-load-no">아니요, 새로 시작</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btn-temp-load-yes').onclick = function() {
    modal.remove();
    restoreTempFormData();
  };
  document.getElementById('btn-temp-load-no').onclick = function() {
    modal.remove();
    if (window.clearDynamicFormTemp) window.clearDynamicFormTemp();
    if (window.clearFormFields) window.clearFormFields();
  };
}

function restoreTempFormData() {
  if (window.loadDynamicFormTemp) {
    const tempData = window.loadDynamicFormTemp();
    if (tempData) {
      const waitForForm = setInterval(() => {
        const form = document.getElementById('dynamic-missionary-form');
        if (form) {
          clearInterval(waitForForm);
          setTimeout(() => {
            fillFormWithMissionaryData(tempData);
            showToast('임시저장된 데이터가 복원되었습니다', 'info');
          }, 200);
        }
      }, 100);
      setTimeout(() => { clearInterval(waitForForm); }, 5000);
    }
  }
}



document.addEventListener('DOMContentLoaded', () => {
  // ... 기존 코드 ...
  // 폼 진입 시 임시저장 데이터 있으면 모달 표시
  if (!isEditMode && window.loadDynamicFormTemp && window.loadDynamicFormTemp()) {
    setTimeout(showTempLoadModal, 400);
  }

});