import { createPost, subscribeToMainFeed } from "@/utils/blog.repo";
import { getAuth } from "@react-native-firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BlogPost } from "@/utils/types/blog.types";
import { Link } from "expo-router";

export default function Feed() {
  const currentUser = getAuth().currentUser;

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // post stuff
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Call the repo function. It returns an unsubscribe function.
    const unsubscribe = subscribeToMainFeed((updatedPosts) => {
      // This callback runs instantly whenever the database changes
      setPosts(updatedPosts);
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleAddPost = async () => {
    if (!currentUser) {
      return Alert.alert("Error", "Not logged in");
    }
    if (!title.trim() || !content.trim()) {
      return Alert.alert("Error", "Please fill in title and content");
    }

    try {
      // Hardcoded 'true' for isVerified for testing
      await createPost(title, content, true);
      Alert.alert("Success", "Post created!");
      // Clear form
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("❌ Create Post Error:", error);
      Alert.alert("Error", "Failed to create post");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        placeholder="Post Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Post Content"
        multiline
        value={content}
        onChangeText={setContent}
        style={styles.input}
      />
      <Button title="Publish Post" onPress={handleAddPost} />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          // 1. The Card is now just a visual container (View), not a Link.
          <View style={styles.card}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              {/* 2. ZONE A: Link specific to the Author Profile */}
              {/* Note: Ensure the path includes '/author/' so it goes to the right page */}
              <Link href={`./author/${item.authorId}`} asChild>
                <TouchableOpacity>
                  <Text style={{ fontWeight: "bold", color: "#007AFF" }}>
                    {item.authorName}
                    {item.isVerifiedOrg && " ✅"}
                  </Text>
                </TouchableOpacity>
              </Link>

              <Text style={styles.date}>
                {item.timestamp?.toDate().toLocaleDateString()}
              </Text>
            </View>

            {/* 3. ZONE B: Link specific to the Post Detail */}
            {/* This wraps the title and summary, making the "body" clickable */}
            <Link href={`./post/${item.postId}`} asChild>
              <TouchableOpacity>
                <Text style={styles.title}>{item.title}</Text>
                <Text numberOfLines={3} style={styles.summary}>
                  {item.summary || item.content}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  authorName: { fontWeight: "bold", color: "#333" },
  date: { color: "#888", fontSize: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  summary: { color: "#555", lineHeight: 20 },
});
