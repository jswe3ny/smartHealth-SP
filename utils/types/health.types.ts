import { Timestamp } from "@react-native-firebase/firestore";

export interface DailyHealthData {
  date: Timestamp;
  steps: number;
  distance: number; // in meters
  calories: number;
  weight: number | null; // in lbs
  activeMinutes: number;
  syncedAt: Timestamp;
}

export interface HealthGoal {
  goalId: string;
  type: 'steps' | 'distance' | 'calories' | 'activeMinutes' | 'weight';
  targetValue: number;
  createdAt: Timestamp;
  isActive: boolean;
}

export interface HealthStats {
  weeklyAverage: {
    steps: number;
    distance: number;
    calories: number;
  };
  monthlyTotal: {
    steps: number;
    distance: number;
    calories: number;
  };
  streak: number; // days in a row meeting goals
}
