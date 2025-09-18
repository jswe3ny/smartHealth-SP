import { foodJournalStyles as styles } from '@/assets/styles/componentStyles/FoodJournal';
import { AllergyAlert as AllergyAlertModal } from "@/components/AllergyAlert";
import { FoodEntryForm } from "@/components/FoodEntryForm";
import { MealSection } from "@/components/MealSection";
import { NutritionSummary } from "@/components/NutritionSummary";
import { useAuth } from "@/contexts/authContext";
import { useFoodEntries } from "@/hooks/useFoodEntries";
import { useUserInfo } from "@/hooks/useUserInfo";
import { allergyUtils } from "@/utils/allergyUtils";
import { calculateTotalNutrition, getEntriesByMeal } from "@/utils/nutritionUtils";
import type { AllergyAlert as AllergyAlertType } from '@/utils/types/food.types';
import { createFoodEntryFromForm, FoodEntryFormData, MEAL_TYPES } from '@/utils/types/food.types';
import { updateUserInfo } from '@/utils/user.repo';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function FoodJournalPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [pendingEntry, setPendingEntry] = useState<any>(null);
  const [allergyAlert, setAllergyAlert] = useState<AllergyAlertType | null>(null);

  const { currentUser } = useAuth();
  const { entries, addEntry, updateEntry, deleteEntry } = useFoodEntries(selectedDate);
  const { profile: userProfile } = useUserInfo(); 

  const checkForAllergies = (formData: FoodEntryFormData): AllergyAlertType | null => {
    if (!userProfile?.prohibitedIngredients) {
      return null;
    }

    const allergyCheck = allergyUtils.checkForProhibitedIngredients(
      formData,
      userProfile.prohibitedIngredients
    );

    if (allergyCheck.hasProhibited) {
      return allergyUtils.getAlertMessage(allergyCheck.matches, formData.foodName);
    }

    return null;
  };

  const handleAddEntry = async (formData: FoodEntryFormData) => {
    const alert = checkForAllergies(formData);
    
    if (alert) {
      setPendingEntry(formData);
      setAllergyAlert(alert);
      return;
    }

    try {
      const entryData = createFoodEntryFromForm({
        ...formData,
        date: selectedDate,
      });
      await addEntry(entryData);
      setModalVisible(false);
      Alert.alert('Success', 'Food entry added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food entry');
    }
  };

  const handleAllergyAlertProceed = async () => {
    try {
      const entryData = createFoodEntryFromForm({
        ...pendingEntry,
        date: selectedDate,
        notes: pendingEntry.notes + ' [Added despite allergy warning]',
      });
      await addEntry(entryData);
      setModalVisible(false);
      setAllergyAlert(null);
      setPendingEntry(null);
      Alert.alert('Success', 'Food entry added with allergy note!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food entry');
    }
  };

  const handleAllergyAlertCancel = () => {
    setAllergyAlert(null);
    setPendingEntry(null);
  };

  const handleAllergyAlertDismiss = async () => {
    if (allergyAlert && pendingEntry && userProfile && currentUser) {
      try {
        const matchIds = allergyAlert.matches.map(match => match.ingredientId);
        
        const updatedProhibited = userProfile.prohibitedIngredients?.filter(
          ingredient => !matchIds.includes(ingredient.ingredientId)
        ) || [];

        await updateUserInfo(currentUser.uid, { prohibitedIngredients: updatedProhibited });
        
        handleAllergyAlertProceed();
      } catch (error) {
        Alert.alert('Error', 'Failed to update allergy settings');
      }
    }
  };

  const handleUpdateEntry = async (formData: FoodEntryFormData) => {
    const alert = checkForAllergies(formData);
    
    if (alert) {
      setPendingEntry({ ...formData, isUpdate: true, entryId: editingEntry.id });
      setAllergyAlert(alert);
      return;
    }

    try {
      const entryData = createFoodEntryFromForm(formData);
      delete (entryData as any).date;
      delete (entryData as any).timestamp;
      
      await updateEntry(editingEntry.id, entryData);
      setEditModalVisible(false);
      setEditingEntry(null);
      Alert.alert('Success', 'Food entry updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update food entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entryId);
              Alert.alert('Success', 'Food entry deleted!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete food entry');
            }
          },
        },
      ]
    );
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setEditModalVisible(true);
  };

  const totalNutrition = calculateTotalNutrition(entries);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Food</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelector}>
        <TextInput
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {userProfile?.prohibitedIngredients && userProfile.prohibitedIngredients.length > 0 && (
        <View style={styles.allergyInfo}>
          <Text style={styles.allergyInfoText}>
            🛡️ Allergy protection active ({userProfile.prohibitedIngredients.length} items)
          </Text>
        </View>
      )}

      <View style={styles.summaryContainer}>
        <NutritionSummary nutrition={totalNutrition} />
      </View>

      <ScrollView style={styles.mealsContainer}>
        {MEAL_TYPES.map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            entries={getEntriesByMeal(entries, mealType)}
            allEntries={entries}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <FoodEntryForm
            onSubmit={handleAddEntry}
            onCancel={() => setModalVisible(false)}
            isEditing={false}
          />
          
          {allergyAlert && (
            <AllergyAlertModal
              alert={allergyAlert}
              onProceed={handleAllergyAlertProceed}
              onCancel={handleAllergyAlertCancel}
              onDismiss={handleAllergyAlertDismiss}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <FoodEntryForm
            initialData={editingEntry}
            onSubmit={handleUpdateEntry}
            onCancel={() => {
              setEditModalVisible(false);
              setEditingEntry(null);
            }}
            isEditing={true}
          />
          
          {allergyAlert && (
            <AllergyAlertModal
              alert={allergyAlert}
              onProceed={() => {
                if (pendingEntry?.isUpdate) {
                  const { isUpdate, entryId, ...formData } = pendingEntry;
                  const entryData = createFoodEntryFromForm(formData);
                  delete (entryData as any).date;
                  delete (entryData as any).timestamp;
                  (entryData as any).notes = formData.notes + ' [Updated despite allergy warning]';
                  
                  updateEntry(entryId, entryData).then(() => {
                    setEditModalVisible(false);
                    setEditingEntry(null);
                    setAllergyAlert(null);
                    setPendingEntry(null);
                    Alert.alert('Success', 'Food entry updated with allergy note!');
                  }).catch(() => {
                    Alert.alert('Error', 'Failed to update food entry');
                  });
                }
              }}
              onCancel={handleAllergyAlertCancel}
              onDismiss={handleAllergyAlertDismiss}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

