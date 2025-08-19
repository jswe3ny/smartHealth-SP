import { z } from "zod";

/**
 * Convert Firestore Timestamp | Date | number | null/undefined -> number|null (millis)
 */
const toMilliseconds = (v: unknown): number | null => {
  if (v == null) return null;
  if (v instanceof Date) return v.getTime();
  return null;
};

const TimestampMs = z.preprocess(toMilliseconds, z.number().nullable());
// ============================= User Type ==============================
/**
    Sub Types for User 
 */
export const GoalRaw = z
  .object({
    name: z.string().default(""),
    description: z.string().nullable().optional(),
    startDate: z.unknown().optional(),
    endDate: z.unknown().optional(),
  })
  .transform((r) => ({
    name: r.name,
    description: r.description ?? null,
    startDateMs: TimestampMs.parse(r.startDate),
    endDateMs: TimestampMs.parse(r.endDate),
  }));

export const RestrictionRaw = z
  .object({
    name: z.string().default(""),
    reason: z.string().nullable().optional(),
    severity: z.unknown().optional(),
  })
  .transform((r) => ({
    name: r.name,
    reason: r.reason ?? null,
    severity: r.severity == null ? null : Number(r.severity),
  }));

// Full User Type
export const UserProfileRaw = z
  .object({
    email: z.email().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    age: z.number().int().nullable().optional(),
    currentGoals: z.array(GoalRaw).default([]),
    onboardingComplete: z.boolean(),
    prohibitedIngredients: z.array(RestrictionRaw).default([]),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
  })
  .transform((r) => ({
    email: r.email ?? null,
    firstName: r.firstName ?? null,
    lastName: r.lastName ?? null,
    age: r.age ?? null,
    onboardingComplete: r.onboardingComplete,
    currentGoals: r.currentGoals,
    prohibitedIngredients: r.prohibitedIngredients,
    createdAt: TimestampMs.parse(r.createdAt),
    updatedAt: TimestampMs.parse(r.updatedAt),
  }));

export type UserProfile = z.infer<typeof UserProfileRaw>;
export type UserData = UserProfile & { docId: string };
