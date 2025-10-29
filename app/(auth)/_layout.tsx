import { useAuth } from "@/contexts/authContext";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return null; // root splash still up
  if (currentUser) return <Redirect href="/home" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen name="auth" />
    </Stack>
  );
}
