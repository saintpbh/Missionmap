// Firebase 서비스 클래스
class FirebaseService {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.storage = firebase.storage();
    
    // Analytics는 선택적으로 초기화
    try {
      if (firebase.analytics) {
        this.analytics = firebase.analytics();
      } else {
        this.analytics = null;
      }
    } catch (error) {
      console.warn('Firebase Analytics 초기화 실패:', error);
      this.analytics = null;
    }
  }

  // ===== 인증 관련 메서드 =====
  
  // 로그인
  async login(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('로그인 에러:', error);
      throw error;
    }
  }

  // 로그아웃
  async logout() {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('로그아웃 에러:', error);
      throw error;
    }
  }

  // 현재 사용자 가져오기
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // 관리자 권한 확인
  async isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    try {
      const idTokenResult = await user.getIdTokenResult();
      return idTokenResult.claims.admin === true;
    } catch (error) {
      console.error('권한 확인 에러:', error);
      return false;
    }
  }

  // ===== 선교사 데이터 관련 메서드 =====
  
  // 모든 선교사 가져오기
  async getMissionaries() {
    try {
      // Realtime Database에서 데이터 가져오기
      const rtdb = firebase.database();
      const snapshot = await rtdb.ref('missionaries').once('value');
      const data = snapshot.val();
      
      if (!data) {
        return [];
      }
      
      // Firebase 키를 id로 변환하여 반환
      return Object.keys(data).map(key => ({
        id: key,
        _id: key, // PcWeb과 호환성을 위해 _id도 추가
        ...data[key]
      }));
    } catch (error) {
      console.error('선교사 데이터 가져오기 에러:', error);
      throw error;
    }
  }

  // 선교사 추가
  async addMissionary(missionaryData) {
    try {
      const now = new Date();
      const timestamp = now.getTime();
      
      // Realtime Database에 저장
      const rtdb = firebase.database();
      const newMissionaryRef = rtdb.ref('missionaries').push();
      
      const missionaryWithMetadata = {
        ...missionaryData,
        _id: newMissionaryRef.key, // Firebase 키를 _id로 저장
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: this.getCurrentUser()?.uid || 'system',
        updateHistory: [{
          timestamp: timestamp,
          action: '생성',
          updatedBy: this.getCurrentUser()?.uid || 'system',
          changes: Object.keys(missionaryData)
        }]
      };
      
      await newMissionaryRef.set(missionaryWithMetadata);
      
      // Firestore에도 동기화 (기존 호환성 유지)
      try {
        await this.db.collection('missionaries').doc(newMissionaryRef.key).set({
          ...missionaryWithMetadata,
          createdAt: now,
          updatedAt: now
        });
      } catch (firestoreError) {
        console.warn('Firestore 동기화 실패 (무시됨):', firestoreError);
      }
      
      return newMissionaryRef.key;
    } catch (error) {
      console.error('선교사 추가 에러:', error);
      throw error;
    }
  }

  // 선교사 업데이트
  async updateMissionary(id, missionaryData) {
    try {
      const now = new Date();
      const timestamp = now.getTime();
      
      // Realtime Database에서 현재 데이터 가져오기
      const rtdb = firebase.database();
      const currentSnapshot = await rtdb.ref(`missionaries/${id}`).once('value');
      const currentData = currentSnapshot.val();
      
      if (!currentData) {
        throw new Error('선교사를 찾을 수 없습니다.');
      }
      
      // 변경된 필드 찾기
      const changes = [];
      Object.keys(missionaryData).forEach(key => {
        if (currentData[key] !== missionaryData[key]) {
          changes.push(key);
        }
      });
      
      // 기존 수정 이력 가져오기
      const updateHistory = currentData.updateHistory || [];
      
      // 새로운 수정 이력 추가
      updateHistory.push({
        timestamp: timestamp,
        action: '수정',
        updatedBy: this.getCurrentUser()?.uid || 'system',
        changes: changes
      });
      
      // Realtime Database에 업데이트
      await rtdb.ref(`missionaries/${id}`).update({
        ...missionaryData,
        updatedAt: timestamp,
        updateHistory: updateHistory
      });
      
      // Firestore에도 동기화 (기존 호환성 유지)
      try {
        await this.db.collection('missionaries').doc(id).update({
          ...missionaryData,
          updatedAt: now,
          updateHistory: updateHistory
        });
      } catch (firestoreError) {
        console.warn('Firestore 동기화 실패 (무시됨):', firestoreError);
      }
    } catch (error) {
      console.error('선교사 업데이트 에러:', error);
      throw error;
    }
  }

  // 선교사 삭제
  async deleteMissionary(id) {
    try {
      // Realtime Database에서 삭제
      const rtdb = firebase.database();
      await rtdb.ref(`missionaries/${id}`).remove();
      
      // Firestore에서도 삭제 (기존 호환성 유지)
      try {
        await this.db.collection('missionaries').doc(id).delete();
      } catch (firestoreError) {
        console.warn('Firestore 삭제 실패 (무시됨):', firestoreError);
      }
    } catch (error) {
      console.error('선교사 삭제 에러:', error);
      throw error;
    }
  }

  // 특정 선교사 가져오기
  async getMissionary(id) {
    try {
      // Realtime Database에서 데이터 가져오기
      const rtdb = firebase.database();
      const snapshot = await rtdb.ref(`missionaries/${id}`).once('value');
      const data = snapshot.val();
      
      if (data) {
        return {
          id: id,
          _id: id, // PcWeb과 호환성을 위해 _id도 추가
          ...data
        };
      } else {
        throw new Error('선교사를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('선교사 데이터 가져오기 에러:', error);
      throw error;
    }
  }

  // 선교사의 최신 뉴스레터 정보 업데이트
  async updateMissionaryLatestNewsletter(missionaryId, newsletterInfo) {
    try {
      const rtdb = firebase.database();
      const now = new Date();
      const timestamp = now.getTime();
      
      // Realtime Database에서 선교사 데이터 업데이트
      await rtdb.ref(`missionaries/${missionaryId}`).update({
        latestNewsletterSummary: newsletterInfo.summary || '',
        latestNewsletterDate: newsletterInfo.date || timestamp,
        latestNewsletterIsUrgent: newsletterInfo.isUrgent || false,
        updatedAt: timestamp
      });
      
      console.log(`선교사 ${missionaryId}의 최신 뉴스레터 정보 업데이트 완료`);
    } catch (error) {
      console.error('선교사 최신 뉴스레터 정보 업데이트 에러:', error);
      throw error;
    }
  }

  // ===== 뉴스레터 관련 메서드 =====
  
  // 뉴스레터 추가
  async addNewsletter(newsletterData) {
    try {
      const docRef = await this.db.collection('newsletters').add({
        ...newsletterData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // 뉴스레터 추가 후 해당 선교사의 최신 뉴스레터 정보 업데이트
      if (newsletterData.missionaryId) {
        await this.updateMissionaryLatestNewsletter(newsletterData.missionaryId, {
          summary: newsletterData.summary,
          date: newsletterData.date,
          isUrgent: newsletterData.isUrgent
        });
      }
      
      return docRef.id;
    } catch (error) {
      console.error('뉴스레터 추가 에러:', error);
      throw error;
    }
  }

  // 뉴스레터 업데이트
  async updateNewsletter(id, newsletterData) {
    try {
      await this.db.collection('newsletters').doc(id).update({
        ...newsletterData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // 뉴스레터 업데이트 후 해당 선교사의 최신 뉴스레터 정보 업데이트
      if (newsletterData.missionaryId) {
        await this.updateMissionaryLatestNewsletter(newsletterData.missionaryId, {
          summary: newsletterData.summary,
          date: newsletterData.date,
          isUrgent: newsletterData.isUrgent
        });
      }
    } catch (error) {
      console.error('뉴스레터 업데이트 에러:', error);
      throw error;
    }
  }

  // 뉴스레터 삭제
  async deleteNewsletter(id) {
    try {
      await this.db.collection('newsletters').doc(id).delete();
    } catch (error) {
      console.error('뉴스레터 삭제 에러:', error);
      throw error;
    }
  }

  // 뉴스레터 목록 가져오기
  async getNewsletters(limit = 50) {
    try {
      const snapshot = await this.db.collection('newsletters')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('뉴스레터 목록 가져오기 에러:', error);
      throw error;
    }
  }

  // 특정 선교사의 뉴스레터 가져오기
  async getNewslettersByMissionary(missionaryId, limit = 20) {
    try {
      const snapshot = await this.db.collection('newsletters')
        .where('missionaryId', '==', missionaryId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('선교사별 뉴스레터 가져오기 에러:', error);
      throw error;
    }
  }

  // 긴급 뉴스레터 가져오기
  async getUrgentNewsletters(limit = 10) {
    try {
      const snapshot = await this.db.collection('newsletters')
        .where('isUrgent', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('긴급 뉴스레터 가져오기 에러:', error);
      throw error;
    }
  }

  // ===== 파일 업로드 관련 메서드 =====
  
  // 파일 업로드
  async uploadFile(file, folder, customName = null) {
    try {
      const fileName = customName || `${Date.now()}_${file.name}`;
      const fileRef = this.storage.ref(`${folder}/${fileName}`);
      
      const snapshot = await fileRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      
      // 파일 메타데이터 저장
      const fileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: downloadURL,
        path: `${folder}/${fileName}`,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        uploadedBy: this.getCurrentUser()?.uid
      };
      
      const docRef = await this.db.collection('files').add(fileMetadata);
      
      return {
        id: docRef.id,
        ...fileMetadata
      };
    } catch (error) {
      console.error('파일 업로드 에러:', error);
      throw error;
    }
  }

  // 사진 업로드
  async uploadPhoto(file) {
    return this.uploadFile(file, 'photos');
  }

  // 문서 업로드
  async uploadDocument(file) {
    return this.uploadFile(file, 'documents');
  }

  // 파일 삭제
  async deleteFile(fileId, filePath) {
    try {
      // Storage에서 파일 삭제
      const fileRef = this.storage.ref(filePath);
      await fileRef.delete();
      
      // Firestore에서 메타데이터 삭제
      await this.db.collection('files').doc(fileId).delete();
    } catch (error) {
      console.error('파일 삭제 에러:', error);
      throw error;
    }
  }

  // 파일 다운로드 URL 가져오기
  async getFileDownloadURL(filePath) {
    try {
      const fileRef = this.storage.ref(filePath);
      return await fileRef.getDownloadURL();
    } catch (error) {
      console.error('파일 URL 가져오기 에러:', error);
      throw error;
    }
  }

  // ===== 데이터 마이그레이션 메서드 =====
  
  // LocalStorage에서 Firestore로 마이그레이션
  async migrateFromLocalStorage() {
    try {
      console.log('마이그레이션 시작...');
      
      // 선교사 데이터 마이그레이션
      const localMissionaries = JSON.parse(localStorage.getItem('missionaries') || '[]');
      console.log(`${localMissionaries.length}명의 선교사 데이터 마이그레이션 중...`);
      
      for (const missionary of localMissionaries) {
        await this.addMissionary(missionary);
      }
      
      // 뉴스레터 데이터 마이그레이션
      const localNewsletters = JSON.parse(localStorage.getItem('newsletters') || '[]');
      console.log(`${localNewsletters.length}개의 뉴스레터 데이터 마이그레이션 중...`);
      
      for (const newsletter of localNewsletters) {
        // 파일 데이터 처리
        const processedNewsletter = await this.processNewsletterFiles(newsletter);
        await this.addNewsletter(processedNewsletter);
      }
      
      console.log('마이그레이션 완료!');
      return {
        success: true,
        missionaries: localMissionaries.length,
        newsletters: localNewsletters.length
      };
    } catch (error) {
      console.error('마이그레이션 에러:', error);
      throw error;
    }
  }

  // 뉴스레터 파일 데이터 처리
  async processNewsletterFiles(newsletter) {
    const processedNewsletter = { ...newsletter };
    
    // 사진 파일 처리
    if (newsletter.photos && newsletter.photos.length > 0) {
      processedNewsletter.photos = [];
      for (const photo of newsletter.photos) {
        if (photo.isLocal && photo.data) {
          // Base64 데이터를 Firebase Storage에 업로드
          try {
            const uploadedPhoto = await this.uploadBase64ToStorage(photo.data, 'photos', photo.name);
            processedNewsletter.photos.push(uploadedPhoto);
          } catch (error) {
            console.error('사진 업로드 실패:', photo.name, error);
            // 실패한 경우 원본 데이터 유지
            processedNewsletter.photos.push(photo);
          }
        } else {
          processedNewsletter.photos.push(photo);
        }
      }
    }
    
    // 문서 파일 처리
    if (newsletter.documents && newsletter.documents.length > 0) {
      processedNewsletter.documents = [];
      for (const doc of newsletter.documents) {
        if (doc.isLocal && doc.data) {
          // Base64 데이터를 Firebase Storage에 업로드
          try {
            const uploadedDoc = await this.uploadBase64ToStorage(doc.data, 'documents', doc.name);
            processedNewsletter.documents.push(uploadedDoc);
          } catch (error) {
            console.error('문서 업로드 실패:', doc.name, error);
            // 실패한 경우 원본 데이터 유지
            processedNewsletter.documents.push(doc);
          }
        } else {
          processedNewsletter.documents.push(doc);
        }
      }
    }
    
    return processedNewsletter;
  }

  // Base64 데이터를 Firebase Storage에 업로드
  async uploadBase64ToStorage(base64Data, folder, fileName) {
    try {
      // Base64 데이터를 Blob으로 변환
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      // Firebase Storage에 업로드
      const fileRef = this.storage.ref(`${folder}/${Date.now()}_${fileName}`);
      const snapshot = await fileRef.put(blob);
      const downloadURL = await snapshot.ref.getDownloadURL();
      
      // 파일 메타데이터 저장
      const fileMetadata = {
        name: fileName,
        size: blob.size,
        type: blob.type,
        url: downloadURL,
        path: `${folder}/${snapshot.ref.name}`,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        uploadedBy: this.getCurrentUser()?.uid
      };
      
      const docRef = await this.db.collection('files').add(fileMetadata);
      
      return {
        id: docRef.id,
        ...fileMetadata
      };
    } catch (error) {
      console.error('Base64 업로드 에러:', error);
      throw error;
    }
  }

  // 마이그레이션 상태 확인
  async checkMigrationStatus() {
    try {
      const localNewsletters = JSON.parse(localStorage.getItem('newsletters') || '[]');
      const localMissionaries = JSON.parse(localStorage.getItem('missionaries') || '[]');
      
      const firestoreNewsletters = await this.getNewsletters(1000);
      const firestoreMissionaries = await this.getMissionaries();
      
      return {
        local: {
          newsletters: localNewsletters.length,
          missionaries: localMissionaries.length
        },
        firestore: {
          newsletters: firestoreNewsletters.length,
          missionaries: firestoreMissionaries.length
        },
        needsMigration: localNewsletters.length > 0 || localMissionaries.length > 0
      };
    } catch (error) {
      console.error('마이그레이션 상태 확인 에러:', error);
      throw error;
    }
  }

  // ===== 실시간 리스너 메서드 =====
  
  // 뉴스레터 실시간 리스너
  onNewslettersUpdate(callback) {
    return this.db.collection('newsletters')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot((snapshot) => {
        const newsletters = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(newsletters);
      }, (error) => {
        console.error('뉴스레터 실시간 업데이트 에러:', error);
      });
  }

  // 특정 뉴스레터 실시간 리스너
  onNewsletterUpdate(newsletterId, callback) {
    return this.db.collection('newsletters').doc(newsletterId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          callback({
            id: doc.id,
            ...doc.data()
          });
        } else {
          callback(null);
        }
      }, (error) => {
        console.error('뉴스레터 실시간 업데이트 에러:', error);
      });
  }
}

// 전역 인스턴스 생성
try {
  window.firebaseService = new FirebaseService();
  console.log('FirebaseService 초기화 완료');
} catch (error) {
  console.error('FirebaseService 초기화 실패:', error);
  window.firebaseService = null;
}

// ===== 전역 함수들 =====
// 선교사 관리에서 사용할 함수들

// 선교사 목록 가져오기
window.getMissionaries = async function() {
  const service = new FirebaseService();
  return await service.getMissionaries();
}

// 선교사 추가
window.addMissionary = async function(missionaryData) {
  const service = new FirebaseService();
  return await service.addMissionary(missionaryData);
}

// 선교사 수정
window.updateMissionary = async function(id, missionaryData) {
  const service = new FirebaseService();
  return await service.updateMissionary(id, missionaryData);
}

// 선교사 삭제
window.deleteMissionary = async function(id) {
  const service = new FirebaseService();
  return await service.deleteMissionary(id);
}

// 뉴스레터 추가
window.addNewsletter = async function(newsletterData) {
  const service = new FirebaseService();
  return await service.addNewsletter(newsletterData);
}

// 뉴스레터 수정
window.updateNewsletter = async function(id, newsletterData) {
  const service = new FirebaseService();
  return await service.updateNewsletter(id, newsletterData);
}

// 뉴스레터 삭제
window.deleteNewsletter = async function(id) {
  const service = new FirebaseService();
  return await service.deleteNewsletter(id);
}

// 뉴스레터 목록 가져오기
window.getNewsletters = async function(limit = 50) {
  const service = new FirebaseService();
  return await service.getNewsletters(limit);
}

// 마이그레이션 상태 확인
window.checkMigrationStatus = async function() {
  const service = new FirebaseService();
  return await service.checkMigrationStatus();
}

// LocalStorage에서 마이그레이션
window.migrateFromLocalStorage = async function() {
  const service = new FirebaseService();
  return await service.migrateFromLocalStorage();
}

window.getMissionary = async function(id) {
  const service = new FirebaseService();
  return await service.getMissionary(id);
} 