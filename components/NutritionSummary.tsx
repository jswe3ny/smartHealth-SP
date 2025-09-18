import { nutritionSummaryStyles as styles } from '@/assets/styles/componentStyles/NutritionSummary';
import { NutritionData } from '@/utils/types/food.types';
import React from 'react';
import { Text, View } from 'react-native';

interface NutritionSummaryProps {
  nutrition: NutritionData;
  title?: string;
}

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({ nutrition, title = "Daily Totals" }) => {
  const nutritionItems = [
    { key: 'calories', label: 'Calories', value: nutrition.calories, suffix: '' },
    { key: 'protein', label: 'Protein', value: nutrition.protein.toFixed(1), suffix: 'g' },
    { key: 'carbs', label: 'Carbs', value: nutrition.carbs.toFixed(1), suffix: 'g' },
    { key: 'fat', label: 'Fat', value: nutrition.fat.toFixed(1), suffix: 'g' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {nutritionItems.map((item) => (
          <View key={item.key} style={styles.item}>
            <Text style={styles.value}>{item.value}{item.suffix}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

