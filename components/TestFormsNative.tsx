// ======================================== TESTING ONLY NO VALIDATION ====================================
import { updateUserInfo } from "@/utils/user.repo";
import { Timestamp } from "@react-native-firebase/firestore";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// --- Form 1: Goal ---
export const GoalForm = ({ uid }: { uid: string }) => {
  const [goalName, setGoalName] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [startDate, setStartDate] = useState(""); // expects YYYY-MM-DD

  const submitGoal = () => {
    const convertedStartDate = Timestamp.fromDate(new Date(startDate));
    updateUserInfo(uid, {
      goal: {
        name: goalName,
        description: goalDesc,
        endDate: convertedStartDate,
      },
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Add Goal</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        value={goalName}
        onChangeText={setGoalName}
        placeholder="e.g. Bulk phase"
        placeholderTextColor="#9ca3af"
        style={styles.input}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={goalDesc}
        onChangeText={setGoalDesc}
        placeholder="Short description..."
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>end Date</Text>
      <TextInput
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD (e.g., 2025-08-21)"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={submitGoal}>
        <Text style={styles.buttonText}>Save Goal</Text>
      </Pressable>
    </View>
  );
};

// --- Form 2: Prohibited Ingredient ---
export const ProhibitedIngredientForm = ({ uid }: { uid: string }) => {
  const [piName, setPiName] = useState("");
  const [piReason, setPiReason] = useState("");
  const [piSeverity, setPiSeverity] = useState(""); // keep as string; convert when sending

  const submitProhibited = () => {
    updateUserInfo(uid, {
      prohibitedIngredient: {
        name: piName,
        reason: piReason,
        severity: Number(piSeverity),
      },
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Prohibited Ingredient</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        value={piName}
        onChangeText={setPiName}
        placeholder="e.g. Peanuts"
        placeholderTextColor="#9ca3af"
        style={styles.input}
      />

      <Text style={styles.label}>Reason</Text>
      <TextInput
        value={piReason}
        onChangeText={setPiReason}
        placeholder="Why it's prohibited..."
        placeholderTextColor="#9ca3af"
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Severity (1–10)</Text>
      <TextInput
        value={piSeverity}
        onChangeText={setPiSeverity}
        placeholder="1–10"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={submitProhibited}>
        <Text style={styles.buttonText}>Save Prohibited Ingredient</Text>
      </Pressable>
    </View>
  );
};

// ---Form 3: Personal Details Update ---
export const ProfileDetailsForm = ({ uid }: { uid: string }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD

  const submitProfile = () => {
    // if (dob) {
    let convertedDob;
    if (dob) {
      convertedDob = Timestamp.fromDate(new Date(dob));
    }

    updateUserInfo(uid, {
      firstName: firstName,
      lastName: lastName,
      dateOfBirth: convertedDob,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Basic Profile</Text>

      <Text style={styles.label}>First Name</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="e.g. Jane"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="e.g. Doe"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <Text style={styles.label}>Date of Birth</Text>
      <TextInput
        value={dob}
        onChangeText={setDob}
        placeholder="YYYY-MM-DD (e.g., 2001-04-09)"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
      />

      <Pressable style={styles.button} onPress={submitProfile}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </Pressable>
    </View>
  );
};

// --- Original component now wraps the three new components ---
export default function TestFormsNative({ uid }: { uid: string }) {
  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <GoalForm uid={uid} />
      <ProhibitedIngredientForm uid={uid} />
      <ProfileDetailsForm uid={uid} />
    </ScrollView>
  );
}

// --- Styles object is shared by all components in this file ---
const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#111827",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  h2: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: "#0b1220",
    color: "#e5e7eb",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: {
    textAlignVertical: "top",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    borderColor: "#374151",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
