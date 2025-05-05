const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function confirmPaymentWithBonusAndNotification(paymentId, transactionHash) {
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

  // تحديث حالة الدفع
  await paymentRef.update({
    status: 'confirmed',
    transactionHash: transactionHash,
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ تم تأكيد الدفع ${paymentId} وتسجيل المعاملة ${transactionHash}`);

  // تحديث خطة المستخدم
  const userRef = db.collection('users').doc(paymentData.uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.log(`❌ لا يوجد مستخدم بالمعرف ${paymentData.uid}`);
    return;
  }

  const userData = userDoc.data();

  let bonusAmount = 0;
  if (planId === 'first') {
    bonusAmount = 1_000_000;
  } else if (planId === 'business') {
    bonusAmount = 100_000;
  }

  const currentBalance = userData.balance || 0;
  const newBalance = currentBalance + bonusAmount;

  await userRef.update({
    plan: planId,
    paymentStatus: 'confirmed',
    subscriptionStart: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionEnd: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + planData.durationDays * 24 * 60 * 60 * 1000)
    ),
    balance: newBalance,
  });

  console.log(`✅ تم ترقية المستخدم ${paymentData.uid} إلى باقة ${planId} مع إضافة ${bonusAmount} عملة. الرصيد الجديد: ${newBalance}`);

  // إضافة إشعار داخل inbox
  const inboxRef = db.collection('users').doc(paymentData.uid).collection('inbox');
  await inboxRef.add({
    title: 'ترقية الاشتراك ومكافأة إضافية!',
    body: `تمت ترقية اشتراكك إلى باقة ${planId}. لقد أضفنا ${bonusAmount.toLocaleString()} عملة إلى رصيدك! شكرًا لاختيارك شبكتنا.`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
    claimed: false,
  });

  console.log(`📩 تم إرسال إشعار إلى صندوق بريد المستخدم ${paymentData.uid}`);
}

// 🏁 تشغيل السكربت (أدخل المعرفات هنا قبل التشغيل)
(async () => {
  const paymentId = 'payment_001';               // معرف الدفع
  const transactionHash = '0xExampleTransactionHash'; // هاش المعاملة الحقيقي
  await confirmPaymentWithBonusAndNotification(paymentId, transactionHash);
})();
