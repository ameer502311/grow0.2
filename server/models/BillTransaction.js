import mongoose from 'mongoose';

const billTransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  paymentOrderId: { type: String, required: true, index: true },
  internalOrderId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  billerId: { type: String, required: true },
  billerName: { type: String, required: true },
  customerIdentifier: { type: String, required: true },
  maskedCustomerIdentifier: { type: String, required: true },
  billRequestId: { type: String, default: null },
  billPaymentId: { type: String, default: null },
  provider: { type: String, default: 'RAZORPAY_BBPS' },
  providerReference: { type: String, default: null },
  providerPaymentId: { type: String, default: null },
  amount: { type: Number, required: true },
  convenienceFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { type: String, default: 'UPI' },
  paymentStatus: { 
    type: String, 
    enum: ['CREATED', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'CREATED' 
  },
  billStatus: { 
    type: String, 
    enum: ['NOT_STARTED', 'PROCESSING', 'PENDING', 'SUCCESS', 'FAILED', 'UNKNOWN'],
    default: 'NOT_STARTED' 
  },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  transactionDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

billTransactionSchema.index({ userId: 1, transactionDate: -1 });

export default mongoose.models.BillTransaction || mongoose.model('BillTransaction', billTransactionSchema);
