import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/authContext";
import { router } from "expo-router";
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

const isValidEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

const AuthForm = () => {
  const { isLoading, accountSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const handleAuthentication = async () => {
    const e = email.trim();
    const p = password; // don’t trim passwords

    // client-side validation
    if (!e || !p) {
      setError("Please enter both email and password.");
      return;
    }
    if (!isValidEmail(e)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isLoading) return; // block double taps

    setError(null);
    try {
      await accountSignIn(e, p);
    } catch (err: any) {
      const msg =
        err?.message ??
        err?.code ??
        "Login failed. Please try again.";
      setError(msg);
      // optional: console.log(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.innerContainer}>
          <Header title="Welcome Back" subtitle="Sign in to continue" />

          {error ? (
            <View style={styles.errorBox} accessible accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Email"
          />

          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleAuthentication}
              accessibilityLabel="Password"
            />
            <Pressable
              onPress={() => setShowPassword(s => !s)}
              style={styles.showBtn}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Text style={styles.showBtnText}>{showPassword ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>

          <Button
            title={isLoading ? "Signing in..." : "Login"}
            onPress={handleAuthentication}
            size="lg"
            bg={colors.primary}
            fullWidth
            disabled={isLoading}
          />

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator />
              <Text style={styles.loaderText}>Authenticating…</Text>
            </View>
          ) : null}

          <Pressable
            style={styles.toggleButton}
            onPress={() => router.push("/createAccount")}
            disabled={isLoading}
            accessibilityRole="button"
          >
            <Text style={styles.toggleButtonText}>
              Need an account? Sign up
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f6",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
    alignSelf: "center",
  },
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
  passwordRow: {
    width: "100%",
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 70, // room for Show/Hide
  },
  showBtn: {
    position: "absolute",
    right: 10,
    height: 50,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  showBtnText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 8,
  },
  toggleButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fdecea",
    borderColor: "#f5c6cb",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#a94442",
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loaderText: {
    color: "#666",
  },
});

export default AuthForm;
