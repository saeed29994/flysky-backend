const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateOldPaymentsWithPlanId(defaultPlanId = 'economy') {
  const paymentsSnapshot = await db.collection('payments').get();

  let updatedCount = 0;

  for (const doc of paymentsSnapshot.docs) {
    const data = doc.data();

    if (!data.planId) {
      await doc.ref.update({
        planId: defaultPlanId,
      });
      console.log(`✅ تم تحديث الدفع ${doc.id} بإضافة planId = ${defaultPlanId}`);
      updatedCount++;
    }
  }

  console.log(`🏁 تم تحديث ${updatedCount} من عمليات الدفع القديمة.`);
}

// 🏁 تشغيل السكربت
(async () => {
  await updateOldPaymentsWithPlanId('economy'); // يمكنك تغيير 'economy' لأي قيمة تريدها
})();
