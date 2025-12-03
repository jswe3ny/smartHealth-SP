import { useThemeColors } from "@/assets/styles";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/button";
import { GoalContainer } from "@/components/GoalContainer";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const { accountSignOut, currentUser } = useAuth();
  const userData = useUserInfo();
  const colors = useThemeColors();

  if (!currentUser) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <View>
            <Text style={styles.brandTitle}>Smart Health</Text>
            <Text style={styles.brandSubtitle}>Your wellness companion</Text>
          </View>
        </View>
        <Button title="Sign Out" onPress={accountSignOut} size="sm" bg="#0EA5E9" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <AppLogo size={72} style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={styles.welcomeTitle}>Welcome to Smart Health</Text>
          <Text style={styles.welcomeSubtitle}>
            Track your nutrition, monitor fitness goals, and connect with health experts.
            Start your wellness journey today!
          </Text>
        </View>

        <GoalContainer goals={userData.profile?.currentGoals} id={currentUser?.uid} />

        <View style={styles.actionsColumn}>
          {/* Food Journal Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.greenButton]}
            onPress={() => router.push("./foodJournal")}
            activeOpacity={0.9}
          >
            <View style={[styles.iconContainer, styles.greenIconBg]}>
              <Ionicons name="restaurant" size={20} color={colors.pastelGreenText} />
            </View>
            <Text style={[styles.actionButtonText, styles.greenText]}>Food Journal</Text>
          </TouchableOpacity>

          {/* Scan Barcode Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.greenButton]}
            onPress={() => router.push("./barcodeScanner")}
            activeOpacity={0.9}
          >
            <View style={[styles.iconContainer, styles.greenIconBg]}>
              <Ionicons name="barcode" size={20} color={colors.pastelGreenText} />
            </View>
            <Text style={[styles.actionButtonText, styles.greenText]}>Scan Barcode</Text>
          </TouchableOpacity>

          {/* Health Tracking Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.blackButton]}
            onPress={() => router.push("./healthTracking")}
            activeOpacity={0.9}
          >
            <View style={[styles.iconContainer, styles.whiteIconBg]}>
              <Ionicons name="barbell" size={20} color="#000000" />
            </View>
            <Text style={[styles.actionButtonText, styles.whiteText]}>Health Tracking</Text>
          </TouchableOpacity>

          {/* Food Pantry Blog Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.blueButton]}
            onPress={() => router.push("./blog/feed")}
            activeOpacity={0.9}
          >
            <View style={[styles.iconContainer, styles.goldIconBg]}>
              <Ionicons name="nutrition" size={20} color="#003594" />
            </View>
            <Text style={[styles.actionButtonText, styles.whiteText]}>Food Pantry Blog</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  brandSubtitle: { fontSize: 12, color: "#6B7280" },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 16 },
  welcomeCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsColumn: { gap: 12, marginTop: 12 },
  
  // Action Buttons
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 10,
    gap: 12,
  },
  greenButton: {
    backgroundColor: "#C8E6C9",
  },
  blackButton: {
    backgroundColor: "#000000",
  },
  blueButton: {
    backgroundColor: "#003594",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  greenIconBg: {
    backgroundColor: "rgba(46, 125, 50, 0.15)",
  },
  whiteIconBg: {
    backgroundColor: "#FFFFFF",
  },
  goldIconBg: {
    backgroundColor: "#FFC72C",
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  greenText: {
    color: "#2E7D32",
  },
  whiteText: {
    color: "#FFFFFF",
  },
});
