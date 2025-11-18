import { Timestamp } from "@react-native-firebase/firestore";

export type Goal = {
  goalId?: string;
  name: string;
  description: string;
  endDate: Timestamp;
  startDate?: Timestamp;
  // Goal type - health, nutrition, or general
  type?: 'steps' | 'distance' | 'calories' | 'activeMinutes' | 'weight'  // Health goals
       | 'protein' | 'carbs' | 'fat' | 'totalCalories' | 'water' | 'fiber' | 'sugar'  // Nutrition goals
       | 'general';
  // Numeric target for health/nutrition goals
  targetValue?: number;
  currentValue?: number;
  category?: 'health' | 'nutrition' | 'general';
};

export type ProhibitedIngredient = {
  ingredientId?: string;
  name: string;
  reason: string;
  severity: number;
};

export type PersonalInformation = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Timestamp;
};

export type UserDoc = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Timestamp;
  email: string;
  onboardingComplete: boolean;
  createdAt: Timestamp;
  currentGoals?: Goal[];
  prohibitedIngredients?: ProhibitedIngredient[];
};

export type UserUpdates = Partial<UserDoc> & {
  goal?: Goal;
  prohibitedIngredient?: ProhibitedIngredient;
  personalInformation?: PersonalInformation;
};
