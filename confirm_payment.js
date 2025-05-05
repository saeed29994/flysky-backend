const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function confirmPayment(paymentId, transactionHash) {
  const paymentRef = db.collection('payments').doc(paymentId);
  const paymentDoc = await paymentRef.get();

  if (!paymentDoc.exists) {
    console.log(`❌ لا يوجد طلب دفع بالمعرف ${paymentId}`);
    return;
  }

  const paymentData = paymentDoc.data();

  if (paymentData.status === 'confirmed') {
    console.log(`ℹ️ الدفع ${paymentId} مؤكد مسبقًا`);
    return;
  }

  // جلب تفاصيل الباقة
  const planId = paymentData.planId;
  const planRef = db.collection('plans').doc(planId);
  const planDoc = await planRef.get();

  if (!planDoc.exists) {
    console.log(`❌ لا توجد باقة معرفها ${planId}`);
    return;
  }

  const planData = planDoc.data();

  // تحديث الدفع
  await paymentRef.update({
    status: 'confirmed',
    transactionHash: transactionHash,
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ تم تأكيد الدفع ${paymentId} وتسجيل المعاملة ${transactionHash}`);

  // تحديث حساب المستخدم
  const userRef = db.collection('users').doc(paymentData.uid);
  await userRef.update({
    plan: planId,
    paymentStatus: 'confirmed',
    subscriptionStart: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionEnd: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + planData.durationDays * 24 * 60 * 60 * 1000)
    ),
  });

  console.log(`✅ تم ترقية المستخدم ${paymentData.uid} إلى باقة ${planId} لمدة ${planData.durationDays} يومًا`);
}

// 🏁 تشغيل السكربت (أدخل المعرفات هنا قبل التشغيل)
(async () => {
  const paymentId = 'payment_001';               // معرف الدفع
  const transactionHash = '0xExampleTransactionHash'; // هاش المعاملة الحقيقي
  await confirmPayment(paymentId, transactionHash);
})();
