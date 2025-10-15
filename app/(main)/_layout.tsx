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
        <Stack.Screen 
          name="home" 
          options={{ title: "Home" }} 
        />
        <Stack.Screen 
          name="foodJournal" 
          options={{ title: "Food Journal" }} 
        />
        <Stack.Screen 
          name="barcodeScanner" 
          options={{ title: "Barcode Scanner" }} 
        />
        <Stack.Screen 
          name="meals/[mealId]" 
          options={{ title: "Meal Details" }} 
        />
      </Stack>
    </SafeAreaView>
  );
}
