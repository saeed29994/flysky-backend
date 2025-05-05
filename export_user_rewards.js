const admin = require('firebase-admin');
const fs = require('fs');
const { Parser } = require('json2csv');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function getTimestampedFilename(baseName, extension) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  return `${baseName}_${timestamp}.${extension}`;
}

async function exportUserRewards() {
  const usersSnapshot = await db.collection('users').get();

  if (usersSnapshot.empty) {
    console.log('ℹ️ لا توجد سجلات مستخدمين.');
    return;
  }

  const report = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    report.push({
      uid: doc.id,
      fullName: data.fullName,
      plan: data.plan,
      rewardBalance: data.balance || 0,
    });
  });

  const jsonFilename = getTimestampedFilename('user_rewards_report', 'json');
  fs.writeFileSync(jsonFilename, JSON.stringify(report, null, 2));
  console.log(`✅ تم تصدير مكافآت ${report.length} مستخدم إلى ${jsonFilename}`);

  const parser = new Parser();
  const csv = parser.parse(report);
  const csvFilename = getTimestampedFilename('user_rewards_report', 'csv');
  fs.writeFileSync(csvFilename, csv);
  console.log(`✅ تم تصدير مكافآت ${report.length} مستخدم إلى ${csvFilename}`);
}

// 🏁 تشغيل السكربت
(async () => {
  await exportUserRewards();
})();
