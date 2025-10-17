import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, router } from "expo-router";
import { TouchableOpacity } from "react-native";


export default function OnboardingLayout() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { isLoading: profileLoading } = useUserInfo();

  if (authLoading || profileLoading) return null;
  if (!currentUser) return <Redirect href="/auth" />;


  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="onboarding" 
        options={{
          title: "Onboarding",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push("/(main)/home")}
              style={{ padding: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          )
        }}
      />
    </Stack>
  );
}
