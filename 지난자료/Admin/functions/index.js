/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const logger = require("firebase-functions/logger");

// Firebase Admin 초기화
initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// ===== 관리자 권한 부여 함수 =====

// 관리자 권한 부여 (Callable Function)
exports.setAdminRole = onCall({
  maxInstances: 5,
  region: "us-central1", // 기본 리전으로 변경
}, async (request) => {
  try {
    // 요청 데이터 확인
    const {email, adminPassword} = request.data;

    if (!email || !adminPassword) {
      throw new Error("이메일과 관리자 비밀번호가 필요합니다.");
    }

    // 관리자 비밀번호 확인 (실제 운영에서는 더 안전한 방법 사용)
    const expectedPassword = "admin123!@#"; // 실제 운영에서는 환경변수 사용
    if (adminPassword !== expectedPassword) {
      throw new Error("관리자 비밀번호가 올바르지 않습니다.");
    }

    // 사용자 UID 찾기
    const auth = getAuth();
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      throw new Error("해당 이메일의 사용자를 찾을 수 없습니다.");
    }

    // 관리자 권한 부여
    await auth.setCustomUserClaims(userRecord.uid, {admin: true});

    logger.info(`관리자 권한 부여 완료: ${email}`, {structuredData: true});

    return {
      success: true,
      message: `${email}에게 관리자 권한이 부여되었습니다.`,
      uid: userRecord.uid,
    };
  } catch (error) {
    logger.error("관리자 권한 부여 실패:", error);
    throw new Error(
        `관리자 권한 부여 실패: ${error.message}`,
    );
  }
});

// 관리자 권한 확인 함수
exports.checkAdminRole = onCall({
  maxInstances: 5,
  region: "us-central1",
}, async (request) => {
  try {
    const {uid} = request.data;

    if (!uid) {
      throw new Error("사용자 UID가 필요합니다.");
    }

    const auth = getAuth();
    const userRecord = await auth.getUser(uid);

    const isAdmin = userRecord.customClaims &&
        userRecord.customClaims.admin === true;

    return {
      success: true,
      isAdmin: isAdmin,
      email: userRecord.email,
      claims: userRecord.customClaims,
    };
  } catch (error) {
    logger.error("관리자 권한 확인 실패:", error);
    throw new Error(
        "관리자 권한 확인 실패: " +
          error.message,
    );
  }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
