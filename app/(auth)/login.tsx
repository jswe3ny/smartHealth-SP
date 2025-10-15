import { useThemeColors } from "@/assets/styles";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
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
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

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
          {/* Logo and Title */}
          <View style={styles.logoSection}>
            <AppLogo size={80} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Smart Health</Text>
            <Text style={styles.subtitle}>Your wellness companion</Text>
          </View>

          {/* Sign In / Sign Up tabs */}
          <View style={styles.tabContainer}>
            <Pressable 
              style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
              onPress={() => setActiveTab('signin')}
            >
              <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => {
                setActiveTab('signup');
                router.push("/createAccount");
              }}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Security message */}
          <View style={styles.securityBox}>
            <Ionicons name="shield-checkmark" size={20} color="#2E7D32" />
            <Text style={styles.securityText}>Your health data is encrypted and secure</Text>
          </View>

          {error ? (
            <View style={styles.errorBox} accessible accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
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
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                placeholder="Enter your password"
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
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#888" 
                />
              </Pressable>
            </View>
          </View>

          {/* Sign In button */}
          <Button
            title={isLoading ? "Signing in..." : "Sign In"}
            onPress={handleAuthentication}
            size="lg"
            bg={colors.pastelGreen}
            color={colors.pastelGreenText}
            fullWidth
            disabled={isLoading}
            style={styles.signInButton}
          />

          {/* Forgot password link */}
          <Pressable style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </Pressable>

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator />
              <Text style={styles.loaderText}>Authenticating…</Text>
            </View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#111827",
    fontWeight: "700",
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  securityText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: "#111827",
  },
  passwordInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: "#111827",
    paddingRight: 40,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    padding: 8,
  },
  signInButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  forgotPasswordButton: {
    alignItems: "center",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#FFE5E5",
    borderColor: "#FF3B30",
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontWeight: "600",
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loaderText: {
    color: "#666",
  },
});

export default AuthForm;
