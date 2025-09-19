import { StyleSheet } from 'react-native';

export const mealSectionStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calories: {
    fontSize: 14,
    color: '#666',
  },
});