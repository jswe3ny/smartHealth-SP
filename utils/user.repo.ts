import {
  genId,
  getDocWithId,
  listenDocWithId,
  removeObjectfFromArray,
  upsert,
} from "@/utils/firestore-helpers";
// import { UserProfileRaw, type UserData } from "@/utils/schemas/user";
import { arrayUnion, Timestamp } from "@react-native-firebase/firestore";
import { createGoalHistoryEvent } from "./nutrition.repo";
import { Goal, UserDoc, UserUpdates } from "./types/user.types";

const userPath = (uid: string) => `user/${uid}`;

// Constants for goal limits
const MAX_TOTAL_GOALS = 8;
const HEALTH_GOAL_TYPES = ['steps', 'distance', 'calories', 'activeMinutes', 'weight'] as const;
const NUTRITION_GOAL_TYPES = ['protein', 'carbs', 'fat', 'totalCalories', 'water', 'fiber', 'sugar'] as const;

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

// Helper function to validate goals before adding
const validateNewGoal = async (uid: string, newGoal: Goal): Promise<void> => {
  const userDoc = await getDocWithId<UserDoc>(userPath(uid));
  const currentGoals = userDoc?.data?.currentGoals || [];

  // Check total goal limit
  if (currentGoals.length >= MAX_TOTAL_GOALS) {
    throw new Error(`Maximum of ${MAX_TOTAL_GOALS} goals reached. Please delete a goal before adding a new one.`);
  }

  // Check for duplicate health/nutrition goal types
  if (newGoal.type && newGoal.type !== 'general') {
    const allSpecialTypes = [...HEALTH_GOAL_TYPES, ...NUTRITION_GOAL_TYPES];
    if (allSpecialTypes.includes(newGoal.type as any)) {
      const existingGoal = currentGoals.find(g => g.type === newGoal.type);
      if (existingGoal) {
        const goalTypeLabel = newGoal.type.charAt(0).toUpperCase() + newGoal.type.slice(1);
        throw new Error(`You already have a ${goalTypeLabel} goal. Please delete it first or update the existing one.`);
      }
    }
  }
};

export const updateUserInfo = async (uid: string, updates: UserUpdates) => {
  // add valid fields to update object
  // basic. Add Try Catch Block Later
  if (!updates) throw new Error("No Valid Updates");
  // Adding a goal with validation and history tracking
  if (updates.goal) {
    // Validate before adding
    await validateNewGoal(uid, updates.goal);

    const goalId = updates.goal.goalId ?? genId();
    
    // Include new health-specific and nutrition-specific fields if present
    const goal: Goal = {
      goalId,
      name: updates.goal.name,
      description: updates.goal.description,
      endDate: updates.goal.endDate,
      ...(updates.goal.type && { type: updates.goal.type }),
      ...(updates.goal.targetValue !== undefined && { targetValue: updates.goal.targetValue }),
      ...(updates.goal.currentValue !== undefined && { currentValue: updates.goal.currentValue }),
      ...(updates.goal.startDate && { startDate: updates.goal.startDate }),
      ...(updates.goal.category && { category: updates.goal.category }),
    };

    await upsert(userPath(uid), {
      currentGoals: arrayUnion(goal),
    });

    // Create goal history event
    try {
      await createGoalHistoryEvent(uid, goalId, 'created', goal);
    } catch (error) {
      console.error("Error creating goal history:", error);
    }

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

  if (updates.email) infoUpdate.email = updates.email; 
  if (updates.height !== undefined) infoUpdate.height = updates.height; 
  if (updates.onboardingComplete)
    infoUpdate.onboardingComplete = updates.onboardingComplete;

  if (updates.currentGoals !== undefined)
    infoUpdate.currentGoals = updates.currentGoals;
  if (updates.prohibitedIngredients !== undefined)
    infoUpdate.prohibitedIngredients = updates.prohibitedIngredients;
  await upsert(userPath(uid), infoUpdate);

  return;
};

// Delete goal with history tracking
export const deleteGoal = async (
  uid: string,
  arrayName: string,
  objectIdFieldName: string,
  objectId: string
) => {
  try {
    // Get goal data before deleting for history
    const userDoc = await getDocWithId<UserDoc>(userPath(uid));
    const goals = userDoc?.data?.currentGoals || [];
    const goalToDelete = goals.find(g => g.goalId === objectId);

    await removeObjectfFromArray(
      userPath(uid),
      arrayName,
      objectIdFieldName,
      objectId
    );

    // Create history event for deletion
    if (goalToDelete) {
      try {
        await createGoalHistoryEvent(uid, objectId, 'deleted', goalToDelete);
      } catch (error) {
        console.error("Error creating goal deletion history:", error);
      }
    }
  } catch (error) {
    console.log("error: " + error);
    throw error;
  }
};

// Helper to get current goal count
export const getGoalCount = async (uid: string): Promise<number> => {
  const userDoc = await getDocWithId<UserDoc>(userPath(uid));
  return userDoc?.data?.currentGoals?.length || 0;
};

// Update existing goal with history tracking
export const updateGoal = async (
  uid: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<void> => {
  try {
    const userDoc = await getDocWithId<UserDoc>(userPath(uid));
    const currentGoals = userDoc?.data?.currentGoals || [];
    
    const goalIndex = currentGoals.findIndex(g => g.goalId === goalId);
    if (goalIndex === -1) {
      throw new Error("Goal not found");
    }

    const oldGoal = currentGoals[goalIndex];
    const updatedGoal = { ...oldGoal, ...updates };
    
    const newGoals = [...currentGoals];
    newGoals[goalIndex] = updatedGoal;

    await updateUserInfo(uid, { currentGoals: newGoals });

    // Create history event
    try {
      await createGoalHistoryEvent(
        uid,
        goalId,
        'updated',
        updatedGoal,
        oldGoal.targetValue,
        updatedGoal.targetValue
      );
    } catch (error) {
      console.error("Error creating goal update history:", error);
    }
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
};
