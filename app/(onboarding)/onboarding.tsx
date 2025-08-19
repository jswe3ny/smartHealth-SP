import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { upsert } from "@/utils/firestore-helpers";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Onboarding = () => {
  const { profile, isLoading: profileLoading } = useUserInfo();
  const { accountSignOut } = useAuth();

  // const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) return false;
    const n = Number.parseInt(age, 10);
    if (Number.isNaN(n) || n < 13 || n > 120) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!profile?.docId) return;
    if (!canSubmit()) {
      setError("Please fill all fields correctly.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const n = Number.parseInt(age, 10);
      await upsert(`user/${profile?.docId}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: n,
        onboardingComplete: true,
        currentGoals: [],
        prohibitedIngredients: [],
        // updatedAt: Date.noOnbw(),
      });
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Tell us a little about yourself</Text>

          <View style={styles.field}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 26"
              keyboardType="number-pad"
              style={styles.input}
              returnKeyType="done"
              maxLength={3}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                !canSubmit() || loading ? styles.buttonDisabled : null,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit() || loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  error: {
    color: "#b00020",
    marginTop: 8,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 12,
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Onboarding;
