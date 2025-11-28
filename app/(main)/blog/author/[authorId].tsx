import { getAuthorProfile, getPostsByAuthor } from "@/utils/blog.repo";
import { AuthorProfile, BlogPost } from "@/utils/types/blog.types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function AuthorProfileScreen() {
  const { authorId } = useLocalSearchParams<{ authorId: string }>();

  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [authorPosts, setAuthorPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authorId) {
      setIsLoading(false);
      return;
    }

    function myFunction() {
      console.log("This message appears after a 1-second delay.");
    }

    setTimeout(myFunction, 1000); // 1000 milliseconds = 1 second

    const loadData = async () => {
      try {
        console.log(`Fetching data for authorId: "${authorId}"`); // Check for spaces here!

        const [profileData, postsData] = await Promise.all([
          getAuthorProfile(authorId),
          getPostsByAuthor(authorId),
        ]);

        // ▼▼▼ THE FIX: Log the variables we just got back ▼▼▼
        console.log("✅ FETCHED Profile:", profileData);
        console.log("✅ FETCHED Posts count:", postsData.length);
        console.log(
          "✅ FETCHED Posts contents:",
          JSON.stringify(postsData, null, 2)
        );

        setProfile(profileData);
        setAuthorPosts(postsData);
      } catch (error) {
        console.error("Error loading author page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authorId]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!profile) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Author not found in database.</Text>
        <Text style={{ fontSize: 12, color: "grey" }}>ID: {authorId}</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        {profile.firstName || "Unknown Name"}
      </Text>
      <Text>{profile.bio || "No bio available"}</Text>
    </View>
  );
}
