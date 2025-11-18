import { Timestamp } from "@react-native-firebase/firestore";
import { Goal } from "./user.types";

// Daily nutrition data
export interface DailyNutritionData {
  date: Timestamp;
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium?: number;
  water?: number; 
  mealsConsumed: string[];  
  mealTypes: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
  };
  syncedAt: Timestamp;
}

// Goal history event types
export type GoalEventType = 'created' | 'updated' | 'completed' | 'deleted' | 'paused' | 'resumed';

// Goal categories
export type GoalCategory = 'health' | 'nutrition' | 'general';

// Goal history event tracking
export interface GoalHistoryEvent {
  historyId: string;
  goalId: string;
  goalCategory: GoalCategory;
  eventType: GoalEventType;
  eventDate: Timestamp;
  snapshot: Goal;  // Full goal data at this point in time
  previousValue?: any;  // For updates - what was changed from
  newValue?: any;  // For updates - what was changed to
  metadata?: {
    achievementRate?: number;  // Percentage of days goal was met 
    daysActive?: number;  // Total days goal was active
    longestStreak?: number;  // Longest consecutive days meeting goal
    currentStreak?: number;  // Current consecutive days meeting goal
    averagePerformance?: number;  // Average value achieved
    completed?: boolean;  // Whether goal was marked complete
    notes?: string;  // Optional notes about the event
  };
}

// Nutrition goal progress
export interface NutritionGoalProgress {
  goalId: string;
  date: Timestamp;
  targetValue: number;
  actualValue: number;
  percentComplete: number;
  achieved: boolean;
}