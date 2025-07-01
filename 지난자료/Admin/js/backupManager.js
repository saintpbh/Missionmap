// 데이터 백업 및 복원 관리자
class BackupManager {
  constructor() {
    this.backupInterval = null;
    this.autoBackupEnabled = true;
    this.backupRetentionDays = 30;
    this.init();
  }

  async init() {
    this.setupAutoBackup();
    this.cleanupOldBackups();
  }

  // 자동 백업 설정
  setupAutoBackup() {
    if (this.autoBackupEnabled) {
      // 6시간마다 자동 백업
      this.backupInterval = setInterval(() => {
        this.createBackup('auto');
      }, 6 * 60 * 60 * 1000);
    }
  }

  // 백업 생성
  async createBackup(type = 'manual') {
    try {
      const timestamp = new Date().toISOString();
      const backupData = {
        id: `backup_${Date.now()}`,
        type: type,
        timestamp: timestamp,
        version: '1.0',
        data: {
          missionaries: await getAllMissionaries(),
          newsletters: await getAllNewsletters(),
          formSettings: this.getFormSettings(),
          systemSettings: this.getSystemSettings()
        }
      };

      // Firebase에 백업 저장
      await firebase.firestore().collection('backups').doc(backupData.id).set(backupData);
      
      // 로컬 스토리지에도 저장
      localStorage.setItem(`backup_${backupData.id}`, JSON.stringify(backupData));
      
      console.log(`${type} 백업 생성 완료:`, backupData.id);
      return backupData.id;
      
    } catch (error) {
      console.error('백업 생성 오류:', error);
      throw error;
    }
  }

  // 백업 목록 가져오기
  async getBackups() {
    try {
      const snapshot = await firebase.firestore().collection('backups')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('백업 목록 가져오기 오류:', error);
      return [];
    }
  }

  // 백업 복원
  async restoreBackup(backupId) {
    try {
      const backupDoc = await firebase.firestore().collection('backups').doc(backupId).get();
      
      if (!backupDoc.exists) {
        throw new Error('백업을 찾을 수 없습니다.');
      }

      const backupData = backupDoc.data();
      
      // 데이터 복원
      await this.restoreData(backupData.data);
      
      console.log('백업 복원 완료:', backupId);
      return true;
      
    } catch (error) {
      console.error('백업 복원 오류:', error);
      throw error;
    }
  }

  // 데이터 복원
  async restoreData(data) {
    const batch = firebase.firestore().batch();
    
    // 기존 데이터 삭제
    const missionariesSnapshot = await firebase.firestore().collection('missionaries').get();
    missionariesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    const newslettersSnapshot = await firebase.firestore().collection('newsletters').get();
    newslettersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 새 데이터 추가
    if (data.missionaries) {
      data.missionaries.forEach(missionary => {
        const docRef = firebase.firestore().collection('missionaries').doc();
        batch.set(docRef, missionary);
      });
    }
    
    if (data.newsletters) {
      data.newsletters.forEach(newsletter => {
        const docRef = firebase.firestore().collection('newsletters').doc();
        batch.set(docRef, newsletter);
      });
    }
    
    // 설정 복원
    if (data.formSettings) {
      localStorage.setItem('formSettings', JSON.stringify(data.formSettings));
    }
    
    if (data.systemSettings) {
      localStorage.setItem('systemSettings', JSON.stringify(data.systemSettings));
    }
    
    await batch.commit();
  }

  // 백업 삭제
  async deleteBackup(backupId) {
    try {
      await firebase.firestore().collection('backups').doc(backupId).delete();
      localStorage.removeItem(`backup_${backupId}`);
      console.log('백업 삭제 완료:', backupId);
      return true;
    } catch (error) {
      console.error('백업 삭제 오류:', error);
      throw error;
    }
  }

  // 오래된 백업 정리
  async cleanupOldBackups() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupRetentionDays);
      
      const snapshot = await firebase.firestore().collection('backups')
        .where('timestamp', '<', cutoffDate.toISOString())
        .get();
      
      const batch = firebase.firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        localStorage.removeItem(`backup_${doc.id}`);
      });
      
      if (snapshot.docs.length > 0) {
        await batch.commit();
        console.log(`${snapshot.docs.length}개의 오래된 백업을 삭제했습니다.`);
      }
      
    } catch (error) {
      console.error('백업 정리 오류:', error);
    }
  }

  // 폼 설정 가져오기
  getFormSettings() {
    try {
      return JSON.parse(localStorage.getItem('formSettings') || '{}');
    } catch (error) {
      return {};
    }
  }

  // 시스템 설정 가져오기
  getSystemSettings() {
    try {
      return JSON.parse(localStorage.getItem('systemSettings') || '{}');
    } catch (error) {
      return {};
    }
  }

  // 백업 통계
  async getBackupStats() {
    try {
      const backups = await this.getBackups();
      const totalSize = backups.reduce((sum, backup) => {
        return sum + JSON.stringify(backup.data).length;
      }, 0);
      
      return {
        totalBackups: backups.length,
        totalSize: totalSize,
        lastBackup: backups[0]?.timestamp || null,
        autoBackupEnabled: this.autoBackupEnabled
      };
    } catch (error) {
      console.error('백업 통계 오류:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        lastBackup: null,
        autoBackupEnabled: this.autoBackupEnabled
      };
    }
  }

  // 백업 내보내기
  async exportBackup(backupId) {
    try {
      const backupDoc = await firebase.firestore().collection('backups').doc(backupId).get();
      
      if (!backupDoc.exists) {
        throw new Error('백업을 찾을 수 없습니다.');
      }

      const backupData = backupDoc.data();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupId}_${backupData.timestamp.split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('백업 내보내기 오류:', error);
      throw error;
    }
  }

  // 백업 가져오기
  async importBackup(file) {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // 백업 데이터 검증
      if (!backupData.data || !backupData.timestamp) {
        throw new Error('유효하지 않은 백업 파일입니다.');
      }
      
      // 백업 저장
      const backupId = `imported_${Date.now()}`;
      backupData.id = backupId;
      backupData.type = 'imported';
      backupData.timestamp = new Date().toISOString();
      
      await firebase.firestore().collection('backups').doc(backupId).set(backupData);
      
      console.log('백업 가져오기 완료:', backupId);
      return backupId;
      
    } catch (error) {
      console.error('백업 가져오기 오류:', error);
      throw error;
    }
  }

  // 자동 백업 토글
  toggleAutoBackup() {
    this.autoBackupEnabled = !this.autoBackupEnabled;
    
    if (this.autoBackupEnabled) {
      this.setupAutoBackup();
    } else {
      if (this.backupInterval) {
        clearInterval(this.backupInterval);
        this.backupInterval = null;
      }
    }
    
    localStorage.setItem('autoBackupEnabled', this.autoBackupEnabled);
  }

  // 정리
  destroy() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
  }
}

// 전역 함수들
window.createBackup = async function() {
  try {
    const backupId = await backupManager.createBackup('manual');
    showToast('백업이 성공적으로 생성되었습니다.', 'success');
    return backupId;
  } catch (error) {
    showToast('백업 생성 중 오류가 발생했습니다.', 'error');
    throw error;
  }
};

window.restoreBackup = async function(backupId) {
  if (confirm('정말로 이 백업으로 복원하시겠습니까? 현재 데이터가 모두 삭제됩니다.')) {
    try {
      await backupManager.restoreBackup(backupId);
      showToast('백업이 성공적으로 복원되었습니다.', 'success');
      location.reload();
    } catch (error) {
      showToast('백업 복원 중 오류가 발생했습니다.', 'error');
    }
  }
};

window.deleteBackup = async function(backupId) {
  if (confirm('정말로 이 백업을 삭제하시겠습니까?')) {
    try {
      await backupManager.deleteBackup(backupId);
      showToast('백업이 삭제되었습니다.', 'success');
      // 백업 목록 새로고침
      if (window.refreshBackupList) {
        window.refreshBackupList();
      }
    } catch (error) {
      showToast('백업 삭제 중 오류가 발생했습니다.', 'error');
    }
  }
};

window.exportBackup = async function(backupId) {
  try {
    await backupManager.exportBackup(backupId);
    showToast('백업이 내보내졌습니다.', 'success');
  } catch (error) {
    showToast('백업 내보내기 중 오류가 발생했습니다.', 'error');
  }
};

window.importBackup = async function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await backupManager.importBackup(file);
        showToast('백업이 성공적으로 가져와졌습니다.', 'success');
        // 백업 목록 새로고침
        if (window.refreshBackupList) {
          window.refreshBackupList();
        }
      } catch (error) {
        showToast('백업 가져오기 중 오류가 발생했습니다.', 'error');
      }
    }
  };
  input.click();
};

// 전역 인스턴스 생성
let backupManager;
document.addEventListener('DOMContentLoaded', () => {
  backupManager = new BackupManager();
}); 