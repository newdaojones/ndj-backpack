import {delay, put, select, takeLatest} from 'redux-saga/effects';
import {
  Action,
  ActionType,
  ENSInfo,
  RootState,
  Wallet,
  WalletItem,
} from '@app/models';
import {
  addWallet,
  selectWallet,
  setLoading,
  setReadyApp,
  setWallets,
} from '../actions';
import {generateMnemonicPhrase, showSnackbar} from '@app/utils';
import {NetworkName} from '@app/constants';
import {WalletService} from '@app/services';
import {wyreService} from '@app/services/wyreService';

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
    for (const account of wallets) {
      const walletItems: WalletItem[] = [];
      for (const wallet of account.wallets) {
        try {
          const ensInfo: ENSInfo = yield WalletService.getENSInfo(
            wallet.network,
            wallet.address,
          );
          wallet.ensInfo = ensInfo;
        } catch (err) {
          console.log(err);
        }
        walletItems.push(
          new WalletItem(
            wallet.network,
            wallet.liveAddress,
            wallet.testAddress,
            wallet.privateKey,
            wallet.ensInfo,
          ),
        );
      }

      account.wallets = walletItems;
    }
    yield put(setWallets(wallets));
  } catch (err: any) {
    showSnackbar(err.message);
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
    showSnackbar(err.message);
  } finally {
    yield put(setLoading(false));
  }
}

function* createDefaultWallets() {
  yield put(setLoading(true));

  try {
    const state: RootState = yield select();

    const defaultWallet = state.wallets.walletId;
    const investedWallet = state.wallets.wallets?.find(w => w.id === 'invest');
    const savedWallet = state.wallets.wallets?.find(w => w.id === 'save');

    const mnemonicSpend: string = yield generateMnemonicPhrase();
    const spendWalletItems: WalletItem[] = yield WalletService.createWallets(
      mnemonicSpend,
    );

    const spendWallet: Wallet = {
      id: 'spend',
      name: 'Spend',
      mnemonic: mnemonicSpend,
      wallets: spendWalletItems,
    };

    yield put(addWallet(spendWallet));

    if (!defaultWallet) {
      yield put(selectWallet(spendWallet));
    }

    if (!savedWallet) {
      // Save
      yield delay(1000);
      const mnemonicSave: string = yield generateMnemonicPhrase();
      const saveWalletItems: WalletItem[] = yield WalletService.createWallets(
        mnemonicSave,
      );

      const saveWallet: Wallet = {
        id: 'save',
        name: 'Save',
        mnemonic: mnemonicSave,
        wallets: saveWalletItems,
      };

      yield put(addWallet(saveWallet));
    }

    if (!investedWallet) {
      // Invest
      yield delay(1000);
      const mnemonicInvest: string = yield generateMnemonicPhrase();
      const saveWalletInvest: WalletItem[] = yield WalletService.createWallets(
        mnemonicInvest,
      );

      const investWallet: Wallet = {
        id: 'invest',
        name: 'Invest',
        mnemonic: mnemonicInvest,
        wallets: saveWalletInvest,
      };

      yield put(addWallet(investWallet));
    }
  } catch (err: any) {
    showSnackbar(err.message);
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
  yield takeLatest(
    ActionType.CREATE_DEFAULT_WALLETS as any,
    createDefaultWallets,
  );
}
