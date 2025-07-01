// 스프레드시트 데이터 가져오기 페이지
let selectedFile = null;
let isImporting = false;

document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 스프레드시트 가져오기 페이지 초기화');
  
  // Firebase 연결 상태 확인
  const isFirebaseAvailable = typeof firebase !== 'undefined' && firebase.apps.length > 0;
  const useFirebase = isFirebaseAvailable;
  
  // DOM 요소들
  const elements = {
    firebaseStatus: document.getElementById('firebaseStatus'),
    googleSheetUrl: document.getElementById('googleSheetUrl'),
    importFromSheetBtn: document.getElementById('importFromSheetBtn'),
    fileUploadArea: document.getElementById('fileUploadArea'),
    fileInput: document.getElementById('fileInput'),
    selectedFile: document.getElementById('selectedFile'),
    importFromFileBtn: document.getElementById('importFromFileBtn'),
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    fieldAnalysisSection: document.getElementById('fieldAnalysisSection'),
    fieldAnalysisContent: document.getElementById('fieldAnalysisContent'),
    logOutput: document.getElementById('logOutput'),
    clearLogBtn: document.getElementById('clearLogBtn'),
    downloadLogBtn: document.getElementById('downloadLogBtn'),
    resultSummary: document.getElementById('resultSummary'),
    resultContent: document.getElementById('resultContent'),
    confirmDialog: document.getElementById('confirmDialog'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmBtn: document.getElementById('confirmBtn')
  };

  // 초기화
  initPage();

  function initPage() {
    showFirebaseStatus();
    setupEventListeners();
    logMessage('📊 스프레드시트 가져오기 시스템 준비 완료');
    logMessage(`🔥 Firebase 모드: ${useFirebase ? '활성화' : '비활성화'}`);
  }

  // Firebase 상태 표시
  function showFirebaseStatus() {
    if (!elements.firebaseStatus) return;
    
    if (useFirebase) {
      elements.firebaseStatus.textContent = '🔥';
      elements.firebaseStatus.className = 'firebase-status-icon connected';
      elements.firebaseStatus.title = 'Firebase 연결됨';
    } else {
      elements.firebaseStatus.textContent = '🪵';
      elements.firebaseStatus.className = 'firebase-status-icon disconnected';
      elements.firebaseStatus.title = 'Firebase 연결 안됨';
    }
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // Google Sheets 가져오기
    if (elements.importFromSheetBtn) {
      elements.importFromSheetBtn.addEventListener('click', handleGoogleSheetsImport);
    }

    // 파일 업로드 영역 클릭
    if (elements.fileUploadArea) {
      elements.fileUploadArea.addEventListener('click', () => {
        if (!isImporting) {
          elements.fileInput.click();
        }
      });
    }

    // 파일 선택
    if (elements.fileInput) {
      elements.fileInput.addEventListener('change', handleFileSelect);
    }

    // 파일에서 가져오기
    if (elements.importFromFileBtn) {
      elements.importFromFileBtn.addEventListener('click', handleFileImport);
    }

    // 드래그 앤 드롭
    setupDragAndDrop();

    // 로그 버튼들
    if (elements.clearLogBtn) {
      elements.clearLogBtn.addEventListener('click', clearLog);
    }
    if (elements.downloadLogBtn) {
      elements.downloadLogBtn.addEventListener('click', downloadLog);
    }
  }

  // 드래그 앤 드롭 설정
  function setupDragAndDrop() {
    if (!elements.fileUploadArea) return;

    elements.fileUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!isImporting) {
        elements.fileUploadArea.classList.add('dragover');
      }
    });

    elements.fileUploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      elements.fileUploadArea.classList.remove('dragover');
    });

    elements.fileUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.fileUploadArea.classList.remove('dragover');
      
      if (isImporting) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          selectFile(file);
        }
      }
    });
  }

  // Google Sheets 가져오기 처리
  async function handleGoogleSheetsImport() {
    const url = elements.googleSheetUrl.value.trim();
    
    if (!url) {
      showToast('Google Sheets URL을 입력해주세요.', 'warning');
      return;
    }

    if (!confirm('Google Sheets에서 데이터를 가져오시겠습니까?')) {
      return;
    }

    try {
      setImportingState(true);
      logMessage('🌐 Google Sheets에서 데이터 가져오기 시작...');

      const data = await importFromGoogleSheets(url);
      await saveToFirebase(data);

      showToast('Google Sheets 가져오기가 완료되었습니다!', 'success');
    } catch (error) {
      console.error('Google Sheets 가져오기 실패:', error);
      logMessage(`❌ 오류: ${error.message}`);
      showToast('Google Sheets 가져오기에 실패했습니다.', 'error');
    } finally {
      setImportingState(false);
    }
  }

  // 파일 선택 처리
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      selectFile(file);
    }
  }

  // 파일 가져오기 처리
  async function handleFileImport() {
    if (!selectedFile) {
      showToast('파일을 선택해주세요.', 'warning');
      return;
    }

    if (!confirm(`"${selectedFile.name}" 파일에서 데이터를 가져오시겠습니까?`)) {
      return;
    }

    try {
      setImportingState(true);
      logMessage('📁 파일에서 데이터 가져오기 시작...');

      const data = await importFromFile(selectedFile);
      await saveToFirebase(data);

      showToast('파일 가져오기가 완료되었습니다!', 'success');
    } catch (error) {
      console.error('파일 가져오기 실패:', error);
      logMessage(`❌ 오류: ${error.message}`);
      showToast('파일 가져오기에 실패했습니다.', 'error');
    } finally {
      setImportingState(false);
    }
  }

  // 파일 검증
  function validateFile(file) {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      showToast('Excel(.xlsx, .xls) 또는 CSV 파일만 지원됩니다.', 'warning');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('파일 크기가 10MB를 초과합니다.', 'warning');
      return false;
    }

    return true;
  }

  // 파일 선택
  function selectFile(file) {
    selectedFile = file;
    
    const fileName = elements.selectedFile.querySelector('.file-name');
    const fileSize = elements.selectedFile.querySelector('.file-size');
    
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
    
    elements.selectedFile.style.display = 'flex';
    elements.fileUploadArea.querySelector('.upload-placeholder').style.display = 'none';
    elements.importFromFileBtn.disabled = false;
    
    logMessage(`📁 파일 선택: ${file.name}`);
  }

  // 선택된 파일 제거
  window.clearSelectedFile = function() {
    selectedFile = null;
    elements.fileInput.value = '';
    elements.selectedFile.style.display = 'none';
    elements.fileUploadArea.querySelector('.upload-placeholder').style.display = 'flex';
    elements.importFromFileBtn.disabled = true;
    
    logMessage('📁 파일 선택 해제');
  };

  // Google Sheets에서 데이터 가져오기
  async function importFromGoogleSheets(url) {
    updateProgress(10, 'Google Sheets 분석 중...');
    
    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      throw new Error('올바른 Google Sheets URL이 아닙니다.');
    }

    updateProgress(30, 'Google Sheets 데이터 가져오는 중...');
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('Google Sheets에 접근할 수 없습니다. 공유 설정을 확인해주세요.');
    }
    
    const csvText = await response.text();
    updateProgress(60, 'CSV 데이터 파싱 중...');
    
    const data = parseCSV(csvText);
    updateProgress(80, '데이터 검증 중...');
    
    logMessage(`✅ Google Sheets에서 ${data.length}개 행 가져오기 완료`);
    return data;
  }

  // 파일에서 데이터 가져오기
  async function importFromFile(file) {
    updateProgress(10, '파일 읽는 중...');
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (fileExtension === '.csv') {
      return await readCSVFile(file);
    } else {
      return await readExcelFile(file);
    }
  }

  // CSV 파일 읽기
  async function readCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          updateProgress(50, 'CSV 파싱 중...');
          const csvText = e.target.result;
          const data = parseCSV(csvText);
          
          logMessage(`✅ CSV 파일에서 ${data.length}개 행 가져오기 완료`);
          resolve(data);
        } catch (error) {
          reject(new Error(`CSV 파싱 실패: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // Excel 파일 읽기
  async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          updateProgress(50, 'Excel 파싱 중...');
          
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('파일에 데이터가 없습니다.');
          }
          
          const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
          const parsedData = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = {};
            let hasData = false;
            
            headers.forEach((header, index) => {
              const value = jsonData[i][index];
              row[header] = value ? String(value).trim() : '';
              if (row[header]) hasData = true;
            });
            
            if (hasData) {
              parsedData.push(row);
            }
          }
          
          logMessage(`✅ Excel 파일에서 ${parsedData.length}개 행 가져오기 완료`);
          resolve(parsedData);
          
        } catch (error) {
          reject(new Error(`Excel 파싱 실패: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsArrayBuffer(file);
    });
  }

  // CSV 파싱
  function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV 파일에 데이터가 없습니다.');
    }
    
    const headers = parseCSVLine(lines[0]).map(h => h.trim()).filter(h => h);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      let hasData = false;
      
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
        if (row[header]) hasData = true;
      });
      
      if (hasData) {
        data.push(row);
      }
    }
    
    return data;
  }

  // CSV 라인 파싱
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  // 가져온 데이터 처리
  async function processImportedData(data, source) {
    try {
      updateProgress(85, '데이터 분석 중...');
      
      // 필드 분석
      const fieldAnalysis = analyzeFields(data);
      displayFieldAnalysis(fieldAnalysis);
      
      updateProgress(90, 'Firebase에 저장 중...');
      
      // Firebase에 저장
      const results = await saveToFirebase(data);
      
      updateProgress(100, '가져오기 완료!');
      
      // 결과 표시
      displayResults(results, source);
      
      logMessage(`✅ 가져오기 완료: ${results.success}개 성공, ${results.failed}개 실패`);
      showToast('데이터 가져오기가 완료되었습니다!', 'success');
      
    } catch (error) {
      throw new Error(`데이터 처리 실패: ${error.message}`);
    }
  }

  // 필드 분석
  function analyzeFields(data) {
    if (!data || data.length === 0) {
      throw new Error('분석할 데이터가 없습니다.');
    }

    const requiredFields = ['name', 'country'];
    const allFields = Object.keys(data[0] || {});
    const missingRequired = requiredFields.filter(field => !allFields.includes(field));
    
    if (missingRequired.length > 0) {
      throw new Error(`필수 필드가 누락되었습니다: ${missingRequired.join(', ')}`);
    }

    return {
      totalRows: data.length,
      totalFields: allFields.length,
      fields: allFields,
      requiredFields,
      missingRequired
    };
  }

  // 필드 분석 결과 표시
  function displayFieldAnalysis(analysis) {
    const content = `
      <div class="field-analysis">
        <div class="analysis-stats">
          <div class="stat-item">
            <span class="stat-number">${analysis.totalRows}</span>
            <span class="stat-label">총 데이터 행</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${analysis.totalFields}</span>
            <span class="stat-label">필드 개수</span>
          </div>
        </div>
        <div class="field-list">
          <h4>📋 감지된 필드들</h4>
          <div class="fields">
            ${analysis.fields.map(field => `
              <span class="field-tag ${analysis.requiredFields.includes(field) ? 'required' : ''}">${field}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    elements.fieldAnalysisContent.innerHTML = content;
    elements.fieldAnalysisSection.style.display = 'block';
    
    logMessage(`🔍 필드 분석: ${analysis.totalRows}개 행, ${analysis.totalFields}개 필드`);
    logMessage(`📋 필드 목록: ${analysis.fields.join(', ')}`);
  }

  // Firebase에 저장
  async function saveToFirebase(data) {
    if (!useFirebase) {
      throw new Error('Firebase가 연결되지 않았습니다.');
    }

    updateProgress(90, 'Firebase에 저장 중...');

    const db = firebase.firestore();
    const batch = db.batch();
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        if (!row.name || !row.country) {
          failCount++;
          logMessage(`❌ 행 ${i + 2}: name 또는 country 필드 누락`);
          continue;
        }

        const docId = generateDocumentId(row.name);
        const docRef = db.collection('missionaries').doc(docId);
        
        const missionaryData = {
          name: row.name,
          country: row.country,
          english_name: row.english_name || '',
          city: row.city || '',
          organization: row.organization || '',
          presbytery: row.presbytery || '',
          prayer: row.prayer || '',
          email: row.email || '',
          lastUpdate: new Date().toISOString()
        };

        // 좌표 처리
        if (row.lat && row.lng) {
          missionaryData.lat = parseFloat(row.lat);
          missionaryData.lng = parseFloat(row.lng);
        }
        
        batch.set(docRef, missionaryData, { merge: true });
        successCount++;
        
      } catch (error) {
        failCount++;
        logMessage(`❌ 행 ${i + 2}: ${error.message}`);
      }
    }
    
    await batch.commit();
    updateProgress(100, '저장 완료!');
    
    logMessage(`✅ 저장 완료: ${successCount}개 성공, ${failCount}개 실패`);
    return { success: successCount, failed: failCount };
  }

  // 문서 ID 생성
  function generateDocumentId(name) {
    return name.replace(/[^a-zA-Z0-9가-힣]/g, '_').toLowerCase();
  }

  // 스프레드시트 ID 추출
  function extractSpreadsheetId(url) {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  // 진행 상태 업데이트
  function updateProgress(percent, message) {
    if (elements.progressFill) {
      elements.progressFill.style.width = `${percent}%`;
    }
    if (elements.progressText) {
      elements.progressText.textContent = message;
    }
    
    logMessage(`⏳ ${percent}% - ${message}`);
  }

  // 가져오기 상태 설정
  function setImportingState(importing) {
    isImporting = importing;
    
    if (elements.importFromSheetBtn) {
      elements.importFromSheetBtn.disabled = importing;
      elements.importFromSheetBtn.textContent = importing ? '가져오는 중...' : '📊 Google Sheets에서 가져오기';
    }
    
    if (elements.importFromFileBtn) {
      elements.importFromFileBtn.disabled = importing || !selectedFile;
      elements.importFromFileBtn.textContent = importing ? '가져오는 중...' : '📂 파일에서 가져오기';
    }
    
    if (elements.progressSection) {
      elements.progressSection.style.display = importing ? 'block' : 'none';
    }
    
    if (importing) {
      updateProgress(0, '준비 중...');
    }
  }

  // 로그 메시지 추가
  function logMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${message}`;
    
    if (elements.logOutput) {
      elements.logOutput.textContent += logLine + '\n';
      elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
    }
    
    console.log(logLine);
  }

  // 로그 지우기
  function clearLog() {
    if (elements.logOutput) {
      elements.logOutput.textContent = '';
    }
    logMessage('📋 로그 지워짐');
  }

  // 로그 다운로드
  function downloadLog() {
    const logContent = elements.logOutput.textContent;
    if (!logContent.trim()) {
      showToast('다운로드할 로그가 없습니다.', 'info');
      return;
    }
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-log-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logMessage('📥 로그 다운로드 완료');
  }

  // 파일 크기 포맷
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

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

  // 결과 표시
  function displayResults(results, source) {
    const content = `
      <div class="import-results">
        <div class="result-stats">
          <div class="stat-item success">
            <span class="stat-number">${results.success}</span>
            <span class="stat-label">성공</span>
          </div>
          <div class="stat-item failed">
            <span class="stat-number">${results.failed}</span>
            <span class="stat-label">실패</span>
          </div>
        </div>
        <div class="result-details">
          <p><strong>소스:</strong> ${source}</p>
          <p><strong>처리 시간:</strong> ${new Date().toLocaleString()}</p>
          ${results.errors.length > 0 ? `
            <details>
              <summary>오류 세부사항 (${results.errors.length}개)</summary>
              <ul>
                ${results.errors.slice(0, 10).map(error => `<li>${error}</li>`).join('')}
                ${results.errors.length > 10 ? `<li>... 및 ${results.errors.length - 10}개 더</li>` : ''}
              </ul>
            </details>
          ` : ''}
        </div>
      </div>
    `;
    
    elements.resultContent.innerHTML = content;
    elements.resultSummary.style.display = 'block';
  }

  console.log('📊 스프레드시트 가져오기 모듈 로드 완료');
});

// 전역 함수들
window.clearSelectedFile = window.clearSelectedFile || function() {};
window.closeConfirmDialog = window.closeConfirmDialog || function() {}; 