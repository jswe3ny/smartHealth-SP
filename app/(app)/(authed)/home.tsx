import { useAuth } from "@/utils/authContext";
import React from "react";
import { Button, Text, View } from "react-native";

export default function Home() {
  const { currentUser, isLoading, accountSignOut } = useAuth();
  return (
    <View>
      <Text>Home</Text>
      <Text>{currentUser?.email} </Text>
      <Button title="Sign Out" onPress={accountSignOut} />
    </View>
  );
}
