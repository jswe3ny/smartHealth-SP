import React from "react";
import {
  GestureResponderEvent,
  Pressable,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { makeButtonStyles } from "../assets/styles/componentStyles/button";

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  size?: "sm" | "md" | "lg";
  bg?: string;
  color?: string;
  radius?: number;
  disabled?: boolean;
  loading?: boolean;

  // layout toggles
  fullWidth?: boolean;
  width?: number | string;

  // fine‑grained overrides when needed
  paddingVertical?: number;
  paddingHorizontal?: number;
  fontSize?: number;

  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
};

export const Button = ({
  title,
  onPress,
  style,
  textStyle,
  fullWidth,
  loading,
  disabled,
  ...opts
}: Props) => {
  const s = makeButtonStyles({ ...opts, disabled });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.button,
        fullWidth && { alignSelf: "stretch" },
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      <Text style={[s.text, textStyle]}>{loading ? "..." : title}</Text>
    </Pressable>
  );
};
