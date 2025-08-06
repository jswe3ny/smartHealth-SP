import { Stack } from "expo-router";

export default function RootLayout() {
  // const { currentUser, isLoading } = useAuth();
  // const router = useRouter();
  // useEffect(() => {
  //   if (isLoading) {
  //     return;
  //   }

  //   if (currentUser && !isLoading) {
  //     router.push("/home");
  //   }

  //   SplashScreen.hideAsync();
  // }, [currentUser, isLoading, router]);

  return (
    <Stack>
      <Stack.Screen name="createAccount" />
      <Stack.Screen name="login" />
      <Stack.Screen name="index" options={{ animation: "none" }} />
    </Stack>
  );
}
