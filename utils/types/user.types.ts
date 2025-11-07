import { Timestamp } from "@react-native-firebase/firestore";

export type Goal = {
  goalId?: string;
  description: string;
  endDate: Timestamp;
  startDate?: Timestamp;
  name: string;
};

export type ProhibitedIngredient = {
  prohibitedIngredientId?: string;
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
