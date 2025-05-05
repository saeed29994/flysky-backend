const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cancelUserSubscription(uid) {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.log(`❌ لا يوجد مستخدم بالمعرف ${uid}`);
    return;
  }

  await userRef.update({
    plan: 'economy',                  // تعيين الخطة الافتراضية بعد الإلغاء
    paymentStatus: 'pending',         // تعيين الحالة إلى pending
    subscriptionStart: null,          // مسح تاريخ بدء الاشتراك
    subscriptionEnd: null,            // مسح تاريخ نهاية الاشتراك
  });

  console.log(`✅ تم إلغاء اشتراك المستخدم ${uid} وإعادته إلى خطة economy`);
}

// 🏁 تشغيل السكربت (أدخل معرف المستخدم هنا قبل التشغيل)
(async () => {
  const uid = 'abc123'; // ضع هنا معرف المستخدم الذي تريد إلغاء اشتراكه
  await cancelUserSubscription(uid);
})();
