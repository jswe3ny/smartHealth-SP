import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppLayout() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserInfo();

  if (authLoading || profileLoading) return null;
  if (!currentUser) return <Redirect href="/" />;
  if (!profile?.onboardingComplete) return <Redirect href="/onboarding" />;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#FF5722",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            paddingTop: 8,
            paddingBottom: 8,
            height: 65,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarLabel: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="foodJournal"
          options={{
            title: "Food Journal",
            tabBarLabel: "Food",
            tabBarIcon: ({ color }) => (
              <Ionicons name="restaurant" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="nutritionTracking"
          options={{
            title: "Nutrition",
            tabBarLabel: "Nutrition",
            tabBarIcon: ({ color }) => (
              <Ionicons name="stats-chart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="healthTracking"
          options={{
            title: "Health",
            tabBarLabel: "Health",
            tabBarIcon: ({ color }) => (
              <Ionicons name="fitness" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="blog"
          options={{
            title: "Blog",
            tabBarLabel: "Blog",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="newspaper" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="meals/[mealId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="barcodeScanner"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
