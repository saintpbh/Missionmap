const admin = require('firebase-admin');

// Firebase Admin SDK 초기화 (다른 방식 시도)
try {
  // 방법 1: Firebase CLI 토큰 사용
  admin.initializeApp({
    projectId: 'prokworldmap',
    credential: admin.credential.applicationDefault()
  });
} catch (error) {
  console.log('ApplicationDefault 인증 실패, 다른 방법 시도...');
  try {
    // 방법 2: Firebase CLI 토큰 직접 사용
    const { execSync } = require('child_process');
    const token = execSync('firebase auth:print-access-token', { encoding: 'utf8' }).trim();
    
    admin.initializeApp({
      projectId: 'prokworldmap',
      credential: admin.credential.refreshToken({
        refresh_token: token
      })
    });
  } catch (tokenError) {
    console.error('모든 인증 방법 실패:', tokenError.message);
    console.log('\n📝 대안 방법:');
    console.log('1. Firebase 콘솔에서 직접 설정하세요:');
    console.log('   https://console.firebase.google.com/project/prokworldmap/authentication/users');
    console.log('2. saintpbh@gmail.com 사용자의 "⋮" 메뉴 → "Set custom claims"');
    console.log('3. {"admin": true} 입력');
    process.exit(1);
  }
}

async function setAdminClaim(email) {
  try {
    // 이메일로 사용자 찾기
    const user = await admin.auth().getUserByEmail(email);
    console.log('사용자 찾음:', user.email, 'UID:', user.uid);
    
    // 관리자 클레임 설정
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ ${email}에게 관리자 권한이 부여되었습니다.`);
    
    // 현재 클레임 확인
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('현재 클레임:', updatedUser.customClaims);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 스크립트 실행
const targetEmail = 'saintpbh@gmail.com';
console.log(`${targetEmail}에게 관리자 권한을 부여합니다...`);

setAdminClaim(targetEmail)
  .then(() => {
    console.log('\n✅ 작업 완료!');
    console.log('📝 다음 단계:');
    console.log('1. 브라우저에서 로그아웃 후 다시 로그인하세요.');
    console.log('2. 새로운 ID 토큰이 발급되어 관리자 권한이 적용됩니다.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }); 