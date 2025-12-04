import { Stack } from "expo-router";

export default function BlogLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Feed" }}>
      <Stack.Screen name="index" options={{ title: "Feed" }} />

      <Stack.Screen name="./post/[postId]" options={{ title: "Article" }} />

      <Stack.Screen
        name="./author/[authorId]"
        options={{ title: "Author Profile" }}
      />
    </Stack>
  );
}
