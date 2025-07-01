// missionaryFormManager.js (모듈 분리 안내)
// 아래 순서대로 각 모듈을 <script>로 불러오세요:
// 1. formUtils.js
// 2. familyManager.js
// 3. supporterManager.js
// 4. dynamicFormRenderer.js
// 5. formSettingsManager.js
//
// 각 기능별 함수는 window.XXX로 등록되어 있으니 기존처럼 사용 가능합니다.

// 선교사 입력 폼 관리 모듈
// 동적 필드/탭/카테고리 관리 기능

// 기본 필드 타입 정의
const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea', 
  SELECT: 'select',
  DATE: 'date',
  EMAIL: 'email',
  TEL: 'tel',
  NUMBER: 'number',
  CHECKBOX: 'checkbox',
  RADIO: 'radio'
};

// 기본 카테고리/탭 정의
const DEFAULT_CATEGORIES = [
  { id: 'basic', name: '기본정보', order: 1 },
  { id: 'family', name: '가족사항', order: 2 },
  { id: 'church', name: '교회정보', order: 3 },
  { id: 'support', name: '후원정보', order: 4 },
  { id: 'contact', name: '연락처', order: 5 }
];

// 기본 필드 정의
const DEFAULT_FIELDS = [
  // 기본정보
  { id: 'name', name: '이름', type: FIELD_TYPES.TEXT, required: true, category: 'basic', order: 1, maxLength: 20 },
  { id: 'english_name', name: '영문명', type: FIELD_TYPES.TEXT, required: false, category: 'basic', order: 2, maxLength: 50 },
  { id: 'country', name: '국가', type: FIELD_TYPES.TEXT, required: true, category: 'basic', order: 3, maxLength: 20 },
  { id: 'city', name: '도시', type: FIELD_TYPES.TEXT, required: false, category: 'basic', order: 4, maxLength: 30 },
  { id: 'organization', name: '소속기관', type: FIELD_TYPES.TEXT, required: false, category: 'basic', order: 5, maxLength: 100 },
  { id: 'sent_date', name: '파송일', type: FIELD_TYPES.DATE, required: false, category: 'basic', order: 6 },
  { id: 'prayer', name: '기도제목', type: FIELD_TYPES.TEXTAREA, required: false, category: 'basic', order: 7, maxLength: 200 },
  { id: 'lat', name: '위도', type: FIELD_TYPES.NUMBER, required: false, category: 'basic', order: 8, step: '0.000001' },
  { id: 'lng', name: '경도', type: FIELD_TYPES.NUMBER, required: false, category: 'basic', order: 9, step: '0.000001' },
  { id: 'image', name: '이미지 URL', type: FIELD_TYPES.TEXT, required: false, category: 'basic', order: 10 },
  { id: 'NewsLetter', name: '뉴스레터 URL', type: FIELD_TYPES.TEXT, required: false, category: 'basic', order: 11 },
  
  // 가족사항 (DB 차일드 방식으로 변경)
  { id: 'family', name: '가족사항', type: 'family_group', required: false, category: 'family', order: 1 },
  
  // 교회정보
  { id: 'presbytery', name: '소속노회', type: FIELD_TYPES.TEXT, required: false, category: 'church', order: 1, maxLength: 30 },
  { id: 'sending_church', name: '파송교회', type: FIELD_TYPES.TEXT, required: false, category: 'church', order: 2, maxLength: 50 },
  { id: 'support_church', name: '후원교회', type: FIELD_TYPES.TEXT, required: false, category: 'church', order: 3, maxLength: 50 },
  
  // 후원정보
  { id: 'support_chairman', name: '후원회장', type: FIELD_TYPES.TEXT, required: false, category: 'support', order: 1, maxLength: 20 },
  { id: 'support_secretary', name: '후원총무', type: FIELD_TYPES.TEXT, required: false, category: 'support', order: 2, maxLength: 20 },
  { id: 'support_amount', name: '후원금현황', type: FIELD_TYPES.NUMBER, required: false, category: 'support', order: 3 },
  { id: 'supporters', name: '주요 후원자', type: 'supporter_group', required: false, category: 'support', order: 4 },
  
  // 연락처
  { id: 'email', name: '이메일', type: FIELD_TYPES.EMAIL, required: false, category: 'contact', order: 1 },
  { id: 'local_address', name: '현지 주소', type: FIELD_TYPES.TEXTAREA, required: false, category: 'contact', order: 2, maxLength: 200 },
  { id: 'local_phone', name: '현지 전화번호', type: FIELD_TYPES.TEL, required: false, category: 'contact', order: 3 },
  { id: 'local_emergency', name: '현지 응급전화 번호', type: FIELD_TYPES.TEL, required: false, category: 'contact', order: 4 },
  { id: 'korea_phone', name: '귀국시 전화번호', type: FIELD_TYPES.TEL, required: false, category: 'contact', order: 5 },
  { id: 'korea_address', name: '귀국시 주소', type: FIELD_TYPES.TEXTAREA, required: false, category: 'contact', order: 6, maxLength: 200 },
  { id: 'korea_emergency', name: '한국 응급 전화 번호', type: FIELD_TYPES.TEL, required: false, category: 'contact', order: 7 }
];

// 설정 저장/로드
const SETTINGS_KEY = 'missionaryFormSettings';
function saveFormSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function loadFormSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    return JSON.parse(raw);
  }
  // 기본 설정 반환
  return {
    categories: DEFAULT_CATEGORIES,
    fields: DEFAULT_FIELDS
  };
}

// 전역 함수로 등록
window.loadFormSettings = loadFormSettings;
window.saveFormSettings = saveFormSettings;

// 카테고리 관리
function addCategory(name) {
  const settings = loadFormSettings();
  const newId = 'category_' + Date.now();
  const newCategory = {
    id: newId,
    name: name,
    order: settings.categories.length + 1
  };
  settings.categories.push(newCategory);
  saveFormSettings(settings);
  return newCategory;
}

function removeCategory(categoryId) {
  const settings = loadFormSettings();
  settings.categories = settings.categories.filter(cat => cat.id !== categoryId);
  // 해당 카테고리의 필드들도 제거
  settings.fields = settings.fields.filter(field => field.category !== categoryId);
  saveFormSettings(settings);
}

function updateCategoryOrder(categoryId, newOrder) {
  const settings = loadFormSettings();
  const category = settings.categories.find(cat => cat.id === categoryId);
  if (category) {
    category.order = newOrder;
    saveFormSettings(settings);
  }
}

// 필드 관리
function addField(fieldData) {
  const settings = loadFormSettings();
  const newField = {
    id: 'field_' + Date.now(),
    ...fieldData,
    order: settings.fields.filter(f => f.category === fieldData.category).length + 1
  };
  settings.fields.push(newField);
  saveFormSettings(settings);
  return newField;
}

function removeField(fieldId) {
  const settings = loadFormSettings();
  settings.fields = settings.fields.filter(field => field.id !== fieldId);
  saveFormSettings(settings);
}

function updateField(fieldId, fieldData) {
  const settings = loadFormSettings();
  const fieldIndex = settings.fields.findIndex(field => field.id === fieldId);
  if (fieldIndex !== -1) {
    settings.fields[fieldIndex] = { ...settings.fields[fieldIndex], ...fieldData };
    saveFormSettings(settings);
  }
}

function updateFieldOrder(fieldId, newOrder) {
  const settings = loadFormSettings();
  const field = settings.fields.find(f => f.id === fieldId);
  if (field) {
    field.order = newOrder;
    saveFormSettings(settings);
  }
}

// 폼 렌더링 (설정 기반)
function renderDynamicForm(containerId, settings = null, existingData = null) {
  const formSettings = settings || loadFormSettings();
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;
  
  // 카테고리별로 정렬
  const sortedCategories = formSettings.categories.sort((a, b) => a.order - b.order);
  
  let html = '<form id="dynamic-missionary-form" autocomplete="off">';
  
  // 탭 네비게이션
  html += '<div class="form-tabs">';
  sortedCategories.forEach((category, index) => {
    const activeClass = index === 0 ? 'active' : '';
    html += `<button type="button" class="tab-btn ${activeClass}" data-category="${category.id}">${category.name}</button>`;
  });
  html += '</div>';
  
  // 탭 컨텐츠
  sortedCategories.forEach((category, index) => {
    const activeClass = index === 0 ? 'active' : '';
    html += `<div class="tab-content ${activeClass}" data-category="${category.id}">`;
    
    // 해당 카테고리의 필드들 정렬하여 렌더링
    const categoryFields = formSettings.fields
      .filter(field => field.category === category.id)
      .sort((a, b) => a.order - b.order);
    
    categoryFields.forEach(field => {
      html += renderField(field, existingData);
    });
    
    html += '</div>';
  });
  
  // 수정 모드인지 확인
  const isEditMode = existingData && existingData.id;
  
  if (!isEditMode) {
    html += `
      <div class="form-actions">
        <button type="button" id="btn-temp-save">임시저장</button>
        <button type="button" id="btn-submit">등록</button>
      </div>
    `;
  }
  
  html += '</form>';
  html += '<div id="dynamic-toast" style="display:none;"></div>';
  
  container.innerHTML = html;
  bindDynamicFormEvents();
  
  // 수정 모드인 경우 기존 데이터로 폼 채우기
  if (isEditMode && existingData) {
    fillFormWithData(existingData);
  }
}

// 필드 렌더링
function renderField(field, existingData) {
  const required = field.required ? '<span style="color:red">*</span>' : '';
  const maxLengthAttr = field.maxLength ? `maxlength="${field.maxLength}"` : '';
  
  // 기존 데이터에서 값 가져오기
  const existingValue = existingData ? existingData[field.id] || '' : '';
  
  let html = `<div class="form-group" data-field-id="${field.id}">`;
  html += `<label>${field.name} ${required}</label>`;
  
  switch (field.type) {
    case 'family_group':
      html += renderFamilyGroup(field, existingData);
      break;
    case 'supporter_group':
      html += renderSupporterGroup(field, existingData);
      break;
    case FIELD_TYPES.TEXTAREA:
      html += `<textarea name="${field.id}" ${field.required ? 'required' : ''} ${maxLengthAttr}>${existingValue}</textarea>`;
      break;
    case FIELD_TYPES.SELECT:
      html += `<select name="${field.id}" ${field.required ? 'required' : ''}>`;
      if (field.options) {
        field.options.forEach(option => {
          const selected = option.value === existingValue ? 'selected' : '';
          html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
        });
      }
      html += `</select>`;
      break;
    case FIELD_TYPES.CHECKBOX:
      const checked = existingValue ? 'checked' : '';
      html += `<input type="${field.type}" name="${field.id}" ${field.required ? 'required' : ''} ${checked} />`;
      break;
    default:
      html += `<input type="${field.type}" name="${field.id}" value="${existingValue}" ${field.required ? 'required' : ''} ${maxLengthAttr} />`;
  }
  
  html += '</div>';
  return html;
}

// 새로운 가족사항 렌더링 함수 (카드형+섹션 구분 구조)
function renderFamilyGroup(field, existingData) {
  const familyData = existingData?.family || {};
  const spouseData = familyData.spouse || {};
  const parentsData = familyData.parents || [];
  const childrenData = familyData.children || [];

  return `
    <div class="family-group-modern">
      <!-- 배우자 섹션 -->
      <div class="family-section-divider">
        <span class="family-section-title spouse">👫 배우자</span>
      </div>
      <div class="family-members-container" id="spouse-container">
        ${spouseData.name ? `
          <div class="family-member-card spouse" data-type="spouse" data-id="spouse_1">
            <div class="member-header-simple">
              <span class="member-title">배우자</span>
              <button type="button" class="btn-remove-family" onclick="removeFamilyMemberSimple('spouse', 'spouse_1')" title="삭제">🗑️</button>
            </div>
            <div class="member-form-simple">
              <div class="form-row-simple">
                <div class="form-group-simple">
                  <label for="spouse_name_1">이름</label>
                  <input type="text" id="spouse_name_1" name="spouse_name_1" value="${spouseData.name || ''}"
                         autocomplete="name" oninput="autoSaveFamilyMemberSimple('spouse', 'spouse_1')"
                         onblur="checkDuplicateNameSimple(this, 'spouse')">
                </div>
                <div class="form-group-simple">
                  <label for="spouse_birthday_1">생년월일</label>
                  <input type="text" id="spouse_birthday_1" name="spouse_birthday_1" value="${spouseData.birthday || ''}"
                         autocomplete="bday" oninput="autoSaveFamilyMemberSimple('spouse', 'spouse_1')">
                </div>
              </div>
              <div class="form-group-simple">
                <label for="spouse_notes_1">비고</label>
                <textarea id="spouse_notes_1" name="spouse_notes_1" autocomplete="off"
                          oninput="autoSaveFamilyMemberSimple('spouse', 'spouse_1')">${spouseData.notes || ''}</textarea>
              </div>
              <button type="button" class="btn-save-family" onclick="saveFamilyMemberSimple('spouse', 'spouse_1')" title="저장하기">
                💾 저장하기
              </button>
            </div>
          </div>
        ` : ''}
      </div>
      <button type="button" class="btn btn-add-family" onclick="addFamilyMemberSimple('spouse')" title="배우자 추가">👫 배우자 추가</button>

      <!-- 부모 섹션 -->
      <div class="family-section-divider">
        <span class="family-section-title parents">👨‍👩‍👧‍👦 부모</span>
      </div>
      <div class="family-members-container" id="parents-container">
        ${parentsData.map((parent, idx) => `
          <div class="family-member-card parents" data-type="parents" data-id="parent_${idx + 1}">
            <div class="member-header-simple">
              <span class="member-title">부모 ${idx + 1}</span>
              <button type="button" class="btn-remove-family" onclick="removeFamilyMemberSimple('parents', 'parent_${idx + 1}')" title="삭제">🗑️</button>
            </div>
            <div class="member-form-simple">
              <div class="form-row-simple">
                <div class="form-group-simple">
                  <label for="parent_name_${idx + 1}">이름</label>
                  <input type="text" id="parent_name_${idx + 1}" name="parent_name_${idx + 1}" value="${parent.name || ''}"
                         autocomplete="name" oninput="autoSaveFamilyMemberSimple('parents', 'parent_${idx + 1}')"
                         onblur="checkDuplicateNameSimple(this, 'parents')">
                </div>
                <div class="form-group-simple">
                  <label for="parent_birthday_${idx + 1}">생년월일</label>
                  <input type="text" id="parent_birthday_${idx + 1}" name="parent_birthday_${idx + 1}" value="${parent.birthday || ''}"
                         autocomplete="bday" oninput="autoSaveFamilyMemberSimple('parents', 'parent_${idx + 1}')">
                </div>
              </div>
              <div class="form-group-simple">
                <label for="parent_notes_${idx + 1}">비고</label>
                <textarea id="parent_notes_${idx + 1}" name="parent_notes_${idx + 1}" autocomplete="off"
                          oninput="autoSaveFamilyMemberSimple('parents', 'parent_${idx + 1}')">${parent.notes || ''}</textarea>
              </div>
              <button type="button" class="btn-save-family" onclick="saveFamilyMemberSimple('parents', 'parent_${idx + 1}')" title="저장하기">
                💾 저장하기
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-add-family" onclick="addFamilyMemberSimple('parents')" title="부모 추가">👨‍👩‍👧‍👦 부모 추가</button>

      <!-- 자녀 섹션 -->
      <div class="family-section-divider">
        <span class="family-section-title children">👶 자녀</span>
      </div>
      <div class="family-members-container" id="children-container">
        ${childrenData.map((child, idx) => `
          <div class="family-member-card children" data-type="children" data-id="child_${idx + 1}">
            <div class="member-header-simple">
              <span class="member-title">자녀 ${idx + 1}</span>
              <button type="button" class="btn-remove-family" onclick="removeFamilyMemberSimple('children', 'child_${idx + 1}')" title="삭제">🗑️</button>
            </div>
            <div class="member-form-simple">
              <div class="form-row-simple">
                <div class="form-group-simple">
                  <label for="child_name_${idx + 1}">이름</label>
                  <input type="text" id="child_name_${idx + 1}" name="child_name_${idx + 1}" value="${child.name || ''}"
                         autocomplete="name" oninput="autoSaveFamilyMemberSimple('children', 'child_${idx + 1}')"
                         onblur="checkDuplicateNameSimple(this, 'children')">
                </div>
                <div class="form-group-simple">
                  <label for="child_birthday_${idx + 1}">생년월일</label>
                  <input type="text" id="child_birthday_${idx + 1}" name="child_birthday_${idx + 1}" value="${child.birthday || ''}"
                         autocomplete="bday" oninput="autoSaveFamilyMemberSimple('children', 'child_${idx + 1}')">
                </div>
              </div>
              <div class="form-group-simple">
                <label for="child_notes_${idx + 1}">비고</label>
                <textarea id="child_notes_${idx + 1}" name="child_notes_${idx + 1}" autocomplete="off"
                          oninput="autoSaveFamilyMemberSimple('children', 'child_${idx + 1}')">${child.notes || ''}</textarea>
              </div>
              <button type="button" class="btn-save-family" onclick="saveFamilyMemberSimple('children', 'child_${idx + 1}')" title="저장하기">
                💾 저장하기
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-add-family" onclick="addFamilyMemberSimple('children')" title="자녀 추가">👶 자녀 추가</button>
    </div>
  `;
}

// 후원자 그룹 렌더링
function renderSupporterGroup(field, existingData) {
  return `
    <div class="supporter-group" data-field-id="${field.id}">
      <div class="section-header">
        <h4>💝 주요 후원자</h4>
        <button type="button" class="btn-add-supporter" onclick="addSupporter()">
          ➕ 후원자 추가
        </button>
      </div>
      <div class="supporters-list" id="supportersList">
        <!-- 후원자 항목들이 여기에 동적으로 추가됩니다 -->
      </div>
    </div>
  `;
}

// 탭 전환 이벤트
function bindDynamicFormEvents() {
  // 탭 전환
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      const categoryId = btn.dataset.category;
      switchTab(categoryId);
    };
  });
  
  // 폼 제출 이벤트 제거 - 입력 페이지에서 버튼 클릭으로 처리
  // const form = document.getElementById('dynamic-missionary-form');
  // if (form) {
  //   form.onsubmit = async (e) => {
  //     e.preventDefault();
  //     const data = getDynamicFormValues();
  //     const err = validateDynamicForm(data);
  //     if (err) {
  //       showDynamicToast(err, 'error');
  //       return;
  //     }
  //     await saveDynamicFormToFirestore(data);
  //     form.reset();
  //   };
  // }
  
  // 임시저장 (입력 모드에서만)
  const tempSaveBtn = document.getElementById('btn-temp-save');
  if (tempSaveBtn) {
    tempSaveBtn.onclick = () => {
      const data = getDynamicFormValues();
      saveDynamicFormTemp(data);
    };
  }
  
  // 임시저장 복원 (입력 모드에서만)
  const temp = loadDynamicFormTemp();
  if (temp && !document.querySelector('#editMissionaryModal')) {
    fillFormWithData(temp);
    showDynamicToast('임시저장 복원됨', 'info');
  }
  
  // 가족사항 관련 이벤트
  bindFamilyEvents();
  
  // 후원자 관련 이벤트
  bindSupporterEvents();
}

// 가족사항 이벤트 바인딩
function bindFamilyEvents() {
  // 자녀 추가 버튼
  const addChildBtn = document.querySelector('.btn-add-child');
  if (addChildBtn) {
    addChildBtn.onclick = addChild;
  }
  
  // 후원자 추가 버튼
  const addSupporterBtn = document.querySelector('.btn-add-supporter');
  if (addSupporterBtn) {
    addSupporterBtn.onclick = addSupporter;
  }
}

// 후원자 이벤트 바인딩
function bindSupporterEvents() {
  // 후원자 추가 버튼
  const addSupporterBtn = document.querySelector('.btn-add-supporter');
  if (addSupporterBtn) {
    addSupporterBtn.onclick = addSupporter;
  }
}

// 탭 전환
function switchTab(categoryId) {
  // 모든 탭 비활성화
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // 선택된 탭 활성화
  document.querySelector(`[data-category="${categoryId}"].tab-btn`).classList.add('active');
  document.querySelector(`[data-category="${categoryId}"].tab-content`).classList.add('active');
}

// 폼 값 수집
function getDynamicFormValues() {
  const form = document.getElementById('dynamic-missionary-form');
  if (!form) return null;
  
  const data = {};
  
  // 기본 필드 수집
  Array.from(form.elements).forEach(el => {
    if (el.name && el.type !== 'button') {
      if (el.type === 'checkbox') {
        data[el.name] = el.checked;
      } else {
        data[el.name] = el.value.trim();
      }
    }
  });
  
  // 필드 매핑 처리 (폼 필드명 -> 데이터 필드명)
  const fieldMappings = {
    'sending_date': 'sent_date',  // 폼 필드명 -> 데이터 필드명
    'mission': 'prayer',          // 사역분야 -> 기도제목으로 매핑
    'note': 'prayer'              // 비고 -> 기도제목으로 매핑
  };
  
  // 매핑된 필드들 처리
  Object.entries(fieldMappings).forEach(([formField, dataField]) => {
    if (data[formField] !== undefined) {
      data[dataField] = data[formField];
      delete data[formField]; // 원본 필드명 제거
    }
  });
  
  // 가족사항 수집 (DB 차일드 방식)
  const familyData = collectFamilyData();
  if (familyData) {
    data.family = familyData;
  }
  
  // 후원자 데이터 수집 (DB 차일드 방식)
  const supportersData = collectSupportersData();
  if (supportersData) {
    data.supporters = supportersData;
  }
  
  return data;
}

// 가족사항 데이터 수집 (새로운 시스템 사용)
function collectFamilyData() {
  // 새로운 가족사항 시스템의 collectAllFamilyData 함수 사용
  if (typeof window.collectAllFamilyData === 'function') {
    return window.collectAllFamilyData();
  }
  
  // 폴백: 기존 방식 (호환성 유지)
  const familyData = {
    spouse: null,
    parents: [],
    children: []
  };
  
  // 배우자 정보 수집
  const spouseName = document.querySelector('input[name="spouse_name"]')?.value.trim();
  const spouseBirthday = document.querySelector('input[name="spouse_birthday"]')?.value;
  const spouseNotes = document.querySelector('textarea[name="spouse_notes"]')?.value.trim();
  
  if (spouseName || spouseBirthday || spouseNotes) {
    familyData.spouse = {
      name: spouseName,
      birthday: spouseBirthday,
      notes: spouseNotes
    };
  }
  
  // 부모 정보 수집
  const parentItems = document.querySelectorAll('.parent-item');
  parentItems.forEach(parentItem => {
    const parentId = parentItem.getAttribute('data-parent-id');
    const parentName = parentItem.querySelector(`input[name="parent_name_${parentId}"]`)?.value.trim();
    const parentBirthday = parentItem.querySelector(`input[name="parent_birthday_${parentId}"]`)?.value;
    const parentNotes = parentItem.querySelector(`textarea[name="parent_notes_${parentId}"]`)?.value.trim();
    
    if (parentName || parentBirthday || parentNotes) {
      familyData.parents.push({
        name: parentName,
        birthday: parentBirthday,
        notes: parentNotes
      });
    }
  });
  
  // 자녀 정보 수집
  const childItems = document.querySelectorAll('.child-item');
  childItems.forEach(childItem => {
    const childId = childItem.getAttribute('data-child-id');
    const childName = childItem.querySelector(`input[name="child_name_${childId}"]`)?.value.trim();
    const childBirthday = childItem.querySelector(`input[name="child_birthday_${childId}"]`)?.value;
    const childNotes = childItem.querySelector(`textarea[name="child_notes_${childId}"]`)?.value.trim();
    
    if (childName || childBirthday || childNotes) {
      familyData.children.push({
        name: childName,
        birthday: childBirthday,
        notes: childNotes
      });
    }
  });
  
  return familyData;
}

// 후원자 데이터 수집
function collectSupportersData() {
  const supportersData = [];
  
  // 후원자 정보 수집
  const supporterItems = document.querySelectorAll('.supporter-item');
  supporterItems.forEach(supporterItem => {
    const supporterId = supporterItem.dataset.supporterId;
    const supporterName = supporterItem.querySelector(`input[name="supporter_name_${supporterId}"]`)?.value.trim();
    const supporterRelation = supporterItem.querySelector(`input[name="supporter_relation_${supporterId}"]`)?.value.trim();
    const supporterContact = supporterItem.querySelector(`input[name="supporter_contact_${supporterId}"]`)?.value.trim();
    const supporterAmount = supporterItem.querySelector(`input[name="supporter_amount_${supporterId}"]`)?.value.trim();
    const supporterNotes = supporterItem.querySelector(`textarea[name="supporter_notes_${supporterId}"]`)?.value.trim();
    
    if (supporterName || supporterRelation || supporterContact || supporterAmount || supporterNotes) {
      supportersData.push({
        id: supporterId,
        name: supporterName,
        relation: supporterRelation,
        contact: supporterContact,
        amount: supporterAmount,
        notes: supporterNotes
      });
    }
  });
  
  return supportersData.length > 0 ? supportersData : null;
}

// 폼 검증
function validateDynamicForm(data) {
  const settings = loadFormSettings();
  const requiredFields = settings.fields.filter(field => field.required);
  
  for (const field of requiredFields) {
    if (!data[field.id] || data[field.id].toString().trim() === '') {
      return `${field.name}을(를) 입력하세요.`;
    }
  }
  return null;
}

// 임시저장
const DYNAMIC_TEMP_KEY = 'dynamicMissionaryFormTemp';
function saveDynamicFormTemp(data) {
  localStorage.setItem(DYNAMIC_TEMP_KEY, JSON.stringify(data));
  showDynamicToast('임시저장 완료', 'success');
}

function loadDynamicFormTemp() {
  const raw = localStorage.getItem(DYNAMIC_TEMP_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearDynamicFormTemp() {
  localStorage.removeItem(DYNAMIC_TEMP_KEY);
}

// 폼에 데이터 채우기
function fillFormWithData(data) {
  const form = document.getElementById('dynamic-missionary-form');
  if (!form) return;
  
  // 기본 필드 채우기
  Array.from(form.elements).forEach(el => {
    if (el.name && data[el.name] !== undefined) {
      if (el.type === 'checkbox') {
        el.checked = data[el.name];
      } else {
        el.value = data[el.name];
      }
    }
  });
  
  // 특별한 필드 매핑 처리
  const fieldMappings = {
    'sending_date': 'sent_date',  // 폼 필드명 -> 데이터 필드명
    'mission': 'prayer',          // 사역분야 -> 기도제목으로 매핑
    'note': 'prayer'              // 비고 -> 기도제목으로 매핑
  };
  
  // 매핑된 필드들 채우기
  Object.entries(fieldMappings).forEach(([formField, dataField]) => {
    const formElement = form.querySelector(`[name="${formField}"]`);
    if (formElement && data[dataField] !== undefined) {
      if (formElement.type === 'checkbox') {
        formElement.checked = data[dataField];
      } else {
        formElement.value = data[dataField];
      }
    }
  });
  
  // 가족사항 데이터 채우기
  if (data.family) {
    fillFamilyData(data.family);
  }
  
  // 후원자 데이터 채우기
  if (data.supporters) {
    fillSupportersData(data.supporters);
  }
}

// 가족사항 데이터로 폼 채우기
function fillFamilyData(familyData) {
  // familyManager.js의 fillFamilyData 함수를 직접 호출
  if (typeof window.fillFamilyDataFromManager === 'function') {
    window.fillFamilyDataFromManager(familyData);
  }
}

// 후원자 데이터 채우기
function fillSupportersData(supportersData) {
  const supportersList = document.getElementById('supportersList');
  if (supportersList) {
    supportersList.innerHTML = ''; // 기존 후원자 목록 초기화
    
    if (supportersData && supportersData.length > 0) {
      supportersData.forEach(supporter => {
        const supporterId = supporter.id || 'supporter_' + Date.now();
        
        const supporterHtml = `
          <div class="supporter-item" data-supporter-id="${supporterId}">
            <div class="supporter-header accordion-header" onclick="toggleSupporterAccordion('${supporterId}')">
              <div class="accordion-title">
                <span class="accordion-icon">▶</span>
                <span class="supporter-name">후원자 ${supportersList.children.length + 1}</span>
                <span class="supporter-summary"></span>
              </div>
              <div class="supporter-actions" onclick="event.stopPropagation()">
                <button type="button" class="btn-remove-supporter" onclick="removeSupporter('${supporterId}')">
                  🗑️ 삭제
                </button>
              </div>
            </div>
            <div class="supporter-content accordion-content" style="display: none;">
              <div class="supporter-form">
                <div class="form-row">
                  <div class="form-col">
                    <label>이름</label>
                    <input type="text" name="supporter_name_${supporterId}" placeholder="후원자 이름" maxlength="20" oninput="updateSupporterSummary('${supporterId}')" value="${supporter.name || ''}" />
                  </div>
                  <div class="form-col">
                    <label>관계</label>
                    <input type="text" name="supporter_relation_${supporterId}" placeholder="친구, 가족 등" maxlength="20" oninput="updateSupporterSummary('${supporterId}')" value="${supporter.relation || ''}" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-col">
                    <label>연락처</label>
                    <input type="text" name="supporter_contact_${supporterId}" placeholder="전화번호 또는 이메일" maxlength="50" oninput="updateSupporterSummary('${supporterId}')" value="${supporter.contact || ''}" />
                  </div>
                  <div class="form-col">
                    <label>후원금액</label>
                    <input type="number" name="supporter_amount_${supporterId}" placeholder="월 후원금액" value="${supporter.amount || ''}" oninput="updateSupporterSummary('${supporterId}')" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-col full-width">
                    <label>비고</label>
                    <textarea name="supporter_notes_${supporterId}" placeholder="특이사항" maxlength="200" oninput="updateSupporterSummary('${supporterId}')">${supporter.notes || ''}</textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        supportersList.insertAdjacentHTML('beforeend', supporterHtml);
      });
      
      updateSupporterNumbers();
      
      // 각 후원자의 요약 정보 업데이트
      supportersData.forEach(supporter => {
        const supporterId = supporter.id || 'supporter_' + Date.now();
        updateSupporterSummary(supporterId);
      });
    }
  }
}

// Firestore 저장
async function saveDynamicFormToFirestore(data) {
  try {
    await window.addMissionary(data);
    showDynamicToast('저장 성공!', 'success');
    clearDynamicFormTemp();
  } catch (e) {
    showDynamicToast('저장 실패: ' + e.message, 'error');
  }
}

// 토스트 알림
function showDynamicToast(msg, type = 'info') {
  const toast = document.getElementById('dynamic-toast');
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

// 설정 관리 UI 렌더링
function renderFormSettingsUI(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const settings = loadFormSettings();
  
  let html = `
    <div class="settings-container">
      <h3>선교사 입력 폼 설정</h3>
      
      <div class="settings-section">
        <h4>카테고리 관리</h4>
        <div class="category-list">
          ${settings.categories.map(cat => `
            <div class="category-item" data-id="${cat.id}">
              <span>${cat.name}</span>
              <button onclick="removeCategory('${cat.id}')">삭제</button>
            </div>
          `).join('')}
        </div>
        <div class="add-category">
          <input type="text" id="new-category-name" placeholder="카테고리명" />
          <button onclick="addNewCategory()">추가</button>
        </div>
      </div>
      
      <div class="settings-section">
        <h4>필드 관리</h4>
        <div class="field-list">
          ${settings.fields.map(field => `
            <div class="field-item" data-id="${field.id}">
              <span>${field.name} (${field.type})</span>
              <span class="category-tag">${settings.categories.find(c => c.id === field.category)?.name || 'Unknown'}</span>
              <button onclick="removeField('${field.id}')">삭제</button>
            </div>
          `).join('')}
        </div>
        <div class="add-field">
          <select id="new-field-type">
            ${Object.entries(FIELD_TYPES).map(([key, value]) => 
              `<option value="${value}">${key}</option>`
            ).join('')}
          </select>
          <input type="text" id="new-field-name" placeholder="필드명" />
          <select id="new-field-category">
            ${settings.categories.map(cat => 
              `<option value="${cat.id}">${cat.name}</option>`
            ).join('')}
          </select>
          <button onclick="addNewField()">추가</button>
        </div>
      </div>
      
      <div class="settings-actions">
        <button onclick="previewForm()">미리보기</button>
        <button onclick="resetToDefault()">기본값으로 초기화</button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  bindSettingsEvents();
}

// 설정 이벤트 바인딩
function bindSettingsEvents() {
  // 전역 함수로 등록 (간단한 구현)
  window.addNewCategory = () => {
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput.value.trim();
    if (name) {
      addCategory(name);
      nameInput.value = '';
      renderFormSettingsUI('settings-container');
    }
  };
  
  window.removeCategory = (categoryId) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      removeCategory(categoryId);
      renderFormSettingsUI('settings-container');
    }
  };
  
  window.addNewField = () => {
    const typeSelect = document.getElementById('new-field-type');
    const nameInput = document.getElementById('new-field-name');
    const categorySelect = document.getElementById('new-field-category');
    
    const fieldData = {
      name: nameInput.value.trim(),
      type: typeSelect.value,
      category: categorySelect.value,
      required: false
    };
    
    if (fieldData.name) {
      addField(fieldData);
      nameInput.value = '';
      renderFormSettingsUI('settings-container');
    }
  };
  
  window.removeField = (fieldId) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      removeField(fieldId);
      renderFormSettingsUI('settings-container');
    }
  };
  
  window.previewForm = () => {
    // 미리보기 모달 또는 새 창에서 폼 표시
    const previewContainer = document.getElementById('form-preview-container');
    if (previewContainer) {
      renderDynamicForm('form-preview-container');
    }
  };
  
  window.resetToDefault = () => {
    if (confirm('기본값으로 초기화하시겠습니까? 현재 설정이 모두 삭제됩니다.')) {
      localStorage.removeItem(SETTINGS_KEY);
      renderFormSettingsUI('settings-container');
    }
  };
}

// 전역 함수 등록 (새로운 간단한 시스템 사용)
window.renderDynamicForm = renderDynamicForm;
window.getDynamicFormValues = getDynamicFormValues;
window.fillFormWithData = fillFormWithData;
window.updateChildNumbers = updateChildNumbers;
window.updateSupporterNumbers = updateSupporterNumbers;
window.renderFormSettingsUI = renderFormSettingsUI;
window.saveFormSettings = saveFormSettings;
window.loadFormSettings = loadFormSettings;

// 가족 관련 함수들은 familyManager.js에서 관리됨
// missionaryFormManager.js에서는 window 등록만 하고 실제 구현은 familyManager.js에서 담당

// 기존 아코디언 시스템 함수들 (하위 호환성)
window.toggleFamilyAccordion = function(type) {
  console.warn('toggleFamilyAccordion은 더 이상 사용되지 않습니다. 새로운 간단한 시스템을 사용하세요.');
};

window.addFamilyMember = function(type) {
  console.warn('addFamilyMember는 더 이상 사용되지 않습니다. addFamilyMemberSimple을 사용하세요.');
  if (typeof window.addFamilyMemberSimple === 'function') {
    window.addFamilyMemberSimple(type);
  }
};

window.removeFamilyMember = function(type, memberId) {
  console.warn('removeFamilyMember는 더 이상 사용되지 않습니다. removeFamilyMemberSimple을 사용하세요.');
  if (typeof window.removeFamilyMemberSimple === 'function') {
    window.removeFamilyMemberSimple(type, memberId);
  }
};

window.saveFamilyMember = function(type, memberId) {
  console.warn('saveFamilyMember는 더 이상 사용되지 않습니다. saveFamilyMemberSimple을 사용하세요.');
  if (typeof window.saveFamilyMemberSimple === 'function') {
    window.saveFamilyMemberSimple(type, memberId);
  }
};

window.autoSaveFamilyMember = function(type, memberId) {
  console.warn('autoSaveFamilyMember는 더 이상 사용되지 않습니다. autoSaveFamilyMemberSimple을 사용하세요.');
  if (typeof window.autoSaveFamilyMemberSimple === 'function') {
    window.autoSaveFamilyMemberSimple(type, memberId);
  }
};

window.checkDuplicateName = function(inputElement, type) {
  console.warn('checkDuplicateName은 더 이상 사용되지 않습니다. checkDuplicateNameSimple을 사용하세요.');
  if (typeof window.checkDuplicateNameSimple === 'function') {
    window.checkDuplicateNameSimple(inputElement, type);
  }
};

window.updateFamilySummary = function(type) {
  console.warn('updateFamilySummary는 더 이상 사용되지 않습니다. 새로운 간단한 시스템을 사용하세요.');
};

window.updateFamilyMemberNumbers = function(type) {
  console.warn('updateFamilyMemberNumbers는 더 이상 사용되지 않습니다. updateFamilyMemberNumbersSimple을 사용하세요.');
  if (typeof window.updateFamilyMemberNumbersSimple === 'function') {
    window.updateFamilyMemberNumbersSimple(type);
  }
};

// 누락된 함수 정의 (ReferenceError 방지)
window.updateChildNumbers = function() {
  if (typeof window.updateFamilyMemberNumbersSimple === 'function') {
    window.updateFamilyMemberNumbersSimple('children');
  }
};

window.updateSupporterNumbers = function() {
  const supportersList = document.getElementById('supportersList');
  if (supportersList) {
    const supporterItems = supportersList.querySelectorAll('.supporter-item');
    supporterItems.forEach((item, idx) => {
      const title = item.querySelector('.supporter-title');
      if (title) title.textContent = `후원자 ${idx + 1}`;
    });
  }
};

function updateChildNumbers() {
  if (typeof window.updateFamilyMemberNumbersSimple === 'function') {
    window.updateFamilyMemberNumbersSimple('children');
  }
}

function updateSupporterNumbers() {
  const supportersList = document.getElementById('supportersList');
  if (supportersList) {
    const supporterItems = supportersList.querySelectorAll('.supporter-item');
    supporterItems.forEach((item, idx) => {
      const title = item.querySelector('.supporter-title');
      if (title) title.textContent = `후원자 ${idx + 1}`;
    });
  }
} 