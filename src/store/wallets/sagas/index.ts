import {delay, put, select, takeLatest} from 'redux-saga/effects';
import {
  Action,
  ActionType,
  ENSInfo,
  RootState,
  Wallet,
  WalletItem,
} from '@app/models';
import {addWallet, setLoading, setReadyApp, setWallets} from '../actions';
import {NetworkName} from '@app/constants';
import {WalletService} from '@app/services';
import {wyreService} from '@app/services/wyreService';
import Toast from 'react-native-toast-message';
import {Farcaster} from '@app/services/facasterService';
import {getBaseCoinsRequest} from '@app/store/coins/actions';

function* reload() {
  try {
    yield put(setLoading(true));

    yield delay(1000);
    const state: RootState = yield select();
    const network = state.wallets.network;
    WalletService.switchNetwork(network);
    wyreService.setNetwork(network);

    yield put(setReadyApp());

    const accounts = state.wallets.wallets;
    const wallets: Wallet[] = [...accounts];
    let isRefreshCoins = false;
    for (const account of wallets) {
      const walletItems: WalletItem[] = [];
      for (const wallet of account.wallets) {
        try {
          const ensInfo: ENSInfo = yield WalletService.getENSInfo(
            wallet.network,
            wallet.liveAddress,
          );
          wallet.ensInfo = ensInfo;
        } catch (err) {
          console.log(err);
        }

        const item = new WalletItem(
          wallet.network,
          wallet.liveAddress,
          wallet.testAddress,
          wallet.privateKey,
          wallet.ensInfo,
        );

        item.setIsTestNet(network === 'testnet');

        walletItems.push(item);
      }

      if (!walletItems.find(item => item.network === NetworkName.avalanche)) {
        const avaxWallet: WalletItem[] = yield WalletService.createWallets(
          account.mnemonic,
          NetworkName.avalanche,
        );

        walletItems.push(avaxWallet[0]);

        isRefreshCoins = true;
      }

      const ethWallet = walletItems.find(
        item => item.network === NetworkName.ethereum,
      );

      if (ethWallet) {
        const farcaster: Farcaster = yield Farcaster.init(
          ethWallet?.privateKey,
        );

        account.farcaster = farcaster;
      }

      account.wallets = walletItems;
    }

    if (isRefreshCoins) {
      yield put(getBaseCoinsRequest(true));
    }

    yield put(setWallets(wallets));
  } catch (err: any) {
    Toast.show({
      type: 'error',
      text1: err.message,
    });
  } finally {
    yield put(setLoading(false));
  }
}

function* createWallet({
  payload,
}: Action<{mnemonic: string; name?: string; network?: NetworkName}>) {
  yield put(setLoading(true));
  yield delay(1000);
  try {
    const state: RootState = yield select();

    const accounts = state.wallets.wallets;
    const wallets: WalletItem[] = yield WalletService.createWallets(
      payload.mnemonic,
      payload.network,
    );

    const wallet: Wallet = {
      id: (Math.random() + 1).toString(36).substring(7),
      name: payload.name || `Main Wallet ${accounts.length + 1}`,
      network: payload.network,
      mnemonic: payload.mnemonic,
      wallets,
    };
    yield put(addWallet(wallet));
  } catch (err: any) {
    Toast.show({
      type: 'error',
      text1: err.message,
    });
  } finally {
    yield put(setLoading(false));
  }
}

export function* reloadWatcher() {
  yield takeLatest(ActionType.INIT_STORE as any, reload);
  yield takeLatest(ActionType.REFRESH_WALLETS as any, reload);
  yield takeLatest(ActionType.ADD_WALLET as any, reload);
}

export function* createWalletWatcher() {
  yield takeLatest(ActionType.CREATE_WALLET as any, createWallet);
}
