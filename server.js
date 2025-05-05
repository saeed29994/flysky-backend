const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: '*', // ⚠️ لاحقًا ضع نطاق موقعك فقط للأمان
}));

const PORT = 3001;

app.post('/create-payment', async (req, res) => {
  const { uid, amountUSD, planId, payCurrency } = req.body;

  if (!uid || !amountUSD || !planId || !payCurrency) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const paymentId = `pay_${Date.now()}`;
    const cryptoAddress = '0xYourCryptoWalletAddress'; // ضع هنا عنوانك الحقيقي

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

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
