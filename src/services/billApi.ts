import { 
  BillerCategory, 
  BillerItem, 
  BillerMetadata, 
  BillRequestData, 
  RechargePlan, 
  BillTransactionRecord, 
  BillReceiptData 
} from '../types';

export async function fetchBillCategories(): Promise<BillerCategory[]> {
  try {
    const res = await fetch('/api/bills/categories');
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching bill categories:', err);
    return [];
  }
}

export async function fetchBillers(category: string): Promise<BillerItem[]> {
  try {
    const res = await fetch(`/api/bills/billers?category=${category}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching billers:', err);
    return [];
  }
}

export async function fetchBillerMetadata(billerId: string): Promise<BillerMetadata | null> {
  try {
    const res = await fetch(`/api/bills/billers/${billerId}/metadata`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching biller metadata:', err);
    return null;
  }
}

export async function requestBillDetails(billerId: string, customerParams: Record<string, string>): Promise<BillRequestData | null> {
  try {
    const res = await fetch('/api/bills/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billerId, customerParams })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error requesting bill details:', err);
    return null;
  }
}

export async function fetchRechargePlans(billerId: string): Promise<RechargePlan[]> {
  try {
    const res = await fetch(`/api/bills/billers/${billerId}/plans`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching recharge plans:', err);
    return [];
  }
}

export async function createPaymentOrder(payload: {
  amount: number;
  category: string;
  billerId: string;
  billerName: string;
  customerIdentifier: string;
  billRequestId?: string;
}) {
  try {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error creating payment order:', err);
    return null;
  }
}

export async function verifyPayment(payload: {
  internalOrderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
  paymentMethod?: string;
  transactionId?: string;
}): Promise<BillTransactionRecord | null> {
  try {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error verifying payment:', err);
    return null;
  }
}

export async function fetchPaymentHistory(filters: {
  category?: string;
  paymentStatus?: string;
  billStatus?: string;
  search?: string;
} = {}): Promise<BillTransactionRecord[]> {
  try {
    const query = new URLSearchParams(filters as any).toString();
    const res = await fetch(`/api/payments/history?${query}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Error fetching payment history:', err);
    return [];
  }
}

export async function fetchTransactionReceipt(id: string): Promise<BillReceiptData | null> {
  try {
    const res = await fetch(`/api/payments/receipt/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Error fetching transaction receipt:', err);
    return null;
  }
}

export function loadRazorpayCheckoutSdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
