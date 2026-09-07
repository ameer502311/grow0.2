import mongoose from 'mongoose';

const paymentOrderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  internalOrderId: { type: String, required: true, unique: true, index: true },
  provider: { type: String, default: 'RAZORPAY' },
  providerOrderId: { type: String, default: null },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  convenienceFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['CREATED', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'CREATED' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

paymentOrderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.PaymentOrder || mongoose.model('PaymentOrder', paymentOrderSchema);
