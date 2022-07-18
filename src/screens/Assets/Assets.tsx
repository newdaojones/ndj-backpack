import React, {useMemo, useState} from 'react';
import {Image, RefreshControl, TouchableOpacity, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {t} from 'react-native-tailwindcss';
import {useDispatch, useSelector} from 'react-redux';
import {NavigationProp, useNavigation} from '@react-navigation/native';

import {colors} from '@app/assets/colors.config';
import {refreshWallets} from '@app/store/wallets/actions';
import {setToken} from '@app/store/coins/actions';
import {AssetStackParamList, BaseCoin, MainStackParamList} from '@app/models';
import {BaseScreen, Button, Card, Paragraph} from '@app/components';
import {
  accountCoinsSelector,
  isLoadingTokensSelector,
  tokensSelector,
} from '@app/store/coins/coinsSelector';
import {normalizeNumber, showNetworkName, showSnackbar} from '@app/utils';
import {
  networkSelector,
  selectedWalletSelector,
} from '@app/store/wallets/walletsSelector';
import {wyreSupportCoins} from '@app/constants/wyre';
import {wyreService} from '@app/services/wyreService';

export const AssetsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<AssetStackParamList>>();
  const mainNavigation = useNavigation<NavigationProp<MainStackParamList>>();

  const isLoading = useSelector(isLoadingTokensSelector);
  const tokens = useSelector(tokensSelector);
  const network = useSelector(networkSelector);
  const selectedWallet = useSelector(selectedWalletSelector);
  const [loadingWyre, setLoadingWyre] = useState(false);

  const allTokens = Object.values(tokens).reduce((all, current) => {
    return all.concat(current);
  }, []);
  let coins = useSelector(accountCoinsSelector);

  coins = coins
    .filter(c => c.enabled)
    .map(coin => {
      const balance = allTokens
        .filter(
          a =>
            a.id === coin.id &&
            a.symbol === coin.symbol &&
            a.network === coin.network,
        )
        .map(a => a.balance || 0)
        .reduce((total, current) => total + current, 0);
      return {
        ...coin,
        balance,
      };
    });

  const [selectedCoin, setSelectedCoin] = useState<BaseCoin>();

  const isSupportWyre = useMemo(() => {
    if (!selectedCoin) {
      return false;
    }

    const wyreSupportCoin = wyreSupportCoins.find(
      item =>
        item.network === selectedCoin.network &&
        item.symbol === selectedCoin.symbol.toUpperCase(),
    );

    return !!wyreSupportCoin;
  }, [selectedCoin]);

  const onPressToken = () => {
    if (!selectedCoin) {
      return;
    }

    dispatch(setToken(selectedCoin));
    navigation.navigate('Transaction');
  };

  const onOpenAddToken = () => {
    navigation.navigate('Tokens');
  };

  const onBuyToken = async () => {
    if (!selectedCoin || !selectedWallet) {
      return;
    }

    const wallet = selectedWallet.wallets.find(
      w => w.network === selectedCoin.network,
    );

    if (!wallet) {
      return;
    }

    setLoadingWyre(true);

    try {
      const res = await wyreService.reserve(
        selectedCoin.symbol.toUpperCase(),
        wallet.address,
      );

      if (res.url) {
        mainNavigation.navigate('BuyToken', {
          url: res.url,
          token: selectedCoin,
        });
      }
    } catch (err: any) {
      showSnackbar(err.message);
    } finally {
      setLoadingWyre(false);
    }
  };

  return (
    <BaseScreen isLoading={loadingWyre}>
      <View style={[t.flex1]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => dispatch(refreshWallets())}
              tintColor={colors.white}
              titleColor={colors.white}
            />
          }>
          <Card>
            {coins.map(coin => {
              const isSelected =
                selectedCoin?.id === coin.id &&
                selectedCoin.network === coin.network;
              return (
                <TouchableOpacity
                  onPress={() => setSelectedCoin(coin)}
                  key={coin.id + coin.network}
                  style={[
                    t.flexRow,
                    t.itemsCenter,
                    t.mT1,
                    t.mT1,
                    t.p1,
                    t.pL2,
                    t.pR2,
                    t.roundedLg,
                    isSelected ? {backgroundColor: colors.secondary} : {},
                  ]}>
                  <Image
                    source={{uri: coin.image}}
                    style={[t.w8, t.h8, t.roundedFull, t.bgWhite, t.mR2]}
                  />
                  <View style={[t.flex1]}>
                    <Paragraph
                      text={`${coin.name}${showNetworkName(
                        coin.network,
                        network,
                      )}`}
                    />
                  </View>
                  <Paragraph
                    text={`${normalizeNumber(
                      coin.balance || 0,
                    )} ${coin.symbol.toUpperCase()}`}
                  />
                </TouchableOpacity>
              );
            })}
          </Card>
        </ScrollView>
      </View>
      <View>
        <View style={[t.mT2]}>
          <Button
            text="Buy a Token"
            disabled={!isSupportWyre || loadingWyre}
            onPress={() => onBuyToken()}
          />
        </View>
        <View style={[t.flexRow, t.mT2]}>
          <View style={[t.flex1]}>
            <Button text="Add a Token" onPress={onOpenAddToken} />
          </View>
          <View style={[t.flex1, t.mL2]}>
            <Button
              text="Tx Details"
              onPress={onPressToken}
              disabled={!selectedCoin}
            />
          </View>
        </View>
      </View>
    </BaseScreen>
  );
};
