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

async function exportUsersSummary() {
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
      email: data.email,
      plan: data.plan,
      balance: data.balance || 0,
      paymentStatus: data.paymentStatus,
    });
  });

  // حذف الملفات القديمة (إذا أردت حذفها يدويًا ضع fs.unlinkSync هنا)

  const jsonFilename = getTimestampedFilename('users_summary_report', 'json');
  fs.writeFileSync(jsonFilename, JSON.stringify(report, null, 2));
  console.log(`✅ تم تصدير ${report.length} مستخدم إلى ${jsonFilename}`);

  // تصدير كـ CSV
  const parser = new Parser();
  const csv = parser.parse(report);
  const csvFilename = getTimestampedFilename('users_summary_report', 'csv');
  fs.writeFileSync(csvFilename, csv);
  console.log(`✅ تم تصدير ${report.length} مستخدم إلى ${csvFilename}`);
}

// 🏁 تشغيل السكربت
(async () => {
  await exportUsersSummary();
})();
