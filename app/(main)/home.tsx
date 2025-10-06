import { Button } from "@/components/button";
import { GoalContainer } from "@/components/GoalContainer";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const { accountSignOut, currentUser } = useAuth();
  const userData = useUserInfo();

  if (!currentUser) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
          </View>
          <View>
            <Text style={styles.brandTitle}>Smart Health</Text>
            <Text style={styles.brandSubtitle}>Your wellness companion</Text>
          </View>
        </View>
        <Button title="Sign Out" onPress={accountSignOut} size="sm" bg="#0EA5E9" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <View style={styles.heroIcon}>
          </View>
          <Text style={styles.welcomeTitle}>Welcome to Smart Health</Text>
          <Text style={styles.welcomeSubtitle}>
            Track your nutrition, monitor fitness goals, and connect with health experts.
            Start your wellness journey today!
          </Text>
        </View>

        <GoalContainer goals={userData.profile?.currentGoals} id={currentUser?.uid} />

        <View style={styles.actionsColumn}>
          <Button
            title="Food Journal"
            onPress={() => {
              router.push("./foodJournal");
            }}
            size="lg"
            bg="#000000"
          />

          <Button
            title="Scan Barcode"
            onPress={() => {
              router.push("./barcodeScanner");
            }}
            size="lg"
            bg="#505050ff"
          />
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
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
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
  heroIcon: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
});
