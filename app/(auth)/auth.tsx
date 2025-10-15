import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { Ionicons } from "@expo/vector-icons";
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

export default function Auth() {
  const { isLoading, accountSignIn, accountSignUp } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    const e = email.trim();
    const p = password;

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
    }
  };

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

    setError(null);
    try {
      await accountSignUp(e, password);
    } catch (e: any) {
      setError(e?.message ?? "Sign up failed. Please try again.");
    }
  };

  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setError(null); // Clear any existing errors when switching tabs
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.innerContainer}>
          {/* Header with title and close button */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
            </View>
            <Text style={styles.title}>Welcome to Smart Health</Text>
            <Pressable style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {/* Sign In / Sign Up tabs */}
          <View style={styles.tabContainer}>
            <Pressable 
              style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
              onPress={() => handleTabChange('signin')}
            >
              <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => handleTabChange('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Information/Security message */}
          <View style={styles.messageBox}>
            <Ionicons 
              name={activeTab === 'signin' ? "shield-checkmark" : "checkmark-circle"} 
              size={20} 
              color={activeTab === 'signin' ? "#4CAF50" : "#007AFF"} 
            />
            <Text style={[
              styles.messageText,
              { color: activeTab === 'signin' ? "#4CAF50" : "#007AFF" }
            ]}>
              {activeTab === 'signin' 
                ? "Your health data is encrypted and secure"
                : "Create your personalized health profile"
              }
            </Text>
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
                placeholder={activeTab === 'signin' ? "Enter your password" : "Create a password"}
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={activeTab === 'signin' ? "password" : "password-new"}
                textContentType={activeTab === 'signin' ? "password" : "newPassword"}
                returnKeyType={activeTab === 'signin' ? "go" : "next"}
                onSubmitEditing={activeTab === 'signin' ? handleSignIn : () => confirmPasswordRef.current?.focus()}
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

          {/* Confirm Password input - only show for signup */}
          {activeTab === 'signup' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleSignUp}
                  accessibilityLabel="Confirm Password"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(s => !s)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#888" 
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* Action button */}
          <Button
            title={
              isLoading 
                ? (activeTab === 'signin' ? "Signing in..." : "Creating...") 
                : (activeTab === 'signin' ? "Sign In" : "Create Account")
            }
            onPress={activeTab === 'signin' ? handleSignIn : handleSignUp}
            size="lg"
            bg={activeTab === 'signin' ? "#4CAF50" : "#007AFF"}
            fullWidth
            disabled={isLoading}
            style={styles.actionButton}
          />

          {/* Forgot password link - only show for signin */}
          {activeTab === 'signin' && (
            <Pressable style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </Pressable>
          )}

          {/* Legal text - only show for signup */}
          {activeTab === 'signup' && (
            <Text style={styles.legalText}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          )}

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator />
              <Text style={styles.loaderText}>
                {activeTab === 'signin' ? "Authenticating…" : "Creating your account…"}
              </Text>
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
    backgroundColor: "#fff",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  activeTabText: {
    color: "#333",
    fontWeight: "600",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
    paddingRight: 40,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  actionButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  legalText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 20,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fdecea",
    borderColor: "#f5c6cb",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#a94442",
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
