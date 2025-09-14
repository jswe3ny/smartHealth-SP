import { Goal } from "@/utils/types/user.types";
import { deleteGoal } from "@/utils/user.repo";
import React from "react";
import { Text, View } from "react-native";
import { Button } from "./button";

export const GoalContainer = ({
  goals = [],
  id,
}: {
  goals?: Goal[];
  id: string;
}) => {
  if (!goals) {
    return <Text>No Goals Added</Text>;
  }
  if (goals) {
    return (
      <View>
        {goals.map((goal) => {
          return (
            <View key={goal.goalId}>
              <Text>{goal.goalId}</Text>

              <Text>{goal.description}</Text>
              <Button
                title="delete"
                onPress={() => {
                  // Must Check becasue goalId is optional -- important
                  if (!goal.goalId) return;
                  deleteGoal(id, "currentGoals", "goalId", goal.goalId);
                }}
              />
            </View>
          );
        })}
        <Text>test</Text>
      </View>
    );
  }
};
