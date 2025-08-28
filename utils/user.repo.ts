import { genId, listenDocWithId, upsert } from "@/utils/firestore-helpers";
import { UserProfileRaw, type UserData } from "@/utils/schemas/user";
import { arrayUnion, Timestamp } from "@react-native-firebase/firestore";

import { UserUpdates } from "./types/user.types";

const userPath = (uid: string) => `user/${uid}`;

export const listenUserById = (
  uid: string,
  cb: (u: UserData | null) => void
) => {
  return listenDocWithId<Record<string, unknown>>(
    userPath(uid),
    (res) => {
      if (!res) return cb(null);
      const parsed = UserProfileRaw.safeParse(res.data);
      cb(parsed.success ? { docId: res.id, ...parsed.data } : null);
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
    const goalId = updates.goal.id ?? genId();
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
    const prohibitedIngredientId = updates.prohibitedIngredient.id ?? genId();
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

  if (updates.onboardingComplete)
    infoUpdate.onboardingComplete = updates.onboardingComplete;

  if (updates.currentGoals !== undefined)
    infoUpdate.currentGoals = updates.currentGoals;
  if (updates.prohibitedIngredients !== undefined)
    infoUpdate.prohibitedIngredients = updates.prohibitedIngredients;
  await upsert(userPath(uid), infoUpdate);

  return;
};
