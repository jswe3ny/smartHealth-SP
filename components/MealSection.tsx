import { mealSectionStyles as styles } from '@/assets/styles/componentStyles/MealSection';
import { calculateMealNutrition } from "@/utils/nutritionUtils";
import { FoodEntry, MealType } from '@/utils/types/food.types';
import React from 'react';
import { Text, View } from 'react-native';
import { FoodEntry as FoodEntryComponent } from './FoodEntry';

interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  allEntries: FoodEntry[];
  onEditEntry: (entry: FoodEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const MealSection: React.FC<MealSectionProps> = ({ 
  mealType, 
  entries, 
  allEntries, 
  onEditEntry, 
  onDeleteEntry 
}) => {
  const mealNutrition = calculateMealNutrition(allEntries, mealType);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
        </Text>
        {entries.length > 0 && (
          <Text style={styles.calories}>{mealNutrition.calories} cal</Text>
        )}
      </View>
      
      {entries.map((entry) => (
        <FoodEntryComponent
          key={entry.id}
          entry={entry}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
        />
      ))}
    </View>
  );
};
