import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "@/assets/styles";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/button";
import { addMeal, getRecentMealSummaries } from "@/utils/foodjournal.repo";
import {
  FoodItem,
  MealSummary,
  ProductData,
} from "@/utils/types/foodJournal.types";
import { Link } from "expo-router";

export type NewFoodItem = Omit<FoodItem, "foodItemId">;

export default function FoodJournal() {
  const { currentUser } = useAuth();
  const userData = useUserInfo();

  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [foodItems, setFoodItems] = useState<NewFoodItem[]>([]);
  const [currentFoodItem, setCurrentFoodItem] = useState<NewFoodItem>({
    tempClientId: undefined,
    foodName: "",
    calories: null,
    sugar: null,
    protein: null,
    carbs: null,
    fat: null,
  });
  const [foodItemCount, setFoodItemCount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [mealSummary, setMealSummary] = useState<MealSummary[]>([]);

  useEffect(() => {
    // getMealSummary();
    if (!currentUser?.uid) return;

    const unsubscribe = getRecentMealSummaries(
      currentUser.uid,
      (updatedMeals) => {
        setMealSummary(updatedMeals);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleInputChange = (field: keyof FoodItem, value: string) => {
    setCurrentFoodItem((prevItem) => ({
      ...prevItem,
      [field]: value,
    }));
  };

  const checkForProhibitedIngredients = (ingredients: string[]) => {
    const prohibited = userData.profile?.prohibitedIngredients || [];
    return prohibited.filter((p) =>
      ingredients.some((ing) =>
        ing.toLowerCase().includes(p.name.toLowerCase())
      )
    );
  };

  const autofillForm = (product: ProductData) => {
    setCurrentFoodItem({
      tempClientId: undefined,
      foodName: product.productName,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
      sugar: product.sugar,
    });
  };

  // Handles allergy checking and shows appropriate alerts
  const handleProductScanned = (product: ProductData) => {
    setShowScanner(false);
    const foundProhibited = checkForProhibitedIngredients(product.ingredients);

    // If allergens found, show warning with confirmation
    if (foundProhibited.length > 0) {
      const prohibitedNames = foundProhibited.map((p) => p.name).join(", ");
      Alert.alert(
        "Allergy Alert",
        `This product contains: ${prohibitedNames}\n\nYou have marked these as prohibited ingredients.`,
        [
          {
            text: "Close",
            onPress: () => setShowScanner(false),
          },
          {
            text: "Add Anyway",
            style: "destructive",
            onPress: () => {
              // Show second confirmation alert
              Alert.alert(
                "Are you sure?",
                "This product contains ingredients you've marked as prohibited. Add to meal anyway?",
                [
                  { text: "Cancel" },
                  {
                    text: "Yes, Add",
                    onPress: () => autofillForm(product),
                  },
                ]
              );
            },
          },
        ]
      );
    } else {
      // No allergens, show safe message
      Alert.alert(
        "No Allergens Detected",
        `${product.productName}\n\nNo prohibited ingredients detected.`,
        [
          { text: "Close", onPress: () => setShowScanner(false) },
          { text: "Add to Meal", onPress: () => autofillForm(product) },
        ]
      );
    }
  };

  const handleAddItem = () => {
    if (!currentFoodItem.foodName) {
      console.log("Can't add food item with no name");
      return;
    }

    const itemToAdd = {
      ...currentFoodItem,
      tempClientId: Date.now(), // Generate the unique ID here
    };

    // add current foodItem to array
    setFoodItems([...foodItems, itemToAdd]);

    // // 2. Clear the input fields by resetting the current food item state
    setCurrentFoodItem({
      tempClientId: undefined,
      foodName: "",
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      sugar: undefined,
    });

    // // 3. Increment the item counter for the UI (e.g., "Food Item #2")
    setFoodItemCount((foodItemCount) => foodItemCount + 1);
  };

  const handleDeleteItem = (clientIdToDelete: number | undefined) => {
    const newFoodItems = foodItems.filter(
      (item) => item.tempClientId !== clientIdToDelete
    );

    // Update the state with the new array.
    setFoodItems(newFoodItems);
  };

  if (!currentUser) return;

  const handleSubmitMeal = async () => {
    const uid = currentUser?.uid;
    try {
      const temp = await addMeal(mealName, mealType, uid, foodItems);
      setFoodItems([]);
      setMealName("");
      setMealType("breakfast");
      setCurrentFoodItem({
        foodName: "",
        calories: null,
        sugar: null,
        protein: null,
        carbs: null,
        fat: null,
      });
      setFoodItemCount(0);
      console.log("mealId: ", temp);
    } catch (error) {
      console.log("error: ", error);
    }
  };
  // const getMealSummary = async () => {
  //   let meals = await getRecentMealSummaries(currentUser.uid);
  //   setMealSummary(meals);
  // };

  return (
    <ScrollView>
      <Text>Food Journal</Text>

      {/* ====================== ADD MEAL BUTTON AND MODAL START ====================== */}
      <Button
        title="Add Meal"
        onPress={() => {
          setShowModal(true);
        }}
        size="lg"
        bg={colors.primary}
        disabled={showModal}
      />
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => {
          setShowModal(false);
        }}
      >
        <SafeAreaView>
          <ScrollView style={{ padding: 10, backgroundColor: "#f0f0f0" }}>
            <View
              style={{ backgroundColor: "white", padding: 15, borderRadius: 8 }}
            >
              <Text>Meal Entry Form</Text>
              <Text style={{ fontWeight: "bold" }}>Meal Name </Text>
              <Button
                style={{ marginLeft: "auto", marginBottom: 2 }}
                title="X"
                color="white"
                size="lg"
                bg={colors.black}
                onPress={() => {
                  setShowModal(false);
                }}
              />
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 10,
                  borderRadius: 5,
                  marginBottom: 10,
                }}
                placeholder="Meal Name (e.g., Morning Oats)"
                value={mealName}
                onChangeText={setMealName}
              />
              <Text style={{ fontWeight: "bold" }}>Meal Type </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 10,
                  borderRadius: 5,
                  marginBottom: 10,
                }}
                placeholder="Enter Meal Type - lowercase"
                value={mealType}
                onChangeText={setMealType}
              />
              {/* adding food items section */}
              <View>
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}
                >
                  Food Item {foodItemCount + 1}
                </Text>

                {/* Scan Barcode Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 5,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                  onPress={() => setShowScanner(true)}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Scan Barcode
                  </Text>
                </TouchableOpacity>

                <Text style={{ fontWeight: "bold" }}>Food Name </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                  placeholder="Food Name"
                  value={currentFoodItem.foodName.toString()}
                  onChangeText={(text) => handleInputChange("foodName", text)}
                />
                <Text style={{ fontWeight: "bold" }}>Calories: </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                  placeholder="Calories"
                  keyboardType="numeric"
                  value={currentFoodItem.calories?.toString()}
                  onChangeText={(text) => handleInputChange("calories", text)}
                />
                <Text style={{ fontWeight: "bold" }}>Sugar: (g) </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                  placeholder="Sugar (g)"
                  keyboardType="numeric"
                  value={currentFoodItem.sugar?.toString()}
                  onChangeText={(text) => handleInputChange("sugar", text)}
                />
                <Text style={{ fontWeight: "bold" }}> Carbs: (mg) </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                  placeholder="Carbs (mg)"
                  keyboardType="numeric"
                  value={currentFoodItem.carbs?.toString()}
                  onChangeText={(text) => handleInputChange("carbs", text)}
                />
                <Text style={{ fontWeight: "bold" }}>Fat: (g) </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                  placeholder="Fat (g)"
                  keyboardType="numeric"
                  value={currentFoodItem.fat?.toString()}
                  onChangeText={(text) => handleInputChange("fat", text)}
                />
                <Text style={{ fontWeight: "bold" }}>Protein: (g)</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                  placeholder="Protein(g)"
                  keyboardType="numeric"
                  value={currentFoodItem.protein?.toString()}
                  onChangeText={(text) => handleInputChange("protein", text)}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: "#007AFF",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 5,
                    alignSelf: "flex-start",
                    marginTop: 10,
                  }}
                  onPress={handleAddItem}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    add item
                  </Text>
                </TouchableOpacity>
              </View>
              <Button
                style={{ marginTop: 10 }}
                title="Submit"
                size="lg"
                bg={colors.gray}
                onPress={handleSubmitMeal}
              />
            </View>

            <View>
              {foodItems &&
                foodItems.map((item) => (
                  <View
                    key={item.tempClientId}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 8,
                      padding: 15,
                      marginVertical: 5,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* Left side with the food's name and macros */}
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        {item.foodName}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "gray", marginTop: 4 }}
                      >
                        P: {item.protein || 0}g | C: {item.carbs || 0}g | F:{" "}
                        {item.fat || 0}g
                      </Text>
                    </View>

                    {/* Right side with the calorie count */}
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          color: "#007AFF",
                        }}
                      >
                        {item.calories || 0}
                      </Text>
                      <Text style={{ fontSize: 12, color: "gray" }}>kcal</Text>
                      <TouchableOpacity
                        // The onPress handler calls your delete function, passing the
                        // index of the item you want to remove.
                        onPress={() => {
                          handleDeleteItem(item.tempClientId);
                        }}
                        style={{
                          backgroundColor: "#ff3b30",
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          justifyContent: "center",
                          alignItems: "center",
                          marginLeft: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: 14,
                          }}
                        >
                          X
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          </ScrollView>
        </SafeAreaView>
        {/* Barcode Scanner Modal */}

        <BarcodeScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onProductScanned={handleProductScanned}
        />
      </Modal>
      {/* ====================== ADD MEAL BUTTON AND MODAL END ====================== */}

      {/* ====================== Previous MEALS SECTION START ====================== */}
      {mealSummary &&
        mealSummary.length > 0 &&
        mealSummary.map((item) => (
          // Each item in the list must have a unique "key" prop. We use the item's id.
          <Link key={item.id} href={`./meals/${item.id}`}>
            <View
              style={{
                backgroundColor: "white",
                paddingVertical: 18,
                paddingHorizontal: 15,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
                width: "100%",
              }}
            >
              <Text style={{ fontSize: 16 }}>
                {/* Display the mealName, or a default if it doesn't exist. */}
                {item.mealName || "Unnamed Meal"}
              </Text>
            </View>
          </Link>
        ))}
      {/* ====================== Previous MEALS SECTION START ====================== */}
    </ScrollView>
  );
}
