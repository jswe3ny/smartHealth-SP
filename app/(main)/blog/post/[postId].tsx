import { getPostDetails } from "@/utils/blog.repo";
import { BlogPost } from "@/utils/types/blog.types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function PostDetailScreen() {
  // 1. Get the dynamic ID from the URL
  const { postId } = useLocalSearchParams<{ postId: string }>();

  console.log("Current postId:", postId);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Fetch the full post data
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const data = await getPostDetails(postId);
        setPost(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!post) {
    return <Text>Post not found.</Text>;
  }

  console.log("Full Article Info:", post);

  return (
    <View>
      <Text>{post.title}</Text>
      <Text>{post.authorName}</Text>
    </View>
  );
}
