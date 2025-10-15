import React from 'react';
import { Image, ViewStyle } from 'react-native';

type LogoProps = {
  size?: number;
  style?: ViewStyle;
};

export const AppLogo = ({ size = 36, style }: LogoProps) => {
  return (
    <Image
      source={require('@/assets/images/app-logo.png')}
      style={[
        {
          width: size,
          height: size,
        },
        style
      ]}
      resizeMode="contain"
    />
  );
};

