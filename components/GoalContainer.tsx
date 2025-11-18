import {
  fontSize,
  fontWeight,
  radius,
  spacing,
  useThemeColors,
} from "@/assets/styles";
import { Goal } from "@/utils/types/user.types";
import { deleteGoal } from "@/utils/user.repo";
import { Ionicons } from "@expo/vector-icons";
import { Timestamp } from "@react-native-firebase/firestore";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const GoalContainer = ({
  goals = [],
  id,
  showCategory = true, // 
  filterByCategory,
}: {
  goals?: Goal[];
  id: string;
  showCategory?: boolean;
  filterByCategory?: 'health' | 'nutrition' | 'general';
}) => {
  const colors = useThemeColors();

  const filteredGoals = filterByCategory
    ? goals.filter(goal => {
        if (filterByCategory === 'health') {
          return goal.type && ['steps', 'distance', 'calories', 'activeMinutes', 'weight'].includes(goal.type);
        } else if (filterByCategory === 'nutrition') {
          return goal.type && ['protein', 'carbs', 'fat', 'totalCalories', 'water', 'fiber', 'sugar'].includes(goal.type);
        } else {
          return !goal.type || goal.type === 'general';
        }
      })
    : goals;

  if (!filteredGoals || filteredGoals.length === 0) {
    return null;
  }

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "No end date";
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    const today = new Date();
    const daysUntil = Math.ceil(
      (dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) return "Past due";
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get goal category for badge display
  const getGoalCategory = (goal: Goal): 'health' | 'nutrition' | 'general' => {
    if (!goal.type || goal.type === 'general') return 'general';
    
    const healthTypes = ['steps', 'distance', 'calories', 'activeMinutes', 'weight'];
    const nutritionTypes = ['protein', 'carbs', 'fat', 'totalCalories', 'water', 'fiber', 'sugar'];
    
    if (healthTypes.includes(goal.type)) return 'health';
    if (nutritionTypes.includes(goal.type)) return 'nutrition';
    return 'general';
  };

  // Get badge color by category
  const getBadgeColor = (category: 'health' | 'nutrition' | 'general') => {
    switch (category) {
      case 'health':
        return { bg: '#E3F2FD', text: '#1976D2' };
      case 'nutrition':
        return { bg: '#FFF3E0', text: '#F57C00' };
      default:
        return { bg: '#F3E5F5', text: '#7B1FA2' };
    }
  };

  // Format target value display
  const formatTargetValue = (goal: Goal): string => {
    if (!goal.targetValue) return '';
    
    switch (goal.type) {
      case 'steps':
        return `${goal.targetValue.toLocaleString()} steps/day`;
      case 'distance':
        return `${goal.targetValue} mi/day`;
      case 'calories': // Health - calories burned
        return `${goal.targetValue} cal burned/day`;
      case 'activeMinutes':
        return `${goal.targetValue} min/day`;
      case 'weight':
        return `${goal.targetValue} lbs target`;
      case 'protein':
        return `${goal.targetValue}g protein/day`;
      case 'carbs':
        return `${goal.targetValue}g carbs/day`;
      case 'fat':
        return `${goal.targetValue}g fat/day`;
      case 'totalCalories': // Nutrition - calorie intake
        return `${goal.targetValue} cal intake/day`;
      case 'water':
        return `${goal.targetValue}L water/day`;
      case 'fiber':
        return `${goal.targetValue}g fiber/day`;
      case 'sugar':
        return `${goal.targetValue}g sugar/day`;
      default:
        return '';
    }
  };

  const handleDelete = (goal: Goal) => {
    if (!goal.goalId) return;

    Alert.alert("Delete Goal", `Are you sure you want to delete "${goal.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteGoal(id, "currentGoals", "goalId", goal.goalId!);
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    goalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    goalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    goalHeaderLeft: {
      flex: 1,
      marginRight: spacing.sm,
    },
    goalName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    goalBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
    },
    goalBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    goalTarget: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    deleteButton: {
      padding: spacing.xs,
    },
    goalDescription: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      lineHeight: 20,
    },
    goalFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    goalDate: {
      fontSize: fontSize.xs,
      color: colors.textTertiary,
      flexDirection: "row",
      alignItems: "center",
    },
    dateIcon: {
      marginRight: spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>My Goals</Text>
      {filteredGoals.map((goal) => {
        const category = getGoalCategory(goal);
        const badgeColor = getBadgeColor(category);
        const targetDisplay = formatTargetValue(goal);

        return (
          <View key={goal.goalId} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalHeaderLeft}>
                {/* Category badge */}
                {showCategory && (
                  <View style={[styles.goalBadge, { backgroundColor: badgeColor.bg }]}>
                    <Text style={[styles.goalBadgeText, { color: badgeColor.text }]}>
                      {category}
                    </Text>
                  </View>
                )}
                
                <Text style={styles.goalName}>{goal.name}</Text>
                
                {/* Target value for health/nutrition goals */}
                {targetDisplay && (
                  <Text style={styles.goalTarget}>{targetDisplay}</Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(goal)}
              >
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
            
            {goal.description && (
              <Text style={styles.goalDescription}>{goal.description}</Text>
            )}
            
            <View style={styles.goalFooter}>
              <View style={styles.goalDate}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textTertiary}
                  style={styles.dateIcon}
                />
                <Text>{formatDate(goal.endDate)}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

