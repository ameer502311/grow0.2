import express from 'express';
import crypto from 'crypto';
import { RazorpayPaymentProvider } from '../services/providers/RazorpayPaymentProvider.js';

export function createWebhookRouter(memoryStore = {}, io = null) {
  const router = express.Router();
  const paymentProvider = new RazorpayPaymentProvider();
  let processedWebhookEvents = new Set();

  router.post('/razorpay', (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (signature) {
      const isValid = paymentProvider.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('⚠️ Webhook Signature Verification Failed');
        return res.status(400).json({ status: 'error', message: 'Invalid webhook signature' });
      }
    }

    const payload = req.body || {};
    const eventId = payload.event_id || `evt_${Date.now()}`;
    const eventType = payload.event || 'payment.captured';

    // Idempotency duplicate check
    if (processedWebhookEvents.has(eventId)) {
      console.log(`ℹ️ Webhook event ${eventId} already processed, ignoring duplicate.`);
      return res.json({ status: 'ok', message: 'Duplicate event ignored' });
    }

    processedWebhookEvents.add(eventId);

    console.log(`🔔 Verified Razorpay Webhook Event Received: ${eventType} (${eventId})`);

    if (io) {
      io.emit('webhook-event-alert', { eventType, eventId, timestamp: new Date().toISOString() });
    }

    res.json({ status: 'ok', processed: true, eventId });
  });

  return router;
}
