import {SessionTypes} from '@walletconnect/types';

export type RootStackParamList = {
  Splash: undefined;
  CreateWallet: undefined;
  MainStack: undefined;
};

export type MainStackParamList = {
  WalletStack: undefined;
  AssetStack: undefined;
  DappStack: undefined;
  SessionApprovalModal: SessionApprovalParams;
  SessionSignModal: {
    event: SessionTypes.RequestEvent;
    session?: SessionTypes.Settled;
  };
  SessionSignTypedDataModal: {
    event: SessionTypes.RequestEvent;
    session?: SessionTypes.Settled;
  };
  SessionSendTransactionModal: {
    event: SessionTypes.RequestEvent;
    session?: SessionTypes.Settled;
  };
  SessionUnsuportedMethodModal: {
    event: SessionTypes.RequestEvent;
    session?: SessionTypes.Settled;
  };
  WebView: {
    url: string;
    title?: string;
  };
};

export type WalletStackParamList = {
  Wallets: undefined;
  AddWallet: undefined;
};

export type StackParams = RootStackParamList &
  MainStackParamList &
  WalletStackParamList;

export interface SessionApprovalParams {
  proposal: SessionTypes.Proposal;
}
