import { Stack } from "expo-router";

export default function TrackingLayout() {
  return (
    <Stack>
      <Stack.Screen name="foodJournal" options={{ title: "Food Journal" }} />
    </Stack>
  );
}