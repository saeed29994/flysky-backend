const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

// 🛡 تحميل بيانات الخدمة من متغير البيئة
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

// 🏗 تهيئة Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

// 🌍 تفعيل CORS (⚠️ لاحقًا ضع origin = نطاق موقعك فقط)
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// ✅ أخذ المنفذ من Render أو افتراضيًا 3001
const PORT = process.env.PORT || 3001;

// 🏠 مسار الجذر للاختبار من المتصفح
app.get('/', (req, res) => {
  res.send('✅ FlySky backend is running!');
});

// 📦 إنشاء طلب دفع
app.post('/create-payment', async (req, res) => {
  const { uid, amountUSD, planId, payCurrency } = req.body;

  if (!uid || !amountUSD || !planId || !payCurrency) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const paymentId = `pay_${Date.now()}`;

    // ⚠️ ضع هنا عنوان محفظتك الحقيقي بدل المثال
    const cryptoAddress = '0xYourRealCryptoWalletAddress';

    await db.collection('payments').doc(paymentId).set({
      uid,
      amountExpected: amountUSD,
      currency: payCurrency,
      planId,
      cryptoAddress,
      transactionHash: '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      confirmedAt: null,
    });

    const paymentUrl = `https://payment.mock/checkout/${paymentId}`; // رابط دفع وهمي للتجربة

    res.json({ payment_url: paymentUrl, paymentId });
    console.log(`✅ Created payment ${paymentId} for user ${uid}`);
  } catch (error) {
    console.error('❌ Failed to create payment:', error);
    res.status(500).json({ error: 'Failed to create payment.' });
  }
});

// 🚀 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
