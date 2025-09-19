import { foodEntryStyles as styles } from '@/assets/styles/componentStyles/FoodEntry';
import { FoodEntry as FoodEntryType } from "@/utils/types/food.types";
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface FoodEntryProps {
  entry: FoodEntryType;
  onEdit: (entry: FoodEntryType) => void;
  onDelete: (entryId: string) => void;
}

export const FoodEntry: React.FC<FoodEntryProps> = ({ entry, onEdit, onDelete }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.content} onPress={() => onEdit(entry)}>
        <Text style={styles.foodName}>{entry.foodName}</Text>
        {entry.notes ? (
          <Text style={styles.notes}>{entry.notes}</Text>
        ) : null}
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionText}>{entry.calories || 0} cal</Text>
          <Text style={styles.nutritionText}>P: {entry.protein || 0}g</Text>
          <Text style={styles.nutritionText}>C: {entry.carbs || 0}g</Text>
          <Text style={styles.nutritionText}>F: {entry.fat || 0}g</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(entry.id!)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};
