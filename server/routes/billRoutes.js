import express from 'express';
import { RazorpayPaymentProvider } from '../services/providers/RazorpayPaymentProvider.js';
import { RazorpayBBPSProvider } from '../services/providers/RazorpayBBPSProvider.js';

export function createBillRouter(memoryStore = {}, io = null) {
  const router = express.Router();
  const paymentProvider = new RazorpayPaymentProvider();
  const bbpsProvider = new RazorpayBBPSProvider();

  // In-memory or Database Stores
  let paymentOrdersStore = [];
  let billTransactionsStore = [];

  // GET /api/bills/categories
  router.get('/categories', async (req, res) => {
    try {
      const categories = await bbpsProvider.getAvailableCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/bills/billers
  router.get('/billers', async (req, res) => {
    const { category } = req.query;
    try {
      const billers = await bbpsProvider.getAvailableBillers(category || 'electricity');
      res.json({ success: true, data: billers });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/bills/billers/:billerId/metadata
  router.get('/billers/:billerId/metadata', async (req, res) => {
    try {
      const metadata = await bbpsProvider.getBillerMetadata(req.params.billerId);
      res.json({ success: true, data: metadata });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/bills/request (Fetch Bill details)
  router.post('/request', async (req, res) => {
    const { billerId, customerParams } = req.body;
    try {
      const billData = await bbpsProvider.fetchBill({ billerId, customerParams });
      res.json({ success: true, data: billData });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/bills/billers/:billerId/plans
  router.get('/billers/:billerId/plans', async (req, res) => {
    try {
      const plans = await bbpsProvider.getRechargePlans(req.params.billerId);
      res.json({ success: true, data: plans });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/payments/create-order
  router.post('/create-order', async (req, res) => {
    const { amount, category, billerId, billerName, customerIdentifier, billRequestId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    const internalOrderId = `GROW_ORDER_${Math.floor(10000000 + Math.random() * 90000000)}`;

    try {
      const providerOrder = await paymentProvider.createPaymentOrder({
        internalOrderId,
        amount,
        currency: 'INR'
      });

      const paymentOrderObj = {
        id: `pord-${Date.now()}`,
        userId: 'u-101',
        internalOrderId,
        provider: 'RAZORPAY',
        providerOrderId: providerOrder.providerOrderId,
        amount,
        convenienceFee: 0,
        totalAmount: amount,
        paymentStatus: 'CREATED',
        createdAt: new Date().toISOString()
      };

      paymentOrdersStore.unshift(paymentOrderObj);

      // Mask customer identifier
      const strId = String(customerIdentifier || '100000');
      const maskedId = strId.length > 4 ? `*`.repeat(strId.length - 4) + strId.slice(-4) : strId;

      const idempotencyKey = `idemp_${internalOrderId}_${Date.now()}`;
      const billTxObj = {
        id: `btx-${Date.now()}`,
        userId: 'u-101',
        paymentOrderId: paymentOrderObj.id,
        internalOrderId,
        category: category || 'utility',
        billerId: billerId || 'GENERIC',
        billerName: billerName || 'Utility Provider',
        customerIdentifier: strId,
        maskedCustomerIdentifier: maskedId,
        billRequestId: billRequestId || null,
        billPaymentId: null,
        provider: 'RAZORPAY_BBPS',
        providerReference: null,
        providerPaymentId: null,
        amount,
        convenienceFee: 0,
        totalAmount: amount,
        currency: 'INR',
        paymentMethod: 'UPI',
        paymentStatus: 'CREATED',
        billStatus: 'NOT_STARTED',
        idempotencyKey,
        transactionDate: new Date().toISOString()
      };

      billTransactionsStore.unshift(billTxObj);

      res.json({
        success: true,
        data: {
          internalOrderId,
          providerOrderId: providerOrder.providerOrderId,
          keyId: providerOrder.keyId,
          amount,
          currency: 'INR',
          transactionId: billTxObj.id
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/payments/verify
  router.post('/verify', async (req, res) => {
    const { 
      internalOrderId, 
      providerOrderId, 
      providerPaymentId, 
      signature, 
      paymentMethod,
      transactionId 
    } = req.body;

    const isValid = paymentProvider.verifyPaymentSignature({
      providerOrderId,
      providerPaymentId,
      signature: signature || 'mock_sig'
    });

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature verification' });
    }

    const tx = billTransactionsStore.find(t => t.internalOrderId === internalOrderId || t.id === transactionId);
    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Guard duplicate verification
    if (tx.paymentStatus === 'SUCCESS') {
      return res.json({ success: true, message: 'Transaction already verified', data: tx });
    }

    // Step 1: Update Payment Status to SUCCESS
    tx.paymentStatus = 'SUCCESS';
    tx.providerPaymentId = providerPaymentId || `pay_${Date.now()}`;
    tx.paymentMethod = paymentMethod || 'UPI (Google Pay / PhonePe)';

    // Step 2: Trigger Bill Payment Execution
    tx.billStatus = 'PROCESSING';
    try {
      const billResult = await bbpsProvider.executeBillPayment({
        billRequestId: tx.billRequestId,
        billerId: tx.billerId,
        amount: tx.amount,
        providerPaymentId: tx.providerPaymentId,
        internalOrderId: tx.internalOrderId
      });

      tx.billStatus = billResult.billStatus || 'SUCCESS';
      tx.billPaymentId = billResult.billPaymentId;
      tx.providerReference = billResult.providerReference;

      // Real-time WebSocket event dispatch
      if (io) {
        io.emit('new-bill-payment-alert', tx);
      }

      res.json({ success: true, data: tx });
    } catch (err) {
      tx.billStatus = 'FAILED';
      res.status(500).json({ success: false, error: 'Bill execution failed', data: tx });
    }
  });

  // GET /api/payments/history
  router.get('/history', (req, res) => {
    const { category, paymentStatus, billStatus, search } = req.query;
    let list = [...billTransactionsStore];

    if (category) list = list.filter(t => t.category === category);
    if (paymentStatus) list = list.filter(t => t.paymentStatus === paymentStatus);
    if (billStatus) list = list.filter(t => t.billStatus === billStatus);
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(t => 
        t.billerName.toLowerCase().includes(q) || 
        t.internalOrderId.toLowerCase().includes(q) ||
        t.customerIdentifier.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: list });
  });

  // GET /api/payments/history/:id
  router.get('/history/:id', (req, res) => {
    const tx = billTransactionsStore.find(t => t.id === req.params.id || t.internalOrderId === req.params.id);
    if (!tx) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: tx });
  });

  // GET /api/payments/receipt/:id
  router.get('/receipt/:id', (req, res) => {
    const tx = billTransactionsStore.find(t => t.id === req.params.id || t.internalOrderId === req.params.id);
    if (!tx) return res.status(404).json({ success: false, error: 'Transaction receipt not found' });

    res.json({
      success: true,
      data: {
        appName: 'Grow 0.2 Fintech Platform',
        receiptTitle: 'GROW Official Transaction Record',
        internalOrderId: tx.internalOrderId,
        category: tx.category,
        billerName: tx.billerName,
        maskedCustomerIdentifier: tx.maskedCustomerIdentifier,
        amount: tx.amount,
        convenienceFee: tx.convenienceFee,
        totalAmount: tx.totalAmount,
        currency: tx.currency,
        paymentStatus: tx.paymentStatus,
        billStatus: tx.billStatus,
        providerReference: tx.providerReference || 'N/A',
        providerPaymentId: tx.providerPaymentId || 'N/A',
        transactionDate: tx.transactionDate,
        customerName: 'Alex Vance',
        disclaimer: 'This is a computer-generated transaction record for payments processed via GROW 0.2 Application.'
      }
    });
  });

  return router;
}
