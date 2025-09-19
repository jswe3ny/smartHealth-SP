import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type HeaderProps = {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Header({ title, subtitle, style, textStyle }: HeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, textStyle]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center", // centers everything horizontally
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
});
