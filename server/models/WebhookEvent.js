import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
  provider: { type: String, default: 'RAZORPAY' },
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, required: true },
  payloadHash: { type: String, required: true },
  processed: { type: Boolean, default: false },
  processedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);
