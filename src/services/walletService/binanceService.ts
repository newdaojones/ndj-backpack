import {NetworkName} from '@app/constants';
import axios, {AxiosInstance} from 'axios';
import {BncClient, Transaction, crypto} from '@binance-chain/javascript-sdk';
import {AminoPrefix} from '@binance-chain/javascript-sdk/lib/types';
import {BASENUMBER} from '@binance-chain/javascript-sdk/lib/utils';
import BigNumber from 'bignumber.js';

import WalletService from './walletService';
import {ENSInfo, ITransaction} from '@app/models';
import moment from 'moment-timezone';

export default class BinanceService extends WalletService {
  baseURL = 'https://dex.binance.org';
  net = 'mainnet';

  // baseURL = 'https://testnet-dex.binance.org';
  // net = 'mainnet';
  httpClient: AxiosInstance;
  bnbClient: BncClient;

  constructor() {
    super(NetworkName.binance);
    WalletService.add(this);

    this.bnbClient = new BncClient(this.baseURL);
    this.bnbClient.chooseNetwork(this.net as 'testnet' | 'mainnet');
    this.httpClient = axios.create({
      baseURL: this.baseURL + '/api/v1',
    });
    this.bnbClient.initChain();
  }

  async generateKeys(mnemonic: string) {
    const {privateKey, address} =
      this.bnbClient.recoverAccountFromMnemonic(mnemonic);

    return {
      privateKey,
      address,
    };
  }

  async getBalance(account: string, address?: string) {
    // Todo: need to get it by once
    const res = await this.bnbClient.getBalance(account);
    const symbol = address || 'BNB';
    const data = res.find((item: any) => item.symbol === symbol);

    if (!data) {
      return 0;
    }

    return this.balance(data);
  }

  async balance(data: {
    free: string;
    frozen: string;
    locked: string;
    symbol: string;
  }) {
    return (
      Number(data.free || 0) +
      Number(data.frozen || 0) +
      Number(data.locked || 0)
    );
  }

  async transfer(
    privateKey: string,
    toAccount: string,
    amount: number,
    asset?: string,
  ): Promise<{transaction: any; fee: number}> {
    this.bnbClient.setPrivateKey(privateKey);
    const fromAddress = this.bnbClient.getClientKeyAddress(); // sender address string (e.g. bnb1...)

    if (!fromAddress) {
      throw new Error('Please init wallet');
    }

    const amountBig = new BigNumber(amount);
    const amountString = Number(amountBig.multipliedBy(BASENUMBER).toString());
    // const res = await this.httpClient.get(`/account/${fromAddress}/sequence`);
    // const sequence = res.data.sequence || 0;
    const sequence = 0;

    const accCode = crypto.decodeAddress(fromAddress);
    const toAccCode = crypto.decodeAddress(toAccount);
    const coin = {
      denom: asset || 'BNB',
      amount: amountString,
    };

    const msg = {
      inputs: [
        {
          address: accCode,
          coins: [coin],
        },
      ],
      outputs: [
        {
          address: toAccCode,
          coins: [coin],
        },
      ],
      aminoPrefix: AminoPrefix.MsgSend,
    };

    const signMsg = {
      inputs: [
        {
          address: fromAddress,
          coins: [coin],
        },
      ],
      outputs: [
        {
          address: toAccount,
          coins: [coin],
        },
      ],
    };

    const tx = new Transaction({
      accountNumber: this.bnbClient.account_number as number,
      chainId: this.bnbClient.chainId as string,
      msg,
      memo: '',
      sequence,
      source: this.bnbClient._source,
    });

    const signedTx = await this.bnbClient._signingDelegate(tx, signMsg);

    return {
      transaction: signedTx,
      fee: 0.000075,
    };
  }

  async sendTransaction(privateKey: string, tx: any): Promise<void> {
    this.bnbClient.setPrivateKey(privateKey);

    const res = await this.bnbClient.sendTransaction(tx, false);

    if (res.status !== 200) {
      throw new Error('Failed send transaction');
    }
  }

  async sign(privateKey: string, message: any) {
    this.bnbClient.setPrivateKey(privateKey);
    console.log(message);
  }
  async signTransaction(privateKey: string, data: any): Promise<any> {
    this.bnbClient.setPrivateKey(privateKey);
    console.log(data);
  }

  async getTransactions(
    account: string,
    contractAddress: string,
    page: number,
    limit: number,
  ): Promise<ITransaction[]> {
    const endTime = new Date().getTime();
    const startTime = endTime - 90 * 24 * 60 * 60 * 1000; // 3 months is the max range
    const params = {
      address: account,
      txAsset: contractAddress,
      startTime: startTime,
      endTime: endTime,
      offset: (page - 1) * limit,
      limit,
      txType: 'TRANSFER',
    };
    const {data} = await this.httpClient.get('/transactions', {
      params,
    });

    const result = data?.tx || [];

    if (!result || typeof result === 'string' || !result.length) {
      return [];
    }

    const transactions: ITransaction[] = [];

    result.forEach((item: any) => {
      transactions.push({
        to: item.toAddr,
        from: item.fromAddr,
        type:
          item.fromAddr.toLowerCase() === account.toLowerCase() ? 'out' : 'in',
        fee: +item.txFee,
        timeStamp: moment(item.timeStamp).unix().toString(),
        status: 'success',
        value: +item.value,
        hash: item.txHash,
        nonce: item.nonce,
        url: `https://explorer.binance.org/tx/${item.txHash}`,
      });
    });

    return transactions;
  }
  async getENSInfo(address: string): Promise<ENSInfo | null | undefined> {
    return {
      name: address,
    };
  }
}
