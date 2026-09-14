// Abstract ExternalBrokerProvider Contract

export class ExternalBrokerProvider {
  async connectAccount(params) {
    throw new Error('Method connectAccount() must be implemented');
  }

  async syncHoldings(params) {
    throw new Error('Method syncHoldings() must be implemented');
  }

  async disconnectAccount(params) {
    throw new Error('Method disconnectAccount() must be implemented');
  }
}
