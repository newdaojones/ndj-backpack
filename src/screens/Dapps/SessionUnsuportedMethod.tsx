import {BaseScreen, Paragraph} from '@app/components';
import {useWalletConnect} from '@app/context/walletconnect';
import {MainStackParamList} from '@app/models';
import {walletsSelector} from '@app/store/wallets/walletsSelector';
import {rejectEIP155Request} from '@app/utils/EIP155RequestHandlerUtil';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import {Card, DappInfo, RequestDetail} from './components';
import {colors} from '@app/assets/colors.config';

export const SessionUnsuportedMethod = () => {
  const {client} = useWalletConnect();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, 'SessionSignModal'>>();
  const wallets = useSelector(walletsSelector);
  const {event, session} = route.params;

  const onReject = () => {
    if (client && event) {
      const response = rejectEIP155Request(event.request);
      client.respond({
        topic: event.topic,
        response,
      });
    }
    navigation.goBack();
  };

  useEffect(() => {
    if (!session) {
      onReject();
    }
  }, [wallets, session]);

  if (!session || !event) {
    return <></>;
  }

  const {method} = event.request;

  return (
    <BaseScreen noBottom title="Unsupported Method" onBack={onReject}>
      <ScrollView>
        <DappInfo metadata={session?.peer.metadata} />
        <RequestDetail
          chainId={event.chainId}
          protocol={session.relay.protocol}
        />
        <Card>
          <Paragraph text="Method:" color={colors.textGray} />
          <Paragraph text={method} />
        </Card>
      </ScrollView>
    </BaseScreen>
  );
};
