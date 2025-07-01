// 선교사 입력 UI/로직 모듈
// 유지보수 편의를 위해 모든 함수는 export 형태로 작성

// 1. 입력 폼 렌더링 (동적 생성)
window.renderMissionaryInputForm = function(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <form id="missionary-input-form" autocomplete="off">
      <div class="form-group">
        <label>이름 <span style="color:red">*</span></label>
        <input type="text" name="name" required maxlength="20" />
      </div>
      <div class="form-group">
        <label>국가 <span style="color:red">*</span></label>
        <input type="text" name="country" required maxlength="20" />
      </div>
      <div class="form-group">
        <label>사역 분야</label>
        <input type="text" name="mission" maxlength="30" />
      </div>
      <div class="form-group">
        <label>비고</label>
        <input type="text" name="note" maxlength="50" />
      </div>
      <div class="form-actions">
        <button type="button" id="btn-temp-save">임시저장</button>
        <button type="submit">등록</button>
      </div>
    </form>
    <div id="missionary-toast" style="display:none;"></div>
  `;
  // 이벤트 바인딩
  bindMissionaryInputEvents();
}

// 2. 입력값 수집
window.getMissionaryInputValues = function() {
  const form = document.getElementById('missionary-input-form');
  if (!form) return null;
  const data = {};
  Array.from(form.elements).forEach(el => {
    if (el.name) data[el.name] = el.value.trim();
  });
  return data;
}

// 3. 입력값 검증 (간단)
window.validateMissionaryInput = function(data) {
  if (!data.name) return '이름을 입력하세요.';
  if (!data.country) return '국가를 입력하세요.';
  return null;
}

// 4. 임시저장 (LocalStorage)
const TEMP_KEY = 'missionaryInputTemp';
window.saveMissionaryTemp = function(data) {
  localStorage.setItem(TEMP_KEY, JSON.stringify(data));
  showMissionaryToast('임시저장 완료', 'success');
}
window.loadMissionaryTemp = function() {
  const raw = localStorage.getItem(TEMP_KEY);
  return raw ? JSON.parse(raw) : null;
}
window.clearMissionaryTemp = function() {
  localStorage.removeItem(TEMP_KEY);
}

// 5. Firestore 저장 (firebaseService 사용)
// import { addMissionary } from '../firebaseService.js';
window.saveMissionaryToFirestore = async function(data) {
  try {
    await addMissionary(data);
    showMissionaryToast('저장 성공!', 'success');
    clearMissionaryTemp();
  } catch (e) {
    showMissionaryToast('저장 실패: ' + e.message, 'error');
  }
}

// 6. 토스트 알림
window.showMissionaryToast = function(msg, type = 'info') {
  const toast = document.getElementById('missionary-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.background = type === 'error' ? '#f44336' : (type === 'success' ? '#4caf50' : '#333');
  toast.style.color = '#fff';
  toast.style.padding = '8px 16px';
  toast.style.borderRadius = '8px';
  toast.style.position = 'fixed';
  toast.style.bottom = '40px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.zIndex = 9999;
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

// 7. 이벤트 바인딩
function bindMissionaryInputEvents() {
  const form = document.getElementById('missionary-input-form');
  if (!form) return;
  // 임시저장 버튼
  document.getElementById('btn-temp-save').onclick = () => {
    const data = getMissionaryInputValues();
    saveMissionaryTemp(data);
  };
  // 폼 제출
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = getMissionaryInputValues();
    const err = validateMissionaryInput(data);
    if (err) {
      showMissionaryToast(err, 'error');
      return;
    }
    await saveMissionaryToFirestore(data);
    form.reset();
  };
  // 임시저장 복원
  const temp = loadMissionaryTemp();
  if (temp) {
    Array.from(form.elements).forEach(el => {
      if (el.name && temp[el.name]) el.value = temp[el.name];
    });
    showMissionaryToast('임시저장 복원됨', 'info');
  }
} 