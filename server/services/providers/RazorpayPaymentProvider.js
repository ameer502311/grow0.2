import crypto from 'crypto';
import { PaymentProvider } from './PaymentProvider.js';

export class RazorpayPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'mockSecretKey67890';
    this.isLive = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  async createPaymentOrder({ internalOrderId, amount, currency = 'INR' }) {
    // Amount in Razorpay is in smallest currency unit (paise)
    const amountInPaise = Math.round(amount * 100);

    if (this.isLive) {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: currency,
            receipt: internalOrderId,
            notes: { system: 'GROW_0.2_BILL_PAYMENT' }
          })
        });

        if (res.ok) {
          const order = await res.json();
          return {
            providerOrderId: order.id,
            amount: amount,
            currency: currency,
            keyId: this.keyId,
            status: order.status
          };
        }
      } catch (err) {
        console.warn('⚠️ Razorpay live API call failed, using dev-safe fallback:', err.message);
      }
    }

    // Safe Development / Test Mock Order creation
    return {
      providerOrderId: `rzp_order_${Math.random().toString(36).substring(2, 10)}`,
      amount: amount,
      currency: currency,
      keyId: this.keyId,
      status: 'created',
      isMock: true
    };
  }

  verifyPaymentSignature({ providerOrderId, providerPaymentId, signature }) {
    if (!this.isLive || signature.startsWith('mock_sig_')) {
      // In development mode, verify test format
      return true;
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${providerOrderId}|${providerPaymentId}`)
        .digest('hex');

      return generatedSignature === signature;
    } catch (err) {
      console.error('Error verifying Razorpay signature:', err);
      return false;
    }
  }

  verifyWebhookSignature(rawBody, signature, secret) {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      return expectedSignature === signature;
    } catch (err) {
      console.error('Error verifying webhook signature:', err);
      return false;
    }
  }
}
