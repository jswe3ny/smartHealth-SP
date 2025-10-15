import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();
  return (
    <SafeAreaView>
      <Text>Laning Page</Text>
      <Text>loading: {isLoading.toString()}</Text>
      {/* 
      <Pressable style={styles.button} onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/createAccount")}
      >
        <Text style={styles.buttonText}>Create Account</Text>
      </Pressable> */}
      <Button
        title="Login"
        onPress={() => router.push("./auth")}
        size="lg"
        bg={colors.black}
        fullWidth={true}
      />
      <Button
        title="Create Account"
        onPress={() => router.push("./auth")}
        size="lg"
        bg={colors.primary}
        fullWidth={true}
      />
    </SafeAreaView>
  );
}
