import { FoodEntry } from '@/utils/types/food.types';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const foodService = {
  subscribeToEntries: (date: string, callback: (entries: FoodEntry[]) => void) => {
    const currentUser = auth().currentUser;
    if (!currentUser) return () => {};

    const unsubscribe = firestore()
      .collection('foodEntries')
      .where('userId', '==', currentUser.uid)
      .where('date', '==', date)
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        (querySnapshot) => {
          const entries: FoodEntry[] = [];
          if (querySnapshot) { 
            querySnapshot.forEach((doc) => {
              entries.push({ id: doc.id, ...doc.data() } as FoodEntry);
            });
          }
          callback(entries);
        },
        (error) => {
          console.error('Error in subscription:', error);
          callback([]);
        }
      );

    return unsubscribe;
  },

  addEntry: async (entryData: Omit<FoodEntry, 'id' | 'userId'>) => {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    return await firestore()
      .collection('foodEntries')
      .add({
        ...entryData,
        userId: currentUser.uid,
      });
  },

  updateEntry: async (entryId: string, entryData: Partial<FoodEntry>) => {
    return await firestore()
      .collection('foodEntries')
      .doc(entryId)
      .update(entryData);
  },

  deleteEntry: async (entryId: string) => {
    return await firestore()
      .collection('foodEntries')
      .doc(entryId)
      .delete();
  },
};