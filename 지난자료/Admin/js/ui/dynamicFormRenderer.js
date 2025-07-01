// dynamicFormRenderer.js

function renderDynamicForm(containerId, settings, existingData) {
  // ... 기존 코드 ...
}
function renderField(field, existingData) { /* ... */ }
function switchTab(categoryId) { /* ... */ }
function bindDynamicFormEvents() { /* ... */ }

// window 등록
window.renderDynamicForm = renderDynamicForm;
window.renderField = renderField;
window.switchTab = switchTab;
window.bindDynamicFormEvents = bindDynamicFormEvents; 