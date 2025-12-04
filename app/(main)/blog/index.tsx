import { subscribeToMainFeed } from "@/utils/blog.repo";
import { BlogPost } from "@/utils/types/blog.types";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// CSUB Brand Colors
const CSUB_BLUE = "#003594";
const CSUB_GOLD = "#FFC72C";

export default function Feed() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMainFeed((updatedPosts) => {
      setPosts(updatedPosts);
      setIsLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderPost = ({ item, index }: { item: BlogPost; index: number }) => (
    <View style={[styles.card, index === 0 && styles.featuredCard]}>
      {/* Optional Header Image */}
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      )}

      <View style={styles.cardContent}>
        {/* Author Row */}
        <View style={styles.authorRow}>
          <Link href={`/blog/author/${item.authorId}`} asChild>
            <TouchableOpacity style={styles.authorInfo}>
              <View style={styles.avatarContainer}>
                {item.authorAvatar ? (
                  <Image
                    source={{ uri: item.authorAvatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {item.authorName?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.authorTextContainer}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>{item.authorName}</Text>
                  {item.isVerifiedOrg && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={CSUB_BLUE}
                      />
                    </View>
                  )}
                </View>
                <Text style={styles.timestamp}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Post Content - Clickable */}
        <Link href={`/blog/post/${item.postId}`} asChild>
          <TouchableOpacity activeOpacity={0.7}>
            <Text
              style={[styles.postTitle, index === 0 && styles.featuredTitle]}
            >
              {item.title}
            </Text>
            <Text style={styles.postSummary} numberOfLines={3}>
              {item.summary || item.content}
            </Text>

            {/* Read More */}
            <View style={styles.readMoreContainer}>
              <Text style={styles.readMoreText}>Read Article</Text>
              <Ionicons name="arrow-forward" size={16} color={CSUB_BLUE} />
            </View>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.headerContent} pointerEvents="none">
        <View style={styles.headerIconContainer}>
          <Ionicons name="nutrition" size={28} color={CSUB_BLUE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Food Pantry Blog</Text>
          <Text style={styles.headerSubtitle}>
            Nutrition tips, recipes & campus resources
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="newspaper-outline" size={64} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>
        Check back soon for nutrition tips, recipes, and updates from the Runner
        Pantry!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CSUB_BLUE} />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={CSUB_BLUE}
            colors={[CSUB_BLUE]}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
  },
  listContent: {
    paddingBottom: 32,
  },

  // Header
  header: {
    backgroundColor: CSUB_BLUE,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "flex-start",
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: CSUB_GOLD,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: CSUB_GOLD,
  },
  cardImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E2E8F0",
  },
  cardContent: {
    padding: 18,
  },

  // Author Row
  authorRow: {
    marginBottom: 14,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: CSUB_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  authorTextContainer: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  verifiedBadge: {
    backgroundColor: "rgba(0, 53, 148, 0.1)",
    borderRadius: 10,
    padding: 2,
  },
  timestamp: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },

  // Post Content
  postTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 26,
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  postSummary: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 16,
  },
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: CSUB_BLUE,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#F1F5F9",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
});
