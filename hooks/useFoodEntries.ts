import { foodService } from '@/utils/foodService';
import { FoodEntry } from '@/utils/types/food.types';
import { useEffect, useState } from 'react';

export interface UseFoodEntriesReturn {
  entries: FoodEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (entryData: Omit<FoodEntry, 'id' | 'userId'>) => Promise<void>;
  updateEntry: (entryId: string, entryData: Partial<FoodEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
}

export const useFoodEntries = (selectedDate: string): UseFoodEntriesReturn => {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = foodService.subscribeToEntries(selectedDate, (data: FoodEntry[]) => {
      setEntries(data);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, [selectedDate]);

  const addEntry = async (entryData: Omit<FoodEntry, 'id' | 'userId'>): Promise<void> => {
    try {
      await foodService.addEntry(entryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const updateEntry = async (entryId: string, entryData: Partial<FoodEntry>): Promise<void> => {
    try {
      await foodService.updateEntry(entryId, entryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteEntry = async (entryId: string): Promise<void> => {
    try {
      await foodService.deleteEntry(entryId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
  };
};