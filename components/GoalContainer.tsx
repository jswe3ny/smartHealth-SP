import {
  fontSize,
  fontWeight,
  radius,
  spacing,
  useThemeColors,
} from "@/assets/styles";
import { Goal } from "@/utils/types/user.types";
import { deleteGoal } from "@/utils/user.repo";
import { Timestamp } from "@react-native-firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const GoalContainer = ({
  goals = [],
  id,
}: {
  goals?: Goal[];
  id: string;
}) => {
  const colors = useThemeColors();

  if (!goals || goals.length === 0) {
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
    goalName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
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
      {goals.map((goal) => (
        <View key={goal.goalId} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalName}>{goal.name}</Text>
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
      ))}
    </View>
  );
};
