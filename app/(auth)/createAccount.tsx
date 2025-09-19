import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
const MIN_PW = 8;

export default function CreateAccount() {
  const { accountSignUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (isLoading) return;

    const e = email.trim();
    if (!e || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isValidEmail(e)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < MIN_PW) {
      setError(`Password must be at least ${MIN_PW} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await accountSignUp(e, password);
    } catch (e: any) {
      setError(e?.message ?? "Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.innerContainer}>
          <Header title="Create Account" subtitle="Join SmartHealth today" />

          {error ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => pwRef.current?.focus()}
            accessibilityLabel="Email"
          />

          <View style={styles.passwordRow}>
            <TextInput
              ref={pwRef}
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              accessibilityLabel="Password"
            />
            <Pressable
              onPress={() => setShowPw(s => !s)}
              style={styles.showBtn}
              accessibilityRole="button"
              accessibilityLabel={showPw ? "Hide password" : "Show password"}
            >
              <Text style={styles.showBtnText}>{showPw ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>

          <View style={styles.passwordRow}>
            <TextInput
              ref={confirmRef}
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="go"
              onSubmitEditing={handleSignUp}
              accessibilityLabel="Confirm Password"
            />
            <Pressable
              onPress={() => setShowConfirm(s => !s)}
              style={styles.showBtn}
              accessibilityRole="button"
              accessibilityLabel={showConfirm ? "Hide password" : "Show password"}
            >
              <Text style={styles.showBtnText}>{showConfirm ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>

          <Button
            title={isLoading ? "Creating..." : "Sign Up"}
            onPress={handleSignUp}
            fullWidth
            disabled={isLoading}
          />

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator />
              <Text style={styles.loaderText}>Creating your account…</Text>
            </View>
          ) : null}

          <Pressable
            style={styles.toggleButton}
            onPress={() => router.push("/login")}
            disabled={isLoading}
          >
            <Text style={styles.toggleButtonText}>
              Already have an account? Log In
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f6" },
  innerContainer: { flex: 1, justifyContent: "center", padding: 20, gap: 12 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
    alignSelf: "center",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fdecea",
    borderColor: "#f5c6cb",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  errorText: { color: "#a94442" },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  passwordRow: { width: "100%", position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 70 },
  showBtn: {
    position: "absolute",
    right: 10,
    height: 50,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  showBtnText: { color: "#007AFF", fontWeight: "600" },
  toggleButton: { marginTop: 8, alignSelf: "center" },
  toggleButtonText: { color: "#007AFF", fontSize: 16, fontWeight: "500" },
  loaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loaderText: { color: "#666" },
});
