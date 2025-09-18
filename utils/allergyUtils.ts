import { AllergyAlert, FoodEntry, FoodEntryFormData } from '@/utils/types/food.types';
import { ProhibitedIngredient } from '@/utils/types/user.types';

export interface AllergyCheckResult {
  hasProhibited: boolean;
  matches: ProhibitedIngredient[];
}

export interface AllergenTemplate {
  name: string;
  reason: string;
  severity: number;
}

export const allergyUtils = {
  checkForProhibitedIngredients: (
    foodItem: Partial<FoodEntry> | FoodEntryFormData, 
    prohibitedIngredients: ProhibitedIngredient[]
  ): AllergyCheckResult => {
    if (!prohibitedIngredients || prohibitedIngredients.length === 0) {
      return { hasProhibited: false, matches: [] };
    }

    const matches: ProhibitedIngredient[] = [];
    const foodName = foodItem.foodName?.toLowerCase() || '';
    const brand = foodItem.brand?.toLowerCase() || '';
    const notes = foodItem.notes?.toLowerCase() || '';
    const ingredients = (foodItem as FoodEntry).ingredients || [];
    const allergens = (foodItem as FoodEntry).allergens || [];

    const searchableText = `${foodName} ${brand} ${notes} ${ingredients.join(' ')} ${allergens.join(' ')}`.toLowerCase();

    prohibitedIngredients.forEach(prohibited => {
      const prohibitedName = prohibited.name?.toLowerCase().trim() || '';
      
      if (prohibitedName && searchableText.includes(prohibitedName)) {
        matches.push(prohibited);
      }
    });

    return {
      hasProhibited: matches.length > 0,
      matches,
    };
  },

  getAlertMessage: (matches: ProhibitedIngredient[], foodName: string): AllergyAlert => {
    const highestSeverity = Math.max(...matches.map(m => m.severity || 5));
    const ingredientList = matches.map(m => m.name).join(', ');
    const reasons = [...new Set(matches.map(m => m.reason).filter(r => r))];
    const plural = matches.length > 1 ? 'ingredients' : 'ingredient';
    
    const isHighRisk = highestSeverity >= 8;
    const title = isHighRisk ? ' SEVERE ALLERGY ALERT' : ' Allergy Alert';
    const alertType: 'warning' | 'danger' = isHighRisk ? 'danger' : 'warning';
    
    let message = `"${foodName}" contains prohibited ${plural}: ${ingredientList}`;
    
    if (reasons.length > 0) {
      message += `\n\nReasons: ${reasons.join(', ')}`;
    }
    
    if (isHighRisk) {
      message += '\n\n HIGH SEVERITY - Exercise extreme caution!';
    }
    
    return {
      title,
      message,
      severity: alertType,
      highestSeverity,
      matches,
    };
  },

  getSeverityColor: (severity: number): string => {
    if (severity >= 9) return '#d32f2f';
    if (severity >= 7) return '#f57c00';
    if (severity >= 5) return '#fbc02d';
    return '#689f38';
  },

  getSeverityLabel: (severity: number): string => {
    if (severity >= 9) return 'EMERGENCY';
    if (severity >= 7) return 'HIGH RISK';
    if (severity >= 5) return 'MODERATE';
    return 'LOW RISK';
  },

  commonAllergens: [
    { name: 'Milk', reason: 'Lactose Intolerant', severity: 6 },
    { name: 'Eggs', reason: 'Egg Allergy', severity: 7 },
    { name: 'Fish', reason: 'Fish Allergy', severity: 8 },
    { name: 'Shellfish', reason: 'Shellfish Allergy', severity: 9 },
    { name: 'Tree nuts', reason: 'Tree Nut Allergy', severity: 9 },
    { name: 'Peanuts', reason: 'Peanut Allergy', severity: 10 },
    { name: 'Wheat', reason: 'Wheat Allergy', severity: 7 },
    { name: 'Soybeans', reason: 'Soy Allergy', severity: 6 },
    { name: 'Gluten', reason: 'Celiac Disease', severity: 8 },
    { name: 'Sesame', reason: 'Sesame Allergy', severity: 7 }
  ] as AllergenTemplate[],

  dietaryRestrictions: [
    { name: 'Meat', reason: 'Vegetarian', severity: 3 },
    { name: 'Pork', reason: 'Religious/Dietary', severity: 4 },
    { name: 'Beef', reason: 'Religious/Dietary', severity: 4 },
    { name: 'Alcohol', reason: 'Personal Choice', severity: 5 },
    { name: 'High sodium', reason: 'Hypertension', severity: 6 },
    { name: 'Added sugar', reason: 'Diabetes', severity: 7 }
  ] as AllergenTemplate[]
};