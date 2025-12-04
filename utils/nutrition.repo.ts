import { Timestamp, collection, getDocs, orderBy, query, where } from "@react-native-firebase/firestore";
import { db } from "./firebase";
import { genId, upsert } from "./firestore-helpers";
import {
    DailyNutritionData,
    GoalCategory,
    GoalEventType,
    GoalHistoryEvent
} from "./types/nutrition.types";
import { Goal } from "./types/user.types";

// Path helpers
const nutritionDataPath = (uid: string, dateStr: string) =>
  `user/${uid}/nutritionData/${dateStr}`;

const goalHistoryPath = (uid: string, historyId: string) =>
  `user/${uid}/goalHistory/${historyId}`;


// NUTRITION DATA FUNCTIONS
// Calculate daily nutrition totals from all meals for a specific date
export const calculateDailyNutritionFromMeals = async (
  uid: string,
  date: Date
): Promise<DailyNutritionData | null> => {
  try {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Query all meals for this user on this date
    const q = query(
      collection(db, "meal"),
      where("uid", "==", uid),
      where("mealTime", ">=", Timestamp.fromDate(startOfDay)),
      where("mealTime", "<", Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    // Initialize totals
    let totalCalories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    let sugar = 0;
    const mealsConsumed: string[] = [];
    const mealTypes = {
      breakfast: false,
      lunch: false,
      dinner: false,
      snack: false,
    };

    // Process each meal
    for (const mealDoc of querySnapshot.docs) {
      const mealData = mealDoc.data();
      mealsConsumed.push(mealDoc.id);
      
      // Track meal types
      const mealType = mealData.mealType?.toLowerCase();
      if (mealType && mealType in mealTypes) {
        mealTypes[mealType as keyof typeof mealTypes] = true;
      }

      // Get food items for this meal
      const foodItemsSnapshot = await getDocs(
        collection(db, `meal/${mealDoc.id}/foodItems`)
      );

      // Sum up nutrition from all food items
      foodItemsSnapshot.docs.forEach((foodDoc: any) => {
        const food = foodDoc.data();
        totalCalories += food.calories || 0;
        protein += food.protein || 0;
        carbs += food.carbs || 0;
        fat += food.fat || 0;
        fiber += food.fiber || 0;
        sugar += food.sugar || 0;
      });
    }

    // Create daily nutrition data
    const nutritionData: DailyNutritionData = {
      date: Timestamp.fromDate(startOfDay),
      totalCalories: Math.round(totalCalories),
      protein: Math.round(protein * 10) / 10,  
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      sugar: Math.round(sugar * 10) / 10,
      mealsConsumed,
      mealTypes,
      syncedAt: Timestamp.now(),
    };

    // Save to nutritionData collection
    await saveDailyNutritionData(uid, nutritionData);

    return nutritionData;
  } catch (error) {
    console.error("Error calculating daily nutrition:", error);
    throw error;
  }
};

// Save daily nutrition data
export const saveDailyNutritionData = async (
  uid: string,
  nutritionData: DailyNutritionData
): Promise<void> => {
  try {
    const date = nutritionData.date.toDate();
    const dateStr = date.toISOString().split("T")[0];

    await upsert(nutritionDataPath(uid, dateStr), nutritionData);
  } catch (error) {
    console.error("Error saving nutrition data:", error);
    throw error;
  }
};

// Get nutrition data for a specific date
export const getNutritionDataByDate = async (
  uid: string,
  date: Date
): Promise<DailyNutritionData | null> => {
  try {
    const dateStr = date.toISOString().split("T")[0];
    const q = query(
      collection(db, `user/${uid}/nutritionData`),
      where("__name__", "==", dateStr)
    );
    const docSnap = await getDocs(q);
    
    if (docSnap.empty) return null;
    
    return docSnap.docs[0].data() as DailyNutritionData;
  } catch (error) {
    console.error("Error fetching nutrition data:", error);
    return null;
  }
};

// Get nutrition data for a date range
export const getNutritionDataRange = async (
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<DailyNutritionData[]> => {
  try {
    const q = query(
      collection(db, `user/${uid}/nutritionData`),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: any) => doc.data() as DailyNutritionData);
  } catch (error) {
    console.error("Error fetching nutrition data range:", error);
    return [];
  }
};

// Get last 7 days of nutrition data
export const getLastWeekNutritionData = async (
  uid: string
): Promise<DailyNutritionData[]> => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return getNutritionDataRange(uid, weekAgo, today);
};

// Get last 30 days of nutrition data
export const getLastMonthNutritionData = async (
  uid: string
): Promise<DailyNutritionData[]> => {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  return getNutritionDataRange(uid, monthAgo, today);
};


// GOAL HISTORY FUNCTIONS
// Determine goal category from goal type
const determineGoalCategory = (goal: Goal): GoalCategory => {
  if (!goal.type || goal.type === 'general') return 'general';
  
  const healthTypes = ['steps', 'distance', 'calories', 'activeMinutes', 'weight'];
  const nutritionTypes = ['protein', 'carbs', 'fat', 'totalCalories', 'water', 'fiber', 'sugar'];
  
  if (healthTypes.includes(goal.type)) return 'health';
  if (nutritionTypes.includes(goal.type)) return 'nutrition';
  
  return 'general';
};

// Create a goal history event
export const createGoalHistoryEvent = async (
  uid: string,
  goalId: string,
  eventType: GoalEventType,
  goalSnapshot: Goal,
  previousValue?: any,
  newValue?: any,
  metadata?: any
): Promise<string> => {
  try {
    const historyId = genId();
    const goalCategory = determineGoalCategory(goalSnapshot);

    const historyEvent: GoalHistoryEvent = {
      historyId,
      goalId,
      goalCategory,
      eventType,
      eventDate: Timestamp.now(),
      snapshot: goalSnapshot,
      ...(previousValue !== undefined && { previousValue }),
      ...(newValue !== undefined && { newValue }),
      ...(metadata && { metadata }),
    };

    await upsert(goalHistoryPath(uid, historyId), historyEvent);
    return historyId;
  } catch (error) {
    console.error("Error creating goal history event:", error);
    throw error;
  }
};

// Get all history events for a specific goal
export const getGoalHistory = async (
  uid: string,
  goalId: string
): Promise<GoalHistoryEvent[]> => {
  try {
    const q = query(
      collection(db, `user/${uid}/goalHistory`),
      where("goalId", "==", goalId),
      orderBy("eventDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: any) => doc.data() as GoalHistoryEvent);
  } catch (error) {
    console.error("Error fetching goal history:", error);
    return [];
  }
};

// Get goal history for a date range
export const getGoalHistoryRange = async (
  uid: string,
  startDate: Date,
  endDate: Date,
  goalCategory?: GoalCategory
): Promise<GoalHistoryEvent[]> => {
  try {
    let q = query(
      collection(db, `user/${uid}/goalHistory`),
      where("eventDate", ">=", Timestamp.fromDate(startDate)),
      where("eventDate", "<=", Timestamp.fromDate(endDate)),
      orderBy("eventDate", "desc")
    );

    if (goalCategory) {
      q = query(q, where("goalCategory", "==", goalCategory));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: any) => doc.data() as GoalHistoryEvent);
  } catch (error) {
    console.error("Error fetching goal history range:", error);
    return [];
  }
};

// Calculate goal achievement rate for a specific goal
export const calculateGoalAchievement = async (
  uid: string,
  goal: Goal,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  try {
    if (!goal.type || !goal.targetValue) return 0;

    const goalCategory = determineGoalCategory(goal);
    
    if (goalCategory === 'health') {
      // Use healthData for health goals
      const { getHealthDataRange } = require('./health.repo');
      const healthData = await getHealthDataRange(uid, startDate, endDate);
      
      if (healthData.length === 0) return 0;

      const daysMetGoal = healthData.filter((day: any) => {
        const value = goal.type === 'steps' ? day.steps :
                     goal.type === 'distance' ? day.distance :
                     goal.type === 'calories' ? day.calories :
                     goal.type === 'weight' ? day.weight :
                     day.activeMinutes;
        return value >= (goal.targetValue || 0);
      }).length;

      return Math.round((daysMetGoal / healthData.length) * 100);
    } else if (goalCategory === 'nutrition') {
      // Use nutritionData for nutrition goals
      const nutritionData = await getNutritionDataRange(uid, startDate, endDate);
      
      if (nutritionData.length === 0) return 0;

      const daysMetGoal = nutritionData.filter((day) => {
        const value = goal.type === 'protein' ? day.protein :
                     goal.type === 'carbs' ? day.carbs :
                     goal.type === 'fat' ? day.fat :
                     goal.type === 'totalCalories' ? day.totalCalories :
                     goal.type === 'fiber' ? day.fiber :
                     goal.type === 'sugar' ? day.sugar :
                     0;
        return value >= (goal.targetValue || 0);
      }).length;

      return Math.round((daysMetGoal / nutritionData.length) * 100);
    }

    return 0;
  } catch (error) {
    console.error("Error calculating goal achievement:", error);
    return 0;
  }
};