import { StyleSheet } from 'react-native';

export const foodEntryFormStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  manualEntryButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  manualEntryText: {
    color: '#666',
    fontWeight: '500',
  },
  manualForm: {
    flex: 1,
  },
  selectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedFoodText: {
    flex: 1,
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  changeSelectionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeSelectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  servingNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  nutritionNote: {
    fontSize: 12,
    color: '#666',
    marginTop: -10,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  mealTypeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  mealTypeText: {
    fontSize: 14,
    color: '#666',
  },
  mealTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  nutritionInput: {
    flex: 1,
    minWidth: '45%',
  },
});