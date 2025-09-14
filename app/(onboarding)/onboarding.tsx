import { useAuth } from "@/contexts/authContext";
import { updateUserInfo } from "@/utils/user.repo";
import { Timestamp } from "@react-native-firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Onboarding = () => {
  // const { profile, isLoading: profileLoading } = useUserInfo();
  const { accountSignOut, currentUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDOB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!currentUser?.uid) return;
    if (!canSubmit()) {
      setError("Please fill all fields correctly.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const convertedDob = Timestamp.fromDate(new Date(dob));
      await updateUserInfo(currentUser?.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: convertedDob,
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
            <Text style={styles.label}>DOB</Text>

            {/* ADD EVENT HANDLER FUNCTION FOR DATEPICKER */}
            {/* <DateTimePicker
              testID="dateTimePicker"
              value={dob}
              mode="date"
              display="default"
              onChange={setDOB}
            /> */}
            <TextInput
              value={dob}
              onChangeText={setDOB}
              placeholder="YYYY-MM-DD - add datepicker"
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <Pressable
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
            </Pressable>
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
