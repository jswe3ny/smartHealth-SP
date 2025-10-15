import { useThemeColors } from "@/assets/styles";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and branding section */}
        <View style={styles.logoSection}>
          <AppLogo size={120} style={{ marginBottom: 24 }} />
          <Text style={styles.title}>Smart Health</Text>
          <Text style={styles.subtitle}>Your wellness companion</Text>
        </View>

        {/* Features section */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="nutrition" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.featureText}>Track your nutrition</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="fitness" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.featureText}>Monitor fitness goals</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.featureText}>Secure & encrypted</Text>
          </View>
        </View>
      </View>

      {/* Buttons section */}
      <View style={styles.buttonContainer}>
        <Button
          title="Sign In"
          onPress={() => router.push("./login")}
          size="lg"
          bg={colors.pastelGreen}
          color={colors.pastelGreenText}
          fullWidth={true}
        />
        <Button
          title="Create Account"
          onPress={() => router.push("./createAccount")}
          size="lg"
          bg="#BBDEFB"
          color="#1565C0"
          fullWidth={true}
          style={styles.blueButton}
        />
        {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },
  featuresContainer: {
    gap: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  blueButton: {
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  loadingText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
  },
});
