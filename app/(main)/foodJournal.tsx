import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { fontSize, fontWeight, radius, spacing, useThemeColors } from "@/assets/styles";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { addMeal } from "@/utils/foodjournal.repo";
import { FoodItem, ProductData } from "@/utils/types/foodJournal.types";

export type NewFoodItem = Omit<FoodItem, "foodItemId">;

export default function FoodJournal() {
  const { currentUser } = useAuth();
  const userData = useUserInfo();
  const colors = useThemeColors();

  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [foodItems, setFoodItems] = useState<NewFoodItem[]>([]);
  const [currentFoodItem, setCurrentFoodItem] = useState<NewFoodItem>({
    tempClientId: undefined,
    foodName: "",
    calories: null,
    sugar: null,
    protein: null,
    carbs: null,
    fat: null,
  });
  const [foodItemCount, setFoodItemCount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);

  const handleInputChange = (field: keyof FoodItem, value: string) => {
    setCurrentFoodItem((prevItem) => ({
      ...prevItem,
      [field]: value,
    }));
  };

  const checkForProhibitedIngredients = (ingredients: string[]) => {
    const prohibited = userData.profile?.prohibitedIngredients || [];
    return prohibited.filter((p) =>
      ingredients.some((ing) =>
        ing.toLowerCase().includes(p.name.toLowerCase())
      )
    );
  };

  const autofillForm = (product: ProductData) => {
    setCurrentFoodItem({
      tempClientId: undefined,
      foodName: product.productName,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
      sugar: product.sugar,
    });
  };

  // Handles allergy checking and shows appropriate alerts
  const handleProductScanned = (product: ProductData) => {
    setShowScanner(false);
    const foundProhibited = checkForProhibitedIngredients(product.ingredients);

    // If allergens found, show warning with confirmation
    if (foundProhibited.length > 0) {
      const prohibitedNames = foundProhibited.map((p) => p.name).join(", ");
      Alert.alert(
        "Allergy Alert",
        `This product contains: ${prohibitedNames}\n\nYou have marked these as prohibited ingredients.`,
        [
          {
            text: "Close",
            onPress: () => setShowScanner(false),
          },
          {
            text: "Add Anyway",
            style: "destructive",
            onPress: () => {
              // Show second confirmation alert
              Alert.alert(
                "Are you sure?",
                "This product contains ingredients you've marked as prohibited. Add to meal anyway?",
                [
                  { text: "Cancel" },
                  {
                    text: "Yes, Add",
                    onPress: () => autofillForm(product),
                  },
                ]
              );
            },
          },
        ]
      );
    } else {
      // No allergens, show safe message
      Alert.alert(
        "No Allergens Detected",
        `${product.productName}\n\nNo prohibited ingredients detected.`,
        [
          { text: "Close", onPress: () => setShowScanner(false) },
          { text: "Add to Meal", onPress: () => autofillForm(product) },
        ]
      );
    }
  };

  const handleAddItem = () => {
    if (!currentFoodItem.foodName) {
      console.log("Can't add food item with no name");
      return;
    }

    const itemToAdd = {
      ...currentFoodItem,
      tempClientId: Date.now(), // Generate the unique ID here
    };

    // add current foodItem to array
    setFoodItems([...foodItems, itemToAdd]);

    // // 2. Clear the input fields by resetting the current food item state
    setCurrentFoodItem({
      tempClientId: undefined,
      foodName: "",
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      sugar: undefined,
    });

    // // 3. Increment the item counter for the UI (e.g., "Food Item #2")
    setFoodItemCount((foodItemCount) => foodItemCount + 1);
  };

  const handleDeleteItem = (clientIdToDelete: number | undefined) => {
    const newFoodItems = foodItems.filter(
      (item) => item.tempClientId !== clientIdToDelete
    );

    // Update the state with the new array.
    setFoodItems(newFoodItems);
  };

  if (!currentUser) return;

  const handleSubmitMeal = async () => {
    const uid = currentUser?.uid;
    try {
      const temp = await addMeal(mealName, mealType, uid, foodItems);
      setFoodItems([]);
      setMealName("");
      setMealType("breakfast");
      setCurrentFoodItem({
        foodName: "",
        calories: null,
        sugar: null,
        protein: null,
        carbs: null,
        fat: null,
      });
      setFoodItemCount(0);
      setShowAddMealModal(false);
      Alert.alert("Success", "Meal added successfully!");
      console.log("mealId: ", temp);
    } catch (error) {
      console.log("error: ", error);
      Alert.alert("Error", "Failed to add meal");
    }
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
      padding: spacing.lg,
    },
    addButton: {
      backgroundColor: colors.pastelGreen,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    addButtonText: {
      color: colors.pastelGreenText,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    foodItemCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    foodItemName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    foodItemMacros: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    foodItemCalories: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    foodItemCaloriesLabel: {
      fontSize: fontSize.xs,
      color: colors.textTertiary,
      marginTop: spacing.xs,
    },
    deleteButton: {
      backgroundColor: colors.error,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      fontSize: fontSize.xl,
      color: colors.textSecondary,
    },
    formSection: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: radius.md,
      fontSize: fontSize.md,
      color: colors.text,
    },
    scanButton: {
      backgroundColor: colors.pastelGreen,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: "center",
      marginVertical: spacing.md,
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    scanButtonText: {
      color: colors.pastelGreenText,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    secondaryButton: {
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
    secondaryButtonText: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    submitButton: {
      backgroundColor: colors.pastelGreen,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
      alignItems: "center",
      marginTop: spacing.xl,
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    submitButtonText: {
      color: colors.pastelGreenText,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
    emptyState: {
      alignItems: "center",
      padding: spacing.xxl,
    },
    emptyStateText: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Journal</Text>
        <Text style={styles.headerSubtitle}>
          {userData.profile?.firstName || "User"}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Add Meal Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddMealModal(true)}
        >
          <Ionicons name="restaurant" size={20} color={colors.pastelGreenText} />
          <Text style={styles.addButtonText}>Add Meal</Text>
        </TouchableOpacity>

        {/* Food Items List */}
        {foodItems.length > 0 ? (
          <>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.semibold,
                color: colors.text,
                marginBottom: spacing.md,
              }}
            >
              Current Meal: {mealName || "Untitled"}
            </Text>
            {foodItems.map((item) => (
              <View key={item.tempClientId} style={styles.foodItemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodItemName}>{item.foodName}</Text>
                  <Text style={styles.foodItemMacros}>
                    P: {item.protein || 0}g • C: {item.carbs || 0}g • F:{" "}
                    {item.fat || 0}g
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.foodItemCalories}>
                    {item.calories || 0}
                  </Text>
                  <Text style={styles.foodItemCaloriesLabel}>kcal</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.tempClientId)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="close" size={16} color={colors.textInverse} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons 
              name="restaurant-outline" 
              size={64} 
              color={colors.textTertiary} 
            />
            <Text style={styles.emptyStateText}>
              No meals added yet.{"\n"}Tap "Add Meal" to get started!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMealModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Meal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddMealModal(false)}
              >
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Meal Name */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Meal Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Breakfast Bowl"
                  placeholderTextColor={colors.textTertiary}
                  value={mealName}
                  onChangeText={setMealName}
                />
              </View>

              {/* Meal Type */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Meal Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="breakfast, lunch, dinner, snack"
                  placeholderTextColor={colors.textTertiary}
                  value={mealType}
                  onChangeText={setMealType}
                />
              </View>

              {/* Food Item Section */}
              <View style={styles.formSection}>
                <Text
                  style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.bold,
                    color: colors.text,
                    marginBottom: spacing.md,
                  }}
                >
                  Food Item {foodItemCount + 1}
                </Text>

                {/* Scan Barcode Button */}
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setShowScanner(true)}
                >
                  <Ionicons name="scan" size={20} color={colors.pastelGreenText} />
                  <Text style={styles.scanButtonText}>Scan Barcode</Text>
                </TouchableOpacity>

                {/* Food Name */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Food Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Food Name"
                    placeholderTextColor={colors.textTertiary}
                    value={currentFoodItem.foodName.toString()}
                    onChangeText={(text) => handleInputChange("foodName", text)}
                  />
                </View>

                {/* Calories */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Calories</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Calories"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={currentFoodItem.calories?.toString()}
                    onChangeText={(text) => handleInputChange("calories", text)}
                  />
                </View>

                {/* Sugar */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Sugar (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Sugar (g)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={currentFoodItem.sugar?.toString()}
                    onChangeText={(text) => handleInputChange("sugar", text)}
                  />
                </View>

                {/* Carbs */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Carbs (mg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Carbs (mg)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={currentFoodItem.carbs?.toString()}
                    onChangeText={(text) => handleInputChange("carbs", text)}
                  />
                </View>

                {/* Fat */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Fat (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Fat (g)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={currentFoodItem.fat?.toString()}
                    onChangeText={(text) => handleInputChange("fat", text)}
                  />
                </View>

                {/* Protein */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Protein (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Protein (g)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={currentFoodItem.protein?.toString()}
                    onChangeText={(text) => handleInputChange("protein", text)}
                  />
                </View>

                {/* Add Item Button */}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleAddItem}
                >
                  <Ionicons name="add-circle" size={20} color={colors.text} />
                  <Text style={styles.secondaryButtonText}>
                    Add Item to Meal
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Meal Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitMeal}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.pastelGreenText} />
                <Text style={styles.submitButtonText}>
                  Submit Meal
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onProductScanned={handleProductScanned}
      />
    </View>
  );
}
