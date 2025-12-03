import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import {
  calculateDailyNutritionFromMeals,
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
  View
} from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function NutritionTracking() {
  const { currentUser } = useAuth();
  const { profile } = useUserInfo();
  const [todayData, setTodayData] = useState<DailyNutritionData | null>(null);
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

      // Calculate today's nutrition data directly from meals
      const today = new Date();
      const todayNutrition = await calculateDailyNutritionFromMeals(currentUser.uid, today);
      setTodayData(todayNutrition);

      // Fetch weekly data
      const weeklyData = await getLastWeekNutritionData(currentUser.uid);
      setWeekData(weeklyData);

      // Fetch monthly data
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

  const prepareCalorieChartData = () => {
    if (weekData.length === 0) {
      return null;
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

  const calculateWeeklyAverages = () => {
    if (weekData.length === 0) {
      return { 
        calories: 0, 
        protein: 0, 
        carbs: 0, 
        fat: 0,
        fiber: 0,
        sugar: 0
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

  const calculateMacroRatios = (weeklyAvg: any) => {
    if (weekData.length === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    const totalMacroGrams = weeklyAvg.protein + weeklyAvg.carbs + weeklyAvg.fat;
    
    if (totalMacroGrams === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((weeklyAvg.protein / totalMacroGrams) * 100),
      carbs: Math.round((weeklyAvg.carbs / totalMacroGrams) * 100),
      fat: Math.round((weeklyAvg.fat / totalMacroGrams) * 100),
    };
  };

  const calculateMealFrequency = () => {
    if (weekData.length === 0) {
      return { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    }

    return {
      breakfast: weekData.filter(d => d.mealTypes.breakfast).length,
      lunch: weekData.filter(d => d.mealTypes.lunch).length,
      dinner: weekData.filter(d => d.mealTypes.dinner).length,
      snack: weekData.filter(d => d.mealTypes.snack).length,
    };
  };

  const generateNutrientInsights = (weeklyAvg: any) => {
    const insights: Array<{ type: 'warning' | 'success' | 'info', icon: string, title: string, detail: string }> = [];

    if (weekData.length === 0) return insights;

    // Check fiber
    if (weeklyAvg.fiber < 20 && weeklyAvg.fiber > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Low Fiber Intake',
        detail: `Average: ${weeklyAvg.fiber}g/day (Recommended: 25-30g)`
      });
    } else if (weeklyAvg.fiber >= 25) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Great Fiber Intake!',
        detail: `Average: ${weeklyAvg.fiber}g/day - Keep it up!`
      });
    }

    // Check protein against goal
    const proteinGoal = nutritionGoals.find(g => g.type === 'protein');
    if (proteinGoal?.targetValue && weeklyAvg.protein >= (proteinGoal?.targetValue || 80)) {
      insights.push({
        type: 'success',
        icon: '💪',
        title: 'Protein Goal Achieved!',
        detail: `Average: ${weeklyAvg.protein}g/day (Goal: ${proteinGoal?.targetValue || 80}g)`
      });
    } else if (proteinGoal?.targetValue && weeklyAvg.protein < (proteinGoal?.targetValue || 80) * 0.8) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Low Protein Intake',
        detail: `Average: ${weeklyAvg.protein}g/day (Goal: ${proteinGoal?.targetValue || 80}g)`
      });
    }

    // Check sugar
    if (weeklyAvg.sugar > 50) {
      insights.push({
        type: 'warning',
        icon: '🍬',
        title: 'High Sugar Intake',
        detail: `Average: ${weeklyAvg.sugar}g/day (Recommended: <50g)`
      });
    } else if (weeklyAvg.sugar <= 30 && weeklyAvg.sugar > 0) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Healthy Sugar Levels',
        detail: `Average: ${weeklyAvg.sugar}g/day - Excellent control!`
      });
    }

    // Check calories against goal
    const calorieGoal = nutritionGoals.find(g => g.type === 'totalCalories');
    if (calorieGoal && weeklyAvg.calories > 0) {
      const calorieDeviation = Math.abs(weeklyAvg.calories - (calorieGoal?.targetValue || 2000));
      const deviationPercent = (calorieDeviation / (calorieGoal?.targetValue || 2000)) * 100;

      if (deviationPercent <= 10) {
        insights.push({
          type: 'success',
          icon: '🎯',
          title: 'On Target with Calories!',
          detail: `Average: ${weeklyAvg.calories} cal/day (Goal: ${calorieGoal?.targetValue || 2000})`
        });
      }
    }

    // Check consistency
    const daysLogged = weekData.length;
    if (daysLogged === 7) {
      insights.push({
        type: 'success',
        icon: '🔥',
        title: 'Perfect Tracking!',
        detail: 'You logged all 7 days this week!'
      });
    } else if (daysLogged >= 5) {
      insights.push({
        type: 'info',
        icon: 'ℹ️',
        title: 'Good Tracking Consistency',
        detail: `${daysLogged}/7 days logged this week`
      });
    }

    return insights.slice(0, 4);
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
  const weeklyAvg = calculateWeeklyAverages();
  const macroRatios = calculateMacroRatios(weeklyAvg);
  const mealFrequency = calculateMealFrequency();
  const nutrientInsights = generateNutrientInsights(weeklyAvg);
  const screenWidth = Dimensions.get("window").width;

  const calorieGoal = nutritionGoals.find(g => g.type === 'totalCalories');

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

      {/* Today's Nutrition Summary */}
      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <Text style={styles.todayTitle}>Today's Nutrition</Text>
          <Text style={styles.todayDate}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        </View>
  
        {todayData ? (
          <>
            <View style={styles.todayMacros}>
              <View style={styles.macroItem}>
                <Text style={styles.macroEmoji}>🔥</Text>
                <Text style={styles.macroValue}>{todayData.totalCalories}</Text>
                <Text style={styles.macroLabel}>calories</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroEmoji}>💪</Text>
                <Text style={styles.macroValue}>{todayData.protein}g</Text>
                <Text style={styles.macroLabel}>protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroEmoji}>🍞</Text>
                <Text style={styles.macroValue}>{todayData.carbs}g</Text>
                <Text style={styles.macroLabel}>carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroEmoji}>🥑</Text>
                <Text style={styles.macroValue}>{todayData.fat}g</Text>
                <Text style={styles.macroLabel}>fat</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyToday}>
            <Text style={styles.emptyTodayIcon}>🍽️</Text>
            <Text style={styles.emptyTodayText}>No meals logged today</Text>
            <Text style={styles.emptyTodaySubtext}>
              Go to Food Journal to log your first meal
            </Text>
          </View>
        )}
      </View>

      {/* Calorie Budget Tracker */}
      {todayData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calorie Budget</Text>
          {calorieGoal ? (
            <>
              <View style={styles.budgetRow}>
                <View style={styles.budgetItem}>
                  <Text style={styles.budgetLabel}>Goal</Text>
                  <Text style={styles.budgetValue}>{calorieGoal?.targetValue || 2000}</Text>
                </View>
                <View style={styles.budgetItem}>
                  <Text style={styles.budgetLabel}>Consumed</Text>
                  <Text style={[styles.budgetValue, { color: '#FF5722' }]}>{todayData.totalCalories}</Text>
                </View>
                <View style={styles.budgetItem}>
                  <Text style={styles.budgetLabel}>Remaining</Text>
                  <Text style={[styles.budgetValue, { color: todayData.totalCalories > (calorieGoal?.targetValue || 2000) ? '#F44336' : '#4CAF50' }]}>
                    {(calorieGoal?.targetValue || 2000) - todayData.totalCalories}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((todayData.totalCalories / (calorieGoal?.targetValue || 2000)) * 100, 100)}%`,
                      backgroundColor: todayData.totalCalories > (calorieGoal?.targetValue || 2000) ? '#F44336' : '#4CAF50',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((todayData.totalCalories / (calorieGoal?.targetValue || 2000)) * 100)}% of daily goal
              </Text>

              {weekData.length > 0 && (
                <Text style={styles.weeklyAvgText}>
                  Weekly average: {weeklyAvg.calories} cal/day
                </Text>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateText}>No calorie goal set</Text>
              <Text style={styles.emptyStateSubtext}>
                Add a calorie goal on the Home page to track your budget
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Weekly Summary Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Averages</Text>
        {weekData.length > 0 ? (
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
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateText}>No weekly data yet</Text>
            <Text style={styles.emptyStateSubtext}>Log meals for 7 days to see averages</Text>
          </View>
        )}
      </View>

      {/* Calorie Intake Line Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7-Day Calorie Intake</Text>
        <View style={styles.chartContainer}>
          {calorieChartData ? (
            <LineChart
              data={calorieChartData}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartIcon}>📈</Text>
              <Text style={styles.emptyChartText}>No calorie data yet</Text>
              <Text style={styles.emptyChartSubtext}>
                Add meals to see your calorie trends
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Macro Ratios */}
      {weekData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macro Ratios (This Week)</Text>
          
          <View style={styles.macroRatioItem}>
            <View style={styles.macroRatioHeader}>
              <Text style={styles.macroRatioLabel}>💪 Protein</Text>
              <Text style={styles.macroRatioPercent}>{macroRatios.protein}%</Text>
            </View>
            <View style={styles.macroRatioBarContainer}>
              <View style={[styles.macroRatioBar, { width: `${macroRatios.protein}%`, backgroundColor: '#4CAF50' }]} />
            </View>
          </View>

          <View style={styles.macroRatioItem}>
            <View style={styles.macroRatioHeader}>
              <Text style={styles.macroRatioLabel}>🍞 Carbs</Text>
              <Text style={styles.macroRatioPercent}>{macroRatios.carbs}%</Text>
            </View>
            <View style={styles.macroRatioBarContainer}>
              <View style={[styles.macroRatioBar, { width: `${macroRatios.carbs}%`, backgroundColor: '#FF9800' }]} />
            </View>
          </View>

          <View style={styles.macroRatioItem}>
            <View style={styles.macroRatioHeader}>
              <Text style={styles.macroRatioLabel}>🥑 Fat</Text>
              <Text style={styles.macroRatioPercent}>{macroRatios.fat}%</Text>
            </View>
            <View style={styles.macroRatioBarContainer}>
              <View style={[styles.macroRatioBar, { width: `${macroRatios.fat}%`, backgroundColor: '#F44336' }]} />
            </View>
          </View>
        </View>
      )}

      {/* Meal Frequency */}
      {weekData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meals This Week</Text>
          
          <View style={styles.mealFreqItem}>
            <Text style={styles.mealFreqLabel}>🌅 Breakfast</Text>
            <View style={styles.mealFreqBarContainer}>
              <View style={[styles.mealFreqBar, { width: `${(mealFrequency.breakfast / 7) * 100}%` }]} />
            </View>
            <Text style={styles.mealFreqCount}>{mealFrequency.breakfast}/7</Text>
          </View>

          <View style={styles.mealFreqItem}>
            <Text style={styles.mealFreqLabel}>☀️ Lunch</Text>
            <View style={styles.mealFreqBarContainer}>
              <View style={[styles.mealFreqBar, { width: `${(mealFrequency.lunch / 7) * 100}%` }]} />
            </View>
            <Text style={styles.mealFreqCount}>{mealFrequency.lunch}/7</Text>
          </View>

          <View style={styles.mealFreqItem}>
            <Text style={styles.mealFreqLabel}>🌙 Dinner</Text>
            <View style={styles.mealFreqBarContainer}>
              <View style={[styles.mealFreqBar, { width: `${(mealFrequency.dinner / 7) * 100}%` }]} />
            </View>
            <Text style={styles.mealFreqCount}>{mealFrequency.dinner}/7</Text>
          </View>

          <View style={styles.mealFreqItem}>
            <Text style={styles.mealFreqLabel}>🍿 Snacks</Text>
            <View style={styles.mealFreqBarContainer}>
              <View style={[styles.mealFreqBar, { width: `${(mealFrequency.snack / 7) * 100}%` }]} />
            </View>
            <Text style={styles.mealFreqCount}>{mealFrequency.snack}/7</Text>
          </View>
        </View>
      )}

      {/* Nutrient Highlights */}
      {nutrientInsights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrient Highlights</Text>
          
          {nutrientInsights.map((insight, index) => (
            <View 
              key={index} 
              style={[
                styles.insightCard,
                insight.type === 'warning' && styles.insightWarning,
                insight.type === 'success' && styles.insightSuccess,
                insight.type === 'info' && styles.insightInfo,
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDetail}>{insight.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Daily Goals Progress */}
      {nutritionGoals.length > 0 && weekData.length > 0 && (
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
              : 0;

            const progress = (goal?.targetValue || 0)
              ? Math.min((currentValue / (goal?.targetValue || 0)) * 100, 100)
              : 0;

            return (
              <View key={goal.goalId} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalValue}>
                    {Math.round(currentValue)} / {goal?.targetValue || 0}
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
            <View style={styles.historyHeader}>
              <Text style={[styles.historyHeaderText, { width: 70, textAlign: 'left' }]}>Date</Text>
              <Text style={[styles.historyHeaderText, { width: 70, textAlign: 'center' }]}>Calories</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Protein</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Carbs</Text>
              <Text style={[styles.historyHeaderText, { flex: 1, textAlign: 'center' }]}>Fat</Text>
            </View>
            
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📅</Text>
            <Text style={styles.emptyStateText}>No history yet</Text>
            <Text style={styles.emptyStateSubtext}>Start logging meals to see your history</Text>
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
  
  // Today's Card Styles
  todayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  todayDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  todayMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'lowercase',
  },
  mealTypeTracker: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTypeLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  mealTypeDots: {
    flexDirection: 'row',
    gap: 8,
  },
  mealDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  mealDotActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  mealDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  mealDotTextActive: {
    color: '#fff',
  },
  emptyToday: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTodayIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTodayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyTodaySubtext: {
    fontSize: 13,
    color: '#999',
  },

  // Calorie Budget Tracker
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  weeklyAvgText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },

  // Macro Ratios
  macroRatioItem: {
    marginBottom: 16,
  },
  macroRatioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroRatioLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  macroRatioPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  macroRatioBarContainer: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  macroRatioBar: {
    height: '100%',
    borderRadius: 6,
  },

  // Meal Frequency
  mealFreqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealFreqLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 100,
  },
  mealFreqBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  mealFreqBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  mealFreqCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 40,
    textAlign: 'right',
  },

  // Nutrient Highlights
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  insightWarning: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  insightSuccess: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  insightInfo: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightDetail: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // Empty Chart States
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    width: Dimensions.get('window').width - 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyChartIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  emptyChartSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Empty State (for sections)
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: "center",
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
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  buttonContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
});