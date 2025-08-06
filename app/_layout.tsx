import { AuthProvider, useAuth } from "@/utils/authContext";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
// import { SafeAreaView } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return; // Do nothing while loading, splash screen stays visible.

    if (!currentUser) {
      router.replace("/");
    } else {
      router.replace("/home");
    }
    SplashScreen.hideAsync();
  }, [isLoading, currentUser, router]);
  if (isLoading) {
    return null;
  }
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: true,
          animation: "none",
        }}
      >
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
export default function RootLayout() {
  return (
    <AuthProvider>
      <InnerLayout />
    </AuthProvider>
  );
}
