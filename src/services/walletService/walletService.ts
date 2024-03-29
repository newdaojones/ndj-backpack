import {NetworkName} from '@app/constants/enums';
import {ENSInfo} from '@app/models/ensInfo';
import {ITransaction} from '@app/models/transaction';
import {Token} from '@app/models/coinTypes';
import {WalletItem} from '@app/models/walletsTypes';
const bip39 = require('bip39');

abstract class WalletService {
  network: NetworkName;

  private static services: Map<string, WalletService> = new Map();

  private static serviceArray: WalletService[] = [];

  constructor(network: NetworkName) {
    this.network = network;
  }

  protected static add(service: WalletService): void {
    if (WalletService.services.has(service.network)) {
      WalletService.services.set(service.network, service);
      const index = WalletService.serviceArray.findIndex(
        w => w.network === service.network,
      );

      if (index > -1) {
        WalletService.serviceArray[index] = service;
      }
    } else {
      WalletService.serviceArray.push(service);
      WalletService.services.set(service.network, service);
    }
  }

  protected static clean() {
    WalletService.services = new Map();
    WalletService.serviceArray = [];
  }

  static get(network: NetworkName) {
    return this.services.get(network);
  }

  static getServiceByNetwork(network: NetworkName) {
    return this.serviceArray.find(service => service.network === network);
  }

  static isValidMnemonic = (phrase: string) => {
    if (!phrase || typeof phrase !== 'string') {
      return false;
    }

    if (phrase.trim().split(/\s+/g).length < 12) {
      return false;
    }

    return bip39.validateMnemonic(phrase);
  };

  static async createWallets(
    mnemonic: string,
    network?: NetworkName,
  ): Promise<WalletItem[]> {
    if (!this.isValidMnemonic(mnemonic)) {
      throw new Error(`Invalid mnemonic phrase: ${mnemonic}`);
    }

    if (network) {
      const service = this.getServiceByNetwork(network);

      if (!service) {
        throw new Error(`Can not find service for ${network}`);
      }

      const keys = await service.generateKeys(mnemonic);

      return [
        new WalletItem(
          network,
          keys.liveAddress,
          keys.testAddress,
          keys.privateKey,
          keys.ensInfo,
        ),
      ];
    }

    const wallets: WalletItem[] = [];

    for (const service of this.serviceArray) {
      const keys = await service.generateKeys(mnemonic);
      wallets.push(
        new WalletItem(
          service.network,
          keys.liveAddress,
          keys.testAddress,
          keys.privateKey,
          keys.ensInfo,
        ),
      );
    }

    return wallets;
  }

  static getBalanceOf(network: NetworkName, account: string, address?: string) {
    const service = this.getServiceByNetwork(network);

    if (!service) {
      throw new Error(`Can't get service for ${network}`);
    }

    return service.getBalance(account, address);
  }

  static transfer(
    privateKey: string,
    network: NetworkName,
    toAccount: string,
    amount: number,
    token: Token,
    sendMax?: boolean,
  ) {
    const service = this.getServiceByNetwork(network);

    if (!service) {
      throw new Error(`Can't get service for ${network}`);
    }

    return service.transfer(privateKey, toAccount, amount, token, sendMax);
  }

  static sendTransaction(
    privateKey: string,
    network: NetworkName,
    tx: any,
    waitReceipt = true,
  ) {
    const service = this.getServiceByNetwork(network);

    if (!service) {
      throw new Error(`Can't get service for ${network}`);
    }

    return service.sendTransaction(privateKey, tx, waitReceipt);
  }

  static getTransactions(
    network: NetworkName,
    address: string,
    contractAddress: string | undefined,
    page: number,
    limit: number,
  ) {
    const service = this.getServiceByNetwork(network);

    if (!service) {
      throw new Error(`Can't get service for ${network}`);
    }

    return service.getTransactions(address, contractAddress, page, limit);
  }

  static getENSInfo(network: NetworkName, address: string) {
    const service = this.getServiceByNetwork(network);

    if (!service) {
      throw new Error(`Can't get service for ${network}`);
    }

    return service.getENSInfo(address);
  }

  static switchNetwork(chain: 'mainnet' | 'testnet') {
    for (const service of this.serviceArray) {
      service.switchNetwork(chain);
    }
  }

  abstract generateKeys(mnemonic: string): Promise<{
    liveAddress: string;
    testAddress: string;
    privateKey: string;
    ensInfo?: ENSInfo | null;
  }>;

  abstract getBalance(account: string, address?: string): Promise<number>;
  abstract getTransactions(
    account: string,
    contractAddress: string | undefined,
    page: number,
    limit: number,
  ): Promise<ITransaction[]>;
  abstract transfer(
    privateKey: string,
    toAccount: string,
    amount: number,
    token: Token,
    sendMax?: boolean,
  ): Promise<{transaction: any; fee: number}>;

  abstract sendTransaction(
    privateKey: string,
    tx: any,
    waitReceipt?: boolean,
  ): Promise<any>;
  abstract sign(privateKey: string, message: string): Promise<any>;
  abstract signTypedData(
    privateKey: string,
    domain: any,
    types: any,
    data: any,
  ): Promise<any>;
  abstract signTransaction(privateKey: string, data: any): Promise<any>;
  abstract getENSInfo(address: string): Promise<ENSInfo | null | undefined>;
  abstract switchNetwork(chain: 'mainnet' | 'testnet'): void;

  abstract getEstimate(tx: any): Promise<{
    gasPrice: number;
    gasLimit: number;
  }>;
}

export default WalletService;
