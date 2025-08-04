import { useAuth } from "@/utils/authContext";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (currentUser && !isLoading) {
      router.push("/home");
    }
  }, [currentUser, isLoading, router]);

  return (
    <Stack>
      <Stack.Screen name="(authed)" />
      <Stack.Screen name="index" options={{ animation: "none" }} />
    </Stack>
  );
}
