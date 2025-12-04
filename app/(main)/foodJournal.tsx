import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { spacing } from "@/assets/styles";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import {
  checkForAllergens,
  getAllergenAlertMessage,
  getSeverityText,
} from "@/utils/allergen.detector";
import {
  addMeal,
  deleteMealByID,
  getMealDetailsById,
  getRecentMealSummaries,
} from "@/utils/foodjournal.repo";
import { calculateDailyNutritionFromMeals } from "@/utils/nutrition.repo";
import {
  FoodItem,
  MealDetails,
  MealSummary,
  ProductData,
} from "@/utils/types/foodJournal.types";
import { SafeAreaView } from "react-native-safe-area-context";

export type NewFoodItem = Omit<FoodItem, "foodItemId">;

export default function FoodJournal() {
  const { currentUser } = useAuth();
  const userData = useUserInfo();
  //const colors = useThemeColors();

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

  // Meal Details Modal States
  const [showMealDetailsModal, setShowMealDetailsModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedMealDetails, setSelectedMealDetails] =
    useState<MealDetails | null>(null);
  const [loadingMealDetails, setLoadingMealDetails] = useState(false);
  const [duplicatingMeal, setDuplicatingMeal] = useState(false);

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
    // Validate numeric fields
    if (['calories', 'protein', 'carbs', 'fat', 'sugar'].includes(field as string)) {
      // Allow empty string
      if (value === '') {
        setCurrentFoodItem((prevItem) => ({
          ...prevItem,
          [field]: '',
        }));
        return;
      }
    
      // Remove any non-numeric characters except decimal point
      let cleaned = value.replace(/[^\d.]/g, '');
    
      // Only allow one decimal point
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
    
      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        return; // Don't allow more than 2 decimal places
      }
    
      // Check for negative (don't allow)
      const numValue = parseFloat(cleaned || '0');
      if (numValue < 0) {
        return;
      }
    
      // Limit maximum value to 9999
      if (numValue > 9999) {
        return;
      }
    
      // Update with the cleaned value as-is (preserves ".", ".1", etc.)
      setCurrentFoodItem((prevItem) => ({
        ...prevItem,
        [field]: cleaned,
      }));
    } else {
      // For non-numeric fields
      setCurrentFoodItem((prevItem) => ({
        ...prevItem,
        [field]: value,
      }));
    }
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
    setShowAddMealModal(false);
    const prohibited = userData.profile?.prohibitedIngredients || [];
    const allergenMatches = checkForAllergens(product.ingredients, prohibited);

    if (allergenMatches.length > 0) {
      const alertMessage = getAllergenAlertMessage(allergenMatches);
      const highestSeverity = Math.max(
        ...allergenMatches.map((m) => m.severity)
      );
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
              Alert.alert(
                "Are you sure?",
                "This product contains ingredients you've marked as prohibited. Add to meal anyway?",
                [
                  { text: "Cancel", onPress: () => setShowAddMealModal(true) },
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
    if (!currentFoodItem.foodName || currentFoodItem.foodName.trim() === "") {
      Alert.alert(
        "Missing Food Name",
        "Please enter a food name before adding the item to your meal."
      );
      return;
    }

    const itemToAdd = {
      ...currentFoodItem,
      tempClientId: Date.now(),
    };

    setFoodItems([...foodItems, itemToAdd]);

    setCurrentFoodItem({
      tempClientId: undefined,
      foodName: "",
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      sugar: undefined,
    });

    setFoodItemCount((foodItemCount) => foodItemCount + 1);
  };

  const handleDeleteItem = (clientIdToDelete: number | undefined) => {
    const newFoodItems = foodItems.filter(
      (item) => item.tempClientId !== clientIdToDelete
    );
    setFoodItems(newFoodItems);
  };

  // Handle meal click to show details modal
  const handleMealClick = async (mealId: string) => {
    setSelectedMealId(mealId);
    setShowMealDetailsModal(true);
    setLoadingMealDetails(true);

    try {
      const details = await getMealDetailsById(mealId);
      setSelectedMealDetails(details);
    } catch (error) {
      console.error("Error loading meal details:", error);
      Alert.alert("Error", "Failed to load meal details");
    } finally {
      setLoadingMealDetails(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!selectedMealId) return;

    Alert.alert("Delete Meal", "Are you sure you want to delete this meal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMealByID(selectedMealId);
            setShowMealDetailsModal(false);
            setSelectedMealDetails(null);
            setSelectedMealId(null);
          } catch (error) {
            Alert.alert("Error", "Failed to delete meal");
          }
        },
      },
    ]);
  };

  const handleDuplicateMeal = async () => {
    if (!selectedMealDetails || !currentUser) return;

    // Ask user which meal type
    Alert.alert("Duplicate Meal", "Which meal type is this?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Breakfast",
        onPress: () => duplicateMealWithType("breakfast"),
      },
      {
        text: "Lunch",
        onPress: () => duplicateMealWithType("lunch"),
      },
      {
        text: "Dinner",
        onPress: () => duplicateMealWithType("dinner"),
      },
      {
        text: "Snack",
        onPress: () => duplicateMealWithType("snack"),
      },
    ]);
  };

  const duplicateMealWithType = async (type: string) => {
    if (!selectedMealDetails || !currentUser) return;

    setDuplicatingMeal(true);

    try {
      // Extract food items without foodItemId
      const foodItemsForDuplicate = selectedMealDetails.foodItems.map(
        (item) => ({
          foodName: item.foodName,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          sugar: item.sugar,
        })
      );

      // Add the meal with selected type and current timestamp
      await addMeal(
        selectedMealDetails.mealName || "Duplicated Meal",
        type,
        currentUser.uid,
        foodItemsForDuplicate
      );

      setShowMealDetailsModal(false);
      setSelectedMealDetails(null);
      setSelectedMealId(null);
      Alert.alert("Success", `Meal added as ${type}!`);
    } catch (error) {
      console.error("Error duplicating meal:", error);
      Alert.alert("Error", "Failed to duplicate meal");
    } finally {
      setDuplicatingMeal(false);
    }
  };

  if (!currentUser) return;

  const handleSubmitMeal = async () => {
    const uid = currentUser?.uid;
    try {
      const temp = await addMeal(mealName, mealType, uid, foodItems);

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
      backgroundColor: "#f5f5f5",
    },
    header: {
      backgroundColor: "#fff",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#000",
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: "#666",
    },
    content: {
      padding: 16,
    },
    addButton: {
      backgroundColor: "#2196F3",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 16,
      shadowColor: "#2196F3",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    foodItemCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: "#F0F0F0",
    },
    foodItemName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#000",
      marginBottom: 4,
    },
    foodItemMacros: {
      fontSize: 13,
      color: "#666",
    },
    foodItemCalories: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FF5722",
    },
    foodItemCaloriesLabel: {
      fontSize: 11,
      color: "#999",
      marginTop: 4,
    },
    deleteButton: {
      backgroundColor: "#F44336",
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    dropdownButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#D1D5DB",
      borderRadius: 8,
      backgroundColor: "#fff",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    dropdownButtonText: {
      fontSize: 16,
      color: "#111",
    },
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    pickerModal: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 20,
      width: "100%",
      maxWidth: 400,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 16,
      textAlign: "center",
    },
    pickerOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F0F0",
    },
    pickerOptionText: {
      fontSize: 16,
      color: "#333",
    },
    pickerCancelButton: {
      marginTop: 12,
      paddingVertical: 14,
      backgroundColor: "#F5F5F5",
      borderRadius: 8,
      alignItems: "center",
    },
    pickerCancelText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#666",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: "#F9FAFB",
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      maxHeight: "90%",
      width: "100%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#000",
      marginBottom: 20,
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      fontSize: 20,
      color: "#666",
    },
    formSection: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: "#000",
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: "#D1D5DB",
      backgroundColor: "#fff",
      padding: spacing.md,
      borderRadius: 8,
      fontSize: 16,
      color: "#111",
    },
    scanButton: {
      backgroundColor: "#4CAF50",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      marginVertical: 12,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#4CAF50",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    scanButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButton: {
      backgroundColor: "#2196F3",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 12,
      borderWidth: 1,
      borderColor: "#1976D2",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#2196F3",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    secondaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    submitButton: {
      backgroundColor: "#4CAF50",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 24,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#4CAF50",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    emptyState: {
      alignItems: "center",
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: "#666",
      textAlign: "center",
      marginTop: 12,
    },
    mealSummarySection: {
      marginTop: spacing.xl,
    },
    mealSummaryTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#000",
      marginBottom: 12,
    },
    mealSummaryCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: "#F0F0F0",
    },
    mealSummaryName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#000",
    },
    mealCardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    mealHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    mealDateText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#2196F3",
    },
    mealTimeText: {
      fontSize: 13,
      color: "#666",
      marginTop: 4,
    },
    mealCalories: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#FF5722",
    },
    // Meal Details Modal Styles
    mealDetailsModal: {
      backgroundColor: "#fff",
      borderRadius: 16,
      width: "90%",
      maxHeight: "80%",
      marginHorizontal: "5%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    mealDetailsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    mealDetailsTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#000",
      flex: 1,
    },
    loadingContainer: {
      padding: 40,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: "#666",
    },
    mealDetailsContent: {
      padding: 20,
    },
    mealTypeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#2196F3",
      marginRight: 8,
    },
    foodItemsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#000",
      marginBottom: 12,
    },
    foodDetailCard: {
      backgroundColor: "#F9FAFB",
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    foodDetailName: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#000",
      marginBottom: 8,
    },
    foodDetailText: {
      fontSize: 14,
      color: "#666",
      marginTop: 4,
    },
    mealActionButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
    },
    duplicateMealButton: {
      flex: 1,
      backgroundColor: "#2196F3",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 12,
      gap: 8,
    },
    duplicateMealButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    deleteMealButton: {
      flex: 1,
      backgroundColor: "#F44336",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 12,
      gap: 8,
    },
    deleteMealButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
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
          <Ionicons name="restaurant" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Meal</Text>
        </TouchableOpacity>

        {/* Food Items List */}
        {foodItems.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#000",
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
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State */}
        {foodItems.length === 0 &&
          (!mealSummary || mealSummary.length === 0) && (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#999" />
              <Text style={styles.emptyStateText}>
                No meals added yet.{"\n"}Tap &quot;Add Meal&quot; to get
                started!
              </Text>
            </View>
          )}

        {/* Today's Meals & Past Meals Sections */}
        {mealSummary &&
          mealSummary.length > 0 &&
          (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaysMeals = mealSummary.filter((meal) => {
              const mealDate = meal.mealTime.toDate();
              mealDate.setHours(0, 0, 0, 0);
              return mealDate.getTime() === today.getTime();
            });

            const pastMeals = mealSummary.filter((meal) => {
              const mealDate = meal.mealTime.toDate();
              mealDate.setHours(0, 0, 0, 0);
              return mealDate.getTime() < today.getTime();
            });

            return (
              <>
                {/* Today's Meals Section */}
                {todaysMeals.length > 0 && (
                  <View style={styles.mealSummarySection}>
                    <Text style={styles.mealSummaryTitle}>
                      Today&apos;s Meals
                    </Text>
                    {todaysMeals.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.mealSummaryCard}
                        onPress={() => handleMealClick(item.id)}
                      >
                        <View style={styles.mealCardContent}>
                          <View>
                            <View style={styles.mealHeaderRow}>
                              <Text style={styles.mealTypeText}>
                                {item.mealType
                                  ? item.mealType.charAt(0).toUpperCase() +
                                    item.mealType.slice(1)
                                  : "Meal"}
                              </Text>
                              <Text style={styles.mealSummaryName}>
                                {item.mealName || "Unnamed Meal"}
                              </Text>
                            </View>
                            <Text style={styles.mealTimeText}>
                              {item.mealTime
                                .toDate()
                                .toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                            </Text>
                          </View>
                          {item.totalCalories > 0 && (
                            <Text style={styles.mealCalories}>
                              {item.totalCalories} cal
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Past Meals Section */}
                {pastMeals.length > 0 && (
                  <View style={styles.mealSummarySection}>
                    <Text style={styles.mealSummaryTitle}>Past Meals</Text>
                    {pastMeals.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.mealSummaryCard}
                        onPress={() => handleMealClick(item.id)}
                      >
                        <View style={styles.mealCardContent}>
                          <View>
                            <View style={styles.mealHeaderRow}>
                              <Text style={styles.mealDateText}>
                                {item.mealTime
                                  .toDate()
                                  .toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                              </Text>
                              <Text style={styles.mealSummaryName}>
                                {item.mealName || "Unnamed Meal"}
                              </Text>
                            </View>
                            <Text style={styles.mealTimeText}>
                              {item.mealTime
                                .toDate()
                                .toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                            </Text>
                          </View>
                          {item.totalCalories > 0 && (
                            <Text style={styles.mealCalories}>
                              {item.totalCalories} cal
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            );
          })()}
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
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Meal Name */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Meal Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Breakfast Bowl"
                  placeholderTextColor="#999"
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
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#000",
                    marginBottom: 12,
                  }}
                >
                  Food Item {foodItemCount + 1}
                </Text>

                {/* Scan Barcode Button */}
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setShowScanner(true)}
                >
                  <Ionicons name="scan" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Scan Barcode</Text>
                </TouchableOpacity>

                {/* Food Name */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Food Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Food Name"
                    placeholderTextColor="#999"
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
                    placeholderTextColor="#999"
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
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={currentFoodItem.sugar?.toString()}
                    onChangeText={(text) => handleInputChange("sugar", text)}
                  />
                </View>

                {/* Carbs */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>Carbs (g)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Carbs (g)"
                    placeholderTextColor="#999"
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
                    placeholderTextColor="#999"
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
                    placeholderTextColor="#999"
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
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.secondaryButtonText}>
                    Add Item to Meal
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Current Food Items List */}
              {foodItems.length > 0 && (
                <View style={styles.formSection}>
                  <Text style={styles.label}>
                    Items in this meal ({foodItems.length})
                  </Text>
                  {foodItems.map((item, index) => (
                    <View
                      key={item.tempClientId || index}
                      style={styles.foodItemCard}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodItemName}>{item.foodName}</Text>
                        <Text style={styles.foodItemMacros}>
                          {item.calories ? `${item.calories} cal` : ""}
                          {item.protein ? ` • ${item.protein}g protein` : ""}
                          {item.carbs ? ` • ${item.carbs}g carbs` : ""}
                          {item.fat ? ` • ${item.fat}g fat` : ""}
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
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Meal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Meal Details Modal */}
      <Modal
        visible={showMealDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMealDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mealDetailsModal}>
            {/* Header */}
            <View style={styles.mealDetailsHeader}>
              <Text style={styles.mealDetailsTitle}>
                {selectedMealDetails?.mealName || "Meal Details"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowMealDetailsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Loading State */}
            {loadingMealDetails && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading meal details...</Text>
              </View>
            )}

            {/* Meal Details Content */}
            {!loadingMealDetails && selectedMealDetails && (
              <ScrollView style={styles.mealDetailsContent}>
                <Text style={styles.foodItemsTitle}>Food Items</Text>

                {selectedMealDetails.foodItems.map((item, index) => (
                  <View key={index} style={styles.foodDetailCard}>
                    <Text style={styles.foodDetailName}>{item.foodName}</Text>

                    {item.calories != null && (
                      <Text style={styles.foodDetailText}>
                        Calories: {item.calories}
                      </Text>
                    )}

                    {item.protein != null && (
                      <Text style={styles.foodDetailText}>
                        Protein: {item.protein}g
                      </Text>
                    )}

                    {item.carbs != null && (
                      <Text style={styles.foodDetailText}>
                        Carbs: {item.carbs}g
                      </Text>
                    )}

                    {item.fat != null && (
                      <Text style={styles.foodDetailText}>
                        Fat: {item.fat}g
                      </Text>
                    )}

                    {item.sugar != null && (
                      <Text style={styles.foodDetailText}>
                        Sugar: {item.sugar}g
                      </Text>
                    )}
                  </View>
                ))}

                {/* Action Buttons */}
                <SafeAreaView style={styles.mealActionButtons}>
                  <TouchableOpacity
                    style={styles.duplicateMealButton}
                    onPress={handleDuplicateMeal}
                    disabled={duplicatingMeal}
                  >
                    <Ionicons name="copy" size={20} color="#fff" />
                    <Text style={styles.duplicateMealButtonText}>
                      {duplicatingMeal ? "Duplicating..." : "Duplicate Meal"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteMealButton}
                    onPress={handleDeleteMeal}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.deleteMealButtonText}>Delete Meal</Text>
                  </TouchableOpacity>
                </SafeAreaView>
              </ScrollView>
            )}
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
                setMealType("breakfast");
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>🌅 Breakfast</Text>
              {mealType === "breakfast" && (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setMealType("lunch");
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>☀️ Lunch</Text>
              {mealType === "lunch" && (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setMealType("dinner");
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>🌙 Dinner</Text>
              {mealType === "dinner" && (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setMealType("snack");
                setShowMealTypePicker(false);
              }}
            >
              <Text style={styles.pickerOptionText}>🍿 Snack</Text>
              {mealType === "snack" && (
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
