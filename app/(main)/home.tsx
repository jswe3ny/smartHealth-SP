import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import React from "react";
import { Button, Text, View } from "react-native";

export default function Home() {
  const { currentUser, isLoading, accountSignOut } = useAuth();
  const temp = useUserInfo();
  return (
    <View>
      <Text>Home</Text>
      <Text>{currentUser?.email} </Text>
      <Button title="Sign Out" onPress={accountSignOut} />
    </View>
  );
}
