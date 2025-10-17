import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Redirect, Stack } from "expo-router";

export default function OnboardingLayout() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserInfo();

  if (authLoading || profileLoading) return null;
  if (!currentUser) return <Redirect href="/auth" />;
  if (profile?.onboardingComplete) return <Redirect href="/home" />;

  return <Stack />;
}
