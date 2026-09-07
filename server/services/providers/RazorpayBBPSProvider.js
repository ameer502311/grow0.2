import { BillPaymentProvider } from './BillPaymentProvider.js';

export class RazorpayBBPSProvider extends BillPaymentProvider {
  constructor() {
    super();
    this.providerName = 'RAZORPAY_BBPS';
  }

  async getAvailableCategories() {
    return [
      { id: 'electricity', name: 'Electricity / EB', icon: 'Zap', supported: true, description: 'Pay State Electricity Board Bills' },
      { id: 'water', name: 'Water Supply', icon: 'Droplet', supported: true, description: 'Municipal Water Board Bills' },
      { id: 'gas', name: 'Piped Gas / Cylinder', icon: 'Flame', supported: true, description: 'Piped Gas & LPG Cylinder Booking' },
      { id: 'broadband', name: 'Broadband / WiFi', icon: 'Wifi', supported: true, description: 'Broadband Landline & Fiber Bills' },
      { id: 'mobile_recharge', name: 'Mobile Prepaid', icon: 'Smartphone', supported: true, description: 'Prepaid Mobile Top-up & Data Packs' },
      { id: 'mobile_postpaid', name: 'Mobile Postpaid', icon: 'PhoneCall', supported: true, description: 'Postpaid Mobile Monthly Bills' },
      { id: 'dth', name: 'DTH / Cable TV', icon: 'Tv', supported: true, description: 'Satellite DTH Recharges' },
      { id: 'fastag', name: 'FASTag Recharge', icon: 'Car', supported: true, description: 'National Highway Toll Pass Recharge' },
      { id: 'insurance', name: 'Insurance Premium', icon: 'ShieldCheck', supported: true, description: 'Life & General Insurance Premiums' },
      { id: 'loan_emi', name: 'Loan EMI Payment', icon: 'CreditCard', supported: true, description: 'NBFC & Bank Loan EMIs' }
    ];
  }

  async getAvailableBillers(category) {
    const billerDatabase = {
      electricity: [
        { id: 'BESCOM', name: 'BESCOM - Bengaluru Electricity', code: 'BESCOM_KA' },
        { id: 'TNEB', name: 'TNEB - Tamil Nadu Electricity Board', code: 'TNEB_TN' },
        { id: 'MSEDCL', name: 'Mahavitaran MSEDCL - Maharashtra', code: 'MSEDCL_MH' },
        { id: 'UPPCL', name: 'UPPCL - Uttar Pradesh Power Urban', code: 'UPPCL_UP' },
        { id: 'BSES_RAJDHANI', name: 'BSES Rajdhani Power - Delhi', code: 'BSES_DL' }
      ],
      water: [
        { id: 'BWSSB', name: 'BWSSB - Bengaluru Water Supply', code: 'BWSSB_KA' },
        { id: 'DJB', name: 'Delhi Jal Board', code: 'DJB_DL' },
        { id: 'MCGM', name: 'MCGM Water - Mumbai Municipal', code: 'MCGM_MH' }
      ],
      gas: [
        { id: 'IGL', name: 'Indraprastha Gas Limited (IGL)', code: 'IGL_DL' },
        { id: 'MGL', name: 'Mahanagar Gas Limited (MGL)', code: 'MGL_MH' },
        { id: 'HP_GAS', name: 'HP Gas LPG Cylinder Booking', code: 'HP_GAS_IND' },
        { id: 'INDANE', name: 'Indane Oil LPG Cylinder', code: 'INDANE_IND' }
      ],
      broadband: [
        { id: 'AIRTEL_BB', name: 'Airtel Broadband Fiber', code: 'AIRTEL_BB' },
        { id: 'JIO_FIBER', name: 'JioFiber Postpaid', code: 'JIO_FIBER' },
        { id: 'ACT_FIBER', name: 'ACT Fibernet Broadband', code: 'ACT_FIBER' },
        { id: 'TATA_PLAY_BB', name: 'Tata Play Fiber', code: 'TATA_FIBER' }
      ],
      mobile_recharge: [
        { id: 'JIO_RECHARGE', name: 'Reliance Jio Prepaid', code: 'JIO_PRE' },
        { id: 'AIRTEL_RECHARGE', name: 'Airtel Prepaid Mobile', code: 'AIRTEL_PRE' },
        { id: 'VI_RECHARGE', name: 'Vi (Vodafone Idea) Prepaid', code: 'VI_PRE' },
        { id: 'BSNL_RECHARGE', name: 'BSNL Prepaid Top-up', code: 'BSNL_PRE' }
      ],
      mobile_postpaid: [
        { id: 'AIRTEL_POST', name: 'Airtel Postpaid Bill', code: 'AIRTEL_POST' },
        { id: 'JIO_POST', name: 'Jio Postpaid Bill', code: 'JIO_POST' },
        { id: 'VI_POST', name: 'Vi Postpaid Bill', code: 'VI_POST' }
      ],
      dth: [
        { id: 'TATA_PLAY', name: 'Tata Play (Formerly Tata Sky)', code: 'TATA_DTH' },
        { id: 'AIRTEL_DTH', name: 'Airtel Digital TV DTH', code: 'AIRTEL_DTH' },
        { id: 'DISH_TV', name: 'Dish TV India', code: 'DISH_DTH' },
        { id: 'SUN_DIRECT', name: 'Sun Direct DTH', code: 'SUN_DTH' }
      ],
      fastag: [
        { id: 'NHAI_FASTAG', name: 'ICICI Bank FASTag', code: 'ICICI_FASTAG' },
        { id: 'PAYTM_FASTAG', name: 'HDFC Bank FASTag', code: 'HDFC_FASTAG' },
        { id: 'SBI_FASTAG', name: 'State Bank of India FASTag', code: 'SBI_FASTAG' }
      ],
      insurance: [
        { id: 'LIC_INDIA', name: 'Life Insurance Corporation (LIC)', code: 'LIC_IND' },
        { id: 'HDFC_LIFE', name: 'HDFC Life Insurance', code: 'HDFC_LIFE' },
        { id: 'ICICI_PRU', name: 'ICICI Prudential Life', code: 'ICICI_PRU' }
      ],
      loan_emi: [
        { id: 'BAJAJ_FINSERV', name: 'Bajaj Finance EMI', code: 'BAJAJ_FIN' },
        { id: 'HDB_FINANCE', name: 'HDB Financial Services', code: 'HDB_FIN' },
        { id: 'MUTHOOT_FIN', name: 'Muthoot Finance Gold Loan', code: 'MUTHOOT_FIN' }
      ]
    };

    return billerDatabase[category] || [
      { id: `${category.toUpperCase()}_DEFAULT`, name: `Standard ${category} Service Provider`, code: 'GENERIC' }
    ];
  }

  async getBillerMetadata(billerId) {
    // Return dynamic normalized parameter requirements for forms
    const metadataRules = {
      BESCOM: {
        billerId: 'BESCOM',
        billerName: 'BESCOM - Bengaluru Electricity',
        fetchOption: 'FETCH_REQUIRED',
        fields: [
          { name: 'consumerNumber', label: '10-Digit Account ID / Consumer No', type: 'text', required: true, minLength: 10, maxLength: 10, pattern: '^[0-9]{10}$', hint: 'Located on top right of your BESCOM physical bill' }
        ]
      },
      LIC_INDIA: {
        billerId: 'LIC_INDIA',
        billerName: 'LIC India Premium',
        fetchOption: 'FETCH_REQUIRED',
        fields: [
          { name: 'policyNumber', label: '9-Digit Policy Number', type: 'text', required: true, minLength: 9, maxLength: 9, pattern: '^[0-9]{9}$', hint: 'Found on LIC Policy Certificate' },
          { name: 'dob', label: 'Date of Birth (DD/MM/YYYY)', type: 'text', required: true, minLength: 10, maxLength: 10, hint: 'Format: DD/MM/YYYY' }
        ]
      },
      JIO_RECHARGE: {
        billerId: 'JIO_RECHARGE',
        billerName: 'Jio Prepaid Mobile',
        fetchOption: 'PLAN_SELECTION_SUPPORTED',
        fields: [
          { name: 'mobileNumber', label: '10-Digit Mobile Number', type: 'text', required: true, minLength: 10, maxLength: 10, pattern: '^[6-9][0-9]{9}$', hint: 'Registered Jio mobile number' }
        ]
      }
    };

    if (metadataRules[billerId]) return metadataRules[billerId];

    // Generic default parameter structure for any biller
    return {
      billerId,
      billerName: billerId.replace(/_/g, ' '),
      fetchOption: 'FETCH_SUPPORTED',
      fields: [
        { name: 'customerIdentifier', label: 'Consumer Number / Account ID', type: 'text', required: true, minLength: 6, maxLength: 20, hint: 'Found on bill statement or SMS' }
      ]
    };
  }

  async fetchBill({ billerId, customerParams }) {
    // Generate realistic, normalized bill data or mock response for testing
    const paramVal = Object.values(customerParams)[0] || '1029384756';
    const numSeed = Array.from(String(paramVal)).reduce((a, c) => a + c.charCodeAt(0), 0);
    const mockAmount = 450 + (numSeed % 1800);

    const dueDateStr = new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0];

    return {
      billRequestId: `breq_${Math.random().toString(36).substring(2, 10)}`,
      billerId,
      customerName: 'Alex Vance (Verified Subscriber)',
      customerIdentifier: String(paramVal),
      billAmount: mockAmount,
      convenienceFee: 0,
      totalAmount: mockAmount,
      dueDate: dueDateStr,
      billNumber: `BILL-${Math.floor(10000000 + Math.random() * 90000000)}`,
      billPeriod: 'July 2026',
      fetchStatus: 'SUCCESS',
      isMock: true
    };
  }

  async getRechargePlans(billerId) {
    return [
      { id: 'plan-299', name: 'Hero Unlimited 1.5GB/Day', amount: 299, validity: '28 Days', data: '1.5 GB/Day', calling: 'Unlimited Voice', sms: '100 SMS/Day' },
      { id: 'plan-349', name: 'Super Unlimited 2GB/Day', amount: 349, validity: '28 Days', data: '2.0 GB/Day', calling: 'Unlimited Voice', sms: '100 SMS/Day' },
      { id: 'plan-719', name: 'Long Term 1.5GB/Day 84D', amount: 719, validity: '84 Days', data: '1.5 GB/Day', calling: 'Unlimited Voice', sms: '100 SMS/Day' },
      { id: 'plan-19', name: 'Data Booster Topup', amount: 19, validity: 'Active Plan Validity', data: '1.0 GB Total', calling: 'N/A', sms: 'N/A' }
    ];
  }

  async executeBillPayment({ billRequestId, billerId, amount, providerPaymentId, internalOrderId }) {
    return {
      billPaymentId: `bpay_${Math.random().toString(36).substring(2, 10)}`,
      providerReference: `BBPS-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      billerId,
      amount,
      billStatus: 'SUCCESS',
      processedAt: new Date().toISOString()
    };
  }
}
