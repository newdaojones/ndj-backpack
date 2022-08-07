import React, {useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import {Image, View, TouchableOpacity, TextInput} from 'react-native';
import {t} from 'react-native-tailwindcss';
import {Paragraph, QRCode} from '@app/components';
import {selectedWalletSelector} from '@app/store/wallets/walletsSelector';
import {colors} from '@app/assets/colors.config';
import {tokenSelector} from '@app/store/coins/coinsSelector';
import Clipboard from '@react-native-community/clipboard';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';

const logo = require('@app/assets/images/logo.png');

export const Receive = () => {
  const selectedWallet = useSelector(selectedWalletSelector);
  const token = useSelector(tokenSelector);
  const [amount, setAmount] = useState<string>();
  const wallet = selectedWallet?.wallets.find(
    w => w.network === token?.network,
  );
  const content = useMemo(
    () => `${wallet?.address}${amount ? `?amount=${amount}` : ''}`,
    [wallet, amount],
  );

  const onCopy = () => {
    if (!wallet) {
      return;
    }

    ReactNativeHapticFeedback.trigger('impactHeavy');
    Clipboard.setString(wallet.address);
    Toast.show({
      type: 'success',
      text1: 'Copied Address!',
    });
  };

  return (
    <>
      <View style={[t.pT1, t.pB4]}>
        <Paragraph text={'Receive a Transaction'} align="center" type="bold" />
      </View>
      <View style={[t.flexRow]}>
        <View style={[t.flex1, t.itemsCenter]}>
          <TouchableOpacity
            onPress={onCopy}
            style={[t.itemsCenter, t.justifyCenter]}>
            <QRCode
              content={content}
              outerEyeStyle="rounded"
              innerEyeStyle="circle"
              codeStyle="circle"
              logoSize={50}
              size={100}
              backgroundColor={colors.primary}
              outerEyeColor="rgb(255,0,196)"
              innerEyeColor="rgb(0,255,139)"
              linearGradient={['rgb(115,44,249)', 'rgb(88,207,252)']}
              gradientDirection={[160, 70, 50, 220]}
            />
            <Image source={logo} style={[t.w12, t.h12, t.absolute, t.z10]} />
          </TouchableOpacity>
          <View style={{width: 104}}>
            <Paragraph
              text={wallet?.address}
              numberOfLines={1}
              ellipsizeMode="middle"
            />
          </View>
        </View>
        <View style={[t.flex1, t.mL4, t.itemsCenter, t.wFull, t.justifyCenter]}>
          <Paragraph text="Custom QR Value" align="center" marginBottom={5} />
          <View
            style={[
              t.wFull,
              t.bgGray300,
              t.mL4,
              t.mR4,
              t.roundedLg,
              t.itemsCenter,
              t.justifyCenter,
              {height: 30},
            ]}>
            <TextInput
              value={amount}
              onChangeText={value => setAmount(value)}
              placeholder={'-'}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textGray}
              style={[
                t.flex1,
                t.p0,
                t.m0,
                t.textWhite,
                t.wFull,
                t.textCenter,
                {fontSize: 16},
              ]}
            />
          </View>
          <Paragraph
            text={`${token?.symbol.toUpperCase()} Address`}
            align="center"
            marginTop={5}
          />
        </View>
      </View>
    </>
  );
};
