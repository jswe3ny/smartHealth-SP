import { Button } from "@/components/button";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import React from "react";
import { Text, View } from "react-native";

export default function Home() {
  const { accountSignOut } = useAuth();
  const userData = useUserInfo();

  return (
    <View>
      <Text>Home</Text>
      <Text>{userData.profile?.firstName} </Text>
      {/* ################### TESTING Firebase Operations ####################### */}
      {/* <TestFormsNative uid={temp.profile?.docId!} /> */}
      {/* ################### TESTING Operations  ####################### */}

      <Button
        title="Sign Out"
        onPress={accountSignOut}
        size="lg"
        bg="#000000"
      />
    </View>
  );
}
