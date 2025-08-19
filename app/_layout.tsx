// app/_layout.tsx
import { AuthProvider, useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, SplashScreen } from "expo-router";
import React, { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <BootGate>
          <Slot screenOptions={{ showHeader: true }} />
        </BootGate>
      </ThemeProvider>
    </AuthProvider>
  );
}

function BootGate({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { isLoading: profileLoading } = useUserInfo(); // fetches only after uid exists

  // Only wait on profile if we actually have a signed-in user
  const booting = authLoading || (!!currentUser?.uid && profileLoading);

  useEffect(() => {
    if (!booting) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [booting]);

  if (booting) return null; // keep splash visible
  return <>{children}</>;
}
