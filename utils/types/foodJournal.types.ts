import { Timestamp } from "@react-native-firebase/firestore";

type Nullable<T> = T | null;

export interface MealInsertType {
  mealId: string;
  uid: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealTime: Timestamp;
  mealName?: string;
}
export interface FoodItem {
  tempClientId?: number; // only used for client side keys
  foodItemId: string;
  foodName: string;
  sugar?: Nullable<number>;
  calories?: Nullable<number>;
  protein?: Nullable<number>;
  carbs?: Nullable<number>;
  fat?: Nullable<number>;
}
