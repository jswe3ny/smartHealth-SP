// This is the full code for app/meals/[mealId].tsx

import { Button } from "@/components/button";
import { deleteMealByID, getMealDetailsById } from "@/utils/foodjournal.repo";
import { MealDetails } from "@/utils/types/foodJournal.types";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealDetailScreen() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const navigation = useNavigation(); // Get the navigation object

  const [mealDetails, setMealDetails] = useState<MealDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This effect sets the header title dynamically after data is fetched.
  useLayoutEffect(() => {
    if (mealDetails) {
      navigation.setOptions({
        title: mealDetails.mealName || "Meal Details",
      });
    }
  }, [navigation, mealDetails]);

  // This effect fetches the data from Firestore.
  useEffect(() => {
    if (!mealId) return;

    const fetchMeal = async () => {
      // ... your existing data fetching logic ...
      try {
        const details = await getMealDetailsById(mealId);
        setMealDetails(details);
      } catch (err) {
        setError("Failed to load meal details. Message: " + err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeal();
  }, [mealId]);

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  if (!mealDetails) {
    return <Text>No meal data available.</Text>;
  }

  return (
    <SafeAreaView style={{ paddingHorizontal: 10 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        Food Items:
      </Text>
      <Button
        style={{ width: 60, marginLeft: "auto" }}
        title="X"
        bg={"#000000"} // Feel gree to change at any point, colors.black was deleted so hardcoded this.
        onPress={() => {
          deleteMealByID(mealId);
          router.back();
        }}
      />
      <ScrollView style={{ height: "100%" }}>
        {mealDetails.foodItems.map((item, index) => (
          <View
            key={index}
            style={{
              backgroundColor: "white",
              padding: 15,
              borderRadius: 8,
              marginTop: 10,
            }}
          >
            {/* The foodName is required, so we can always display it. */}
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {item.foodName}
            </Text>

            {item.calories != null ? (
              <Text style={{ marginTop: 5 }}>Calories: {item.calories}</Text>
            ) : null}

            {item.protein != null ? (
              <Text>Protein: {item.protein}g</Text>
            ) : null}

            {item.carbs != null ? <Text>Carbs: {item.carbs}g</Text> : null}

            {item.fat != null ? <Text>Fat: {item.fat}g</Text> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
