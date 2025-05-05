const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addUserIfNotExists(uid, fullName, email) {
  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      fullName,
      email,
      plan: 'pending',
      paymentStatus: 'pending',
      subscriptionStart: null,
      subscriptionEnd: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ تم إنشاء مستخدم جديد: ${fullName}`);
  } else {
    console.log(`ℹ️ المستخدم ${uid} موجود بالفعل، لم يتم التعديل`);
  }
}

async function addPlanIfNotExists(planId, name, price, durationDays, features) {
  const planRef = db.collection('plans').doc(planId);
  const doc = await planRef.get();

  if (!doc.exists) {
    await planRef.set({
      name,
      price,
      durationDays,
      features,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ تم إنشاء الباقة: ${name}`);
  } else {
    console.log(`ℹ️ الباقة ${planId} موجودة بالفعل، لم يتم التعديل`);
  }
}

async function addPaymentIfNotExists(paymentId, uid, cryptoAddress, amountExpected, currency, network) {
  const paymentRef = db.collection('payments').doc(paymentId);
  const doc = await paymentRef.get();

  if (!doc.exists) {
    await paymentRef.set({
      uid,
      cryptoAddress,
      amountExpected,
      currency,
      network,
      transactionHash: '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      confirmedAt: null,
    });
    console.log(`✅ تم إنشاء طلب الدفع: ${paymentId}`);
  } else {
    console.log(`ℹ️ الدفع ${paymentId} موجود بالفعل، لم يتم التعديل`);
  }
}

// 🏁 مثال للتشغيل
(async () => {
  await addUserIfNotExists('abc123', 'Saeed Alshammari', 'saeed@example.com');
  await addPlanIfNotExists('economy', 'Economy Class', 10, 30, ['Basic Mining', 'Limited Staking']);
  await addPaymentIfNotExists('payment_001', 'abc123', '0xYourPolygonWallet', 10, 'USDT', 'Polygon');
})();
