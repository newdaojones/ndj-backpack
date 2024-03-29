import React, {useCallback, useEffect, useState} from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {t} from 'react-native-tailwindcss';
import Toast from 'react-native-toast-message';

import {BaseScreen, Button, Card, Paragraph} from '@app/components';
import {walletsSelector} from '@app/store/wallets/walletsSelector';
import {useDispatch, useSelector} from 'react-redux';

import {addWallet} from '@app/store/wallets/actions';

import {useNavigation, useRoute} from '@react-navigation/native';
import {colors} from '@app/assets/colors.config';
import {Wallet} from '@app/models';
import {generateMnemonicPhrase} from '@app/utils/web3Util';
import {createNewWallet} from '@app/utils/wallet';

const logo = require('@app/assets/images/logo.png');
const {width} = Dimensions.get('screen');

export const CreateWalletScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const isAddWalletModal =
    route.name === 'AddWallet' || route.name === 'ImportWallet';
  const wallets = useSelector(walletsSelector);
  const [isCreatingWallet, setIsCreateingWallet] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [newMnemonic, setNewMnemonic] = useState<string>('');

  const onChangeMnemonic = (text: string) => {
    setMnemonic(text);
  };

  const onImport = () => {
    const existingWallet = wallets.find(w => w.mnemonic === mnemonic);

    if (existingWallet) {
      return Toast.show({
        type: 'error',
        text1: `Wallet already exists (${existingWallet.name})`,
      });
    }

    generateWallet(mnemonic);
  };

  const onCreate = () => {
    generateWallet(newMnemonic);
  };

  const generateWallet = async (value: string) => {
    setIsCreateingWallet(true);

    try {
      const newWallets = await createNewWallet(value);

      const wallet: Wallet = {
        id: (Math.random() + 1).toString(36).substring(7),
        name: `Main Wallet ${wallets.length + 1}`,
        mnemonic: value,
        wallets: newWallets,
      };
      dispatch(addWallet(wallet));

      setIsCreateingWallet(false);

      if (isAddWalletModal) {
        navigation.goBack();
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.message,
      });
    } finally {
      setIsCreateingWallet(false);
    }
  };

  const createMnemonicPhrase = useCallback(async () => {
    const mnemonicString: string = await generateMnemonicPhrase();
    setNewMnemonic(mnemonicString);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isCreatingWallet,
    });
  }, [isCreatingWallet]);

  useEffect(() => {
    createMnemonicPhrase();
  }, [createMnemonicPhrase]);

  return (
    <>
      <BaseScreen
        isLoading={isCreatingWallet}
        noBottom
        showToast
        title={isAddWalletModal ? 'Add Wallet' : ''}
        onBack={() => !isCreatingWallet && navigation.goBack()}>
        <View style={[t.flex1]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={isAddWalletModal ? [t.flex1] : []}
            keyboardDismissMode="on-drag">
            <KeyboardAvoidingView
              style={[t.flex1, t.justifyCenter]}
              behavior={Platform.OS === 'android' ? 'padding' : 'position'}
              keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 150}>
              <View style={[t.justifyCenter, t.itemsCenter, t.mB4]}>
                <Image
                  source={logo}
                  style={[{width: width * 0.5, height: width * 0.5}]}
                  resizeMode="contain"
                />
              </View>
              <Card>
                <Paragraph text="Import existing wallet" align="center" />
                <TextInput
                  autoCapitalize="none"
                  value={mnemonic}
                  onChangeText={onChangeMnemonic}
                  style={[
                    t.roundedLg,
                    t.textWhite,
                    t.textCenter,
                    t.h20,
                    t.pT4,
                    t.mB4,
                    t.pL2,
                    t.pR2,
                    t.mT4,
                    t.bgGray300,
                    {fontSize: 16},
                  ]}
                  multiline={true}
                />
              </Card>
              <View style={[t.flexRow, t.mT2, t.wFull]}>
                {!mnemonic ? (
                  <View style={[t.wFull]}>
                    <Paragraph
                      text="OR"
                      align="center"
                      marginTop={10}
                      marginBottom={20}
                    />
                    <View style={[t.wFull]}>
                      <Button text="Create" onPress={onCreate} />
                    </View>
                  </View>
                ) : (
                  <View style={[t.wFull]}>
                    <Button
                      text="Import"
                      disabled={!mnemonic}
                      onPress={onImport}
                    />
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </ScrollView>
        </View>
      </BaseScreen>
    </>
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
