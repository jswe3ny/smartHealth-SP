import {
  collection,
  doc,
  Timestamp,
  writeBatch,
} from "@react-native-firebase/firestore";
import { db } from "./firebase";
import { getCollection, getDocWithId, QueryOptions } from "./firestore-helpers";
import { FoodItem, MealInsertType } from "./types/foodJournal.types";

const parseNumericString = (value: any): number | null => {
  // Handle empty, null, or undefined values first.
  if (value == null || value === "") {
    return null;
  }

  // convert the value to a number.
  const numericValue = parseFloat(value);
  return isNaN(numericValue) ? null : numericValue;
};

// BAD PRACTICE NEED TO MOVE FIRESTORE BATCH WRTIE TO FIRESTORE HELPERS !!!!
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
    await batch.commit();

    return mealRef.id;
  } catch (error) {
    console.error("Error adding meal with items:", error);
    throw new Error("Failed to save meal. Please try again.");
  }
};

export interface MealSummary {
  id: string;
  mealName?: string;
}
export const getRecentMealSummaries = async (
  uid: string
): Promise<MealSummary[]> => {
  try {
    // 1. Define the "recipe" for your query.
    //    Use QueryOptions directly, not db.QueryOptions
    const options: QueryOptions = {
      where: [{ field: "uid", op: "==", value: uid }],
      orderBy: [{ field: "mealTime", dir: "desc" }],
      limit: 20,
    };

    // 2. Call the helper function directly, without the "db." prefix.
    const fullMeals = await getCollection<MealInsertType>("meal", options); // FIX: Changed "meal" to "meals"

    // 3. Transform the full data into the simple shape your UI needs.
    const summaries: MealSummary[] = fullMeals.map((doc) => ({
      id: doc.id,
      mealName: doc.data.mealName,
    }));

    return summaries;
  } catch (error) {
    console.error("Error fetching recent meals:", error);
    return [];
  }
};
export interface MealDetails extends MealInsertType {
  foodItems: FoodItem[];
}
export const getMealDetailsById = async (
  mealId: string
): Promise<MealDetails | null> => {
  try {
    // 1. Construct the path to the parent meal document.
    const mealPath = `meal/${mealId}`;

    // 2. Fetch the main meal document using your new helper.
    const mealDoc = await getDocWithId<MealInsertType>(mealPath);
    if (!mealDoc) {
      // If the main meal doesn't exist, we can't get its items.
      console.warn(`Meal with ID ${mealId} not found.`);
      return null;
    }

    // 3. Construct the path to the foodItems subcollection.
    const foodItemsPath = `meal/${mealId}/foodItems`;

    // 4. Fetch all the food items from the subcollection using your existing helper.
    const foodItemDocs = await getCollection<FoodItem>(foodItemsPath, {});

    // 5. Combine the results into a single, clean object.
    const mealDetails: MealDetails = {
      ...mealDoc.data, // The data from the parent meal (name, type, time)
      mealId: mealDoc.id,
      foodItems: foodItemDocs.map((doc) => doc.data), // The array of food items
    };
    console.log("meal data: ", mealDetails);
    return mealDetails;
  } catch (error) {
    console.error(`Error fetching details for meal ${mealId}:`, error);
    throw error; // Re-throw the error for the UI to handle
  }
};
