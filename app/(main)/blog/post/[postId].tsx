import { getPostDetails } from "@/utils/blog.repo";
import { BlogPost } from "@/utils/types/blog.types";
import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// CSUB Brand Colors
const CSUB_BLUE = "#003594";
const CSUB_GOLD = "#FFC72C";

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const data = await getPostDetails(postId);
        setPost(data);
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        title: post.title,
        message: `Check out this article from the Runner Pantry: ${post.title}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    return timestamp.toDate().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CSUB_BLUE} />
        <Text style={styles.loadingText}>Loading article...</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
        </View>
        <Text style={styles.errorTitle}>Article not found</Text>
        <Text style={styles.errorSubtitle}>
          This article may have been removed or is no longer available.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back to Feed</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={CSUB_BLUE} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={CSUB_BLUE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        {post.imageUrl && (
          <Image source={{ uri: post.imageUrl }} style={styles.heroImage} />
        )}

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Author Card */}
          <Link href={`../author/${post.authorId}`} asChild>
            <TouchableOpacity style={styles.authorCard}>
              <View style={styles.authorAvatarContainer}>
                {post.authorAvatar ? (
                  <Image
                    source={{ uri: post.authorAvatar }}
                    style={styles.authorAvatar}
                  />
                ) : (
                  <View style={styles.authorAvatarPlaceholder}>
                    <Text style={styles.authorAvatarText}>
                      {post.authorName?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  {post.isVerifiedOrg && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={CSUB_BLUE} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.publishDate}>{formatDate(post.timestamp)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </Link>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Article Content */}
          <Text style={styles.content}>{post.content}</Text>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color={CSUB_BLUE} />
              <Text style={styles.shareButtonText}>Share Article</Text>
            </TouchableOpacity>
          </View>

          {/* Related Banner */}
          <TouchableOpacity
            style={styles.relatedBanner}
            onPress={() => Linking.openURL("https://csub.edu/caen/food-security.shtml")}
            activeOpacity={0.8}
          >
            <View style={styles.relatedIconContainer}>
              <Ionicons name="nutrition" size={24} color={CSUB_BLUE} />
            </View>
            <View style={styles.relatedContent}>
              <Text style={styles.relatedTitle}>Runner Pantry</Text>
              <Text style={styles.relatedSubtitle}>
                Visit us for free groceries and resources
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={CSUB_GOLD} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#F1F5F9",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CSUB_BLUE,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#E2E8F0",
  },

  // Content
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 20,
  },

  // Author Card
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  authorAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  authorAvatar: {
    width: "100%",
    height: "100%",
  },
  authorAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: CSUB_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  authorAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 53, 148, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: CSUB_BLUE,
  },
  publishDate: {
    fontSize: 14,
    color: "#64748B",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 24,
  },

  // Content Text
  content: {
    fontSize: 17,
    color: "#334155",
    lineHeight: 28,
    letterSpacing: 0.1,
  },

  // Bottom Actions
  bottomActions: {
    marginTop: 32,
    alignItems: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: CSUB_BLUE,
  },

  // Related Banner
  relatedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CSUB_BLUE,
    padding: 18,
    borderRadius: 16,
    marginTop: 32,
    gap: 14,
  },
  relatedIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: CSUB_GOLD,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  relatedSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
