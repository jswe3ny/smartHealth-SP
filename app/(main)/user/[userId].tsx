import { Button } from "@/components/button";
import { GoalContainer } from "@/components/GoalContainer";
import {
  GoalForm,
  ProhibitedIngredientForm,
} from "@/components/TestFormsNative";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useNavigation } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { ScrollView, Text } from "react-native";

export default function UserIdPage() {
  // const { userId } = useLocalSearchParams<{ userId: string }>();

  const { currentUser } = useAuth();
  const userData = useUserInfo();
  // const colors = useThemeColors();

  // temp state for forsms :
  const [addGoal, setAddGoal] = useState(false);
  const [addIngredient, setAddIngredient] = useState(false);

  const navigation = useNavigation(); // Get the navigation object

  useLayoutEffect(() => {
    if (!userData.isLoading) {
      // console.log("UseLayoutEffect Ran!");
      navigation.setOptions({
        title: userData.profile?.firstName + "'s Page" || "User Name Not Found",
      });
    }
  }, [navigation, userData]);

  if (!currentUser) return;

  return (
    <ScrollView>
      <Text>{userData.profile?.email}</Text>

      {/* ===========GOAL SECTION START=========== */}
      <GoalContainer
        goals={userData.profile?.currentGoals}
        id={currentUser?.uid}
      />
      <Button
        title="Add Goal"
        bg="black"
        fullWidth={false}
        style={{ width: 140, marginHorizontal: "auto", marginBottom: 10 }}
        onPress={() => {
          setAddGoal(!addGoal);
        }}
      />
      {addGoal && <GoalForm uid={currentUser.uid} />}
      {/* ===========GOAL SECTION END=========== */}

      {/* ===========INGREDIENT SECTION START=========== */}

      {userData.profile?.prohibitedIngredients && (
        <ScrollView>
          {userData.profile?.prohibitedIngredients.map((ingredient) => (
            <Text key={ingredient.prohibitedIngredientId}>
              {ingredient.name}
            </Text>
          ))}
        </ScrollView>
      )}
      <Button
        title="Ban Ingredient"
        bg="black"
        fullWidth={false}
        style={{ width: 140, marginHorizontal: "auto", marginBottom: 10 }}
        onPress={() => {
          setAddIngredient(!addIngredient);
        }}
      />

      {addIngredient && <ProhibitedIngredientForm uid={currentUser.uid} />}

      {/* ===========INGREDIENT SECTION END=========== */}
    </ScrollView>
  );
}
