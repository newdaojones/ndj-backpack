import {BaseScreen, Button, Paragraph} from '@app/components';
import {useWalletConnect} from '@app/context/walletconnect';
import Toast from 'react-native-toast-message';
import {StackParams} from '@app/models';

import {
  networkSelector,
  walletsSelector,
} from '@app/store/wallets/walletsSelector';
import {
  approveEIP155Request,
  rejectEIP155Request,
} from '@app/utils/EIP155RequestHandlerUtil';
import {convertHexToUtf8} from '@app/utils/HelperUtil';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {t} from 'react-native-tailwindcss';
import {useSelector} from 'react-redux';
import {Card, DappInfo, RequestDetail} from './components';
import {colors} from '@app/assets/colors.config';
import Web3 from 'web3';
import {getNetworkByChain} from '@app/utils';
import {WalletService} from '@app/services';

const borderBottomWidth = 0.3;

export const SessionSendTransaction = () => {
  const {client, enabledTransactionTopics} = useWalletConnect();
  const network = useSelector(networkSelector);
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<StackParams, 'SessionSendTransactionModal'>>();
  const wallets = useSelector(walletsSelector);
  const [isLoading, setIsLoading] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const {event, session} = route.params;

  const onReject = () => {
    if (client && event) {
      const response = rejectEIP155Request(event);
      client.respond({
        topic: event.topic,
        response,
      });
    }

    navigation.goBack();
  };

  const onConfirm = async () => {
    if (!event) {
      return;
    }

    try {
      setIsLoading(true);
      event.params.request.params[0] = transaction;
      const response = await approveEIP155Request(event, wallets, network);

      if (!client) {
        throw new Error('WalletConnect client is not initialized');
      }

      await client.respond({
        topic: event.topic,
        response,
      });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEstimate = useCallback(async () => {
    try {
      if (!event) {
        return;
      }

      setIsLoading(true);

      const networkName = getNetworkByChain(event.params.chainId, network);
      const service =
        networkName && WalletService.getServiceByNetwork(networkName);
      const estimate = await service?.getEstimate(
        event.params.request.params[0],
      );
      setTransaction(estimate);
    } catch (err: any) {
      console.log(err);
      Toast.show({
        type: 'error',
        text1: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [network, event]);

  useEffect(() => {
    getEstimate();
  }, [getEstimate]);

  useEffect(() => {
    if (!session) {
      onReject();

      return;
    }

    if (!enabledTransactionTopics[session.topic]) {
      onReject();
    }
  }, [wallets, session, enabledTransactionTopics]);

  if (!session || !event) {
    return <></>;
  }

  // Get required request data
  const {params} = event;
  const {chainId} = params;

  const fee = Web3.utils
    .toBN(transaction?.gasPrice || 0)
    .mul(Web3.utils.toBN(transaction?.gasLimit || 0));
  const feeEther = Web3.utils.fromWei(fee);
  const value = Web3.utils.toBN(transaction?.value || 0);
  const total = fee.add(value);
  const totalEther = Web3.utils.fromWei(total);
  const valueEther = Web3.utils.fromWei(value);
  const data = convertHexToUtf8(transaction?.data);

  return (
    <>
      <BaseScreen
        isLoading={isLoading}
        noBottom
        showToast
        title="Sign / Send Transaction"
        onBack={() => onReject()}>
        <ScrollView keyboardDismissMode="on-drag">
          <DappInfo metadata={session?.peer.metadata} />
          <RequestDetail
            address={transaction?.from}
            chainId={chainId}
            protocol={session.relay.protocol}
          />
          <Card>
            <View
              style={[
                t.flexRow,
                t.pB2,
                t.pT2,
                t.borderGray200,
                {borderBottomWidth},
              ]}>
              <View style={[t.w16]}>
                <Paragraph text="To:" marginRight={10} />
              </View>
              <View style={[t.flex1]}>
                <Paragraph
                  align="right"
                  numberOfLines={1}
                  text={transaction?.to}
                />
              </View>
            </View>
            <View
              style={[
                t.flexRow,
                t.pB2,
                t.pT2,
                t.borderGray200,
                {borderBottomWidth},
              ]}>
              <View style={[t.w16]}>
                <Paragraph text="Nonce:" marginRight={10} />
              </View>
              <View style={[t.flex1]}>
                <Paragraph
                  align="right"
                  numberOfLines={1}
                  text={transaction?.nonce}
                />
              </View>
            </View>
            <View
              style={[
                t.flexRow,
                t.pB2,
                t.pT2,
                t.borderGray200,
                {borderBottomWidth},
              ]}>
              <View style={[t.flex1]}>
                <Paragraph text="Value:" marginRight={10} />
              </View>
              <Paragraph align="right" text={valueEther} />
            </View>
            <View
              style={[
                t.flexRow,
                t.pB2,
                t.pT2,
                t.borderGray200,
                {borderBottomWidth},
              ]}>
              <View style={[t.flex1]}>
                <Paragraph text="Network Fee:" marginRight={10} />
              </View>
              <Paragraph align="right" text={feeEther} />
            </View>
            <View style={[t.flexRow, t.pT2]}>
              <View style={[t.flex1]}>
                <Paragraph text="Max Total:" marginRight={10} />
              </View>
              <Paragraph align="right" text={totalEther} />
            </View>
          </Card>
          {!!data && (
            <Card>
              <Paragraph text="Data:" color={colors.textGray} />
              <Paragraph text={data} />
            </Card>
          )}
        </ScrollView>
        <View style={[t.mB4, t.mT2]}>
          <Button text="Confirm" onPress={onConfirm} disabled={isLoading} />
        </View>
      </BaseScreen>
    </>
  );
};
