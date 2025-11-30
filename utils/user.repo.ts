import {
  genId,
  listenDocWithId,
  removeObjectfFromArray,
  upsert,
} from "@/utils/firestore-helpers";
// import { UserProfileRaw, type UserData } from "@/utils/schemas/user";
import { arrayUnion, collection, deleteDoc, doc, getDocs, Timestamp, writeBatch } from "@react-native-firebase/firestore";
import { db } from "./firebase";

import { UserDoc, UserUpdates } from "./types/user.types";

const userPath = (uid: string) => `user/${uid}`;

export const listenUserById = (
  uid: string,
  cb: (u: UserDoc | null) => void
) => {
  return listenDocWithId<Record<string, unknown>>(
    userPath(uid),
    (res) => {
      if (!res) return cb(null);
      const userDoc = {
        docId: res.id,
        ...(res.data as UserDoc),
      };

      cb(userDoc);
    },
    (err) => console.warn("listenUserById error:", err) // permission issues show here
  );
};

export const userAccountInitialization = async (uid: string, email: string) => {
  const now = Timestamp.fromDate(new Date());
  await upsert(userPath(uid), {
    onboardingComplete: false,
    email: email,
    createdAt: now,
  });
};

export const updateUserInfo = async (uid: string, updates: UserUpdates) => {
  // add valid fields to update object
  // basic. Add Try Catch Block Later
  if (!updates) throw new Error("No Valid Updates");
  // adding a goal
  if (updates.goal) {
    const goalId = updates.goal.goalId ?? genId();
    const goal = {
      goalId,
      name: updates.goal.name,
      description: updates.goal.description,
      endDate: updates.goal.endDate,
    };
    await upsert(userPath(uid), {
      currentGoals: arrayUnion(goal),
    });

    return goalId;
  }
  // adding a prohibited ingredient
  if (updates.prohibitedIngredient) {
    const prohibitedIngredientId =
      updates.prohibitedIngredient.ingredientId ?? genId();
    const ingredient = {
      prohibitedIngredientId,
      name: updates.prohibitedIngredient.name,
      reason: updates.prohibitedIngredient.reason,
      severity: updates.prohibitedIngredient.severity,
    };
    await upsert(userPath(uid), {
      prohibitedIngredients: arrayUnion(ingredient),
    });

    return prohibitedIngredientId;
  }

  const infoUpdate: Record<string, unknown> = {};

  // TODO Add personalInfoUpdatedAT timestamp in firestore
  if (updates.firstName) infoUpdate.firstName = updates.firstName;

  if (updates.lastName) infoUpdate.lastName = updates.lastName;

  if (updates.dateOfBirth) infoUpdate.dateOfBirth = updates.dateOfBirth;

  if (updates.height !== undefined) infoUpdate.height = updates.height;

  if (updates.weight !== undefined) infoUpdate.weight = updates.weight;

  if (updates.onboardingComplete)
    infoUpdate.onboardingComplete = updates.onboardingComplete;

  if (updates.currentGoals !== undefined)
    infoUpdate.currentGoals = updates.currentGoals;
  if (updates.prohibitedIngredients !== undefined)
    infoUpdate.prohibitedIngredients = updates.prohibitedIngredients;
  await upsert(userPath(uid), infoUpdate);

  return;
};

export const deleteGoal = async (
  uid: string,
  arrayName: string,
  objectIdFieldName: string,
  objectId: string
) => {
  try {
    await removeObjectfFromArray(
      userPath(uid),
      arrayName,
      objectIdFieldName,
      objectId
    );
  } catch (error) {
    console.log("error: " + error);
  }
};

export const deleteProhibitedIngredient = async (
  uid: string,
  arrayName: string,
  objectIdFieldName: string,
  objectId: string
) => {
  try {
    await removeObjectfFromArray(
      userPath(uid),
      arrayName,
      objectIdFieldName,
      objectId
    );
  } catch (error) {
    console.log("error: " + error);
    throw error;
  }
};

// Delete all user data from Firestore
export const deleteUserData = async (uid: string) => {
  try {
    // Delete health data subcollection
    const healthDataRef = collection(db, `${userPath(uid)}/healthData`);
    const healthDataSnapshot = await getDocs(healthDataRef);
    const batch1 = writeBatch(db);
    healthDataSnapshot.docs.forEach((docSnap: any) => {
      batch1.delete(docSnap.ref);
    });
    if (healthDataSnapshot.docs.length > 0) {
      await batch1.commit();
    }

    // Delete health goals subcollection
    const healthGoalsRef = collection(db, `${userPath(uid)}/healthGoals`);
    const healthGoalsSnapshot = await getDocs(healthGoalsRef);
    const batch2 = writeBatch(db);
    healthGoalsSnapshot.docs.forEach((docSnap: any) => {
      batch2.delete(docSnap.ref);
    });
    if (healthGoalsSnapshot.docs.length > 0) {
      await batch2.commit();
    }

    // Delete all meals (meals are in a separate collection, use uid field)
    const mealsRef = collection(db, "meal");
    const mealsSnapshot = await getDocs(mealsRef);
    
    // Delete meal subcollections (foodItems) and meals
    const batch3 = writeBatch(db);
    let hasMeals = false;
    for (const mealDoc of mealsSnapshot.docs) {
      const mealData = mealDoc.data();
      if (mealData.uid === uid) {
        hasMeals = true;
        const foodItemsRef = collection(db, `meal/${mealDoc.id}/foodItems`);
        const foodItemsSnapshot = await getDocs(foodItemsRef);
        foodItemsSnapshot.docs.forEach((foodItemDoc: any) => {
          batch3.delete(foodItemDoc.ref);
        });
        batch3.delete(mealDoc.ref);
      }
    }
    if (hasMeals) {
      await batch3.commit();
    }

    // Delete user document (do this last)
    const userDocRef = doc(db, userPath(uid));
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
};