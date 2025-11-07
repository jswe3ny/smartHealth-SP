import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Redirect, Stack } from "expo-router";
import { SafeAreaView } from "react-native";

export default function AppLayout() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserInfo();

  if (authLoading || profileLoading) return null; // root splash still up
  if (!currentUser) return <Redirect href="/" />;
  if (!profile?.onboardingComplete) return <Redirect href="/onboarding" />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="foodJournal" />
        <Stack.Screen name="healthTracking" />
        <Stack.Screen name="meals/[mealId]" />
        <Stack.Screen name="user/[userId]" />
      </Stack>
    </SafeAreaView>
  );
}
