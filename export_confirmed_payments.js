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

async function exportConfirmedPayments() {
  const paymentsSnapshot = await db.collection('payments').where('status', '==', 'confirmed').get();

  if (paymentsSnapshot.empty) {
    console.log('ℹ️ لا توجد دفعات مؤكدة.');
    return;
  }

  const report = [];

  paymentsSnapshot.forEach(doc => {
    const data = doc.data();
    report.push({
      paymentId: doc.id,
      uid: data.uid,
      planId: data.planId,
      amount: data.amountExpected,
      currency: data.currency,
      confirmedAt: data.confirmedAt ? data.confirmedAt.toDate() : null,
    });
  });

  const jsonFilename = getTimestampedFilename('confirmed_payments_report', 'json');
  fs.writeFileSync(jsonFilename, JSON.stringify(report, null, 2));
  console.log(`✅ تم تصدير ${report.length} دفعة مؤكدة إلى ${jsonFilename}`);

  const parser = new Parser();
  const csv = parser.parse(report);
  const csvFilename = getTimestampedFilename('confirmed_payments_report', 'csv');
  fs.writeFileSync(csvFilename, csv);
  console.log(`✅ تم تصدير ${report.length} دفعة مؤكدة إلى ${csvFilename}`);
}

// 🏁 تشغيل السكربت
(async () => {
  await exportConfirmedPayments();
})();
