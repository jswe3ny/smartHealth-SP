import { listenDocWithId, upsert } from "@/utils/firestore-helpers";
import { UserProfileRaw, type UserData } from "@/utils/schemas/user";

const userPath = (uid: string) => `user/${uid}`; // ← singular, as you wanted

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
  const now = Date.now();
  await upsert(userPath(uid), {
    onboardingComplete: false,
    email: email,
    createdAt: now,
  });
};
