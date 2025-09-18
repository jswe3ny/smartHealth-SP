import { foodEntryFormStyles as styles } from '@/assets/styles/componentStyles/FoodEntryForm';
import { FoodSearchInput } from "@/components/FoodSearchInput";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import { FoodDatabaseItem, FoodEntryFormData, MEAL_TYPES } from "@/utils/types/food.types";
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface FoodEntryFormProps {
  initialData?: any;
  onSubmit: (formData: FoodEntryFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const FoodEntryForm: React.FC<FoodEntryFormProps> = ({ 
  initialData = null, 
  onSubmit, 
  onCancel,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState<FoodEntryFormData>({
    foodName: '',
    brand: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast',
    notes: '',
    servingSize: '100',
    foodDatabaseId: undefined,
  });

  const [manualEntry, setManualEntry] = useState<boolean>(false);
  const [selectedDatabaseFood, setSelectedDatabaseFood] = useState<FoodDatabaseItem | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    loading,
    clearSearch,
  } = useFoodSearch();

  useEffect(() => {
    if (initialData) {
      setFormData({
        foodName: initialData.foodName || '',
        brand: initialData.brand || '',
        calories: (initialData.calories || 0).toString(),
        protein: (initialData.protein || 0).toString(),
        carbs: (initialData.carbs || 0).toString(),
        fat: (initialData.fat || 0).toString(),
        mealType: initialData.mealType || 'breakfast',
        notes: initialData.notes || '',
        servingSize: '100',
        foodDatabaseId: initialData.foodDatabaseId || undefined,
      });
      setManualEntry(true);
    }
  }, [initialData]);

  const updateField = (field: keyof FoodEntryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectFood = (databaseFood: FoodDatabaseItem) => {
    setSelectedDatabaseFood(databaseFood);
    const servingSize = parseFloat(formData.servingSize) || 100;
    const multiplier = servingSize / 100;

    setFormData(prev => ({
      ...prev,
      foodName: databaseFood.name,
      brand: databaseFood.brand || '',
      calories: Math.round(databaseFood.nutritionPer100g.calories * multiplier).toString(),
      protein: (databaseFood.nutritionPer100g.protein * multiplier).toFixed(1),
      carbs: (databaseFood.nutritionPer100g.carbs * multiplier).toFixed(1),
      fat: (databaseFood.nutritionPer100g.fat * multiplier).toFixed(1),
      foodDatabaseId: databaseFood.id,
    }));

    clearSearch();
    setManualEntry(true);
  };

  const handleServingSizeChange = (newServingSize: string) => {
    updateField('servingSize', newServingSize);
    
    if (selectedDatabaseFood) {
      const servingSize = parseFloat(newServingSize) || 100;
      const multiplier = servingSize / 100;

      updateField('calories', Math.round(selectedDatabaseFood.nutritionPer100g.calories * multiplier).toString());
      updateField('protein', (selectedDatabaseFood.nutritionPer100g.protein * multiplier).toFixed(1));
      updateField('carbs', (selectedDatabaseFood.nutritionPer100g.carbs * multiplier).toFixed(1));
      updateField('fat', (selectedDatabaseFood.nutritionPer100g.fat * multiplier).toFixed(1));
    }
  };

  const handleSubmit = () => {
    if (!formData.foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }
    onSubmit(formData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Food Entry' : 'Add Food Entry'}
        </Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        {!manualEntry && !isEditing && (
          <View style={styles.searchSection}>
            <FoodSearchInput
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              searchResults={searchResults}
              loading={loading}
              onSelectFood={handleSelectFood}
              onClearSearch={clearSearch}
            />
            
            <TouchableOpacity
              style={styles.manualEntryButton}
              onPress={() => setManualEntry(true)}
            >
              <Text style={styles.manualEntryText}>+ Add Custom Food</Text>
            </TouchableOpacity>
          </View>
        )}

        {manualEntry && (
          <View style={styles.manualForm}>
            {selectedDatabaseFood && (
              <View style={styles.selectedFoodHeader}>
                <Text style={styles.selectedFoodText}>
                  Selected: {selectedDatabaseFood.name}
                  {selectedDatabaseFood.brand ? ` - ${selectedDatabaseFood.brand}` : ''}
                </Text>
                <TouchableOpacity
                  style={styles.changeSelectionButton}
                  onPress={() => {
                    setManualEntry(false);
                    setSelectedDatabaseFood(null);
                  }}
                >
                  <Text style={styles.changeSelectionText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Food Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.foodName}
                onChangeText={(value) => updateField('foodName', value)}
                placeholder="Enter food name"
                autoCapitalize="words"
              />
            </View>

            {selectedDatabaseFood && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Serving Size (g)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.servingSize}
                  onChangeText={handleServingSizeChange}
                  placeholder="100"
                  keyboardType="numeric"
                />
                <Text style={styles.servingNote}>
                  Nutrition will be calculated based on serving size
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(value) => updateField('brand', value)}
                placeholder="Enter brand name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meal Type</Text>
              <View style={styles.mealTypeContainer}>
                {MEAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealTypeButton,
                      formData.mealType === type && styles.mealTypeButtonActive
                    ]}
                    onPress={() => updateField('mealType', type)}
                  >
                    <Text style={[
                      styles.mealTypeText,
                      formData.mealType === type && styles.mealTypeTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionInput}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  style={styles.input}
                  value={formData.calories}
                  onChangeText={(value) => updateField('calories', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  editable={!selectedDatabaseFood}
                />
              </View>
              <View style={styles.nutritionInput}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.protein}
                  onChangeText={(value) => updateField('protein', value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  editable={!selectedDatabaseFood}
                />
              </View>
              <View style={styles.nutritionInput}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.carbs}
                  onChangeText={(value) => updateField('carbs', value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  editable={!selectedDatabaseFood}
                />
              </View>
              <View style={styles.nutritionInput}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fat}
                  onChangeText={(value) => updateField('fat', value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  editable={!selectedDatabaseFood}
                />
              </View>
            </View>

            {selectedDatabaseFood && (
              <Text style={styles.nutritionNote}>
                Nutrition values are automatically calculated. Change serving size to adjust.
              </Text>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                placeholder="Add any notes about this food..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
