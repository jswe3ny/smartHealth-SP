import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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

import {
  fontSize,
  fontWeight,
  neutralColors,
  radius,
  spacing,
  useThemeColors,
} from "@/assets/styles";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { checkForAllergens, getAllergenAlertMessage, getSeverityText } from "@/utils/allergen.detector";
import { addMeal, getRecentMealSummaries } from "@/utils/foodjournal.repo";
import { calculateDailyNutritionFromMeals } from "@/utils/nutrition.repo";
import {
  FoodItem,
  MealSummary,
  ProductData,
} from "@/utils/types/foodJournal.types";
import { Link } from "expo-router";

export type NewFoodItem = Omit<FoodItem, "foodItemId">;

export default function FoodJournal() {
  const { currentUser } = useAuth();
  const userData = useUserInfo();
  const colors = useThemeColors();

  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [showMealTypePicker, setShowMealTypePicker] = useState(false);
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

  const [mealSummary, setMealSummary] = useState<MealSummary[]>([]);

  // Real-time meal updates
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = getRecentMealSummaries(
      currentUser.uid,
      (updatedMeals) => {
        setMealSummary(updatedMeals);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleInputChange = (field: keyof FoodItem, value: string) => {
    setCurrentFoodItem((prevItem) => ({
      ...prevItem,
      [field]: value,
    }));
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
    setShowAddMealModal(true);
  };

  // Handles allergy checking and shows appropriate alerts
  const handleProductScanned = (product: ProductData) => {
    setShowScanner(false);
    // Don't reopen form modal yet - wait for user to choose from alert
    setShowAddMealModal(false);
    const prohibited = userData.profile?.prohibitedIngredients || [];
const allergenMatches = checkForAllergens(product.ingredients, prohibited);

// If allergens found, show warning with confirmation
if (allergenMatches.length > 0) {
  const alertMessage = getAllergenAlertMessage(allergenMatches);
  const highestSeverity = Math.max(...allergenMatches.map(m => m.severity));
  const severityText = getSeverityText(highestSeverity);
  
  Alert.alert(
    `🚨 ${severityText} ALLERGEN WARNING`,
    `${product.productName}\n\n${alertMessage}\n\n⚠️ DISCLAIMER: Always verify ingredients on the physical product label.`,
        [
          {
            text: "Close",
            onPress: () => setShowAddMealModal(true),
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
                  { text: "Cancel", 
                    onPress: () => setShowAddMealModal(true)
                  },
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
        "✅ No Known Allergens Detected",
        `${product.productName}\n\nNo prohibited ingredients detected.\n\n⚠️ DISCLAIMER: Always verify ingredients on the physical product label.`,
        [
          { text: "Close", onPress: () => setShowAddMealModal(true) },
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

      // Update daily nutrition data
      try {
        await calculateDailyNutritionFromMeals(uid, new Date());
      } catch (nutritionError) {
        console.error("Error updating nutrition data:", nutritionError);
      }

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
      shadowColor: neutralColors.black,
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
    dropdownButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      backgroundColor: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    dropdownButtonText: {
      fontSize: 16,
      color: '#333',
    },
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    pickerModal: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 16,
      textAlign: 'center',
    },
    pickerOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    pickerOptionText: {
      fontSize: 16,
      color: '#333',
    },
    pickerCancelButton: {
      marginTop: 12,
      paddingVertical: 14,
      backgroundColor: '#F5F5F5',
      borderRadius: 8,
      alignItems: 'center',
    },
    pickerCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#666',
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
    mealSummarySection: {
      marginTop: spacing.xl,
    },
    mealSummaryTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    mealSummaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: neutralColors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    mealSummaryName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
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
          <Ionicons
            name="restaurant"
            size={20}
            color={colors.pastelGreenText}
          />
          <Text style={styles.addButtonText}>Add Meal</Text>
        </TouchableOpacity>

        {/* Food Items List */}
        {foodItems.length > 0 && (
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
                    <Ionicons
                      name="close"
                      size={16}
                      color={colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State - Only show when no current meal AND no recent meals */}
        {foodItems.length === 0 &&
          (!mealSummary || mealSummary.length === 0) && (
            <View style={styles.emptyState}>
              <Ionicons
                name="restaurant-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyStateText}>
                No meals added yet.{"\n"}Tap &quot;Add Meal&quot; to get
                started!
              </Text>
            </View>
          )}

        {/* Previous Meals Section - from team's version */}
        {mealSummary && mealSummary.length > 0 && (
          <View style={styles.mealSummarySection}>
            <Text style={styles.mealSummaryTitle}>Recent Meals</Text>
            {mealSummary.map((item) => (
              <Link key={item.id} href={`./meals/${item.id}`} asChild>
                <TouchableOpacity style={styles.mealSummaryCard}>
                  <Text style={styles.mealSummaryName}>
                    {item.mealName || "Unnamed Meal"}
                  </Text>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal && !showScanner}
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
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowMealTypePicker(true)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
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
                  <Ionicons
                    name="scan"
                    size={20}
                    color={colors.pastelGreenText}
                  />
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

              {/* Current Food Items List */}
              {foodItems.length > 0 && (
                <View style={styles.formSection}>
                  <Text style={styles.label}>Items in this meal ({foodItems.length})</Text>
                  {foodItems.map((item, index) => (
                    <View key={item.tempClientId || index} style={styles.foodItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodItemName}>{item.foodName}</Text>
                        <Text style={styles.foodItemMacros}>
                          {item.calories ? `${item.calories} cal` : ''} 
                          {item.protein ? ` • ${item.protein}g protein` : ''} 
                          {item.carbs ? ` • ${item.carbs}g carbs` : ''} 
                          {item.fat ? ` • ${item.fat}g fat` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          setFoodItems(foodItems.filter((_, i) => i !== index));
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}    
              
              {/* Submit Meal Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitMeal}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.pastelGreenText}
                />
                <Text style={styles.submitButtonText}>Submit Meal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Meal Type Picker Modal */}
      <Modal
        visible={showMealTypePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMealTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowMealTypePicker(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Meal Type</Text>
            
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setMealType('breakfast');
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>🌅 Breakfast</Text>
              {mealType === 'breakfast' && (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setMealType('lunch');
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>☀️ Lunch</Text>
              {mealType === 'lunch' && (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setMealType('dinner');
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>🌙 Dinner</Text>
              {mealType === 'dinner' && (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setMealType('snack');
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>🍿 Snack</Text>
              {mealType === 'snack' && (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setShowMealTypePicker(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <BarcodeScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onProductScanned={handleProductScanned}
        />
      </Modal>
    </View>
  );
}