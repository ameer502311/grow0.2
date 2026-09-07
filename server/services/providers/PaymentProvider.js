// Abstract PaymentProvider Contract

export class PaymentProvider {
  async createPaymentOrder(params) {
    throw new Error('Method createPaymentOrder() must be implemented');
  }

  async verifyPaymentSignature(params) {
    throw new Error('Method verifyPaymentSignature() must be implemented');
  }

  async refund(params) {
    throw new Error('Method refund() must be implemented');
  }
}
