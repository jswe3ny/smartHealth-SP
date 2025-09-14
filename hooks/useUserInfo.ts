// hooks/useUserInfo.ts
import { useAuth } from "@/contexts/authContext";
// import type { UserData } from "@/utils/schemas/user";
import { UserDoc } from "@/utils/types/user.types";
import { listenUserById } from "@/utils/user.repo";
import { useEffect, useState } from "react";

export const useUserInfo = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    const unsub = listenUserById(currentUser.uid, (u) => {
      setProfile(u);
      setIsLoading(false);
    });
    return unsub;
  }, [currentUser]);

  return { profile, isLoading };
};
