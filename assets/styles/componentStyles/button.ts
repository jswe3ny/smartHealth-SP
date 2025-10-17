// assets/styles/components.ts
import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "../tokens";

type ButtonSize = "sm" | "md" | "lg";

type ButtonOpts = {
  bg?: string; // background color override
  color?: string; // text color override
  size?: ButtonSize; // paddings by size
  radius?: number; // border radius override
  fullWidth?: boolean; // make button 100% width
  disabled?: boolean; // apply disabled look

  // optional manual overrides
  paddingVertical?: number;
  paddingHorizontal?: number;
  fontSize?: number;
};

/**
 * Usage:
 *   const s = makeButtonStyles({ bg: '#111', color: '#fff', size: 'lg' });
 *   <Pressable style={[s.button, s.fullWidth]}><Text style={s.text}>Buy</Text></Pressable>
 */
export function makeButtonStyles(opts: ButtonOpts = {}) {
  const {
    bg = colors.primary,
    color = "#FFFFFF", // Feel free to change anytime, colors.white was deleted and this was throwing error.
    size = "md",
    radius: r = radius.md,
    disabled = false,

    // size overrides:
    paddingVertical,
    paddingHorizontal,
    fontSize,
  } = opts;

  const sizeMap = {
    sm: { padV: spacing.sm, padH: spacing.lg, font: 14 },
    md: { padV: spacing.md, padH: spacing.xl, font: 16 },
    lg: { padV: spacing.lg, padH: spacing.xl * 1.25, font: 18 },
  };

  const { padV, padH, font } = sizeMap[size];

  return StyleSheet.create({
    button: {
      backgroundColor: bg,
      borderRadius: r,
      paddingVertical: paddingVertical ?? padV,
      paddingHorizontal: paddingHorizontal ?? padH,
      alignItems: "center",
      justifyContent: "center",
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      color,
      fontSize: fontSize ?? font,
      fontWeight: "600",
    },
  });
}
