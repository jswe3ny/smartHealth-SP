import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import {
  getLastMonthNutritionData,
  getLastWeekNutritionData,
} from "@/utils/nutrition.repo";
import { DailyNutritionData } from "@/utils/types/nutrition.types";
import { Goal } from "@/utils/types/user.types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart, ProgressChart } from "react-native-chart-kit";

export default function NutritionTracking() {
  const { currentUser } = useAuth();
  const { profile } = useUserInfo();
  const [nutritionData, setNutritionData] = useState<DailyNutritionData[]>([]);
  const [weekData, setWeekData] = useState<DailyNutritionData[]>([]);
  const [monthData, setMonthData] = useState<DailyNutritionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nutritionGoals, setNutritionGoals] = useState<Goal[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (profile?.currentGoals) {
      const nutGoals = profile.currentGoals.filter(
        g => g.type && ['protein', 'carbs', 'fat', 'totalCalories', 'water', 'fiber', 'sugar'].includes(g.type)
      );
      setNutritionGoals(nutGoals);
    }
  }, [profile]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const weeklyData = await getLastWeekNutritionData(currentUser.uid);
      setWeekData(weeklyData);

      const monthlyData = await getLastMonthNutritionData(currentUser.uid);
      setMonthData(monthlyData);
    } catch (error) {
      console.error("Error loading nutrition data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Prepare chart data for calories over 7 days
  const prepareCalorieChartData = () => {
    // If no real data, use mock data for screenshots
    if (weekData.length === 0) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ 
          data: [1850, 2100, 1950, 2200, 2050, 2300, 1900],
          color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
        }],
      };
    }

    const sortedData = [...weekData].sort((a, b) =>
      a.date.toDate().getTime() - b.date.toDate().getTime()
    );

    const labels = sortedData.map(day => {
      const date = day.date.toDate();
      return date.toLocaleDateString("en-US", { weekday: "short" });
    });

    const calorieData = sortedData.map(day => day.totalCalories);

    return {
      labels,
      datasets: [{ data: calorieData }],
    };
  };

  // Prepare macro breakdown chart
  const prepareMacroChartData = () => {
    // Mock data for screenshots if no real data
    if (weekData.length === 0) {
      return {
        labels: ["Protein", "Carbs", "Fat"],
        datasets: [{
          data: [145, 220, 75],
          colors: [
            (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          ]
        }],
      };
    }

    const avgProtein = weekData.reduce((sum, day) => sum + day.protein, 0) / weekData.length;
    const avgCarbs = weekData.reduce((sum, day) => sum + day.carbs, 0) / weekData.length;
    const avgFat = weekData.reduce((sum, day) => sum + day.fat, 0) / weekData.length;

    return {
      labels: ["Protein", "Carbs", "Fat"],
      datasets: [{
        data: [
          Math.round(avgProtein),
          Math.round(avgCarbs),
          Math.round(avgFat)
        ]
      }],
    };
  };

  // Macro distribution pie chart
  const prepareMacroPieChart = () => {
    const macroData = weekData.length === 0 ? 
      { protein: 145, carbs: 220, fat: 75 } :
      {
        protein: weekData.reduce((sum, day) => sum + day.protein, 0) / weekData.length,
        carbs: weekData.reduce((sum, day) => sum + day.carbs, 0) / weekData.length,
        fat: weekData.reduce((sum, day) => sum + day.fat, 0) / weekData.length,
      };

    return [
      {
        name: "Protein",
        population: Math.round(macroData.protein),
        color: "#4CAF50",
        legendFontColor: "#333",
        legendFontSize: 14,
      },
      {
        name: "Carbs",
        population: Math.round(macroData.carbs),
        color: "#FF9800",
        legendFontColor: "#333",
        legendFontSize: 14,
      },
      {
        name: "Fat",
        population: Math.round(macroData.fat),
        color: "#F44336",
        legendFontColor: "#333",
        legendFontSize: 14,
      },
    ];
  };

  // Weekly nutrition comparison
  const prepareWeeklyComparisonData = () => {
    if (weekData.length === 0) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            data: [145, 140, 150, 155, 148, 152, 146],
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 2,
          },
          {
            data: [220, 215, 230, 225, 218, 235, 220],
            color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Protein (g)", "Carbs (g)"],
      };
    }

    const sortedData = [...weekData].sort((a, b) =>
      a.date.toDate().getTime() - b.date.toDate().getTime()
    );

    return {
      labels: sortedData.map(day => 
        day.date.toDate().toLocaleDateString("en-US", { weekday: "short" })
      ),
      datasets: [
        {
          data: sortedData.map(day => day.protein),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        },
        {
          data: sortedData.map(day => day.carbs),
          color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        },
      ],
      legend: ["Protein", "Carbs"],
    };
  };

  // Goal progress rings
  const prepareGoalProgressData = () => {
    // Mock data for screenshots
    return {
      labels: ["Protein", "Carbs", "Calories"],
      data: [0.85, 0.92, 0.78],
      colors: ["#4CAF50", "#FF9800", "#FF5722"]
    };
  };

  // Calculate weekly averages
  const calculateWeeklyAverages = () => {
    if (weekData.length === 0) {
      // Mock data for screenshots
      return { 
        calories: 2050, 
        protein: 148, 
        carbs: 225, 
        fat: 75,
        fiber: 28,
        sugar: 45
      };
    }

    const total = weekData.reduce(
      (acc, day) => ({
        calories: acc.calories + day.totalCalories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
        fiber: acc.fiber + (day.fiber || 0),
        sugar: acc.sugar + day.sugar,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
    );

    return {
      calories: Math.round(total.calories / weekData.length),
      protein: Math.round((total.protein / weekData.length) * 10) / 10,
      carbs: Math.round((total.carbs / weekData.length) * 10) / 10,
      fat: Math.round((total.fat / weekData.length) * 10) / 10,
      fiber: Math.round((total.fiber / weekData.length) * 10) / 10,
      sugar: Math.round((total.sugar / weekData.length) * 10) / 10,
    };
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  const calorieChartData = prepareCalorieChartData();
  const macroChartData = prepareMacroChartData();
  const macroPieData = prepareMacroPieChart();
  const weeklyComparisonData = prepareWeeklyComparisonData();
  const goalProgressData = prepareGoalProgressData();
  const weeklyAvg = calculateWeeklyAverages();
  const screenWidth = Dimensions.get("window").width;

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 87, 34, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#FF5722",
    },
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition Tracking</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Weekly Summary Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Averages</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyAvg.calories}</Text>
            <Text style={styles.statLabel}>Calories/day</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyAvg.protein}g</Text>
            <Text style={styles.statLabel}>Protein/day</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyAvg.carbs}g</Text>
            <Text style={styles.statLabel}>Carbs/day</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyAvg.fat}g</Text>
            <Text style={styles.statLabel}>Fat/day</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyAvg.fiber}g</Text>
            <Text style={styles.statLabel}>Fiber/day</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyAvg.sugar}g</Text>
            <Text style={styles.statLabel}>Sugar/day</Text>
          </View>
        </View>
      </View>

      {/* Calorie Intake Line Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7-Day Calorie Intake</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={calorieChartData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      {/* Macro Distribution Pie Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Macro Distribution</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={macroPieData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </View>
      </View>

      {/* Weekly Macro Bar Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Macro Averages</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={macroChartData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix="g"
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </View>
      </View>

      {/* Protein vs Carbs Comparison */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protein vs Carbs (7 Days)</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={weeklyComparisonData}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            }}
            style={styles.chart}
            bezier
          />
        </View>
      </View>

      {/* Goal Progress Rings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Achievement</Text>
        <View style={styles.chartContainer}>
          <ProgressChart
            data={goalProgressData}
            width={screenWidth - 48}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1, index?: number) => {
                const colors = ["rgba(76, 175, 80, 1)", "rgba(255, 152, 0, 1)", "rgba(255, 87, 34, 1)"];
                return colors[index ?? 0] || "rgba(76, 175, 80, 1)";
              },
            }}
            hideLegend={false}
            style={styles.chart}
          />
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Protein Goal: 85%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
            <Text style={styles.legendText}>Carbs Goal: 92%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF5722" }]} />
            <Text style={styles.legendText}>Calories Goal: 78%</Text>
          </View>
        </View>
      </View>

      {/* Nutrition Goals Progress Bars */}
      {nutritionGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goals Progress</Text>
          {nutritionGoals.map((goal) => {
            const today = weekData.length > 0 ? weekData[weekData.length - 1] : null;
            const currentValue = today
              ? goal.type === 'protein' ? today.protein :
                goal.type === 'carbs' ? today.carbs :
                goal.type === 'fat' ? today.fat :
                goal.type === 'totalCalories' ? today.totalCalories :
                goal.type === 'fiber' ? today.fiber :
                goal.type === 'sugar' ? today.sugar : 0
              : goal.type === 'protein' ? weeklyAvg.protein :
                goal.type === 'carbs' ? weeklyAvg.carbs :
                goal.type === 'fat' ? weeklyAvg.fat :
                goal.type === 'totalCalories' ? weeklyAvg.calories :
                goal.type === 'fiber' ? weeklyAvg.fiber :
                weeklyAvg.sugar;

            const progress = goal.targetValue
              ? Math.min((currentValue / goal.targetValue) * 100, 100)
              : 0;

            return (
              <View key={goal.goalId} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalValue}>
                    {Math.round(currentValue)} / {goal.targetValue}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progress}%`,
                        backgroundColor: progress >= 100 ? '#4CAF50' : '#FF9800',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progress.toFixed(0)}% Complete
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent Days History Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Days</Text>
        {weekData.length > 0 ? (
          <>
            {/* Table Header */}
            <View style={styles.historyHeader}>
              <Text style={[styles.historyHeaderText, { width: 70, textAlign: 'left' }]}>Date</Text>
              <Text style={[styles.historyHeaderText, { width: 70, textAlign: 'center' }]}>Calories</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Protein</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Carbs</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Fat</Text>
            </View>
            
            {/* Table Rows */}
            {weekData.map((day, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {day.date.toDate().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={[styles.historyValue, { width: 70 }]}>{day.totalCalories}</Text>
                <Text style={styles.historyValue}>{Math.round(day.protein)}g</Text>
                <Text style={styles.historyValue}>{Math.round(day.carbs)}g</Text>
                <Text style={styles.historyValue}>{Math.round(day.fat)}g</Text>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.mockHistoryContainer}>
            <Text style={styles.mockHistoryTitle}>Sample Week (Mock Data)</Text>
            
            {/* Table Header for Mock Data */}
            <View style={styles.historyHeader}>
              <Text style={[styles.historyHeaderText, { width: 70, textAlign: 'left' }]}>Date</Text>
              <Text style={[styles.historyHeaderText, { width: 70, textAlign: 'center' }]}>Calories</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Protein</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Carbs</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Fat</Text>
            </View>
            
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyDate}>{day}</Text>
                <Text style={[styles.historyValue, { width: 70 }]}>{1850 + (i * 50)}</Text>
                <Text style={styles.historyValue}>{145 + i}g</Text>
                <Text style={styles.historyValue}>{220 + (i * 5)}g</Text>
                <Text style={styles.historyValue}>{75 + i}g</Text>
              </View>
            ))}
            <Text style={styles.emptyText}>Add meals to see your actual data!</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Refresh Data" onPress={handleRefresh} bg="#FF5722" />
      </View>
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
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  legendContainer: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
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
    alignItems: "center",
    marginBottom: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  goalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF5722",
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
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
  },
  historyHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    width: 70,
    textAlign: 'left',
  },
  historyValue: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    flex: 1,
  },
  mockHistoryContainer: {
    backgroundColor: "#fff9e6",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffe082",
  },
  mockHistoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f57c00",
    marginBottom: 12,
    textAlign: "center",
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
});