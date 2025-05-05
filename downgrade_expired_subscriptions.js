const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function downgradeExpiredBusinessSubscriptions() {
  const usersSnapshot = await db.collection('users').get();

  let downgradedCount = 0;
  const now = new Date();

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();

    // فقط نفحص أعضاء بيزنس كلاس
    if (data.plan === 'business' && data.subscriptionEnd && data.subscriptionEnd.toDate() < now) {
      await doc.ref.update({
        plan: 'economy',                   // العودة للخطة الافتراضية
        paymentStatus: 'pending',          // إعادة الحالة إلى pending
        subscriptionStart: null,           // مسح تواريخ الاشتراك
        subscriptionEnd: null,
      });
      console.log(`✅ تم تخفيض المستخدم ${doc.id} من Business Class إلى economy لانتهاء الاشتراك`);
      downgradedCount++;
    }
  }

  console.log(`🏁 تم تخفيض ${downgradedCount} مستخدمًا من Business Class لانتهاء اشتراكاتهم.`);
}

// 🏁 تشغيل السكربت
(async () => {
  await downgradeExpiredBusinessSubscriptions();
})();
