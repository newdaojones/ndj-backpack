import {colors} from '@app/assets/colors.config';
import {BaseScreen, Card, Paragraph} from '@app/components';
import {shadow} from '@app/constants';
import {useKeychain} from '@app/context/keychain';
import {MainStackParamList} from '@app/models';
import {switchNetwork} from '@app/store/wallets/actions';
import {networkSelector} from '@app/store/wallets/walletsSelector';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {t} from 'react-native-tailwindcss';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDispatch, useSelector} from 'react-redux';

export const SettingsScreen = () => {
  const dispatch = useDispatch();
  const network = useSelector(networkSelector);
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [selectedSetting, setSelectedSetting] = useState<string>('network');
  const {enabled, toggleKeychain} = useKeychain();

  const onChangeNetwork = (payload: 'mainnet' | 'testnet') => {
    dispatch(switchNetwork(payload));
  };

  const onToggleBiometric = () => {
    if (enabled) {
      navigation.navigate('VerifyPasscode', {
        onVerified: () => toggleKeychain(false),
      });
    } else {
      navigation.navigate('SetPasscode');
    }
  };

  const onSetNewPasscord = () => {
    navigation.navigate('VerifyPasscode', {
      onVerified: () => {
        navigation.goBack();
        navigation.navigate('SetPasscode');
      },
    });
  };

  return (
    <BaseScreen>
      <View style={[t.flex1]}>
        <Card full>
          <TouchableOpacity
            onPress={() => setSelectedSetting('network')}
            style={[
              t.flexRow,
              t.itemsCenter,
              t.mT1,
              t.mT1,
              t.p1,
              t.pL2,
              t.pR2,
              t.roundedLg,
              selectedSetting === 'network'
                ? {backgroundColor: colors.button}
                : {},
              selectedSetting === 'network' ? shadow : {},
            ]}>
            <Icon name="sync" size={30} color={colors.white} />
            <Paragraph marginLeft={10} text="Switch Networks" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedSetting('fingerprint')}
            style={[
              t.flexRow,
              t.itemsCenter,
              t.mT1,
              t.mT1,
              t.p1,
              t.pL2,
              t.pR2,
              t.roundedLg,
              selectedSetting === 'fingerprint'
                ? {backgroundColor: colors.button}
                : {},
              selectedSetting === 'fingerprint' ? shadow : {},
            ]}>
            <Icon name="fingerprint" size={30} color={colors.white} />
            <Paragraph marginLeft={10} text="PIN & Biometrics" />
          </TouchableOpacity>
        </Card>
      </View>
      <View style={[t.mT10]}>
        {selectedSetting === 'network' && (
          <View style={[t.flexRow]}>
            <TouchableOpacity
              onPress={() => onChangeNetwork('testnet')}
              style={[
                {backgroundColor: colors.button},
                network === 'testnet' ? shadow : {},
                t.flex1,
                t.h10,
                t.alignCenter,
                t.justifyCenter,
                t.roundedLg,
              ]}>
              <Paragraph
                text="Testnets"
                align="center"
                color={colors.white}
                size={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChangeNetwork('mainnet')}
              style={[
                {backgroundColor: colors.button},
                t.mL2,
                network === 'mainnet' ? shadow : {},
                t.flex1,
                t.h10,
                t.alignCenter,
                t.justifyCenter,
                t.roundedLg,
              ]}>
              <Paragraph
                text="Mainnets"
                align="center"
                color={colors.white}
                size={16}
              />
            </TouchableOpacity>
          </View>
        )}
        {selectedSetting === 'fingerprint' && (
          <View style={[t.flexRow]}>
            <TouchableOpacity
              onPress={() => onToggleBiometric()}
              style={[
                {backgroundColor: colors.button},
                enabled ? shadow : {},
                t.flex1,
                t.h10,
                t.alignCenter,
                t.justifyCenter,
                t.roundedLg,
              ]}>
              <Paragraph
                text={enabled ? 'Turn off Biometric' : 'Turn on Biometric'}
                align="center"
                color={colors.white}
                size={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!enabled}
              onPress={() => onSetNewPasscord()}
              style={[
                {backgroundColor: colors.button},
                t.mL2,
                enabled ? shadow : {},
                t.flex1,
                t.h10,
                t.alignCenter,
                t.justifyCenter,
                t.roundedLg,
              ]}>
              <Paragraph
                text="Set New PIN"
                align="center"
                color={colors.white}
                size={16}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </BaseScreen>
  );
};
