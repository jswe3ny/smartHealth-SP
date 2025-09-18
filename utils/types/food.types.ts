import { Timestamp } from "@react-native-firebase/firestore";
import { ProhibitedIngredient } from './user.types';

export interface FoodEntry {
  id?: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  notes: string;
  allergens: string[];
  ingredients: string[];
  foodDatabaseId?: string;
  brand: string;
  date: string;
  timestamp: Timestamp;
  userId?: string;
}

export interface FoodDatabaseItem {
  id?: string;
  name: string;
  brand: string;
  barcode?: string;
  nutritionPer100g: NutritionData;
  allergens: string[];
  categories: string[];
  verified: boolean;
  searchableText: string;
  createdAt: Timestamp;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  [key: string]: number | undefined;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface FoodEntryFormData {
  foodName: string;
  brand: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  mealType: MealType;
  notes: string;
  servingSize: string;
  foodDatabaseId?: string;
}

export interface AllergyAlert {
  title: string;
  message: string;
  severity: 'warning' | 'danger';
  highestSeverity: number;
  matches: ProhibitedIngredient[];
}

export const createFoodEntry = (data: Partial<FoodEntry>): Omit<FoodEntry, 'id'> => ({
  foodName: data.foodName?.trim() || '',
  calories: parseInt(data.calories?.toString() || '0') || 0,
  protein: parseFloat(data.protein?.toString() || '0') || 0,
  carbs: parseFloat(data.carbs?.toString() || '0') || 0,
  fat: parseFloat(data.fat?.toString() || '0') || 0,
  mealType: data.mealType || 'breakfast',
  notes: data.notes?.trim() || '',
  allergens: data.allergens || [],
  ingredients: data.ingredients || [],
  foodDatabaseId: data.foodDatabaseId || undefined,
  brand: data.brand?.trim() || '',
  date: data.date || new Date().toISOString().split('T')[0],
  timestamp: data.timestamp || Timestamp.now(),
});

export const createFoodEntryFromForm = (formData: FoodEntryFormData & { date?: string }): Omit<FoodEntry, 'id'> => ({
  foodName: formData.foodName.trim(),
  calories: parseInt(formData.calories) || 0,
  protein: parseFloat(formData.protein) || 0,
  carbs: parseFloat(formData.carbs) || 0,
  fat: parseFloat(formData.fat) || 0,
  mealType: formData.mealType,
  notes: formData.notes.trim(),
  allergens: [],
  ingredients: [],
  foodDatabaseId: formData.foodDatabaseId,
  brand: formData.brand.trim(),
  date: formData.date || new Date().toISOString().split('T')[0],
  timestamp: Timestamp.now(),
});

export const createFoodDatabaseItem = (data: Partial<FoodDatabaseItem>): Omit<FoodDatabaseItem, 'id'> => ({
  name: data.name?.trim() || '',
  brand: data.brand?.trim() || '',
  barcode: data.barcode || undefined,
  nutritionPer100g: {
    calories: parseFloat(data.nutritionPer100g?.calories?.toString() || '0') || 0,
    protein: parseFloat(data.nutritionPer100g?.protein?.toString() || '0') || 0,
    carbs: parseFloat(data.nutritionPer100g?.carbs?.toString() || '0') || 0,
    fat: parseFloat(data.nutritionPer100g?.fat?.toString() || '0') || 0,
    fiber: parseFloat(data.nutritionPer100g?.fiber?.toString() || '0') || 0,
    sugar: parseFloat(data.nutritionPer100g?.sugar?.toString() || '0') || 0,
    sodium: parseFloat(data.nutritionPer100g?.sodium?.toString() || '0') || 0,
    ...data.nutritionPer100g,
  },
  allergens: data.allergens || [],
  categories: data.categories || [],
  verified: data.verified || false,
  searchableText: `${data.name} ${data.brand}`.toLowerCase(),
  createdAt: data.createdAt || Timestamp.now(),
});