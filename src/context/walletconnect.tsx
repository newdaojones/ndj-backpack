import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Linking} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import LegacySignClient from '@walletconnect/client';
import SignClient from '@walletconnect/sign-client';
import {SessionTypes, SignClientTypes} from '@walletconnect/types';
import {getSdkError, parseUri} from '@walletconnect/utils';
import * as _ from 'lodash';

import {StackParams} from '@app/models';
import {EIP155_SIGNING_METHODS} from '@app/constants/EIP155Data';
import {COSMOS_SIGNING_METHODS} from '@app/constants/COSMOSData';
import {SOLANA_SIGNING_METHODS} from '@app/constants/SolanaData';
import {getDeepLink, getDomainName} from '@app/utils';
import {whiteListedDapps} from '@app/constants/whitelistedDapps';

const ENABLED_TRANSACTION_TOPICS = 'ENABLED_TRANSACTION_TOPICS';
const WALLET_CONNECT_LEGACY_SESSIONS = 'WALLET_CONNECT_LEGACY_SESSIONS';
let connectSessionInterval: any = null;
let disconnectSessionInterval: any = null;

export interface WalletConnectContextProps {
  isInitializingWc: boolean;
  client?: SignClient;
  legacyClients: LegacySignClient[];
  sessions: any[];
  enabledTransactionTopics: {[topic: string]: boolean};
  onAcceptSessionProposal: (proposal: any, accounts: string[]) => void;
  onRejectSessionProposal: (proposal: any, message?: string) => void;

  onAcceptLegacySessionProposal: (
    legacyClient: LegacySignClient,
    accounts: string[],
    chainId: number,
  ) => void;
  onRejectLegacySessionProposal: (legacyClient: LegacySignClient) => void;
  removeLegacyClient: (legacyClient: LegacySignClient) => void;

  onDisconnect: (topic: string) => void;
  onToggleTransactionEnable: (topic: string, value: boolean) => void;
  onPairing: (uri: string) => void;
  onClearPairingTopic: () => void;
  onOpenDeepLink: (url: string) => void;
}

export const WalletConnectContext = createContext<WalletConnectContextProps>({
  legacyClients: [],
  isInitializingWc: false,
  sessions: [],
  enabledTransactionTopics: {},
  onAcceptSessionProposal: () => {},
  onRejectSessionProposal: () => {},
  onAcceptLegacySessionProposal: () => {},
  onRejectLegacySessionProposal: () => {},
  onDisconnect: () => {},
  onToggleTransactionEnable: () => {},
  onPairing: () => {},
  onClearPairingTopic: () => {},
  onOpenDeepLink: () => {},
  removeLegacyClient: () => {},
});

export const useWalletConnect = () => {
  const context = useContext(WalletConnectContext);

  return context;
};

export const WalletConnectProvider = (props: {
  children: React.ReactChild[] | React.ReactChild;
}) => {
  const navigation = useNavigation<NavigationProp<StackParams>>();
  const [client, setClient] = useState<SignClient>();
  const [legacyClients, setLegacyClients] = useState<LegacySignClient[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isInitializingWc, setIsInitializingWc] = useState(false);
  const [enabledTransactionTopics, setEnabledTransactionTopics] = useState<{
    [topic: string]: boolean;
  }>({});
  const [deepLinkUri, setDeepLinkUri] = useState<string>();
  const [pairingTopic, setParingTopic] = useState<string>();
  const [paringLegacyClient, setParingLegacyClient] =
    useState<LegacySignClient | null>();

  const initClient = async () => {
    setIsInitializingWc(true);
    try {
      const wClient = await SignClient.init({
        projectId: '6deff5a02e50ce1ec41397b27b372189',
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
          name: 'NDJ Wallet',
          description: 'NDJ Wallet',
          url: 'https://jxndao.com',
          icons: ['https://jxndao.com//logo192.png'],
        },
      });
      setClient(wClient);
      await initLegacySignClients();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });
    } finally {
      setIsInitializingWc(false);
    }
  };

  useEffect(() => {
    const getUrlAsync = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        onOpenDeepLink(url);
      }
    };

    Linking.addEventListener('url', onOpenDappUrl);
    getUrlAsync();
  }, []);

  const onOpenDappUrl = ({url}: {url: string}) => {
    onOpenDeepLink(url);
  };

  const onOpenDeepLink = (url: string) => {
    const deepLink = getDeepLink(url);

    if (deepLink) {
      setDeepLinkUri(deepLink);
    }
  };

  const onPairDeepLink = useCallback(async () => {
    try {
      if (!deepLinkUri) {
        return;
      }

      const {version} = parseUri(deepLinkUri);

      if (isNaN(version)) {
        throw new Error('WalletConnect: invalid QR code');
      }

      if (version === 1) {
        createLegacySignClient(deepLinkUri);
      } else if (version === 2) {
        if (!client) {
          throw new Error('WalletConnect client is not initialized');
        }
        const res = await client.pair({uri: deepLinkUri});

        if (!res?.topic) {
          throw new Error('Failed paring');
        }

        setParingTopic(res?.topic);
      } else {
        throw new Error(`Unknown version of WalletConnect v${version}`);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });
    } finally {
      setDeepLinkUri('');
    }
  }, [deepLinkUri, client]);

  useEffect(() => {
    onPairDeepLink();
  }, [onPairDeepLink]);

  const onPairing = useCallback(
    async (uri: string) => {
      setDeepLinkUri(uri);
    },
    [client],
  );

  const onClearPairingTopic = () => {
    setParingTopic('');
  };

  const onSessionProposal = useCallback(
    (proposal: SignClientTypes.EventArguments['session_proposal']) => {
      if (proposal.params.pairingTopic === pairingTopic) {
        setParingTopic('');
      }
      ReactNativeHapticFeedback.trigger('impactHeavy');
      navigation?.navigate('SessionApprovalModal', {proposal});
    },
    [pairingTopic, navigation],
  );

  const retryConnectSession = async (
    originSessions: SessionTypes.Struct[],
    retry: number,
  ) => {
    const sessionValues = client?.session.values || [];
    const originSessionTopics = originSessions.map(session => session.topic);
    const newSessions = sessionValues?.filter(
      session => !originSessionTopics.includes(session.topic),
    );

    if (newSessions?.length) {
      clearTimeout(connectSessionInterval);
      connectSessionInterval = null;
      for (const newSession of newSessions) {
        const whiteList = whiteListedDapps.find(
          url => url === getDomainName(newSession.peer.metadata.url),
        );

        if (whiteList && !enabledTransactionTopics[newSession.topic]) {
          await onToggleTransactionEnable(newSession.topic as string, true);
        }
      }

      setSessions(sessionValues);
    } else if (retry === 3) {
      clearTimeout(connectSessionInterval);
      connectSessionInterval = null;
      Toast.show({
        type: 'error',
        text1: 'WalletConnect: connection timed out',
      });
    } else {
      connectSessionInterval = setTimeout(
        () => retryConnectSession(originSessions, retry + 1),
        5000,
      );
    }
  };

  const onAcceptSessionProposal = async (
    proposal: SignClientTypes.EventArguments['session_proposal'],
    accounts: string[],
  ) => {
    try {
      const {id, params} = proposal;
      const {requiredNamespaces, optionalNamespaces, relays} = params;

      const namespaces: SessionTypes.Namespaces = {};
      Object.keys(requiredNamespaces).forEach(key => {
        namespaces[key] = {
          accounts: accounts.filter(account => account.startsWith(key)),
          methods: requiredNamespaces[key].methods,
          events: requiredNamespaces[key].events,
        };
      });

      Object.keys(optionalNamespaces).forEach(key => {
        namespaces[key] = {
          accounts: accounts.filter(account => account.startsWith(key)),
          methods: optionalNamespaces[key].methods,
          events: optionalNamespaces[key].events,
        };
      });

      if (!client) {
        throw new Error('WalletConnect client is not initialized');
      }

      connectSessionInterval = setTimeout(
        () => retryConnectSession(sessions, 1),
        5000,
      );

      const res = await client.approve({
        id,
        relayProtocol: relays[0].protocol,
        namespaces,
      });

      if (!res) {
        throw new Error('Failed approving session connection');
      }

      await res.acknowledged();

      const whiteList = whiteListedDapps.find(
        url => url === getDomainName(proposal.params?.proposer?.metadata?.url),
      );

      if (!res.topic) {
        throw new Error('Can not find approved session topic');
      }

      if (whiteList && !enabledTransactionTopics[res.topic]) {
        await onToggleTransactionEnable(res.topic as string, true);
      }

      if (connectSessionInterval) {
        clearTimeout(connectSessionInterval);
        connectSessionInterval = null;
      }

      setSessions(client.session.values || []);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });

      if (connectSessionInterval) {
        clearTimeout(connectSessionInterval);
        connectSessionInterval = null;
      }
    }
  };

  const onAcceptLegacySessionProposal = async (
    legacyClient: LegacySignClient,
    accounts: string[],
    chainId: number,
  ) => {
    try {
      await legacyClient.approveSession({
        accounts,
        chainId,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });
      removeLegacyClientListener(legacyClient);
    }
  };

  const onRejectLegacySessionProposal = async (
    legacyClient: LegacySignClient,
  ) => {
    try {
      await legacyClient.rejectSession(getSdkError('USER_REJECTED_METHODS'));
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });
    } finally {
      removeLegacyClientListener(legacyClient);
    }
  };

  const onRejectSessionProposal = useCallback(() => {
    async (proposal: SignClientTypes.EventArguments['session_proposal']) => {
      try {
        if (!client) {
          throw new Error('WalletConnect client is not initialized');
        }

        await client.reject({
          id: proposal.id,
          reason: getSdkError('USER_REJECTED_METHODS'),
        });
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: err.message,
        });
      }
    };
  }, [client]);

  const retryDisconnectSession = (topic: string, retry: number) => {
    const sessionValues = client?.session.values || [];
    const session = sessionValues.find(entry => entry.topic === topic);

    if (!session) {
      setSessions(sessionValues);
      clearTimeout(disconnectSessionInterval);
      disconnectSessionInterval = null;
    } else if (retry >= 3) {
      clearTimeout(disconnectSessionInterval);
      disconnectSessionInterval = null;
      Toast.show({
        type: 'error',
        text1: 'WalletConnect: connection timed out',
      });
    } else {
      disconnectSessionInterval = setTimeout(
        () => retryDisconnectSession(topic, retry + 1),
        5000,
      );
    }
  };

  const onDisconnect = async (topic: string) => {
    try {
      if (!client) {
        throw new Error('WalletConnect client is not initialized');
      }

      await client.disconnect({
        topic,
        reason: getSdkError('USER_DISCONNECTED'),
      });

      const newSessions = client.session.values || [];
      const disconnectedSession = newSessions.find(
        session => session.topic === topic,
      );

      if (!disconnectedSession) {
        setSessions(newSessions);
      } else {
        disconnectSessionInterval = setTimeout(
          () => retryDisconnectSession(topic, 1),
          5000,
        );
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });
    }
  };

  const onToggleTransactionEnable = async (topic: string, value: boolean) => {
    const data = {
      ...enabledTransactionTopics,
      [topic]: value,
    };
    await AsyncStorage.setItem(
      ENABLED_TRANSACTION_TOPICS,
      JSON.stringify(data),
    );
    setEnabledTransactionTopics(data);
  };

  const syncTransactionEnableTopics = async () => {
    const res = await AsyncStorage.getItem(ENABLED_TRANSACTION_TOPICS);
    const data = res ? JSON.parse(res) : {};
    const result: any = {};

    for (const session of sessions) {
      result[session.topic] = data[session.topic] || false;
    }

    for (const legacyClient of legacyClients) {
      result[legacyClient.key] = data[legacyClient.key] ?? false;
    }

    AsyncStorage.setItem(ENABLED_TRANSACTION_TOPICS, JSON.stringify(data));
    setEnabledTransactionTopics(result);
  };

  const onSessionRequest = useCallback(
    async (event: SignClientTypes.EventArguments['session_request']) => {
      const {topic, params} = event;
      const {request} = params;
      const session = client?.session.get(topic);

      switch (request.method) {
        case EIP155_SIGNING_METHODS.ETH_SIGN:
        case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
          return navigation.navigate('SessionSignModal', {
            event,
            session,
          });

        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
          return navigation.navigate('SessionSignTypedDataModal', {
            event,
            session,
          });

        case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
        case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
          return navigation.navigate('SessionSendTransactionModal', {
            event,
            session,
          });

        case COSMOS_SIGNING_METHODS.COSMOS_SIGN_DIRECT:
        case COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO:
          break; // Todo

        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
          return navigation.navigate('SessionSignSolanaModal', {
            event,
            session,
          });

        default:
          return navigation.navigate('SessionUnsuportedMethodModal', {
            event,
            session,
          });
      }
    },
    [client, navigation],
  );

  const createLegacySignClient = async (uri: string) => {
    const legacyClient = new LegacySignClient({
      uri,
      clientMeta: {
        name: 'NDJ Wallet',
        description: 'NDJ Wallet',
        url: 'https://jxndao.com',
        icons: ['https://jxndao.com//logo192.png'],
      },
    });
    legacyClientListener(legacyClient);
    setParingLegacyClient(legacyClient);
  };

  const onLegacySingClientCallRequest = async (
    legacyClient: LegacySignClient,
    payload: {
      id: number;
      method: string;
      params: any[];
    },
  ) => {
    switch (payload.method) {
      case EIP155_SIGNING_METHODS.ETH_SIGN:
      case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
        return navigation.navigate('LegacySessionSignModal', {
          client: legacyClient,
          event: payload,
        });

      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
        return navigation.navigate('LegacySessionSignTypedDataModal', {
          client: legacyClient,
          event: payload,
        });

      case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
        return navigation.navigate('LegacySessionSendTransactionModal', {
          client: legacyClient,
          event: payload,
        });

      default:
        console.log(`${payload.method} is not supported for WalletConnect v1`);
    }
  };

  const addLegacyClient = async (legacyClient: LegacySignClient) => {
    const res = await AsyncStorage.getItem(WALLET_CONNECT_LEGACY_SESSIONS);
    const sessionData = res ? JSON.parse(res) : [];

    if (sessions.findIndex(s => s.key === legacyClient.session.key) > -1) {
      return;
    }

    const whiteList = whiteListedDapps.find(
      url =>
        legacyClient.peerMeta &&
        url === getDomainName(legacyClient.peerMeta?.url),
    );

    if (whiteList && !enabledTransactionTopics[legacyClient.key]) {
      await onToggleTransactionEnable(legacyClient.key as string, true);
    }

    sessionData.push(legacyClient.session);

    await AsyncStorage.setItem(
      WALLET_CONNECT_LEGACY_SESSIONS,
      JSON.stringify(sessionData),
    );

    setLegacyClients([...legacyClients, legacyClient]);
  };

  const removeLegacyClient = async (legacyClient: LegacySignClient) => {
    const res = await AsyncStorage.getItem(WALLET_CONNECT_LEGACY_SESSIONS);
    const sessionData = res ? JSON.parse(res) : [];

    const index = sessionData.findIndex(
      (item: any) => item.key === legacyClient.session.key,
    );

    if (index === -1) {
      return;
    }

    sessionData.splice(index, 1);

    AsyncStorage.setItem(
      WALLET_CONNECT_LEGACY_SESSIONS,
      JSON.stringify(sessionData),
    );

    const clonedLegacyClients = _.cloneDeep(legacyClients);
    const clientIndex = clonedLegacyClients.findIndex(
      c => c.session.key === legacyClient.session.key,
    );

    if (clientIndex === -1) {
      return;
    }

    clonedLegacyClients.splice(clientIndex, 1);

    setLegacyClients(clonedLegacyClients);
  };

  const initLegacySignClients = async () => {
    const res = await AsyncStorage.getItem(WALLET_CONNECT_LEGACY_SESSIONS);
    const sessionData = res ? JSON.parse(res) : [];
    let clients = [];
    for (const session of sessionData) {
      const legacyClient = new LegacySignClient({
        session: session,
      });
      clients.push(legacyClient);
    }
    setLegacyClients(clients);
  };

  useEffect(() => {
    for (const legacyClient of legacyClients) {
      legacyClientListener(legacyClient);
    }

    return () => {
      for (const legacyClient of legacyClients) {
        removeLegacyClientListener(legacyClient);
      }
    };
  }, [legacyClients]);

  const legacyClientListener = (legacyClient: LegacySignClient) => {
    legacyClient.on('session_request', (error, payload) => {
      if (error) {
        return Toast.show({
          type: 'error',
          text1: `legacySignClient > session_request failed: ${error.message}`,
        });
      }

      setParingLegacyClient(null);
      ReactNativeHapticFeedback.trigger('impactHeavy');
      navigation?.navigate('LegacySessionProposalModal', {
        client: legacyClient,
        proposal: payload,
      });
    });

    legacyClient.on('connect', () => {
      setParingLegacyClient(null);
      removeLegacyClient(legacyClient);
      addLegacyClient(legacyClient);
    });

    legacyClient.on('error', error => {
      Toast.show({
        type: 'error',
        text1: `legacySignClient > on error: ${error?.message}`,
      });
    });

    legacyClient.on('call_request', (error, payload) => {
      if (error) {
        Toast.show({
          type: 'error',
          text1: `legacySignClient > call_request failed: ${error.message}`,
        });
      }
      onLegacySingClientCallRequest(legacyClient, payload);
    });

    legacyClient.on('disconnect', async () => {
      removeLegacyClient(legacyClient);
    });
  };

  const removeLegacyClientListener = (legacyClient: LegacySignClient) => {
    legacyClient.off('session_request');
    legacyClient.off('connect');
    legacyClient.off('error');
    legacyClient.off('call_request');
    legacyClient.off('disconnect');
  };

  useEffect(() => {
    let timeout: any;
    if (pairingTopic) {
      timeout = setTimeout(() => {
        Toast.show({
          type: 'error',
          text1:
            'WalletConnect: connection timed out. Try refresh paring session in your Dapp',
        });
        setParingTopic('');
      }, 15000);
    }

    return () => {
      timeout && clearTimeout(timeout);
    };
  }, [pairingTopic]);

  useEffect(() => {
    if (!paringLegacyClient) {
      return;
    }

    let timeout = setTimeout(() => {
      Toast.show({
        type: 'error',
        text1:
          'WalletConnect V1: connection timed out. Try refresh paring session in your Dapp',
      });
      setParingLegacyClient(null);
      removeLegacyClientListener(paringLegacyClient);
    }, 15000);

    return () => {
      timeout && clearTimeout(timeout);
    };
  }, [paringLegacyClient]);

  useEffect(() => {
    setSessions(client?.session.values || []);
  }, [client]);

  useEffect(() => {
    syncTransactionEnableTopics();
  }, [sessions, legacyClients]);

  useEffect(() => {
    client?.on('session_proposal', onSessionProposal);

    return () => {
      client?.removeListener('session_proposal', onSessionProposal);
    };
  }, [client, onSessionProposal]);

  useEffect(() => {
    client?.on('session_request', onSessionRequest);

    return () => {
      client?.removeListener('session_request', onSessionRequest);
    };
  }, [client, onSessionRequest]);

  useEffect(() => {
    client?.on('session_extend', e => {
      console.log(e);
    });
    client?.on('session_delete', () => {
      setSessions(client?.session.values || []);
    });

    return () => {
      client?.removeListener('session_delete', () => {
        setSessions(client?.session.values || []);
      });
    };
  }, [client]);

  useEffect(() => {
    initClient();
  }, []);

  return (
    <WalletConnectContext.Provider
      value={{
        isInitializingWc,
        client,
        legacyClients,
        sessions,
        enabledTransactionTopics,
        onPairing,
        onRejectSessionProposal,
        onAcceptSessionProposal,
        onAcceptLegacySessionProposal,
        onRejectLegacySessionProposal,
        onDisconnect,
        onToggleTransactionEnable,
        onClearPairingTopic,
        onOpenDeepLink,
        removeLegacyClient,
      }}>
      {props.children}
    </WalletConnectContext.Provider>
  );
};
