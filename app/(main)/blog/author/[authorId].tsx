import { getAuthorProfile, getPostsByAuthor } from "@/utils/blog.repo";
import { AuthorProfile, BlogPost } from "@/utils/types/blog.types";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Link, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// CSUB Brand Colors
const CSUB_BLUE = "#003594";
const CSUB_GOLD = "#FFC72C";

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

    const loadData = async () => {
      try {
        const [profileData, postsData] = await Promise.all([
          getAuthorProfile(authorId),
          getPostsByAuthor(authorId),
        ]);
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

  const handleWebsitePress = () => {
    if (profile?.website) {
      Linking.openURL(profile.website);
    }
  };

  const formatJoinDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    return timestamp.toDate().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatPostDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderPostCard = ({ item }: { item: BlogPost }) => (
    <Link href={`../post/${item.postId}`} asChild>
      <TouchableOpacity style={styles.postCard}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        )}
        <View style={styles.postContent}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.postSummary} numberOfLines={2}>
            {item.summary || item.content}
          </Text>
          <Text style={styles.postDate}>{formatPostDate(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CSUB_BLUE} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="person-outline" size={64} color="#CBD5E1" />
        </View>
        <Text style={styles.errorTitle}>Author not found</Text>
        <Text style={styles.errorSubtitle}>
          This author profile may have been removed or is no longer available.
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

  const fullName = `${profile.firstName || ""} ${profile.lastname || ""}`.trim() || "Unknown Author";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Author Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={authorPosts}
        keyExtractor={(item) => item.postId}
        renderItem={renderPostCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {profile.imageLink ? (
                  <Image
                    source={{ uri: profile.imageLink }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.verifiedBadgeLarge}>
                  <Ionicons name="checkmark-circle" size={28} color={CSUB_GOLD} />
                </View>
              </View>

              {/* Name & Bio */}
              <Text style={styles.profileName}>{fullName}</Text>
              
              <View style={styles.verifiedLabel}>
                <Ionicons name="shield-checkmark" size={16} color={CSUB_BLUE} />
                <Text style={styles.verifiedLabelText}>Verified Organization</Text>
              </View>

              {profile.bio && (
                <Text style={styles.profileBio}>{profile.bio}</Text>
              )}

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{authorPosts.length}</Text>
                  <Text style={styles.statLabel}>Articles</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {formatJoinDate(profile.joined) || "—"}
                  </Text>
                  <Text style={styles.statLabel}>Joined</Text>
                </View>
              </View>

              {/* Website Button */}
              {profile.website && (
                <TouchableOpacity
                  style={styles.websiteButton}
                  onPress={handleWebsitePress}
                >
                  <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.websiteButtonText}>Visit Website</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Posts Section Header */}
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={22} color={CSUB_BLUE} />
              <Text style={styles.sectionTitle}>
                Articles by {profile.firstName || "Author"}
              </Text>
            </View>

            {authorPosts.length === 0 && (
              <View style={styles.emptyPosts}>
                <Ionicons name="newspaper-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyPostsText}>No articles yet</Text>
              </View>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CSUB_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // List Content
  listContent: {
    paddingBottom: 32,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: CSUB_GOLD,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: CSUB_BLUE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: CSUB_GOLD,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  verifiedBadgeLarge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: CSUB_BLUE,
    borderRadius: 16,
    padding: 4,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  verifiedLabel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 53, 148, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  verifiedLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: CSUB_BLUE,
  },
  profileBio: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: CSUB_BLUE,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
  },

  // Website Button
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CSUB_BLUE,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 10,
    width: "100%",
    justifyContent: "center",
  },
  websiteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },

  // Empty Posts
  emptyPosts: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyPostsText: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 12,
  },

  // Post Cards
  postCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#E2E8F0",
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    lineHeight: 22,
  },
  postSummary: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 10,
  },
  postDate: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
