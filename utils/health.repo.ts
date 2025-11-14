import { collection, getDocs, orderBy, query, Timestamp, where } from "@react-native-firebase/firestore";
import { db } from "./firebase";
import { genId, upsert } from "./firestore-helpers";
import { DailyHealthData, HealthGoal } from "./types/health.types";

const healthDataPath = (uid: string, dateStr: string) =>
  `user/${uid}/healthData/${dateStr}`;

const healthGoalPath = (uid: string, goalId: string) =>
  `user/${uid}/healthGoals/${goalId}`;

// Save daily health data using firestore-helpers
export const saveDailyHealthData = async (
  uid: string,
  healthData: Omit<DailyHealthData, "syncedAt">
): Promise<void> => {
  try {
    const date = healthData.date.toDate();
    const dateStr = date.toISOString().split("T")[0];

    await upsert(healthDataPath(uid, dateStr), {
      ...healthData,
      syncedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error saving health data:", error);
    throw error;
  }
};

// Get health data for a specific date
export const getHealthDataByDate = async (
  uid: string,
  date: Date
): Promise<DailyHealthData | null> => {
  try {
    const dateStr = date.toISOString().split("T")[0];
    const q = query(
      collection(db, `user/${uid}/healthData`),
      where("__name__", "==", dateStr)
    );
    const docSnap = await getDocs(q);
    
    if (docSnap.empty) return null;
    
    const data = docSnap.docs[0].data();
    return {
      date: data.date,
      steps: data.steps,
      distance: data.distance,
      calories: data.calories,
      weight: data.weight,
      activeMinutes: data.activeMinutes,
      syncedAt: data.syncedAt,
    } as DailyHealthData;
  } catch (error) {
    console.error("Error fetching health data:", error);
    return null;
  }
};

// Get health data for a date range
export const getHealthDataRange = async (
  uid: string,
  startDate: Date,
  endDate: Date
): Promise<DailyHealthData[]> => {
  try {
    const q = query(
      collection(db, `user/${uid}/healthData`),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap: any) => {
      const data = docSnap.data();
      return {
        date: data.date,
        steps: data.steps,
        distance: data.distance,
        calories: data.calories,
        weight: data.weight,
        activeMinutes: data.activeMinutes,
        syncedAt: data.syncedAt,
      } as DailyHealthData;
    });
  } catch (error) {
    console.error("Error fetching health data range:", error);
    return [];
  }
};

// Get last 7 days of health data
export const getLastWeekHealthData = async (
  uid: string
): Promise<DailyHealthData[]> => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return getHealthDataRange(uid, weekAgo, today);
};

// Get last 30 days of health data
export const getLastMonthHealthData = async (
  uid: string
): Promise<DailyHealthData[]> => {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  return getHealthDataRange(uid, monthAgo, today);
};

// Save health goal using firestore-helpers
export const saveHealthGoal = async (
  uid: string,
  goal: Omit<HealthGoal, "goalId" | "createdAt">
): Promise<string> => {
  try {
    const goalId = genId();

    await upsert(healthGoalPath(uid, goalId), {
      ...goal,
      goalId,
      createdAt: Timestamp.now(),
    });

    return goalId;
  } catch (error) {
    console.error("Error saving health goal:", error);
    throw error;
  }
};

// Update an existing health goal
export const updateHealthGoal = async (
  uid: string,
  goalId: string,
  updates: Partial<Pick<HealthGoal, "targetValue" | "isActive">>
): Promise<void> => {
  try {
    await upsert(healthGoalPath(uid, goalId), updates);
  } catch (error) {
    console.error("Error updating health goal:", error);
    throw error;
  }
};

// Delete a health goal 
export const deleteHealthGoal = async (
  uid: string,
  goalId: string
): Promise<void> => {
  try {
    await upsert(healthGoalPath(uid, goalId), {
      isActive: false,
    });
  } catch (error) {
    console.error("Error deleting health goal:", error);
    throw error;
  }
};

// Get active health goals
export const getActiveHealthGoals = async (
  uid: string
): Promise<HealthGoal[]> => {
  try {
    const q = query(
      collection(db, `user/${uid}/healthGoals`),
      where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc: any) => doc.data() as HealthGoal);
  } catch (error) {
    console.error("Error fetching health goals:", error);
    return [];
  }
};