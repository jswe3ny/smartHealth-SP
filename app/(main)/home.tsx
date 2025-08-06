import { useAuth } from "@/utils/authContext";
import React from "react";
import { Button, Text, View } from "react-native";

import { useUserInfo } from "@/hooks/useUserInfo";

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
