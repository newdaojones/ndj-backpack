import React, {useState} from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import {t} from 'react-native-tailwindcss';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-community/clipboard';
import * as _ from 'lodash';

import {BaseScreen, Card, Paragraph} from '@app/components';
import {useDispatch, useSelector} from 'react-redux';
import {
  currencySelector,
  selectedWalletSelector,
  walletsSelector,
} from '@app/store/wallets/walletsSelector';
import {Wallet, WalletStackParamList} from '@app/models';
import {colors} from '@app/assets/colors.config';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {
  isLoadingTokensSelector,
  tokensSelector,
} from '@app/store/coins/coinsSelector';
import {refreshWallets} from '@app/store/wallets/actions';
import {formatCurrency, showSnackbar} from '@app/utils';
import {borderWidth, networkList, NetworkName} from '@app/constants';
import {selectWallet} from '@app/store/wallets/actions';
import {useWalletConnect} from '@app/context/walletconnect';

const logo = require('@app/assets/images/logo.png');
const toggle = require('@app/assets/images/toggle.png');

export const WalletsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp<WalletStackParamList>>();
  const wallets = useSelector(walletsSelector);
  const isLoading = useSelector(isLoadingTokensSelector);

  return (
    <BaseScreen>
      <FlatList
        data={wallets}
        keyExtractor={item => `${item.id}`}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => <WalletItem wallet={item} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => dispatch(refreshWallets())}
            tintColor={colors.white}
            titleColor={colors.white}
          />
        }
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddWallet')}
            style={[t.flexRow, t.p2, t.itemsCenter, t.justifyCenter]}>
            <MIcon name="plus" size={20} color={colors.white} />
            <Paragraph text="new wallet" />
          </TouchableOpacity>
        }
      />
    </BaseScreen>
  );
};

const WalletItem = ({wallet}: {wallet: Wallet}) => {
  const {sessions} = useWalletConnect();
  const dispatch = useDispatch();
  const selectedWallet = useSelector(selectedWalletSelector);
  const tokens = useSelector(tokensSelector);
  const currency = useSelector(currencySelector);
  const [showSeed, setShowSeed] = useState(false);

  const tokenList = tokens[wallet.id] || [];
  const totalBalance = tokenList.reduce(
    (total, token) => total + (token.price || 0) * (token.balance || 0),
    0,
  );

  const ethAddress = wallet.wallets.find(
    w => w.network === NetworkName.ethereum,
  )?.address;

  const isSelected = selectedWallet?.id === wallet.id;

  const onCopySeed = () => {
    Clipboard.setString(wallet.mnemonic);
    showSnackbar('Copied Seed!');
  };

  const topTokens = tokenList
    .filter(a => a.balance && a.balance > 0)
    .sort((a, b) =>
      (a.balance || 0) * (a.price || 0) > (b.balance || 0) * (b.price || 0)
        ? -1
        : 1,
    )
    .slice(0, 3);

  const ethWallet = wallet.wallets.find(
    w => w.network === NetworkName.ethereum,
  );
  const ensName =
    ethWallet?.ensInfo?.name && ethWallet?.ensInfo?.name !== ethWallet.address
      ? ethWallet?.ensInfo?.name
      : null;
  const ensAvatar = ethWallet?.ensInfo?.avatar;

  const accounts = wallet.wallets.map(w => {
    const chain = networkList.find(n => n.network === w.network)?.chain;
    return `${chain}:${w.address}`;
  });

  const walletSessions = sessions.filter(session => {
    const sessionAccounts = session.state.accounts.filter(d =>
      accounts.includes(d),
    );
    return sessionAccounts.length > 0;
  });

  return (
    <Card>
      <Paragraph text={wallet.name} align="center" type="bold" />
      <View style={[t.flexRow, t.mT4, t.itemsCenter]}>
        <View style={[t.w40, t.pL8, t.pR8]}>
          <View style={[t.h16, t.flexRow, t.itemsCenter, t.justifyCenter]}>
            {ensAvatar ? (
              <Image
                source={{uri: ensAvatar}}
                style={[t.w16, t.h16, t.selfCenter, t.flex1]}
                resizeMode="contain"
              />
            ) : topTokens.length ? (
              <View style={[t.h16, {width: 64 + (topTokens.length - 1) * 25}]}>
                {topTokens.reverse().map((token, index) => (
                  <Image
                    key={token.id}
                    source={{uri: token.image}}
                    style={[
                      {right: index * 25},
                      t.absolute,
                      t.w16,
                      t.h16,
                      t.selfCenter,
                      t.flex1,
                      t.roundedFull,
                      t.bgWhite,
                    ]}
                    resizeMode="contain"
                  />
                ))}
              </View>
            ) : (
              <Image
                source={logo}
                style={[t.w16, t.h16, t.selfCenter, t.flex1]}
                resizeMode="contain"
              />
            )}
          </View>
          <Paragraph
            text={ensName || ethAddress}
            numberOfLines={1}
            ellipsizeMode="middle"
          />
          <TouchableOpacity
            onPress={() => dispatch(selectWallet(wallet))}
            style={[t.flexRow, t.itemsCenter, t.justifyCenter, t.mT2]}>
            <View style={[t.w4, t.h4]}>
              <Image
                source={toggle}
                style={[
                  t.w4,
                  t.h4,
                  t.selfCenter,
                  t.flex1,
                  isSelected ? t.opacity100 : t.opacity50,
                ]}
                resizeMode="contain"
              />
            </View>
            <Paragraph
              text={isSelected ? 'default' : 'set default'}
              size={12}
              marginLeft={10}
            />
          </TouchableOpacity>
        </View>
        <View style={[t.flex1, t.justifyBetween]}>
          <View
            style={[
              t.bgGray300,
              t.roundedLg,
              t.itemsCenter,
              t.justifyCenter,
              t.h8,
            ]}>
            <Paragraph text={formatCurrency(totalBalance, currency)} />
          </View>
          <View style={[t.flexRow, t.mT4, t.justifyAround]}>
            <TouchableOpacity
              style={[t.itemsCenter]}
              onPress={() => setShowSeed(!showSeed)}>
              <Paragraph text="Seed" align="center" marginRight={5} />
              <Paragraph
                text={`${wallet.mnemonic.split(' ').length} W`}
                type="bold"
              />
            </TouchableOpacity>
            <View style={[t.itemsCenter]}>
              <Paragraph text="dApps" align="center" />
              <View style={[t.flexRow, t.itemsCenter]}>
                <Paragraph
                  text={walletSessions.length}
                  type="bold"
                  align="center"
                />
              </View>
            </View>
          </View>
        </View>
      </View>
      {showSeed && (
        <TouchableOpacity
          style={[t.mT4]}
          onPress={() => setShowSeed(!showSeed)}
          onLongPress={onCopySeed}>
          <View
            style={[
              t.p2,
              t.roundedLg,
              t.borderYellow200,
              t.bgGray300,
              {borderWidth},
            ]}>
            <Paragraph
              text="Seeds are private use them wisely, like you would with any other personal data"
              align="center"
              marginBottom={5}
            />
            <View style={[t.flexRow, t.justifyCenter]}>
              <Paragraph text="tap" type="bold" marginRight={5} />
              <Paragraph text="to close seed" />
            </View>
            <View style={[t.flexRow, t.justifyCenter]}>
              <Paragraph text="long press" type="bold" marginRight={5} />
              <Paragraph text="to copy your seed phrase" />
            </View>
          </View>
          <View
            style={[t.p2, t.mT2, t.roundedLg, t.borderPink500, {borderWidth}]}>
            <Paragraph text={wallet.mnemonic} align="center" lineHeight={24} />
          </View>
        </TouchableOpacity>
      )}
    </Card>
  );
};
