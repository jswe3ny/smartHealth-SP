import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useUserInfo } from "@/hooks/useUserInfo";
import { ProductData } from "@/utils/types/foodJournal.types";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";

export default function BarcodeScannerPage() {
  const router = useRouter();
  const userData = useUserInfo();
  const [showScanner, setShowScanner] = useState(true);

  const handleProductScanned = (product: ProductData) => {
    // Display product info in an alert
    const nutritionInfo = `
Product: ${product.productName}

Nutrition Facts (per 100g):
${product.servingSize ? `Serving Size: ${product.servingSize}\n` : ''}
Calories: ${product.calories || 'N/A'} kcal
Protein: ${product.protein || 'N/A'}g
Carbs: ${product.carbs || 'N/A'}g
Fat: ${product.fat || 'N/A'}g
Sugar: ${product.sugar || 'N/A'}g
${product.fiber ? `Fiber: ${product.fiber}g\n` : ''}${product.sodium ? `Sodium: ${product.sodium}mg\n` : ''}
${product.ingredients.length > 0 ? `\nIngredients:\n${product.ingredients.join(", ")}` : ''}
    `.trim();

    Alert.alert("Product Information", nutritionInfo, [
      { 
        text: "Scan Another", 
        onPress: () => setShowScanner(true) 
      },
      {
        text: "Close",
        onPress: () => router.back()
      }
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <BarcodeScanner
        visible={showScanner}
        onClose={() => router.back()}
        onProductScanned={handleProductScanned}
        prohibitedIngredients={userData.profile?.prohibitedIngredients || []}
      />
    </View>
  );
}