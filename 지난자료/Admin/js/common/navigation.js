// 공통 네비게이션 함수들
window.showDataExport = function() {
  // 데이터 내보내기 모달 표시
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>📤 데이터 내보내기</h2>
        <button type="button" class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p>어떤 데이터를 내보내시겠습니까?</p>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
          <button type="button" class="btn btn-primary" onclick="exportMissionaryData()">
            👥 선교사 데이터 내보내기 (CSV)
          </button>
          <button type="button" class="btn btn-secondary" onclick="exportNewsletterData()">
            📝 뉴스레터 데이터 내보내기 (CSV)
          </button>
          <button type="button" class="btn btn-info" onclick="exportAllData()">
            📊 전체 데이터 내보내기 (JSON)
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.showSystemStatus = function() {
  // 시스템 상태 모달 표시
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>⚙️ 시스템 상태</h2>
        <button type="button" class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div id="system-status-content">
          <div class="loading-spinner"></div>
          <p>시스템 상태를 확인 중...</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // 시스템 상태 확인
  checkSystemStatus();
};

// 데이터 내보내기 함수들
window.exportMissionaryData = async function() {
  try {
    showToast('선교사 데이터를 내보내는 중...', 'info');
    
    // Firebase에서 선교사 데이터 가져오기
    const snapshot = await firebase.firestore().collection('missionaries').get();
    const missionaries = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      missionaries.push({
        이름: data.name || '',
        국가: data.country || '',
        지역: data.region || '',
        노회: data.presbytery || '',
        상태: data.status || '',
        이메일: data.email || '',
        전화번호: data.phone || ''
      });
    });
    
    // CSV 형식으로 변환
    const csvContent = convertToCSV(missionaries);
    downloadFile(csvContent, 'missionaries.csv', 'text/csv');
    
    showToast('선교사 데이터 내보내기 완료!', 'success');
    document.querySelector('.modal').remove();
  } catch (error) {
    console.error('선교사 데이터 내보내기 오류:', error);
    showToast('데이터 내보내기 중 오류가 발생했습니다.', 'error');
  }
};

window.exportNewsletterData = async function() {
  try {
    showToast('뉴스레터 데이터를 내보내는 중...', 'info');
    
    const snapshot = await firebase.firestore().collection('newsletters').get();
    const newsletters = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      newsletters.push({
        선교사명: data.missionaryName || '',
        제목: data.title || '',
        발행일: data.issueDate || '',
        내용: data.content || ''
      });
    });
    
    const csvContent = convertToCSV(newsletters);
    downloadFile(csvContent, 'newsletters.csv', 'text/csv');
    
    showToast('뉴스레터 데이터 내보내기 완료!', 'success');
    document.querySelector('.modal').remove();
  } catch (error) {
    console.error('뉴스레터 데이터 내보내기 오류:', error);
    showToast('데이터 내보내기 중 오류가 발생했습니다.', 'error');
  }
};

window.exportAllData = async function() {
  try {
    showToast('전체 데이터를 내보내는 중...', 'info');
    
    const [missionariesSnapshot, newslettersSnapshot] = await Promise.all([
      firebase.firestore().collection('missionaries').get(),
      firebase.firestore().collection('newsletters').get()
    ]);
    
    const allData = {
      missionaries: [],
      newsletters: [],
      exportDate: new Date().toISOString()
    };
    
    missionariesSnapshot.forEach(doc => {
      allData.missionaries.push({ id: doc.id, ...doc.data() });
    });
    
    newslettersSnapshot.forEach(doc => {
      allData.newsletters.push({ id: doc.id, ...doc.data() });
    });
    
    const jsonContent = JSON.stringify(allData, null, 2);
    downloadFile(jsonContent, 'all_data.json', 'application/json');
    
    showToast('전체 데이터 내보내기 완료!', 'success');
    document.querySelector('.modal').remove();
  } catch (error) {
    console.error('전체 데이터 내보내기 오류:', error);
    showToast('데이터 내보내기 중 오류가 발생했습니다.', 'error');
  }
};

// 시스템 상태 확인
window.checkSystemStatus = async function() {
  const statusContent = document.getElementById('system-status-content');
  
  try {
    const status = {
      firebase: '연결됨',
      firestore: '정상',
      auth: firebase.auth().currentUser ? '로그인됨' : '로그아웃됨',
      timestamp: new Date().toLocaleString('ko-KR')
    };
    
    // 데이터베이스 연결 테스트
    await firebase.firestore().collection('missionaries').limit(1).get();
    
    statusContent.innerHTML = `
      <div style="display: grid; gap: 1rem;">
        <div class="status-item">
          <strong>🔥 Firebase:</strong> <span style="color: green;">${status.firebase}</span>
        </div>
        <div class="status-item">
          <strong>🗄️ Firestore:</strong> <span style="color: green;">${status.firestore}</span>
        </div>
        <div class="status-item">
          <strong>🔐 인증:</strong> <span style="color: ${status.auth === '로그인됨' ? 'green' : 'orange'};">${status.auth}</span>
        </div>
        <div class="status-item">
          <strong>⏰ 확인 시간:</strong> ${status.timestamp}
        </div>
        <div class="status-item">
          <strong>👤 사용자:</strong> ${firebase.auth().currentUser?.email || '미로그인'}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('시스템 상태 확인 오류:', error);
    statusContent.innerHTML = `
      <div style="color: red;">
        <p>⚠️ 시스템 상태 확인 중 오류가 발생했습니다.</p>
        <p>오류: ${error.message}</p>
      </div>
    `;
  }
};

// 유틸리티 함수들
function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 3000);
} 