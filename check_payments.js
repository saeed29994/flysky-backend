const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔑 ضع مفتاح BscScan أو PolygonScan هنا
const API_KEY = 'FE7XQ52YUAMH9XZ6ZPFTMDMTW5VQX72P6U';

async function checkPendingPayments() {
  const paymentsSnapshot = await db.collection('payments').where('status', '==', 'pending').get();

  if (paymentsSnapshot.empty) {
    console.log('ℹ️ لا توجد دفعات قيد الانتظار.');
    return;
  }

  for (const doc of paymentsSnapshot.docs) {
    const data = doc.data();

    console.log(`🔍 التحقق من الدفع ${doc.id} للمستخدم ${data.uid}...`);

    try {
      const txHash = data.transactionHash;
      if (!txHash) {
        console.log(`⚠️ لا يوجد transactionHash لهذا الدفع، يتم تخطيه.`);
        continue;
      }

      // استعلام BscScan (أو PolygonScan)
      const response = await axios.get(`https://api.bscscan.com/api`, {
        params: {
          module: 'transaction',
          action: 'gettxreceiptstatus',
          txhash: txHash,
          apikey: API_KEY,
        },
      });

      const status = response.data.result?.status;

      if (status === '1') {
        await doc.ref.update({
          status: 'confirmed',
          confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ تم تأكيد الدفع ${doc.id}`);
      } else {
        console.log(`⏳ الدفع ${doc.id} لم يتم تأكيده بعد.`);
      }
    } catch (error) {
      console.error(`❌ خطأ في التحقق من ${doc.id}:`, error.message);
    }
  }
}

// 🏁 تشغيل السكربت
(async () => {
  await checkPendingPayments();
})();
