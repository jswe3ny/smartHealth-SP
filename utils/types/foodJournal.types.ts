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

// New ProductData type for Open Food Facts API
export interface ProductData {
  barcode: string;
  productName: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sugar: number | null;
  fiber: number | null;
  sodium: number | null;
  saturatedFat: number | null;
  transFat: number | null;
  cholesterol: number | null;
  servingSize: string | null;
  ingredients: string[];
}
