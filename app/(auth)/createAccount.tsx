import { useThemeColors } from "@/assets/styles";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
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
  const colors = useThemeColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');

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
              onPress={() => {
                setActiveTab('signin');
                router.push("/login");
              }}
            >
              <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Information box */}
          <View style={styles.infoBox}>
            <Ionicons name="checkmark-circle" size={20} color="#1565C0" />
            <Text style={styles.infoText}>Create your personalized health profile</Text>
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
                onSubmitEditing={() => pwRef.current?.focus()}
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
                ref={pwRef}
                style={styles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPw(s => !s)}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPw ? "Hide password" : "Show password"}
              >
                <Ionicons 
                  name={showPw ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#888" 
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                ref={confirmRef}
                style={styles.passwordInput}
                placeholder="Confirm your password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSignUp}
                accessibilityLabel="Confirm Password"
              />
              <Pressable
                onPress={() => setShowConfirm(s => !s)}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showConfirm ? "Hide password" : "Show password"}
              >
                <Ionicons 
                  name={showConfirm ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#888" 
                />
              </Pressable>
            </View>
          </View>

          {/* Create Account button */}
          <Button
            title={isLoading ? "Creating..." : "Create Account"}
            onPress={handleSignUp}
            size="lg"
            bg="#BBDEFB"
            color="#1565C0"
            fullWidth
            disabled={isLoading}
            style={styles.createAccountButton}
          />

          {/* Legal text */}
          <Text style={styles.legalText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator />
              <Text style={styles.loaderText}>Creating your account…</Text>
            </View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  infoText: {
    color: "#1565C0",
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
  createAccountButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  legalText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
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
