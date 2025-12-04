import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import {
  getLastMonthHealthData,
  getLastWeekHealthData,
  saveDailyHealthData,
} from "@/utils/health.repo";
import { HealthData, healthService } from "@/utils/health.service";
import { DailyHealthData } from "@/utils/types/health.types";
import { Goal } from "@/utils/types/user.types";
import { deleteGoal, updateUserInfo } from "@/utils/user.repo";
import { Timestamp } from "@react-native-firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { LineChart } from "react-native-chart-kit";

// const userData = useUserInfo();

// Helper functions for metrics
const calculateBMI = (weightLbs: number, heightInches: number): number => {
  return (weightLbs / (heightInches * heightInches)) * 703;
};

const calculateWeeklyStreak = (
  weekData: DailyHealthData[],
  stepGoal: number
): number => {
  let streak = 0;
  for (let i = weekData.length - 1; i >= 0; i--) {
    if (weekData[i].steps >= stepGoal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const getTotalMonthlyDistance = (monthData: DailyHealthData[]): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return monthData
    .filter((day) => {
      const date = day.date.toDate();
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    })
    .reduce((total, day) => total + day.distance, 0);
};

const getMostActiveDay = (
  weekData: DailyHealthData[]
): { day: string; steps: number } | null => {
  if (weekData.length === 0) return null;

  const mostActive = weekData.reduce((max, current) =>
    current.steps > max.steps ? current : max
  );

  const date = mostActive.date.toDate();
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

  return { day: dayName, steps: mostActive.steps };
};

const getAverageDailySteps = (data: DailyHealthData[]): number => {
  if (data.length === 0) return 0;
  const total = data.reduce((sum, day) => sum + day.steps, 0);
  return Math.round(total / data.length);
};

const calculateGoalStreaks = (weekData: DailyHealthData[], goals: Goal[]) => {
  const streaks: { [key: string]: number } = {};

  goals.forEach((goal) => {
    if (!goal.type) return;

    let streak = 0;
    for (let i = weekData.length - 1; i >= 0; i--) {
      const dayValue =
        goal.type === "steps"
          ? weekData[i].steps
          : goal.type === "distance"
          ? weekData[i].distance
          : weekData[i].calories;
      if (goal.targetValue && dayValue >= goal.targetValue) streak++;
      else break;
    }
    streaks[goal.type] = streak;
  });

  return streaks;
};

export default function HealthTracking() {
  const { currentUser } = useAuth();
  const { profile } = useUserInfo();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [weekData, setWeekData] = useState<DailyHealthData[]>([]);
  const [monthData, setMonthData] = useState<DailyHealthData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: "steps" as "steps" | "distance" | "calories" | "weight",
    targetValue: "",
  });

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [weightGoal, setWeightGoal] = useState<number | null>(155); // goal weight
  const [showWeightGoalModal, setShowWeightGoalModal] = useState(false);
  const [tempWeightGoal, setTempWeightGoal] = useState("");

  useEffect(() => {
    checkAvailability();
  }, []);

  useEffect(() => {
    if (isAvailable) {
      loadData();
    }
  }, [isAvailable]);

  // Update goals when profile changes
  useEffect(() => {
    if (profile?.currentGoals) {
      // Filter for health goals
      const healthGoals = profile.currentGoals.filter(
        (g) =>
          g.type === "steps" ||
          g.type === "distance" ||
          g.type === "calories" ||
          g.type === "weight"
      );
      setGoals(healthGoals);

      // Update weight goal if exists
      const weightGoalData = healthGoals.find((g) => g.type === "weight");
      if (weightGoalData && weightGoalData.targetValue) {
        setWeightGoal(weightGoalData.targetValue);
      }
    }
  }, [profile]);

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

        const monthlyData = await getLastMonthHealthData(currentUser.uid);
        setMonthData(monthlyData);
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
      if (editingGoalId) {
        // Update existing goal
        const updatedGoals =
          profile?.currentGoals?.map((g) =>
            g.goalId === editingGoalId
              ? { ...g, targetValue: parseFloat(newGoal.targetValue) }
              : g
          ) || [];

        await updateUserInfo(currentUser.uid, { currentGoals: updatedGoals });

        setEditingGoalId(null);
        Alert.alert("Success", "Goal updated successfully!");
      } else {
        // Add new goal
        const goalData: Goal = {
          name: `${
            newGoal.type.charAt(0).toUpperCase() + newGoal.type.slice(1)
          } Goal`,
          description: `Daily ${newGoal.type} target`,
          type: newGoal.type,
          targetValue: parseFloat(newGoal.targetValue),
          endDate: Timestamp.fromDate(
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          ), // 1 year from now
          startDate: Timestamp.now(),
        };

        await updateUserInfo(currentUser.uid, { goal: goalData });
        Alert.alert("Success", "Goal added successfully!");
      }

      setShowGoalModal(false);
      setNewGoal({ type: "steps", targetValue: "" });
    } catch (error) {
      console.error("Error adding goal:", error);
      Alert.alert("Error", "Failed to add goal");
    }
  };

  const handleSetWeightGoal = async () => {
    if (!currentUser || !tempWeightGoal) {
      Alert.alert("Error", "Please enter a weight goal");
      return;
    }

    const goal = parseFloat(tempWeightGoal);
    if (isNaN(goal) || goal <= 0) {
      Alert.alert("Error", "Please enter a valid weight");
      return;
    }

    try {
      const existingWeightGoal = profile?.currentGoals?.find(
        (g) => g.type === "weight"
      );

      if (existingWeightGoal) {
        const updatedGoals =
          profile?.currentGoals?.map((g) =>
            g.type === "weight" ? { ...g, targetValue: goal } : g
          ) || [];

        await updateUserInfo(currentUser.uid, { currentGoals: updatedGoals });
      } else {
        const goalData: Goal = {
          name: "Weight Goal",
          description: `Target weight: ${goal} lbs`,
          type: "weight",
          targetValue: goal,
          endDate: Timestamp.fromDate(
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          ),
          startDate: Timestamp.now(),
        };

        await updateUserInfo(currentUser.uid, { goal: goalData });
      }

      setWeightGoal(goal);
      setShowWeightGoalModal(false);
      setTempWeightGoal("");
      await loadData();
      Alert.alert("Success", "Weight goal updated!");
    } catch (error) {
      console.error("Error saving weight goal:", error);
      Alert.alert("Error", "Failed to save weight goal");
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.goalId || null);
    setNewGoal({
      type: goal.type as "steps" | "distance" | "calories" | "weight",
      targetValue: goal.targetValue?.toString() || "",
    });
    setShowGoalModal(true);
  };

  const handleDeleteGoal = async (goalId: string, goalType: string) => {
    if (!currentUser) return;

    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
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

  const calculateProgress = (goal: Goal): number => {
    if (!healthData || !goal.targetValue) return 0;

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

  // Helper to prepare chart data from week data
  const prepareChartData = () => {
    if (weekData.length === 0) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
      };
    }

    const sortedData = [...weekData].sort(
      (a, b) => a.date.toDate().getTime() - b.date.toDate().getTime()
    );

    const labels = sortedData.map((day) => {
      const date = day.date.toDate();
      return date.toLocaleDateString("en-US", { weekday: "short" });
    });

    const stepsData = sortedData.map((day) => day.steps);

    return {
      labels,
      datasets: [{ data: stepsData }],
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
  const stepGoal = goals.find((g) => g.type === "steps")?.targetValue || 10000;
  const currentBMI =
    healthData?.weight && profile?.height
      ? calculateBMI(healthData.weight, profile.height)
      : null;
  const weeklyStreak = calculateWeeklyStreak(weekData, stepGoal);
  const monthlyDistance = getTotalMonthlyDistance(monthData);
  const mostActiveDay = getMostActiveDay(weekData);
  const avgDailySteps = getAverageDailySteps(monthData);
  const goalStreaks = calculateGoalStreaks(
    weekData,
    goals.filter((g) => g.type !== "weight")
  );
  const chartData = prepareChartData();
  const screenWidth = Dimensions.get("window").width;
  const currentGoalCount = profile?.currentGoals?.length || 0;

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
            <Text style={styles.statLabel}>Calories burned</Text>
          </View>
        </View>
      </View>

      {/* Weekly Steps Chart */}
      {weekData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Steps Activity</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#007AFF",
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </View>
      )}

      {/* Weight Goal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Goal</Text>

        {healthData?.weight && weightGoal ? (
          <TouchableOpacity
            style={styles.weightGoalCard}
            onLongPress={() => setShowWeightGoalModal(true)}
          >
            <View style={styles.weightGoalContent}>
              <View style={styles.weightGoalLeft}>
                <Text style={styles.weightGoalLabel}>Current Weight</Text>
                <Text style={styles.weightGoalValue}>
                  {healthData.weight.toFixed(1)} lbs
                </Text>
              </View>
              <View style={styles.weightGoalArrow}>
                <Text style={styles.weightGoalArrowText}>→</Text>
              </View>
              <View style={styles.weightGoalRight}>
                <Text style={styles.weightGoalLabel}>Goal Weight</Text>
                <Text style={styles.weightGoalValue}>{weightGoal} lbs</Text>
              </View>
            </View>
            <View style={styles.weightGoalProgress}>
              <Text style={styles.weightGoalRemaining}>
                {Math.abs(healthData.weight - weightGoal).toFixed(1)} lbs to{" "}
                {healthData.weight > weightGoal ? "lose" : "gain"}
              </Text>
            </View>
            <Text style={styles.goalHint}>💡 Long press to edit</Text>
          </TouchableOpacity>
        ) : healthData?.weight && !weightGoal ? (
          <TouchableOpacity
            style={styles.weightGoalCardEmpty}
            onPress={() => setShowWeightGoalModal(true)}
          >
            <Text style={styles.weightGoalEmptyText}>
              Set a weight goal to track your progress
            </Text>
            <Text style={styles.weightGoalEmptyButton}>+ Set Weight Goal</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyText}>
            Sync health data to set a weight goal
          </Text>
        )}
      </View>

      {/* Daily Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Health Goals</Text>
          <Text style={styles.goalSubtitle}>Manage goals from Home page</Text>
        </View>
        {goals.length === 0 ? (
          <View style={styles.emptyGoalsCard}>
            <Text style={styles.emptyGoalsText}>No health goals set yet</Text>
            <Text style={styles.emptyGoalsSubtext}>
              Go to Home page to add health goals
            </Text>
          </View>
        ) : (
          <View style={styles.goalsContainer}>
            {goals
              .filter((g) => g.type === "steps")
              .map((goal) => {
                const progress = calculateProgress(goal);

                return (
                  <View key={goal.goalId} style={styles.barGoalCard}>
                    <View style={styles.barGoalHeader}>
                      <Text style={styles.barGoalType}>Steps</Text>
                      <Text
                        style={[
                          styles.barGoalValue,
                          { color: progress >= 100 ? "#4CAF50" : "#007AFF" },
                        ]}
                      >
                        {healthData?.steps.toLocaleString() || "0"} /{" "}
                        {goal.targetValue?.toLocaleString() || "0"}
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor:
                              progress >= 100 ? "#4CAF50" : "#007AFF",
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.barGoalFooter}>
                      <Text style={styles.progressText}>
                        {progress.toFixed(0)}% Complete
                      </Text>
                      {progress >= 100 && (
                        <Text style={styles.goalAchieved}>✓ Achieved!</Text>
                      )}
                    </View>
                    {goalStreaks.steps > 0 && (
                      <Text style={styles.streakBadge}>
                        🔥 {goalStreaks.steps} day streak
                      </Text>
                    )}
                  </View>
                );
              })}
            {goals
              .filter((g) => g.type === "distance")
              .map((goal) => {
                const progress = calculateProgress(goal);

                return (
                  <View key={goal.goalId} style={styles.barGoalCard}>
                    <View style={styles.barGoalHeader}>
                      <Text style={styles.barGoalType}>Distance</Text>
                      <Text
                        style={[
                          styles.barGoalValue,
                          { color: progress >= 100 ? "#4CAF50" : "#007AFF" },
                        ]}
                      >
                        {healthData ? healthData.distance.toFixed(1) : "0.0"} /{" "}
                        {goal.targetValue} mi
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor:
                              progress >= 100 ? "#4CAF50" : "#FF9800",
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.barGoalFooter}>
                      <Text style={styles.progressText}>
                        {progress.toFixed(0)}% Complete
                      </Text>
                      {progress >= 100 && (
                        <Text style={styles.goalAchieved}>✓ Achieved!</Text>
                      )}
                    </View>
                    {goalStreaks.steps > 0 && (
                      <Text style={styles.streakBadge}>
                        🔥 {goalStreaks.steps} day streak
                      </Text>
                    )}
                  </View>
                );
              })}

            {/* Calories Goal - Bar */}
            {goals
              .filter((g) => g.type === "calories")
              .map((goal) => {
                const progress = calculateProgress(goal);

                return (
                  <View key={goal.goalId} style={styles.barGoalCard}>
                    <View style={styles.barGoalHeader}>
                      <Text style={styles.barGoalType}>Calories Burned</Text>
                      <Text
                        style={[
                          styles.barGoalValue,
                          { color: progress >= 100 ? "#4CAF50" : "#007AFF" },
                        ]}
                      >
                        {healthData?.calories.toLocaleString() || "0"} /{" "}
                        {goal.targetValue?.toLocaleString() || "0"}
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor:
                              progress >= 100 ? "#4CAF50" : "#FF5722",
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.barGoalFooter}>
                      <Text style={styles.progressText}>
                        {progress.toFixed(0)}% Complete
                      </Text>
                      {progress >= 100 && (
                        <Text style={styles.goalAchieved}>✓ Achieved!</Text>
                      )}
                    </View>
                    {goalStreaks.steps > 0 && (
                      <Text style={styles.streakBadge}>
                        🔥 {goalStreaks.steps} day streak
                      </Text>
                    )}
                  </View>
                );
              })}
          </View>
        )}
      </View>

      {/* Health Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Insights</Text>

        <View style={styles.insightsGrid}>
          {/* BMI */}
          {currentBMI && (
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>BMI</Text>
              <Text style={styles.insightValue}>{currentBMI.toFixed(1)}</Text>
              <Text style={styles.insightCategory}>Body Mass Index</Text>
            </View>
          )}
          {/* 7-Day Average Calories */}
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>7-Day Avg</Text>
            <Text style={styles.insightValue}>
              {weeklyAvg.calories.toLocaleString()}
            </Text>
            <Text style={styles.insightCategory}>cal burned per day</Text>
          </View>

          {/* Weekly Total Steps */}
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Week Total</Text>
            <Text style={styles.insightValue}>
              {weekData
                .reduce((sum, day) => sum + day.steps, 0)
                .toLocaleString()}
            </Text>
            <Text style={styles.insightCategory}>steps this week</Text>
          </View>

          {/* Most Active Day */}
          {mostActiveDay && (
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Most Active</Text>
              <Text style={styles.insightValue}>{mostActiveDay.day}</Text>
              <Text style={styles.insightCategory}>
                {mostActiveDay.steps.toLocaleString()} steps
              </Text>
            </View>
          )}

          {/* 7-Day Average Steps */}
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>7-Day Avg</Text>
            <Text style={styles.insightValue}>
              {weeklyAvg.steps.toLocaleString()}
            </Text>
            <Text style={styles.insightCategory}>steps per day</Text>
          </View>

          {/* 7-Day Average Distance */}
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>7-Day Avg</Text>
            <Text style={styles.insightValue}>
              {weeklyAvg.distance.toLocaleString()}
            </Text>
            <Text style={styles.insightCategory}>miles per day</Text>
          </View>

          {/* Monthly Distance */}
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Month Distance</Text>
            <Text style={styles.insightValue}>
              {monthlyDistance.toFixed(1)}
            </Text>
            <Text style={styles.insightCategory}>miles this month</Text>
          </View>

          {/* Average Daily Steps */}
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>30-Day Avg</Text>
            <Text style={styles.insightValue}>
              {avgDailySteps.toLocaleString()}
            </Text>
            <Text style={styles.insightCategory}>steps per day</Text>
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
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGoalId ? "Edit Goal" : "Add New Goal"}
            </Text>

            <Text style={styles.modalLabel}>Goal Type</Text>
            <View style={styles.goalTypeButtons}>
              {["steps", "distance", "calories", "weight"].map((type) => {
                // Check if goal type already exists (except when editing)
                const isDisabled =
                  !editingGoalId && goals.some((g) => g.type === type);
                const isActive = newGoal.type === type;

                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.goalTypeButton,
                      isActive && styles.goalTypeButtonActive,
                      isDisabled && styles.goalTypeButtonDisabled,
                    ]}
                    onPress={() =>
                      !isDisabled &&
                      setNewGoal({ ...newGoal, type: type as any })
                    }
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.goalTypeButtonText,
                        isActive && styles.goalTypeButtonTextActive,
                        isDisabled && styles.goalTypeButtonTextDisabled,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                      {isDisabled && " ✓"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
                  setEditingGoalId(null);
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

      {/* Weight Goal Modal */}
      <Modal
        visible={showWeightGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Weight Goal</Text>

            <Text style={styles.modalLabel}>Target Weight (lbs)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your goal weight"
              keyboardType="numeric"
              value={tempWeightGoal}
              onChangeText={setTempWeightGoal}
            />

            <Text style={styles.modalHint}>
              {healthData?.weight &&
              tempWeightGoal &&
              !isNaN(parseFloat(tempWeightGoal))
                ? `${Math.abs(
                    healthData.weight - parseFloat(tempWeightGoal)
                  ).toFixed(1)} lbs to ${
                    healthData.weight > parseFloat(tempWeightGoal)
                      ? "lose"
                      : "gain"
                  }`
                : "Enter your target weight"}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowWeightGoalModal(false);
                  setTempWeightGoal("");
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSetWeightGoal}
              >
                <Text style={styles.modalButtonSaveText}>Save Goal</Text>
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
  goalCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  goalSubtitle: {
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
  chartContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  insightCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  insightCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  editButton: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  setGoalButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#007AFF",
    borderRadius: 6,
    alignItems: "center",
  },
  setGoalButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  modalHint: {
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
  },
  insightLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  insightCategory: {
    fontSize: 12,
    color: "#666",
  },
  goalsContainer: {
    gap: 12,
    marginTop: 8,
  },
  emptyGoalsCard: {
    backgroundColor: "#f8f9fa",
    padding: 32,
    borderRadius: 12,
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
    textAlign: "center",
  },
  goalAchievedBadge: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 8,
  },
  barGoalCard: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  barGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  barGoalType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  barGoalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF5722",
  },
  barGoalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  goalHint: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
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
  streakBadge: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
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
  weightGoalCard: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  weightGoalContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weightGoalLeft: {
    flex: 1,
    alignItems: "center",
  },
  weightGoalRight: {
    flex: 1,
    alignItems: "center",
  },
  weightGoalArrow: {
    paddingHorizontal: 20,
  },
  weightGoalArrowText: {
    fontSize: 32,
    color: "#007AFF",
  },
  weightGoalLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  weightGoalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  weightGoalProgress: {
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  weightGoalRemaining: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  weightGoalEdit: {
    fontSize: 14,
    color: "#007AFF",
  },
  weightGoalCardEmpty: {
    backgroundColor: "#f8f9fa",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  weightGoalEmptyText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  weightGoalEmptyButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
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
  goalTypeButtonDisabled: {
    backgroundColor: "#f9f9f9",
    borderColor: "#d0d0d0",
    opacity: 0.5,
  },
  goalTypeButtonText: {
    fontSize: 14,
    color: "#666",
  },
  goalTypeButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  goalTypeButtonTextDisabled: {
    color: "#999",
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
