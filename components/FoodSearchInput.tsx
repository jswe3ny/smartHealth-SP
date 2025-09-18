import { foodSearchInputStyles as styles } from '@/assets/styles/componentStyles/FoodSearchInput';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { FoodDatabaseItem } from '../utils/types/food.types';

interface FoodSearchInputProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults: FoodDatabaseItem[];
  loading: boolean;
  onSelectFood: (food: FoodDatabaseItem) => void;
  onClearSearch: () => void;
}

export const FoodSearchInput: React.FC<FoodSearchInputProps> = ({
  searchTerm,
  onSearchTermChange,
  searchResults,
  loading,
  onSelectFood,
  onClearSearch,
}) => {
  const renderFoodItem = ({ item }: { item: FoodDatabaseItem }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onSelectFood(item)}
    >
      <View style={styles.resultContent}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.brand ? (
          <Text style={styles.brandName}>{item.brand}</Text>
        ) : null}
        <View style={styles.nutritionPreview}>
          <Text style={styles.nutritionText}>
            {item.nutritionPer100g.calories} cal per 100g
          </Text>
          <Text style={styles.nutritionText}>
            P: {item.nutritionPer100g.protein}g
          </Text>
        </View>
      </View>
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const showResults = searchTerm.length >= 2;

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={onSearchTermChange}
          placeholder="Search for foods..."
          autoCapitalize="words"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearSearch}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {showResults && !loading && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Search Results</Text>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id || ''}
              renderItem={renderFoodItem}
              style={styles.resultsList}
              nestedScrollEnabled={true}
            />
          ) : (
            <Text style={styles.noResults}>No foods found</Text>
          )}
        </View>
      )}
    </View>
  );
};