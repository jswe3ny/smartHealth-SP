import { Button } from "@/components/button";
import { GoalContainer } from "@/components/GoalContainer";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import React from "react";
import { Text, View } from "react-native";

export default function Home() {
  const { accountSignOut, currentUser } = useAuth();
  const userData = useUserInfo();
  console.log("client: ", userData.profile?.currentGoals);
  if (!currentUser) return;
  return (
    <View>
      <Text>Home</Text>
      <Text>{userData.profile?.firstName} </Text>
      {/* ################### TESTING Firebase Operations ####################### */}
      {/* <TestFormsNative uid={userData.profile?.docId!} /> */}
      {/* ################### TESTING Operations  ####################### */}
      <GoalContainer
        goals={userData.profile?.currentGoals}
        id={currentUser?.uid}
      />
      <Button
        title="Sign Out"
        onPress={accountSignOut}
        size="lg"
        bg="#000000"
      />
    </View>
  );
}
