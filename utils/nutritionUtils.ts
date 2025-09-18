import { FoodEntry, MealType, NutritionData } from './types/food.types';

export const calculateTotalNutrition = (entries: FoodEntry[]): NutritionData => {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + (entry.calories || 0),
      protein: totals.protein + (entry.protein || 0),
      carbs: totals.carbs + (entry.carbs || 0),
      fat: totals.fat + (entry.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

export const getEntriesByMeal = (entries: FoodEntry[], mealType: MealType): FoodEntry[] => {
  return entries.filter(entry => entry.mealType === mealType);
};

export const calculateMealNutrition = (entries: FoodEntry[], mealType: MealType): NutritionData => {
  const mealEntries = getEntriesByMeal(entries, mealType);
  return calculateTotalNutrition(mealEntries);
};
