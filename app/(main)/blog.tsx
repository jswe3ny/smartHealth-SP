import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function Blog() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blog</Text>
        <Text style={styles.subtitle}>Health & Wellness Articles</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name="newspaper-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Coming Soon!</Text>
          <Text style={styles.emptyText}>
            Health tips, nutrition guides, and wellness articles will appear here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});