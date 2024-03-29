import {NetworkName} from '@app/constants/enums';
import {ENSInfo} from '@app/models/ensInfo';
import {ITransaction} from '@app/models/transaction';
import {Token as BToken} from '@app/models/coinTypes';

import WalletService from './walletService';
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import * as ed25519 from 'ed25519-hd-key';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import * as bip39 from 'bip39';
import {AxiosInstance} from '@app/apis/axios';
import SolanaWallet, {SolanaSignTransaction} from 'solana-wallet';
import NP from 'number-precision';

const solscanApi = 'https://public-api.solscan.io';
const solscanDevApi = 'https://public-api-test.solscan.io';

const provider =
  'https://solana-mainnet.g.alchemy.com/v2/t2Dr1PBNMZlmEig8IdHcI_E5km9fTVny';
const providerDev =
  'https://solana-devnet.g.alchemy.com/v2/ixygs7hUe-2zBtbEXjuEWs-kylEe92oG';

export default class SolanaService extends WalletService {
  chain: 'mainnet' | 'testnet' = 'mainnet';
  decimals = 9;
  connection: Connection;
  constructor() {
    super(NetworkName.solana);
    WalletService.add(this);
    this.connection = new Connection(provider, 'confirmed');
  }

  get apiURI() {
    if (this.chain === 'testnet') {
      return solscanDevApi;
    }

    return solscanApi;
  }

  switchNetwork(chain: 'mainnet' | 'testnet') {
    this.chain = chain;
    this.connection = new Connection(
      chain === 'mainnet' ? provider : providerDev,
      'confirmed',
    );
  }

  async generateKeys(mnemonic: string) {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const derivedSeed = ed25519.derivePath(
      "m/44'/501'/0'",
      seed.toString('hex'),
    ).key;
    const keypair = Keypair.fromSeed(derivedSeed);

    return {
      testAddress: keypair.publicKey.toString(),
      liveAddress: keypair.publicKey.toString(),
      privateKey: keypair.secretKey.toString(),
    };
  }

  async getBalance(account: string, address?: string) {
    // Todo: need to get it by once
    if (!address) {
      const balance = await this.connection.getBalance(new PublicKey(account));

      return this.normalizeAmount(balance, this.decimals);
    }

    const res = await this.connection.getParsedTokenAccountsByOwner(
      new PublicKey(account),
      {
        programId: TOKEN_PROGRAM_ID,
      },
    );

    const data = res.value.find(
      item => item.account.data.parsed?.info?.mint === address,
    )?.account?.data?.parsed?.info?.tokenAmount;

    if (data) {
      return this.normalizeAmount(data.amount, data.decimals);
    }

    return 0;
  }

  async transfer(
    privateKey: string,
    toAccount: string,
    amount: number,
    token: BToken,
    sendMax?: boolean,
  ) {
    if (token.contractAddress) {
      return this.transferCustomToken(privateKey, toAccount, amount, token);
    }

    const key = privateKey?.split(',').map(v => Number(v)) || [];
    const wallet = Keypair.fromSecretKey(new Uint8Array(key));

    // const airdropSignature = await this.connection.requestAirdrop(
    //   wallet.publicKey,
    //   LAMPORTS_PER_SOL, // 10000000 Lamports in 1 SOL
    // );

    // await this.connection.confirmTransaction(airdropSignature);
    // let nonceAccount = Keypair.generate();

    const blockHashInfo = await this.connection.getRecentBlockhashAndContext();
    let transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: blockHashInfo.value.blockhash,
    });

    const fee =
      blockHashInfo.value.feeCalculator.lamportsPerSignature / LAMPORTS_PER_SOL;

    let sendAmount = amount;

    if (sendMax) {
      sendAmount = NP.strip(NP.minus(sendAmount, fee));
    }

    const total = NP.strip(NP.plus(sendAmount, fee));
    const balance = await this.getBalance(wallet.publicKey.toString());

    if (total > balance) {
      throw new Error(
        `Insufficient funds for fee. You need at least ${total} ${token.symbol.toUpperCase()} to make this transaction. You have ${balance} ${token.symbol.toUpperCase()} on your account.`,
      );
    }

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(toAccount),
        lamports: LAMPORTS_PER_SOL * sendAmount,
      }),
    );

    return {
      transaction,
      fee,
    };
  }

  async transferCustomToken(
    privateKey: string,
    toAccount: string,
    amount: number,
    token: BToken,
  ) {
    const key = privateKey?.split(',').map(v => Number(v)) || [];
    const wallet = Keypair.fromSecretKey(new Uint8Array(key));
    const tokenMint = new PublicKey(token.contractAddress);
    const myToken = new Token(
      this.connection,
      tokenMint,
      TOKEN_PROGRAM_ID,
      wallet,
    );

    const mintInfo = await myToken.getMintInfo();

    const fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
      wallet.publicKey,
    );
    const toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
      new PublicKey(toAccount),
    );

    const blockHashInfo = await this.connection.getRecentBlockhashAndContext();
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: blockHashInfo.value.blockhash,
    });

    const fee =
      blockHashInfo.value.feeCalculator.lamportsPerSignature / LAMPORTS_PER_SOL;

    const balance = await this.getBalance(
      wallet.publicKey.toString(),
      token.contractAddress,
    );

    if (amount > balance) {
      throw new Error(
        `Insufficient funds. You need at least ${amount} ${token.symbol.toUpperCase()} to make this transaction. You have ${balance} ${token.symbol.toUpperCase()} on your account.`,
      );
    }

    const nativeBalance = await this.getBalance(wallet.publicKey.toString());

    if (fee > nativeBalance) {
      throw new Error(
        `Insufficient funds for fee. You need at least ${fee} SOL to make this transaction. You have ${nativeBalance} SOL on your account.`,
      );
    }

    transaction.add(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        wallet.publicKey,
        [],
        amount * Math.pow(10, mintInfo.decimals),
      ),
    );

    return {
      transaction,
      fee,
    };
  }

  async calcTransferFee(account: string) {
    let nonceAccountData = await this.connection.getNonce(
      new PublicKey(account),
      'confirmed',
    );

    return (
      (nonceAccountData?.feeCalculator.lamportsPerSignature || 0) /
      LAMPORTS_PER_SOL
    );
  }

  normalizeAmount(amount: number | string, decimals: number = 0) {
    return Number(amount) / Math.pow(10, decimals);
  }

  async sendTransaction(privateKey: string, tx: any): Promise<string> {
    const key = privateKey?.split(',').map(v => Number(v)) || [];
    const wallet = Keypair.fromSecretKey(new Uint8Array(key));

    const signature = await sendAndConfirmTransaction(this.connection, tx, [
      wallet,
    ]);

    return signature;
  }

  async sign(privateKey: string, message: string): Promise<any> {
    const key = privateKey?.split(',').map(v => Number(v)) || [];
    const wallet = Keypair.fromSecretKey(new Uint8Array(key));
    const signature = nacl.sign.detached(
      bs58.decode(message),
      wallet.secretKey,
    );
    const bs58Signature = bs58.encode(signature);

    return {signature: bs58Signature};
  }

  async signTypedData(
    privateKey: string,
    domain: any,
    types: any,
    data: any,
  ): Promise<any> {
    const key = privateKey?.split(',').map(v => Number(v)) || [];
    const wallet = Keypair.fromSecretKey(new Uint8Array(key));
    console.log(wallet, domain, types, data);
  }

  async signTransaction(
    privateKey: string,
    data: {
      feePayer: SolanaSignTransaction['feePayer'];
      recentBlockhash: SolanaSignTransaction['recentBlockhash'];
      instructions: SolanaSignTransaction['instructions'];
      partialSignatures?: SolanaSignTransaction['partialSignatures'];
    },
  ): Promise<string> {
    const key = privateKey?.split(',').map(v => Number(v)) || [];
    const wallet = Keypair.fromSecretKey(new Uint8Array(key));

    // @ts-ignore
    const solanaWallet = new SolanaWallet(wallet.secretKey);

    const {signature} = await solanaWallet.signTransaction(data.feePayer, {
      feePayer: data.feePayer,
      instructions: data.instructions,
      recentBlockhash: data.recentBlockhash,
      partialSignatures: data.partialSignatures ?? [],
    });

    return signature;
  }

  async getTransactions(
    address: string,
    contractAddress: string | undefined,
    page: number,
    limit: number,
  ) {
    if (this.chain === 'testnet') {
      return [];
    }

    const params = {
      account: address,
      limit,
      offset: (page - 1) * limit,
    };

    if (contractAddress) {
      return this.getCustomTokenTransactions(
        address,
        contractAddress,
        page,
        limit,
      );
    }

    const res = await AxiosInstance.get(`${this.apiURI}/account/solTransfers`, {
      params,
    });

    const data = res.data.data;

    if (!data || !data.length) {
      return [];
    }

    const transactions: ITransaction[] = [];

    data.forEach((item: any) => {
      transactions.push({
        to: item.dst,
        from: item.src,
        type: item.src === address ? 'out' : 'in',
        fee: item.fee / Math.pow(10, item.decimals),
        value: item.lamport / Math.pow(10, item.decimals),
        timeStamp: item.blockTime,
        status: item.status,
        hash: item.txHash,
        nonce: item.nonce,
        url: `https://solscan.io/tx/${item.txHash}${
          this.chain === 'testnet' ? '?cluster=devnet' : ''
        }`,
      });
    });

    return transactions;
  }

  async getCustomTokenTransactions(
    address: string,
    contractAddress: string,
    page: number,
    limit: number,
  ) {
    const params = {
      account: address,
      limit,
      offset: (page - 1) * limit,
      cluster: 'devnet',
    };

    const res = await AxiosInstance.get(`${this.apiURI}/account/splTransfers`, {
      params,
    });

    const data = res.data.data;
    const result = data.filter(
      (item: any) => item.tokenAddress === contractAddress,
    );
    const transactions: ITransaction[] = [];

    result.forEach((item: any) => {
      transactions.push({
        to: item.changeAmount >= 0 ? item.owner : item.address,
        from: item.changeAmount < 0 ? item.owner : item.address,
        type: item.changeAmount >= 0 ? 'in' : 'out',
        fee: item.fee / LAMPORTS_PER_SOL,
        value:
          Number(item.balance.amount) / Math.pow(10, item.balance.decimals),
        timeStamp: item.blockTime,
        status: item.status,
        hash: item.txHash,
        nonce: item.nonce,
        url: `https://solscan.io/tx/${item.txHash}${
          this.chain === 'testnet' ? '?cluster=devnet' : ''
        }`,
      });
    });

    return transactions;
  }

  async getENSInfo(address: string): Promise<ENSInfo | null | undefined> {
    return {
      name: address,
    };
  }

  async getEstimate(tx: any) {
    console.log(tx);
    return {
      gasPrice: 0,
      gasLimit: 0,
    };
  }
}
