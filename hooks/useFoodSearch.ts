import { foodDatabaseService } from '@/utils/foodDatabaseService';
import { FoodDatabaseItem } from '@/utils/types/food.types';
import { useEffect, useState } from 'react';

export interface UseFoodSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: FoodDatabaseItem[];
  loading: boolean;
  clearSearch: () => void;
}

export const useFoodSearch = (): UseFoodSearchReturn => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodDatabaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setLoading(true);
        try {
          const results = await foodDatabaseService.searchFoods(searchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        }
        setLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const clearSearch = (): void => {
    setSearchTerm('');
    setSearchResults([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    loading,
    clearSearch,
  };
};