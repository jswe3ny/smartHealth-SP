import {
  collection,
  doc,
  Timestamp,
  writeBatch,
} from "@react-native-firebase/firestore";
import { db } from "./firebase";
import { FoodItem } from "./types/foodJournal.types";

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
    if (!item.foodName || item.foodName.trim() === "") {
      throw new Error("All food items must have a valid name.");
    }

    // Create a copy of the item to modify
    const validatedItem: Omit<FoodItem, "foodItemId"> = {
      foodName: item.foodName.trim(),
    };

    // Check if each nutrition metric in FoodItem is valid number

    if (typeof item.calories === "number" && !isNaN(item.calories)) {
      validatedItem.calories = item.calories;
    }
    if (typeof item.protein === "number" && !isNaN(item.protein)) {
      validatedItem.protein = item.protein;
    }
    if (typeof item.carbs === "number" && !isNaN(item.carbs)) {
      validatedItem.carbs = item.carbs;
    }
    if (typeof item.fat === "number" && !isNaN(item.fat)) {
      validatedItem.fat = item.fat;
    }
    if (typeof item.sugar === "number" && !isNaN(item.sugar)) {
      validatedItem.sugar = item.sugar;
    }

    return validatedItem;
  });

  try {
    const mealInfo = {
      mealName,
      MealType,
      mealTime: Timestamp.now(),
      uid,
    };

    const mealRef = doc(collection(db, "meal"));

    // 3. Add the "set" operation for the main meal document to the batch.

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
