import {colors} from '@app/assets/colors.config';
import {shadow} from '@app/constants';
import React from 'react';
import {
  Animated,
  StyleProp,
  Text,
  TextStyle,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {styles} from '../styles';

interface Props {
  icon: any;
  current?: string;
  onPress: (id: any) => void;
  styleIconText?: StyleProp<TextStyle>;
}

export const Icon = ({icon, current, onPress, styleIconText}: Props) => {
  return (
    <TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.icon,
          icon.styles,
          icon.position.getLayout(),
          // getIconsTransformDynamicStyles(),
        ]}>
        {icon.isShown && (
          <View
            style={[
              styles.iconContainer,
              current === icon.id
                ? {backgroundColor: colors.secondary}
                : {backgroundColor: colors.primary},
              icon.styles || {},
            ]}>
            {icon.el}
            {/* <Text style={[styles.iconText, styleIconText]}>{icon.title}</Text> */}
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
