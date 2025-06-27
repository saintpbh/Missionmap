const admin = require('firebase-admin');
const csv = require('csvtojson');
const serviceAccount = require('./_data/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://prokworldmap-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function migrateMissionaries() {
  const missionaries = await csv().fromFile('./_data/missionaries.csv');
  const updates = {};
  missionaries.forEach((item, idx) => {
    const id = item.id || `m${idx+1}`;
    updates[`missionaries/${id}`] = item;
  });
  await db.ref().update(updates);
  console.log('선교사 정보 업로드 완료');
}

async function migrateNews() {
  const news = await csv().fromFile('./_data/news.csv');
  const updates = {};
  news.forEach((item, idx) => {
    const id = item.id || `n${idx+1}`;
    updates[`news/${id}`] = item;
  });
  await db.ref().update(updates);
  console.log('소식 업로드 완료');
}

(async () => {
  await migrateMissionaries();
  await migrateNews();
  process.exit();
})();