import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import {
  getActiveHealthGoals,
  getLastWeekHealthData,
  saveDailyHealthData,
  saveHealthGoal,
} from "@/utils/health.repo";
import { HealthData, healthService } from "@/utils/health.service";
import { DailyHealthData, HealthGoal } from "@/utils/types/health.types";
import { Timestamp } from "@react-native-firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HealthTracking() {
  const { currentUser } = useAuth();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [weekData, setWeekData] = useState<DailyHealthData[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: "steps" as "steps" | "distance" | "calories" | "weight",
    targetValue: "",
  });

  useEffect(() => {
    checkAvailability();
  }, []);

  useEffect(() => {
    if (isAvailable) {
      loadData();
    }
  }, [isAvailable]);

  const checkAvailability = async () => {
    const available = await healthService.isAvailable();
    setIsAvailable(available);

    if (!available) {
      Alert.alert(
        "Health Services Unavailable",
        Platform.OS === "android"
          ? "Health Connect is not available on this device. Please install it from the Play Store."
          : "HealthKit is not available on this device."
      );
    }
  };

  const loadData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const initialized = await healthService.initialize();

      if (initialized) {
        const todayData = await healthService.getTodayData();
        setHealthData(todayData);

        if (todayData) {
          await saveDailyHealthData(currentUser.uid, {
            date: Timestamp.fromDate(new Date()),
            steps: todayData.steps,
            distance: todayData.distance,
            calories: todayData.calories,
            weight: todayData.weight,
            activeMinutes: todayData.activeMinutes,
          });
        }

        const weeklyData = await getLastWeekHealthData(currentUser.uid);
        setWeekData(weeklyData);

        const userGoals = await getActiveHealthGoals(currentUser.uid);
        setGoals(userGoals);
      }
    } catch (error) {
      console.error("Error loading health data:", error);
      Alert.alert("Error", "Failed to load health data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    await handleRefresh();
    Alert.alert("Success", "Health data synced successfully!");
  };

  const handleAddGoal = async () => {
    if (!currentUser || !newGoal.targetValue) {
      Alert.alert("Error", "Please enter a target value");
      return;
    }

    try {
      await saveHealthGoal(currentUser.uid, {
        type: newGoal.type,
        targetValue: parseFloat(newGoal.targetValue),
        isActive: true,
      });

      setShowGoalModal(false);
      setNewGoal({ type: "steps", targetValue: "" });
      await loadData();
      Alert.alert("Success", "Goal added successfully!");
    } catch (error) {
      console.error("Error adding goal:", error);
      Alert.alert("Error", "Failed to add goal");
    }
  };

  const calculateProgress = (goal: HealthGoal): number => {
    if (!healthData) return 0;

    let currentValue = 0;
    switch (goal.type) {
      case "steps":
        currentValue = healthData.steps;
        break;
      case "distance":
        currentValue = healthData.distance;
        break;
      case "calories":
        currentValue = healthData.calories;
        break;
      case "weight":
        currentValue = healthData.weight || 0;
        break;
    }

    return Math.min((currentValue / goal.targetValue) * 100, 100);
  };

  const getGoalLabel = (type: string): string => {
    switch (type) {
      case "steps":
        return "steps";
      case "distance":
        return "miles";
      case "calories":
        return "calories";
      case "weight":
        return "lbs";
      default:
        return "";
    }
  };

  const calculateWeeklyAverage = () => {
    if (weekData.length === 0) return { steps: 0, distance: 0, calories: 0 };

    const total = weekData.reduce(
      (acc, day) => ({
        steps: acc.steps + day.steps,
        distance: acc.distance + day.distance,
        calories: acc.calories + day.calories,
      }),
      { steps: 0, distance: 0, calories: 0 }
    );

    return {
      steps: Math.round(total.steps / weekData.length),
      distance: total.distance / weekData.length,
      calories: Math.round(total.calories / weekData.length),
    };
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading health data...</Text>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Health Services Unavailable</Text>
          <Text style={styles.errorText}>
            {Platform.OS === "android"
              ? "Please install Health Connect from the Play Store to use this feature."
              : "HealthKit is not available on this device."}
          </Text>
        </View>
      </View>
    );
  }

  const weeklyAvg = calculateWeeklyAverage();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Health Tracking</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Today's Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {healthData?.steps.toLocaleString() || "0"}
            </Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {healthData ? healthData.distance.toFixed(2) : "0.00"}
            </Text>
            <Text style={styles.statLabel}>miles</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {healthData?.calories.toLocaleString() || "0"}
            </Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>

          {healthData?.weight && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {healthData.weight.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>lbs</Text>
            </View>
          )}
        </View>
      </View>

      {/* Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>My Daily Goals</Text>
            <Text style={styles.sectionSubtitle}>
              Track your progress today
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowGoalModal(true)}>
            <Text style={styles.addButton}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <Text style={styles.emptyText}>
            No goals set. Tap &quot;Add Goal&quot; to create one!
          </Text>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            return (
              <View key={goal.goalId} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalType}>
                    {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}{" "}
                    Goal
                  </Text>
                  <Text style={styles.goalTarget}>
                    Target: {goal.targetValue} {getGoalLabel(goal.type)}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[styles.progressBar, { width: `${progress}%` }]}
                  />
                </View>
                <View style={styles.goalFooter}>
                  <Text style={styles.progressText}>
                    {progress.toFixed(0)}% Complete
                  </Text>
                  {progress >= 100 && (
                    <Text style={styles.goalAchieved}>✓ Goal Achieved!</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Weekly Average */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7-Day Average</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weeklyAvg.steps.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weeklyAvg.distance.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>miles</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weeklyAvg.calories.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>
      </View>

      {/* Recent History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent History</Text>

        {weekData.length === 0 ? (
          <Text style={styles.emptyText}>No data available yet</Text>
        ) : (
          weekData.slice(0, 5).map((day, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {day.date.toDate().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <View style={styles.historyStats}>
                <Text style={styles.historyValue}>
                  {day.steps.toLocaleString()} steps
                </Text>
                <Text style={styles.historyValue}>
                  {day.distance.toFixed(2)} mi
                </Text>
                <Text style={styles.historyValue}>{day.calories} cal</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Sync Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Sync Health Data"
          onPress={handleSync}
          size="lg"
          bg={colors.primary}
          fullWidth
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Data is synced from{" "}
          {Platform.OS === "android" ? "Health Connect" : "Apple Health"}
        </Text>
        <Text style={styles.infoTextSmall}>
          Last updated: {healthData?.lastUpdated.toLocaleTimeString() || "N/A"}
        </Text>
      </View>

      {/* Add Goal Modal */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Daily Goal</Text>

            <Text style={styles.modalLabel}>
              What do you want to achieve today?
            </Text>
            <View style={styles.goalTypeButtons}>
              {["steps", "distance", "calories", "weight"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.goalTypeButton,
                    newGoal.type === type && styles.goalTypeButtonActive,
                  ]}
                  onPress={() => setNewGoal({ ...newGoal, type: type as any })}
                >
                  <Text
                    style={[
                      styles.goalTypeButtonText,
                      newGoal.type === type && styles.goalTypeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>
              Target Value ({getGoalLabel(newGoal.type)})
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter target value"
              keyboardType="numeric"
              value={newGoal.targetValue}
              onChangeText={(text) =>
                setNewGoal({ ...newGoal, targetValue: text })
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowGoalModal(false);
                  setNewGoal({ type: "steps", targetValue: "" });
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleAddGoal}
              >
                <Text style={styles.modalButtonSaveText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  addButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  goalCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  goalTarget: {
    fontSize: 14,
    color: "#666",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
  },
  goalAchieved: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    width: 80,
  },
  historyStats: {
    flexDirection: "row",
    gap: 16,
    flex: 1,
    justifyContent: "flex-end",
  },
  historyValue: {
    fontSize: 13,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
    fontSize: 14,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#1976d2",
    textAlign: "center",
  },
  infoTextSmall: {
    fontSize: 12,
    color: "#64b5f6",
    marginTop: 4,
  },
  errorCard: {
    margin: 16,
    padding: 24,
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  goalTypeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  goalTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  goalTypeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  goalTypeButtonText: {
    fontSize: 14,
    color: "#666",
  },
  goalTypeButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
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
  modalButtonSaveText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
