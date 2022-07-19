import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import {t} from 'react-native-tailwindcss';
import {NavigationProp, useNavigation} from '@react-navigation/native';

import {screenOptions, stackOptions} from './config';
import {WalletStackNavigator} from './WalletStackNavigator';
import {AssetStackNavigator} from './AssetStackNavigator';
import {DappStackNavigator} from './DappStackNavigator';
import {RotateMenu} from '@app/components';
import {colors} from '@app/assets/colors.config';
import {MainStackParamList} from '@app/models';
import {
  SessionApproval,
  SessionSendTransaction,
  SessionSign,
  SessionSignTypedData,
  SessionUnsuportedMethod,
} from '@app/screens/Dapps';
import {SettingsScreen} from '@app/screens/Settings';
import {useKeychain} from '@app/context/keychain';
import {SetPasscodeScreen} from '@app/screens/SetPasscode';

import AssetsIcon from '@app/assets/icons/assets.svg';
import DappsIcon from '@app/assets/icons/dapps.svg';
import WalletsIcon from '@app/assets/icons/wallets.svg';
import SettingsIcon from '@app/assets/icons/settings.svg';
import {SessionSignSolana} from '@app/screens/Dapps/SessionSignSolana';
import {BuyTokenScreen} from '@app/screens/BuyToken';

const Stack = createNativeStackNavigator();

export const MainStackNavigator = () => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const {enabled, verifyPasscode} = useKeychain();

  const onSelectMenu = (name: any) => {
    navigation.navigate(name);
  };

  useEffect(() => {
    if (enabled) {
      verifyPasscode();
    }
  }, []);

  return (
    <View style={[t.flex1]}>
      <Stack.Navigator
        initialRouteName={'WalletStack'}
        screenOptions={screenOptions}>
        <Stack.Screen
          name="WalletStack"
          options={{animation: 'fade', gestureEnabled: false}}
          component={WalletStackNavigator}
        />
        <Stack.Screen
          name="AssetStack"
          options={{animation: 'fade', gestureEnabled: false}}
          component={AssetStackNavigator}
        />
        <Stack.Screen
          name="DappStack"
          options={{animation: 'fade', gestureEnabled: false}}
          component={DappStackNavigator}
        />
        <Stack.Screen
          name="Settings"
          options={{
            animation: 'fade',
            ...stackOptions,
            headerBackVisible: false,
            headerTitle: 'Backpack Settings',
            gestureEnabled: false,
          }}
          component={SettingsScreen}
        />
        <Stack.Screen
          name="SessionApprovalModal"
          component={SessionApproval}
          options={{
            ...stackOptions,
            headerShown: false,
            presentation: 'formSheet',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SessionSignModal"
          component={SessionSign}
          options={{
            ...stackOptions,
            headerShown: false,
            presentation: 'formSheet',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SessionSignTypedDataModal"
          component={SessionSignTypedData}
          options={{
            ...stackOptions,
            headerShown: false,
            presentation: 'formSheet',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SessionSendTransactionModal"
          component={SessionSendTransaction}
          options={{
            ...stackOptions,
            headerShown: false,
            presentation: 'formSheet',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SessionSignSolanaModal"
          component={SessionSignSolana}
          options={{
            ...stackOptions,
            headerShown: false,
            presentation: 'formSheet',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SessionUnsuportedMethodModal"
          component={SessionUnsuportedMethod}
          options={{
            ...stackOptions,
            headerShown: false,
            presentation: 'formSheet',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SetPasscode"
          options={{
            ...stackOptions,
            presentation: 'formSheet',
            headerShown: false,
          }}
          component={SetPasscodeScreen}
        />
        <Stack.Screen
          name="BuyToken"
          options={{
            ...stackOptions,
            presentation: 'formSheet',
            headerShown: false,
            gestureEnabled: false,
          }}
          component={BuyTokenScreen}
        />
      </Stack.Navigator>
      <View style={styles.rotateMenu}>
        <RotateMenu
          girthAngle={180}
          icons={[
            <SettingsIcon id="Settings" title="Settings" />,
            <AssetsIcon id="AssetStack" title="Assets" />,
            <WalletsIcon id="WalletStack" title="Wallets" />,
            <DappsIcon id="DappStack" title="Apps" />,
          ]}
          onSelect={onSelectMenu}
          defaultIconColor={'gray'}
          styleIconText={[t.bgTransparent]}
          iconHideOnTheBackDuration={100}
          isExpDistCorrection={false}
        />
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  rotateMenu: {
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowColor: colors.primary,
    shadowOpacity: 0.9,
    elevation: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
  },
});
