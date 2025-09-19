import { FoodDatabaseItem } from '@/utils/types/food.types';
import firestore from '@react-native-firebase/firestore';

export const foodDatabaseService = {
  searchFoods: async (searchTerm: string, maxResults: number = 20): Promise<FoodDatabaseItem[]> => {
    if (!searchTerm || searchTerm.trim().length < 2) return [];

    try {
      const searchTermLower = searchTerm.toLowerCase().trim();
      
      const querySnapshot = await firestore()
        .collection('foodDatabase')
        .where('searchableText', '>=', searchTermLower)
        .where('searchableText', '<=', searchTermLower + '\uf8ff')
        .orderBy('searchableText')
        .limit(maxResults)
        .get();

      const results: FoodDatabaseItem[] = [];
      
      if (querySnapshot) {  
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data && (data.name.toLowerCase().includes(searchTermLower) || 
              data.brand.toLowerCase().includes(searchTermLower))) {
            results.push({
              id: doc.id,
              ...data,
            } as FoodDatabaseItem);
          }
        });
      }

      return results;
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    }
  },

  getPopularFoods: async (maxResults: number = 10): Promise<FoodDatabaseItem[]> => {
    try {
      const querySnapshot = await firestore()
        .collection('foodDatabase')
        .where('verified', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(maxResults)
        .get();

      const results: FoodDatabaseItem[] = [];
      
      if (querySnapshot) {  
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as FoodDatabaseItem);
        });
      }

      return results;
    } catch (error) {
      console.error('Error getting popular foods:', error);
      return [];
    }
  },
};