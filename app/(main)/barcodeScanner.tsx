import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { addMeal } from "@/utils/foodjournal.repo";
import { fetchProductByBarcode } from "@/utils/openfoodfacts.repo";
import { ProductData } from "@/utils/types/foodJournal.types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BarcodeScanner() {
  const { currentUser } = useAuth();
  const userData = useUserInfo();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("snack");

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showModal) {
          setShowModal(false);
          setScanned(false);
          return true;
        }
        return false;
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [showModal])
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>
            We need camera permission to scan barcodes
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            size="lg"
            bg={colors.primary}
          />
        </View>
      </SafeAreaView>
    );
  }

  const checkForProhibitedIngredients = (ingredients: string[]) => {
    const prohibited = userData.profile?.prohibitedIngredients || [];
    const found = prohibited.filter((p) =>
      ingredients.some((ing) =>
        ing.toLowerCase().includes(p.name.toLowerCase())
      )
    );
    return found;
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      const product = await fetchProductByBarcode(data);

      if (!product) {
        Alert.alert(
          "Product Not Found",
          "Could not find product information for this barcode.",
          [{ text: "Scan Again", onPress: () => setScanned(false) }]
        );
        return;
      }

      setProductData(product);

      const foundProhibited = checkForProhibitedIngredients(
        product.ingredients
      );

      if (foundProhibited.length > 0) {
        const prohibitedNames = foundProhibited.map((p) => p.name).join(", ");
        Alert.alert(
          "⚠️ Allergy Alert",
          `This product contains: ${prohibitedNames}\n\nYou have marked these as prohibited ingredients.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => setScanned(false) },
            {
              text: "Add Anyway",
              style: "destructive",
              onPress: () => setShowModal(true),
            },
          ]
        );
      } else {
        Alert.alert(
          "✓ Product Safe",
          `${product.productName}\n\nNo prohibited ingredients detected.`,
          [
            { text: "Cancel", onPress: () => setScanned(false) },
            { text: "Add to Journal", onPress: () => setShowModal(true) },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch product information. Please try again.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddToJournal = async () => {
    if (!currentUser || !productData) return;

    if (!mealName.trim()) {
      Alert.alert("Error", "Please enter a meal name");
      return;
    }

    setLoading(true);
    try {
      const foodItem = {
        foodName: productData.productName,
        calories: productData.calories || null,
        protein: productData.protein || null,
        carbs: productData.carbs || null,
        fat: productData.fat || null,
        sugar: productData.sugar || null,
      };

      await addMeal(mealName.trim(), mealType, currentUser.uid, [foodItem]);

      Alert.alert("Success", "Product added to food journal!", [
        {
          text: "OK",
          onPress: () => {
            setShowModal(false);
            setScanned(false);
            setProductData(null);
            setMealName("");
            setMealType("snack");
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to add product to journal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f6" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <Text style={styles.headerSubtitle}>
          Scan a product barcode to check ingredients
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
            ],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea} />
            <Text style={styles.scanText}>
              {loading ? "Checking product..." : "Position barcode in frame"}
            </Text>
          </View>
        </CameraView>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <View style={styles.footer}>
        <Button
          title="Back to Home"
          onPress={() => router.back()}
          size="lg"
          bg={colors.gray}
          fullWidth
        />
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowModal(false);
          setScanned(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add to Food Journal</Text>

              {productData && (
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {productData.productName}
                  </Text>
                  
                  {productData.servingSize && (
                    <Text style={styles.servingSize}>
                      Serving Size: {productData.servingSize}
                    </Text>
                  )}

                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Calories:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.calories || "N/A"} kcal
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Protein:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.protein || "N/A"}g
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Carbs:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.carbs || "N/A"}g
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Fat:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.fat || "N/A"}g
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Sugar:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.sugar || "N/A"}g
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Fiber:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.fiber || "N/A"}g
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Sodium:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.sodium || "N/A"}mg
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Saturated Fat:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.saturatedFat || "N/A"}g
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Trans Fat:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.transFat || "N/A"}g
                    </Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Cholesterol:</Text>
                    <Text style={styles.nutritionValue}>
                      {productData.cholesterol || "N/A"}mg
                    </Text>
                  </View>

                  {productData.ingredients.length > 0 && (
                    <View style={styles.ingredientsSection}>
                      <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                      <Text style={styles.ingredientsText}>
                        {productData.ingredients.join(", ")}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Meal Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Morning Snack"
                  value={mealName}
                  onChangeText={setMealName}
                />

                <Text style={styles.inputLabel}>Meal Type</Text>
                <View style={styles.mealTypeRow}>
                  {["breakfast", "lunch", "dinner", "snack"].map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.mealTypeButton,
                        mealType === type && styles.mealTypeButtonActive,
                      ]}
                      onPress={() => setMealType(type)}
                    >
                      <Text
                        style={[
                          styles.mealTypeText,
                          mealType === type && styles.mealTypeTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowModal(false);
                    setScanned(false);
                    setProductData(null);
                    setMealName("");
                  }}
                  size="lg"
                  bg={colors.gray}
                  fullWidth
                  disabled={loading}
                />
                <Button
                  title={loading ? "Adding..." : "Add to Journal"}
                  onPress={handleAddToJournal}
                  size="lg"
                  bg={colors.primary}
                  fullWidth
                  disabled={loading}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f6",
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  scanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  footer: {
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  productInfo: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  nutritionLabel: {
    fontSize: 14,
    color: "#666",
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  ingredientsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  ingredientsText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  mealTypeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  mealTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mealTypeText: {
    fontSize: 14,
    color: "#666",
  },
  mealTypeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  modalActions: {
    gap: 12,
  },
});