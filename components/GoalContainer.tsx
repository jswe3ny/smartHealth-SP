import { Goal } from "@/utils/types/user.types";
import { deleteGoal } from "@/utils/user.repo";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./button";

export const GoalContainer = ({
  goals = [],
  id,
}: {
  goals?: Goal[];
  id: string;
}) => {
  if (goals.length < 1 && true) {
    return (
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <Text>No Goals Added</Text>
      </View>
    );
  }
  if (goals.length >= 1) {
    return (
      <View style={styles.listContainer}>
        <Text>Goal Container</Text>
        {goals.map((goal) => {
          return (
            <View key={goal.goalId} style={styles.goalCard}>
              <Text style={styles.goalTitle}>
                {goal.name || `Goal ID: ${goal.goalId}`}
              </Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
              <Button
                title="Delete"
                onPress={() => {
                  if (!goal.goalId) return;
                  deleteGoal(id, "currentGoals", "goalId", goal.goalId);
                }}
              />
            </View>
          );
        })}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  // A wrapper for the entire list
  listContainer: {
    padding: 16,
  },
  // A card for each individual goal
  goalCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Style for the goal ID (or name)
  goalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  // Style for the goal description
  goalDescription: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
    marginBottom: 12,
  },
  // The Button component you're using likely accepts its own styling props,
  // but if you needed to wrap it or use a <TouchableOpacity>, you could style that.
});
