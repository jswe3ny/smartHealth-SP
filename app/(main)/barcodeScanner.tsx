import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useUserInfo } from "@/hooks/useUserInfo";
import { ProductData } from "@/utils/types/foodJournal.types";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";

export default function BarcodeScannerPage() {
  const router = useRouter();
  const userData = useUserInfo();
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
        "Allergy Alert",
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
        "No Allergens Detected",
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

  return (
    <View style={{ flex: 1 }}>
      {!showScanner ? (
        <Text>Wait</Text>
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
