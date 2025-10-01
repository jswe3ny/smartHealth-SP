import {
  collection,
  doc,
  Timestamp,
  writeBatch,
} from "@react-native-firebase/firestore";
import { db } from "./firebase";
import { FoodItem } from "./types/foodJournal.types";

const parseNumericString = (value: any): number | null => {
  // Handle empty, null, or undefined values first.
  if (value == null || value === "") {
    return null;
  }

  // convert the value to a number.
  const numericValue = parseFloat(value);
  return isNaN(numericValue) ? null : numericValue;
};

export const addMeal = async (
  mealName: string,
  MealType: string,
  uid: string,
  foodItems: Omit<FoodItem, "foodItemId">[]
): Promise<string> => {
  const batch = writeBatch(db);

  // Must Have MealName
  if (!mealName) {
    throw new Error("Cannot add a meal with no Meal Name");
  }

  // Cannot have a meal with no foods
  if (!foodItems || foodItems.length === 0) {
    throw new Error("Cannot add a meal with no food items.");
  }
  // Ensures each foodname has is a valid string
  // Create a new, sanitized array to pass to the batch.
  const validatedFoodItems = foodItems.map((item) => {
    // 1. Validate the required fields first. If this fails, the whole map stops.
    if (!item.foodName || item.foodName.trim() === "") {
      throw new Error("All food items must have a valid name.");
    }

    return {
      foodName: item.foodName.trim(),
      calories: parseNumericString(item.calories),
      protein: parseNumericString(item.protein),
      carbs: parseNumericString(item.carbs),
      fat: parseNumericString(item.fat),
      sugar: parseNumericString(item.sugar),
    };
  });

  try {
    const mealInfo = {
      mealName,
      MealType,
      mealTime: Timestamp.now(),
      uid,
    };

    const mealRef = doc(collection(db, "meal"));

    batch.set(mealRef, {
      ...mealInfo,
      mealId: mealRef.id,
    });

    // loop through the array of food items that were passed in.
    validatedFoodItems.forEach((item) => {
      // For each food item, create a new document reference INSIDE the
      // subcollection of the meal we are about to create.
      const foodItemRef = doc(collection(db, `meal/${mealRef.id}/foodItems`));

      // Add the "set" operation for this food item to the batch.
      batch.set(foodItemRef, {
        ...item,
        foodItemId: foodItemRef.id, // Store the item's own unique ID
      });
    });
    console.log(validatedFoodItems);
    // Either everything will be saved or nothing will
    await batch.commit();

    return mealRef.id;
  } catch (error) {
    // If anything fails during the process, log the error and re-throw it
    // so the UI can handle it (e.g., show an error message to the user).
    console.error("Error adding meal with items:", error);
    throw new Error("Failed to save meal. Please try again.");
  }
};
