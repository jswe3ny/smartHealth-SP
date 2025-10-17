import { useAuth } from "@/contexts/authContext";
import { updateUserInfo } from "@/utils/user.repo";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from "@react-native-firebase/firestore";
import { router } from "expo-router";
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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Onboarding = () => {
  // const { profile, isLoading: profileLoading } = useUserInfo();
  const { accountSignOut, currentUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDOB] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const canSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) return false;
    return true;
  };


  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDOB(selectedDate);
    }
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
      const convertedDob = Timestamp.fromDate(dob);
      await updateUserInfo(currentUser?.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: convertedDob,
        onboardingComplete: true,
        currentGoals: [],
        prohibitedIngredients: [],
        // updatedAt: Date.noOnbw(),
      });
      
      // Redirect to home after successful submission
      router.push("/(main)/home");
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Tell us a little about yourself</Text>
            <Text style={styles.subtitle}>Help us personalize your Smart Health experience</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              autoCapitalize="words"
              autoCorrect={false}
              style={[
                styles.input,
                focusedField === 'firstName' && styles.inputFocused,
                firstName.trim() && styles.inputValid
              ]}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
            <Text style={styles.helpText}>Enter your first name as it appears on official documents</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              autoCapitalize="words"
              autoCorrect={false}
              style={[
                styles.input,
                focusedField === 'lastName' && styles.inputFocused,
                lastName.trim() && styles.inputValid
              ]}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
            <Text style={styles.helpText}>Enter your last name as it appears on official documents</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date of Birth</Text>
            
            <TouchableOpacity
              style={[
                styles.dateInput,
                focusedField === 'dob' && styles.inputFocused,
                dob && styles.inputValid
              ]}
              onPress={() => {
                setFocusedField('dob');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateText}>
                {dob.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>Select your date of birth for personalized health recommendations</Text>

            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={dob}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Text style={styles.privacyText}>
              🔒 Your information is secure and will only be used to personalize your health experience. 
              We never share your personal data with third parties.
            </Text>
          </View>

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
    backgroundColor: "#fff",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  inputFocused: {
    borderColor: "#007AFF",
    borderWidth: 2,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputValid: {
    borderColor: "#28a745",
    backgroundColor: "#f8fff9",
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    lineHeight: 16,
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  error: {
    color: "#a94442",
    marginTop: 8,
    fontSize: 14,
  },
  privacyNotice: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  privacyText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 16,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Onboarding;
