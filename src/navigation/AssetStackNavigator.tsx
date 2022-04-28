import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {screenOptions, stackOptions} from './config';
import {AssetsScreen} from '@app/screens/Assets/Assets';
import {TokensScreen} from '@app/screens/Assets/Tokens';
import {ReceiveScreen} from '@app/screens/Assets/Receive';
const Stack = createNativeStackNavigator();

export const AssetStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName={'Assets'} screenOptions={screenOptions}>
      <Stack.Screen
        name="Assets"
        options={{
          ...stackOptions,
          headerTitle: 'Asset Management',
        }}
        component={AssetsScreen}
      />
      <Stack.Screen
        name="Tokens"
        options={{
          ...stackOptions,
          headerShown: false,
          presentation: 'formSheet',
        }}
        component={TokensScreen}
      />
      <Stack.Screen
        name="Receive"
        options={{
          ...stackOptions,
          headerTitle: 'Asset Management',
        }}
        component={ReceiveScreen}
      />
    </Stack.Navigator>
  );
};