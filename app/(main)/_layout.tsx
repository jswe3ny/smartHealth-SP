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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" options={{ headerShown: true }} />
        <Stack.Screen name="foodJournal" options={{ headerShown: true }} />
        <Stack.Screen name="healthTracking" options={{ headerShown: true }} />
        <Stack.Screen name="blog/feed" options={{ headerShown: false, title: "Food Pantry Blog" }} />
        <Stack.Screen name="blog/post/[postId]" options={{ headerShown: false }} />
        <Stack.Screen name="blog/author/[authorId]" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}
