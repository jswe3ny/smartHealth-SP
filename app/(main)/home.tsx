import { useThemeColors } from "@/assets/styles";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/button";
import { GoalContainer } from "@/components/GoalContainer";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

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
          <Button
            title="Food Journal"
            onPress={() => {
              router.push("./foodJournal");
            }}
            size="lg"
            bg={colors.pastelGreen}
            color={colors.pastelGreenText}
          />

          <Button
            title="Scan Barcode"
            onPress={() => {
              router.push("./barcodeScanner");
            }}
            size="lg"
            bg={colors.pastelGreen}
            color={colors.pastelGreenText}
          />
        </View>

        {/* CSUB Students Section */}
        <View style={styles.csubSection}>
          <View style={styles.csubContent}>
            <View style={styles.csubIconContainer}>
              <Ionicons name="school" size={48} color="#003594" />
            </View>
            <View style={styles.csubTextContainer}>
              <Text style={styles.csubTitle}>CSUB Students</Text>
              <Text style={styles.csubSubtitle}>
                Access free nutritious food at the Runner Pantry
              </Text>
            </View>
          </View>
          <Button
            title="CSUB Students Click Here!"
            onPress={() => {
              router.push("./csubStudents");
            }}
            size="lg"
            bg="#FFC72C"
            color="#003594"
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
  csubSection: {
    backgroundColor: "#003594",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    gap: 16,
  },
  csubContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  csubIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#FFC72C",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  csubTextContainer: {
    flex: 1,
  },
  csubTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  csubSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
  },
});
