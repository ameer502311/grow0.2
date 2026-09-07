// Abstract BillPaymentProvider Contract

export class BillPaymentProvider {
  async getAvailableCategories() {
    throw new Error('Method getAvailableCategories() must be implemented');
  }

  async getAvailableBillers(category) {
    throw new Error('Method getAvailableBillers() must be implemented');
  }

  async getBillerMetadata(billerId) {
    throw new Error('Method getBillerMetadata() must be implemented');
  }

  async fetchBill(params) {
    throw new Error('Method fetchBill() must be implemented');
  }

  async getRechargePlans(billerId) {
    throw new Error('Method getRechargePlans() must be implemented');
  }

  async executeBillPayment(params) {
    throw new Error('Method executeBillPayment() must be implemented');
  }
}
