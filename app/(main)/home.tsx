import { useThemeColors } from "@/assets/styles";
import { AppLogo } from "@/components/AppLogo";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import {
  checkForAllergens,
  getAllergenAlertMessage,
  getSeverityText,
} from "@/utils/allergen.detector";
import { getLastWeekHealthData } from "@/utils/health.repo";
import { calculateDailyNutritionFromMeals } from "@/utils/nutrition.repo";
import { ProductData } from "@/utils/types/foodJournal.types";
import { DailyHealthData } from "@/utils/types/health.types";
import { Goal } from "@/utils/types/user.types";
import { deleteGoal, updateGoal, updateUserInfo } from "@/utils/user.repo";
import { Ionicons } from "@expo/vector-icons";
import { Timestamp } from "@react-native-firebase/firestore";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const { currentUser, accountSignOut } = useAuth();
  const userData = useUserInfo();
  const colors = useThemeColors();

  const [showQuickScan, setShowQuickScan] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(
    null
  );
  const [healthData, setHealthData] = useState<DailyHealthData | null>(null);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    description: "",
    type: "" as
      | ""
      | "steps"
      | "distance"
      | "totalCalories"
      | "calories"
      | "activeMinutes"
      | "weight"
      | "protein"
      | "carbs"
      | "fat"
      | "fiber"
      | "sugar"
      | "water"
      | "general",
    targetValue: "",
  });

  // Fetch health and nutrition data
  const fetchData = React.useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const weekData = await getLastWeekHealthData(currentUser.uid);

      // Find TODAY's data specifically
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayData = weekData.find((day) => {
        const dayDate = day.date.toDate();
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });

      // If today's data exists, use it; otherwise use the most recent
      if (todayData) {
        setHealthData(todayData);
      } else if (weekData.length > 0) {
        setHealthData(weekData[weekData.length - 1]);
      }

      const nutritionResult = await calculateDailyNutritionFromMeals(
        currentUser.uid,
        new Date()
      );
      setNutritionData(nutritionResult);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [currentUser?.uid]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pull to refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (!currentUser) return null;

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const currentGoalCount = userData.profile?.currentGoals?.filter((goal) => goal.type !== 'weight').length || 0;

  // Check for prohibited ingredients
  // Handle Quick Scan
  const handleQuickScan = (product: ProductData) => {
    setShowQuickScan(false);

    // Check if ingredients exist
    if (!product.ingredients || product.ingredients.length === 0) {
      Alert.alert(
        "⚠️ No Ingredient Data",
        `${product.productName}\n\nNo ingredient information available for this product. Unable to check for allergens.`,
        [
          { text: "Close", style: "cancel" },
          {
            text: "View Details",
            onPress: () => showProductDetails(product),
          },
        ]
      );
      return;
    }

    // Use comprehensive allergen detector
    const prohibited = userData.profile?.prohibitedIngredients || [];
    const allergenMatches = checkForAllergens(product.ingredients, prohibited);

    if (allergenMatches.length > 0) {
      const highestSeverity = Math.max(
        ...allergenMatches.map((m) => m.severity)
      );
      const severityText = getSeverityText(highestSeverity);
      const alertMessage = getAllergenAlertMessage(allergenMatches);

      Alert.alert(
        `🚨 ${severityText} ALLERGEN WARNING`,
        `${product.productName}\n\n${alertMessage}\n\nThis product contains ingredients you've marked as prohibited.\n\n⚠️ DISCLAIMER: Always verify ingredients on the physical product label. This scanner may not detect all allergens or may have outdated information. When in doubt, do not consume.`,
        [
          { text: "Close", style: "cancel" },
          {
            text: "View Details",
            onPress: () => showProductDetails(product),
          },
        ]
      );
    } else {
      Alert.alert(
        "✅ Safe to Consume",
        `${product.productName}\n\nNo allergens detected based on your prohibited ingredients list.\n\n⚠️ DISCLAIMER: Always verify ingredients on the physical product label. This information may be incomplete or outdated.`,
        [
          { text: "Close", style: "cancel" },
          {
            text: "View Details",
            onPress: () => showProductDetails(product),
          },
        ]
      );
    }
  };

  const showProductDetails = (product: ProductData) => {
    setSelectedProduct(product);
    setShowProductDetailsModal(true);
  };

  // Handle Add Goal
  const handleAddGoal = async () => {
    if (!currentUser || !newGoal.name || !newGoal.type) {
      Alert.alert("Error", "Please enter a goal name and select a type");
      return;
    }

    // Check if goal type already exists
    const existingGoal = userData.profile?.currentGoals?.find(
      (g) => g.type === newGoal.type
    );
    if (existingGoal) {
      Alert.alert(
        "Duplicate Goal Type",
        `You already have a ${newGoal.type} goal named "${existingGoal.name}". Each goal type can only be set once.`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const goalData: Goal = {
        name: newGoal.name,
        description: newGoal.description,
        type: newGoal.type,
        targetValue: newGoal.targetValue
          ? parseFloat(newGoal.targetValue)
          : undefined,
        endDate: Timestamp.fromDate(
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        ),
        startDate: Timestamp.now(),
      };

      await updateUserInfo(currentUser.uid, { goal: goalData });

      setShowAddGoalModal(false);
      setNewGoal({
        name: "",
        description: "",
        type: "",
        targetValue: "",
      });

      Alert.alert("Success", "Goal added successfully!");
    } catch (error: any) {
      console.error("Error adding goal:", error);
      Alert.alert("Error", error.message || "Failed to add goal");
    }
  };

  // Handle Delete Goal
  const handleDeleteGoal = (goalId: string) => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // const { deleteGoal } = require("@/utils/user.repo");
            await deleteGoal(currentUser.uid, "currentGoals", "goalId", goalId);
            Alert.alert("Success", "Goal deleted!");
          } catch (error) {
            console.error("Error deleting goal:", error);
            Alert.alert("Error", "Failed to delete goal");
          }
        },
      },
    ]);
  };

  // Handle Edit Goal
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      name: goal.name || "",
      description: goal.description || "",
      type: goal.type || "",
      targetValue: goal.targetValue?.toString() || "",
    });
    setShowEditGoalModal(true);
  };

  // Handle Save Edited Goal
  const handleSaveEditedGoal = async () => {
    if (!currentUser || !editingGoal || !newGoal.name || !newGoal.type) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Check if goal type already exists (but allow if it's the same goal being edited)
    const existingGoal = userData.profile?.currentGoals?.find(
      (g) => g.type === newGoal.type && g.goalId !== editingGoal.goalId
    );
    if (existingGoal) {
      Alert.alert(
        "Duplicate Goal Type",
        `You already have a ${newGoal.type} goal named "${existingGoal.name}". Each goal type can only be set once.`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const updates: Partial<Goal> = {
        name: newGoal.name,
        description: newGoal.description,
        type: newGoal.type,
        targetValue: newGoal.targetValue
          ? parseFloat(newGoal.targetValue)
          : undefined,
      };

      await updateGoal(
        currentUser.uid,
        editingGoal.goalId!,
        updates
      );

      setShowEditGoalModal(false);
      setEditingGoal(null);
      setNewGoal({
        name: "",
        description: "",
        type: "",
        targetValue: "",
      });

      Alert.alert("Success", "Goal updated successfully!");
    } catch (error: any) {
      console.error("Error updating goal:", error);
      Alert.alert("Error", error.message || "Failed to update goal");
    }
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getCurrentValueForGoal = (goal: Goal): number => {
    if (!goal.type) return 0;

    switch (goal.type) {
      case "steps":
        return healthData?.steps || 0;
      case "distance":
        return healthData?.distance || 0;
      case "calories":
        return healthData?.calories || 0;
      case "weight":
        return healthData?.weight || 0;
      case "totalCalories":
        return nutritionData?.totalCalories || 0;
      case "protein":
        return nutritionData?.protein || 0;
      case "carbs":
        return nutritionData?.carbs || 0;
      case "fat":
        return nutritionData?.fat || 0;
      case "sugar":
        return nutritionData?.sugar || 0;
      default:
        return 0;
    }
  };

  const getGoalUnit = (type: string | undefined) => {
    if (!type) return "";
    switch (type) {
      case "steps":
        return " steps/day";
      case "distance":
        return " mi/day";
      case "totalCalories":
        return " cal/day";
      case "calories":
        return " cal/day";
      case "activeMinutes":
        return " min/day";
      case "weight":
        return " lbs";
      case "protein":
        return "g/day";
      case "carbs":
        return "g/day";
      case "fat":
        return "g/day";
      case "fiber":
        return "g/day";
      case "sugar":
        return "g/day";
      case "water":
        return " oz/day";
      default:
        return "";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Smart Health branding and Profile Button */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <View>
            <Text style={styles.brandTitle}>Smart Health</Text>
            <Text style={styles.brandSubtitle}>Your wellness companion</Text>
          </View>
        </View>
        <View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileMenu(!showProfileMenu)}
          >
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <View style={styles.profileMenu}>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  router.push("./profile");
                }}
              >
                <Ionicons name="settings-outline" size={20} color="#333" />
                <Text style={styles.profileMenuText}>Settings</Text>
              </TouchableOpacity>

              <View style={styles.profileMenuDivider} />

              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  accountSignOut();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={[styles.profileMenuText, { color: "#EF4444" }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onTouchStart={() => setShowProfileMenu(false)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <AppLogo
            size={72}
            style={{ alignSelf: "center", marginBottom: 12 }}
          />
          <Text style={styles.welcomeTitle}>Welcome to Smart Health</Text>
          <Text style={styles.welcomeSubtitle}>
            Track your nutrition, monitor fitness goals, and connect with health
            experts. Start your wellness journey today!
          </Text>
        </View>

        {/* Greeting & Date */}
        <View style={styles.greetingCard}>
          <Text style={styles.greeting}>
            Hello, {userData.profile?.firstName || "User"}! 👋
          </Text>
          <Text style={styles.date}>{dateString}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.pastelGreen },
            ]}
            onPress={() => setShowQuickScan(true)}
          >
            <Ionicons name="scan" size={24} color={colors.pastelGreenText} />
            <Text
              style={[
                styles.actionButtonText,
                { color: colors.pastelGreenText },
              ]}
            >
              Quick Scan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddGoalModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={[styles.actionButtonText, { color: "#fff" }]}>
              Add Goal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Today&apos;s Progress</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Steps</Text>
              <Text style={styles.progressValue}>
                {(healthData?.steps || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Calorie Intake</Text>
              <Text style={styles.progressValue}>
                {nutritionData?.totalCalories || 0}
              </Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Distance</Text>
              <Text style={styles.progressValue}>
                {(healthData?.distance || 0).toFixed(1)} mi
              </Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Calories Burned</Text>
              <Text style={styles.progressValue}>
                {healthData?.calories || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* My Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🎯 My Daily Goals ({currentGoalCount}/5)
            </Text>
          </View>

          {userData.profile?.currentGoals &&
          userData.profile.currentGoals.length > 0 ? (
            userData.profile.currentGoals
              .filter((goal) => goal.type !== 'weight')
              .map((goal) => (
              <TouchableOpacity
                key={goal.goalId}
                style={styles.goalCard}
                onLongPress={() => {
                  Alert.alert(
                    "Manage Goal",
                    `What would you like to do with "${goal.name}"?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Edit",
                        onPress: () => handleEditGoal(goal),
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () =>
                          goal.goalId && handleDeleteGoal(goal.goalId),
                      },
                    ]
                  );
                }}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalLeft}>
                    {goal.type && (
                      <View
                        style={[
                          styles.goalBadge,
                          {
                            backgroundColor: [
                              "steps",
                              "distance",
                              "calories",
                              "activeMinutes",
                              "weight",
                            ].includes(goal.type)
                              ? "#E3F2FD"
                              : "#FFF3E0",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.goalBadgeText,
                            {
                              color: [
                                "steps",
                                "distance",
                                "calories",
                                "activeMinutes",
                                "weight",
                              ].includes(goal.type)
                                ? "#1976D2"
                                : "#F57C00",
                            },
                          ]}
                        >
                          {[
                            "steps",
                            "distance",
                            "calories",
                            "activeMinutes",
                            "weight",
                          ].includes(goal.type)
                            ? "HEALTH"
                            : "NUTRITION"}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.goalName}>{goal.name}</Text>
                    {goal.targetValue && (
                      <Text style={styles.goalTarget}>
                        Target: {goal.targetValue.toLocaleString()}
                        {getGoalUnit(goal.type)}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </View>
                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}

                {/* Progress Bar */}
                {goal.targetValue && goal.type && (
                  <View style={styles.goalProgressSection}>
                    <View style={styles.goalProgressHeader}>
                      <Text style={styles.goalProgressValue}>
                        {getCurrentValueForGoal(goal).toLocaleString()} /{" "}
                        {goal.targetValue.toLocaleString()}
                        {getGoalUnit(goal.type)}
                      </Text>
                    </View>
                    <View style={styles.goalProgressBarContainer}>
                      <View
                        style={[
                          styles.goalProgressBar,
                          {
                            width: `${Math.min(
                              calculateProgress(
                                getCurrentValueForGoal(goal),
                                goal.targetValue
                              ),
                              100
                            )}%`,
                            backgroundColor:
                              calculateProgress(
                                getCurrentValueForGoal(goal),
                                goal.targetValue
                              ) >= 100
                                ? "#4CAF50"
                                : "#2196F3",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.goalProgressText}>
                      {calculateProgress(
                        getCurrentValueForGoal(goal),
                        goal.targetValue
                      ).toFixed(0)}
                      % Complete
                      {calculateProgress(
                        getCurrentValueForGoal(goal),
                        goal.targetValue
                      ) >= 100 && " ✓"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyGoals}>
              <Text style={styles.emptyGoalsText}>No goals yet</Text>
              <Text style={styles.emptyGoalsSubtext}>
                Tap &quot;Add Goal&quot; to get started!
              </Text>
            </View>
          )}

          <Text style={styles.goalHint}>
            💡 Long press any goal to edit or delete
          </Text>
        </View>
      </ScrollView>

      {/* Quick Scan Modal */}
      <Modal
        visible={showQuickScan}
        animationType="slide"
        onRequestClose={() => setShowQuickScan(false)}
      >
        <BarcodeScanner
          visible={showQuickScan}
          onClose={() => setShowQuickScan(false)}
          onProductScanned={handleQuickScan}
        />
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Goal (Max 5)</Text>

              <Text style={styles.modalLabel}>Goal Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Daily Steps Goal"
                value={newGoal.name}
                onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
              />

              <Text style={styles.modalLabel}>Description (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What do you want to achieve?"
                value={newGoal.description}
                onChangeText={(text) =>
                  setNewGoal({ ...newGoal, description: text })
                }
                multiline
              />

              {/* Health Goals */}
              <Text style={styles.goalCategoryLabel}>Health Goals</Text>
              <View style={styles.goalTypeButtons}>
                {[
                  { value: "steps", label: "Steps" },
                  { value: "distance", label: "Distance" },
                  { value: "calories", label: "Calories" },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeButton,
                      newGoal.type === type.value &&
                        styles.goalTypeButtonActive,
                    ]}
                    onPress={() =>
                      setNewGoal({ ...newGoal, type: type.value as any })
                    }
                  >
                    <Text
                      style={[
                        styles.goalTypeButtonText,
                        newGoal.type === type.value &&
                          styles.goalTypeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nutrition Goals */}
              <Text style={styles.goalCategoryLabel}>Nutrition Goals</Text>
              <View style={styles.goalTypeButtons}>
                {[
                  { value: "totalCalories", label: "Calories" },
                  { value: "protein", label: "Protein" },
                  { value: "carbs", label: "Carbs" },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeButton,
                      newGoal.type === type.value &&
                        styles.goalTypeButtonActive,
                    ]}
                    onPress={() =>
                      setNewGoal({ ...newGoal, type: type.value as any })
                    }
                  >
                    <Text
                      style={[
                        styles.goalTypeButtonText,
                        newGoal.type === type.value &&
                          styles.goalTypeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.goalTypeButtons}>
                {[
                  { value: "fat", label: "Fat" },
                  { value: "fiber", label: "Fiber" },
                  { value: "sugar", label: "Sugar" },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeButton,
                      newGoal.type === type.value &&
                        styles.goalTypeButtonActive,
                    ]}
                    onPress={() =>
                      setNewGoal({ ...newGoal, type: type.value as any })
                    }
                  >
                    <Text
                      style={[
                        styles.goalTypeButtonText,
                        newGoal.type === type.value &&
                          styles.goalTypeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {newGoal.type && (
                <>
                  <Text style={styles.modalLabel}>Target Value</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={
                      newGoal.type === "steps"
                        ? "e.g., 10000"
                        : newGoal.type === "distance"
                        ? "e.g., 5"
                        : newGoal.type === "totalCalories"
                        ? "e.g., 2000"
                        : newGoal.type === "calories"
                        ? "e.g., 500"
                        : newGoal.type === "activeMinutes"
                        ? "e.g., 30"
                        : newGoal.type === "weight"
                        ? "e.g., 150"
                        : newGoal.type === "protein"
                        ? "e.g., 150"
                        : newGoal.type === "carbs"
                        ? "e.g., 200"
                        : newGoal.type === "fat"
                        ? "e.g., 70"
                        : newGoal.type === "fiber"
                        ? "e.g., 30"
                        : newGoal.type === "water"
                        ? "e.g., 64"
                        : "e.g., 50"
                    }
                    keyboardType="numeric"
                    value={newGoal.targetValue}
                    onChangeText={(text) =>
                      setNewGoal({ ...newGoal, targetValue: text })
                    }
                  />
                  <Text style={styles.targetHint}>
                    {newGoal.type === "steps"
                      ? "Daily step goal"
                      : newGoal.type === "distance"
                      ? "Daily distance in miles"
                      : newGoal.type === "totalCalories"
                      ? "Daily calorie intake goal"
                      : newGoal.type === "calories"
                      ? "Daily calories burned goal"
                      : newGoal.type === "activeMinutes"
                      ? "Daily active minutes goal"
                      : newGoal.type === "weight"
                      ? "Target weight in pounds"
                      : newGoal.type === "protein"
                      ? "Daily protein intake in grams"
                      : newGoal.type === "carbs"
                      ? "Daily carbs intake in grams"
                      : newGoal.type === "fat"
                      ? "Daily fat intake in grams"
                      : newGoal.type === "fiber"
                      ? "Daily fiber intake in grams"
                      : newGoal.type === "water"
                      ? "Daily water intake in ounces"
                      : "Daily sugar intake in grams"}
                  </Text>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setShowAddGoalModal(false);
                    setNewGoal({
                      name: "",
                      description: "",
                      type: "",
                      targetValue: "",
                    });
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButtonSave,
                    (!newGoal.name || !newGoal.type) &&
                      styles.modalButtonDisabled,
                  ]}
                  onPress={handleAddGoal}
                  disabled={!newGoal.name || !newGoal.type}
                >
                  <Text style={styles.modalButtonSaveText}>Add Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={showEditGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditGoalModal(false);
          setEditingGoal(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Goal</Text>

              <Text style={styles.modalLabel}>Goal Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Daily Steps Goal"
                value={newGoal.name}
                onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
              />

              <Text style={styles.modalLabel}>Description (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What do you want to achieve?"
                value={newGoal.description}
                onChangeText={(text) =>
                  setNewGoal({ ...newGoal, description: text })
                }
                multiline
              />

              {/* Health Goals */}
              <Text style={styles.goalCategoryLabel}>Health Goals</Text>
              <View style={styles.goalTypeButtons}>
                {[
                  { value: "steps", label: "Steps" },
                  { value: "distance", label: "Distance" },
                  { value: "calories", label: "Calories" },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeButton,
                      newGoal.type === type.value &&
                        styles.goalTypeButtonActive,
                        styles.goalTypeButtonDisabled,
                    ]}
                    onPress={() => {}}
                    disabled={true}
                  >
                    <Text
                      style={[
                        styles.goalTypeButtonText,
                        newGoal.type === type.value &&
                          styles.goalTypeButtonTextActive,
                          styles.goalTypeButtonDisabled,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nutrition Goals */}
              <Text style={styles.goalCategoryLabel}>Nutrition Goals</Text>
              <View style={styles.goalTypeButtons}>
                {[
                  { value: "totalCalories", label: "Calories" },
                  { value: "protein", label: "Protein" },
                  { value: "carbs", label: "Carbs" },
                  { value: "fat", label: "Fat" },
                  { value: "sugar", label: "Sugar" },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeButton,
                      newGoal.type === type.value &&
                        styles.goalTypeButtonActive,
                    ]}
                    onPress={() => {}}
                    disabled={true}
                  >
                    <Text
                      style={[
                        styles.goalTypeButtonText,
                        newGoal.type === type.value &&
                          styles.goalTypeButtonTextActive,
                          styles.goalTypeButtonDisabled,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {newGoal.type && (
                <>
                  <Text style={styles.modalLabel}>Target Value</Text>
                  <Text style={styles.targetHint}>
                    Set your daily target for {newGoal.type}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., 10000"
                    value={newGoal.targetValue}
                    onChangeText={(text) =>
                      setNewGoal({ ...newGoal, targetValue: text })
                    }
                    keyboardType="numeric"
                  />
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setShowEditGoalModal(false);
                    setEditingGoal(null);
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButtonSave,
                    (!newGoal.name || !newGoal.type) &&
                      styles.modalButtonDisabled,
                  ]}
                  onPress={handleSaveEditedGoal}
                  disabled={!newGoal.name || !newGoal.type}
                >
                  <Text style={styles.modalButtonSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Product Details Modal */}
      <Modal
        visible={showProductDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductDetailsModal(false)}
      >
        <View style={styles.productModalOverlay}>
          <View style={styles.productModalContainer}>
            <ScrollView
              contentContainerStyle={styles.productModalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedProduct && (
                <>
                  {/* Header */}
                  <View style={styles.productModalHeader}>
                    <View style={styles.productModalTitleContainer}>
                      <Text style={styles.productModalTitle}>
                        {selectedProduct.productName}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.productModalCloseButton}
                      onPress={() => setShowProductDetailsModal(false)}
                    >
                      <Ionicons name="close-circle" size={32} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Barcode Info */}
                  {selectedProduct.barcode && (
                    <View style={styles.productInfoCard}>
                      <View style={styles.productInfoRow}>
                        <Ionicons
                          name="barcode-outline"
                          size={20}
                          color="#666"
                        />
                        <Text style={styles.productInfoLabel}>Barcode</Text>
                      </View>
                      <Text style={styles.productInfoValue}>
                        {selectedProduct.barcode}
                      </Text>
                    </View>
                  )}

                  {/* Nutrition Facts */}
                  <View style={styles.productSection}>
                    <Text style={styles.productSectionTitle}>
                      Nutrition Facts
                    </Text>
                    {selectedProduct.servingSize && (
                      <Text style={styles.productServingSize}>
                        Per {selectedProduct.servingSize}
                      </Text>
                    )}

                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {selectedProduct.calories || "—"}
                        </Text>
                        <Text style={styles.nutritionLabel}>Calories</Text>
                      </View>

                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {selectedProduct.protein || "—"}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                      </View>

                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {selectedProduct.carbs || "—"}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                      </View>

                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {selectedProduct.fat || "—"}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Fat</Text>
                      </View>

                      {selectedProduct.sugar !== undefined && (
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionValue}>
                            {selectedProduct.sugar}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Sugar</Text>
                        </View>
                      )}

                      {selectedProduct.fiber !== undefined && (
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionValue}>
                            {selectedProduct.fiber}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Fiber</Text>
                        </View>
                      )}

                      {selectedProduct.sodium !== undefined && (
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionValue}>
                            {selectedProduct.sodium}mg
                          </Text>
                          <Text style={styles.nutritionLabel}>Sodium</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Ingredients */}
                  {selectedProduct.ingredients &&
                    selectedProduct.ingredients.length > 0 && (
                      <View style={styles.productSection}>
                        <Text style={styles.productSectionTitle}>
                          Ingredients
                        </Text>
                        <View style={styles.ingredientsList}>
                          {selectedProduct.ingredients.map(
                            (ingredient, index) => (
                              <View key={index} style={styles.ingredientChip}>
                                <Text style={styles.ingredientText}>
                                  {ingredient}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    )}

                  {/* Allergen Warning */}
                  {(() => {
                    const prohibited =
                      userData.profile?.prohibitedIngredients || [];
                    const allergenMatches = checkForAllergens(
                      selectedProduct.ingredients || [],
                      prohibited
                    );

                    if (allergenMatches.length > 0) {
                      return (
                        <View style={styles.allergenWarningCard}>
                          <View style={styles.allergenWarningHeader}>
                            <Ionicons
                              name="warning"
                              size={24}
                              color="#DC2626"
                            />
                            <Text style={styles.allergenWarningTitle}>
                              Allergen Warning
                            </Text>
                          </View>
                          {allergenMatches.map((match, index) => (
                            <View key={index} style={styles.allergenMatch}>
                              <Text style={styles.allergenName}>
                                {getSeverityText(match.severity) === "SEVERE"
                                  ? "🚨"
                                  : getSeverityText(match.severity) ===
                                    "MODERATE"
                                  ? "⚠️"
                                  : "ℹ️"}{" "}
                                {match.prohibitedIngredient}
                              </Text>
                              <Text style={styles.allergenFoundIn}>
                                Found in: {match.foundIn.join(", ")}
                              </Text>
                            </View>
                          ))}
                          <View style={styles.disclaimerBox}>
                            <Text style={styles.disclaimerText}>
                              ⚠️ Always verify ingredients on the physical
                              product label. This information may be incomplete
                              or outdated.
                            </Text>
                          </View>
                        </View>
                      );
                    } else {
                      return (
                        <>
                          <View style={styles.safeCard}>
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color="#10B981"
                            />
                            <Text style={styles.safeText}>
                              No allergens detected based on your profile
                            </Text>
                          </View>
                          <View style={styles.disclaimerBox}>
                            <Text style={styles.disclaimerText}>
                              ⚠️ Always verify ingredients on the physical
                              product label. This information may be incomplete
                              or outdated.
                            </Text>
                          </View>
                        </>
                      );
                    }
                  })()}

                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.productModalButton}
                    onPress={() => setShowProductDetailsModal(false)}
                  >
                    <Text style={styles.productModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  profileButton: {
    padding: 4,
  },
  profileMenu: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
    paddingVertical: 8,
    zIndex: 1000,
  },
  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  profileMenuText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
  },
  greetingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  progressCard: {
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  goalCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  goalLeft: {
    flex: 1,
  },
  goalBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  goalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  goalTarget: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
  },
  goalHint: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  goalProgressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  goalProgressHeader: {
    marginBottom: 8,
  },
  goalProgressValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  goalProgressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  goalProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  emptyGoals: {
    padding: 32,
    alignItems: "center",
  },
  emptyGoalsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptyGoalsSubtext: {
    fontSize: 14,
    color: "#999",
  },
  actionsColumn: {
    gap: 12,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  goalCategoryLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  goalTypeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  goalTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    minWidth: 70,
  },
  goalTypeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  goalTypeButtonDisabled: {
    opacity: 0.5,
  },
  goalTypeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  goalTypeButtonTextActive: {
    color: "#fff",
  },
  targetHint: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  modalButtonDisabled: {
    backgroundColor: "#ccc",
  },
  modalButtonSaveText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  // Product Details Modal Styles
  productModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  productModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  productModalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  productModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  productModalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  productModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  productModalBrand: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  productModalCloseButton: {
    padding: 4,
  },
  productInfoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  productInfoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  productInfoValue: {
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "monospace",
  },
  productSection: {
    marginBottom: 24,
  },
  productSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  productServingSize: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    fontStyle: "italic",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nutritionItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    minWidth: "30%",
    flex: 1,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ingredientChip: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  ingredientText: {
    fontSize: 13,
    color: "#1E40AF",
    fontWeight: "500",
  },
  allergenWarningCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FCA5A5",
  },
  allergenWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  allergenWarningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#DC2626",
  },
  allergenMatch: {
    marginBottom: 8,
  },
  allergenName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#991B1B",
    marginBottom: 4,
  },
  allergenFoundIn: {
    fontSize: 13,
    color: "#7F1D1D",
    fontStyle: "italic",
  },
  safeCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  safeText: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "600",
    flex: 1,
  },
  disclaimerBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 16,
  },
  productModalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  productModalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
