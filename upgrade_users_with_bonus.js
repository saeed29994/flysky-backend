const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function upgradeUsersWithBonus() {
  const confirmedPayments = await db.collection('payments').where('status', '==', 'confirmed').get();

  if (confirmedPayments.empty) {
    console.log('ℹ️ لا توجد دفعات مؤكدة للمعالجة.');
    return;
  }

  for (const doc of confirmedPayments.docs) {
    const payment = doc.data();
    const userRef = db.collection('users').doc(payment.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.log(`⚠️ المستخدم ${payment.uid} غير موجود، يتم تخطيه.`);
      continue;
    }

    const user = userSnap.data();

    if (user.plan !== 'pending' && user.plan !== 'economy') {
      console.log(`ℹ️ المستخدم ${payment.uid} تمت ترقيته بالفعل، يتم تخطيه.`);
      continue;
    }

    let bonus = 0;
    if (payment.planId === 'business') {
      bonus = 100000;
    } else if (payment.planId === 'first') {
      bonus = 1000000;
    } else {
      console.log(`⚠️ خطة غير معروفة (${payment.planId})، يتم تخطيه.`);
      continue;
    }

    await userRef.update({
      plan: payment.planId,
      balance: (user.balance || 0) + bonus,
      subscriptionStart: admin.firestore.FieldValue.serverTimestamp(),
      paymentStatus: 'active',
    });

    console.log(`✅ تمت ترقية المستخدم ${payment.uid} إلى ${payment.planId} + مكافأة ${bonus} FSN.`);

    // ضع علامة "معالج" على الدفع حتى لا يُعاد معالجته لاحقًا
    await doc.ref.update({
      processed: true,
    });
  }
}

// 🏁 تشغيل السكربت
(async () => {
  await upgradeUsersWithBonus();
})();
