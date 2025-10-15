import {
    fontSize,
    fontWeight,
    radius,
    spacing,
    useThemeColors,
} from "@/assets/styles";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useUserInfo } from "@/hooks/useUserInfo";
import { ProductData } from "@/utils/types/foodJournal.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function BarcodeScannerPage() {
  const router = useRouter();
  const userData = useUserInfo();
  const colors = useThemeColors();
  const [showScanner, setShowScanner] = useState(true);

  const checkForProhibitedIngredients = (ingredients: string[]) => {
    const prohibited = userData.profile?.prohibitedIngredients || [];
    return prohibited.filter((p) =>
      ingredients.some((ing) =>
        ing.toLowerCase().includes(p.name.toLowerCase())
      )
    );
  };

  const handleProductScanned = (product: ProductData) => {
    setShowScanner(false);

    const foundProhibited = checkForProhibitedIngredients(product.ingredients);

    if (foundProhibited.length > 0) {
      const prohibitedNames = foundProhibited.map((p) => p.name).join(", ");
      Alert.alert(
        "⚠️ Allergy Alert",
        `This product contains: ${prohibitedNames}\n\nYou have marked these as prohibited ingredients.`,
        [
          {
            text: "Close",
            onPress: () => router.back(),
          },
          {
            text: "See Nutrition Info",
            onPress: () => showNutritionInfo(product),
          },
        ]
      );
    } else {
      Alert.alert(
        "✅ No Allergens Detected",
        `${product.productName}\n\nNo prohibited ingredients detected.`,
        [
          {
            text: "Close",
            onPress: () => router.back(),
          },
          {
            text: "See Nutrition Info",
            onPress: () => showNutritionInfo(product),
          },
        ]
      );
    }
  };

  const showNutritionInfo = (product: ProductData) => {
    const nutritionInfo = `
Product: ${product.productName}

Nutrition Facts (per 100g):
${product.servingSize ? `Serving Size: ${product.servingSize}\n` : ""}
Calories: ${product.calories || "N/A"} kcal
Protein: ${product.protein || "N/A"}g
Carbs: ${product.carbs || "N/A"}g
Fat: ${product.fat || "N/A"}g
Sugar: ${product.sugar || "N/A"}g
${product.fiber ? `Fiber: ${product.fiber}g\n` : ""}${
      product.sodium ? `Sodium: ${product.sodium}mg\n` : ""
    }
${
  product.ingredients.length > 0
    ? `\nIngredients:\n${product.ingredients.join(", ")}`
    : ""
}
    `.trim();

    Alert.alert("Product Information", nutritionInfo, [
      {
        text: "Scan Another",
        onPress: () => setShowScanner(true),
      },
      {
        text: "Close",
        onPress: () => router.back(),
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    infoTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    infoText: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    scanButton: {
      backgroundColor: colors.pastelGreen,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    scanButtonText: {
      color: colors.pastelGreenText,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
    backButton: {
      backgroundColor: colors.backgroundTertiary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: "center",
      marginTop: spacing.md,
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    backButtonText: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    instructionsContainer: {
      marginTop: spacing.xl,
      padding: spacing.lg,
      backgroundColor: colors.infoBackground,
      borderRadius: radius.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.info,
    },
    instructionsTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    instructionItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    instructionText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <Text style={styles.headerSubtitle}>
          {userData.profile?.firstName || "User"}
        </Text>
      </View>

      {!showScanner ? (
        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Ready to Scan</Text>
            <Text style={styles.infoText}>
              Position the barcode within the camera frame and the scanner will
              automatically detect it.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Ionicons name="scan" size={24} color={colors.pastelGreenText} />
            <Text style={styles.scanButtonText}>Start Scanning</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.backButtonText}>Back to Food Journal</Text>
          </TouchableOpacity>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How it works:</Text>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.info} />
              <Text style={styles.instructionText}>
                Point your camera at any product barcode
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.info} />
              <Text style={styles.instructionText}>
                We'll check for any prohibited ingredients you've set
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.info} />
              <Text style={styles.instructionText}>
                View complete nutrition information instantly
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <BarcodeScanner
          visible={showScanner}
          onClose={() => router.back()}
          onProductScanned={handleProductScanned}
        />
      )}
    </View>
  );
}
