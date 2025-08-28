import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const AuthForm = () => {
  const { isLoading, accountSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const handleAuthentication = async () => {
    // Basic validation
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setError(null);
    try {
      console.log("Attempt login for", email);
      await accountSignIn(email, password);
      console.log("Login successful!");
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message ?? "Unknown error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <Text>loading: {isLoading.toString()}</Text>
          <Text style={styles.title}>Welcome Back</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Login"
            onPress={handleAuthentication}
            size="lg"
            bg={colors.primary}
            fullWidth={true}
            disabled={isLoading}
          />

          <Pressable
            style={styles.toggleButton}
            onPress={() => {
              router.push("/createAccount");
            }}
            disabled={isLoading}
          >
            <Text style={styles.toggleButtonText}>
              Need an account? Sign Up
            </Text>
          </Pressable>
          {/* <Button
            title="Create Account"
            onPress={() => {
              router.push("/createAccount");
            }}
            size="lg"
            bg={colors.primary}
            fullWidth={true}
          /> */}
          {error ? <Text>ERRROR: {error}</Text> : ""}
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
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 20,
  },
  toggleButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AuthForm;
