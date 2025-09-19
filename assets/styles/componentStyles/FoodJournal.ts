import { StyleSheet } from 'react-native';

export const foodJournalStyles = StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateSelector: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  allergyInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  allergyInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 20,
  },
  mealsContainer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});