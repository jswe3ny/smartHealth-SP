import {
    fontSize,
    fontWeight,
    neutralColors,
    radius,
    spacing,
    useThemeColors,
} from "@/assets/styles";
import { deleteMealByID, getMealDetailsById } from "@/utils/foodjournal.repo";
import { MealDetails } from "@/utils/types/foodJournal.types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MealDetailScreen() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const navigation = useNavigation();
  const colors = useThemeColors();

  const [mealDetails, setMealDetails] = useState<MealDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate meal totals
  const mealTotals = useMemo(() => {
    if (!mealDetails) return null;

    const totals = mealDetails.foodItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
        sugar: acc.sugar + (item.sugar || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }
    );

    return totals;
  }, [mealDetails]);

  // Format timestamp
  const formatMealTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useLayoutEffect(() => {
    if (mealDetails) {
      navigation.setOptions({
        title: mealDetails.mealName || "Meal Details",
      });
    }
  }, [navigation, mealDetails]);

  useEffect(() => {
    if (!mealId) return;

    const fetchMeal = async () => {
      try {
        const details = await getMealDetailsById(mealId);
        setMealDetails(details);
      } catch (err) {
        setError("Failed to load meal details. Message: " + err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeal();
  }, [mealId]);

  const handleDeleteMeal = () => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMealByID(mealId);
              router.back();
            } catch (err) {
              Alert.alert("Error", "Failed to delete meal. Please try again.");
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      backgroundColor: colors.backgroundSecondary,
    },
    errorText: {
      fontSize: fontSize.lg,
      color: colors.error,
      textAlign: "center",
    },
    header: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    backButton: {
      padding: spacing.xs,
      marginTop: spacing.xs,
    },
    headerContent: {
      flex: 1,
    },
    mealTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    mealMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    mealType: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textTransform: "capitalize",
    },
    mealTime: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      margin: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.lg,
      shadowColor: neutralColors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    summaryTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    macroGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    macroItem: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: radius.md,
      alignItems: "center",
    },
    macroValue: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    macroLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    itemCount: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingTop: 0,
    },
    foodItemCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: neutralColors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    foodItemHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    foodItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.pastelGreen,
      justifyContent: "center",
      alignItems: "center",
    },
    foodItemName: {
      flex: 1,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    foodItemCalories: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    foodItemCaloriesLabel: {
      fontSize: fontSize.xs,
      color: colors.textTertiary,
      textAlign: "right",
    },
    nutritionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: spacing.xs,
    },
    nutritionLabel: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    nutritionValue: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    deleteButton: {
      margin: spacing.lg,
      marginTop: 0,
      backgroundColor: colors.errorBackground,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.error,
    },
    deleteButtonText: {
      color: colors.error,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>
          Loading meal details...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: spacing.xl,
            padding: spacing.md,
            backgroundColor: colors.primary,
            borderRadius: radius.md,
          }}
        >
          <Text style={{ color: colors.textInverse }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!mealDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="restaurant-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.errorText}>No meal data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.mealTitle}>{mealDetails.mealName}</Text>
          <View style={styles.mealMeta}>
            {mealDetails.MealType && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.mealType}>{mealDetails.MealType}</Text>
              </View>
            )}
            {mealDetails.mealTime && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.mealTime}>{formatMealTime(mealDetails.mealTime)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Nutrition Summary */}
        {mealTotals && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Nutrition Summary</Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.calories)}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.protein)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.carbs)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.fat)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        {/* Food Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Food Items</Text>
          <Text style={styles.itemCount}>
            {mealDetails.foodItems.length} {mealDetails.foodItems.length === 1 ? "item" : "items"}
          </Text>
        </View>

        <View style={styles.scrollContent}>
          {mealDetails.foodItems.map((item, index) => (
            <View key={item.foodItemId || index} style={styles.foodItemCard}>
              <View style={styles.foodItemHeader}>
                <View style={styles.foodItemIcon}>
                  <Ionicons name="nutrition" size={20} color={colors.pastelGreenText} />
                </View>
                <Text style={styles.foodItemName}>{item.foodName}</Text>
                <View>
                  <Text style={styles.foodItemCalories}>{item.calories || 0}</Text>
                  <Text style={styles.foodItemCaloriesLabel}>kcal</Text>
                </View>
              </View>

              {/* Nutrition Details */}
              {(item.protein != null || item.carbs != null || item.fat != null || item.sugar != null) && (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm }}>
                  {item.protein != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                      <Text style={styles.nutritionValue}>{item.protein}g</Text>
                    </View>
                  )}
                  {item.carbs != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                      <Text style={styles.nutritionValue}>{item.carbs}g</Text>
                    </View>
                  )}
                  {item.fat != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                      <Text style={styles.nutritionValue}>{item.fat}g</Text>
                    </View>
                  )}
                  {item.sugar != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Sugar</Text>
                      <Text style={styles.nutritionValue}>{item.sugar}g</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteMeal}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete Meal</Text>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}
