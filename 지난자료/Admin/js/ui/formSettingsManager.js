// formSettingsManager.js

function renderFormSettingsUI(containerId) {
  // ... 기존 코드 ...
}
function saveFormSettings(settings) { /* ... */ }
function loadFormSettings() { /* ... */ }
function addCategory(name) { /* ... */ }
function removeCategory(categoryId) { /* ... */ }
function addField(fieldData) { /* ... */ }
function removeField(fieldId) { /* ... */ }
function updateCategoryOrder(categoryId, newOrder) { /* ... */ }
function updateFieldOrder(fieldId, newOrder) { /* ... */ }
function updateField(fieldId, fieldData) { /* ... */ }
function bindSettingsEvents() { /* ... */ }

// window 등록
window.renderFormSettingsUI = renderFormSettingsUI;
window.saveFormSettings = saveFormSettings;
window.loadFormSettings = loadFormSettings;
window.addCategory = addCategory;
window.removeCategory = removeCategory;
window.addField = addField;
window.removeField = removeField;
window.updateCategoryOrder = updateCategoryOrder;
window.updateFieldOrder = updateFieldOrder;
window.updateField = updateField;
window.bindSettingsEvents = bindSettingsEvents; 