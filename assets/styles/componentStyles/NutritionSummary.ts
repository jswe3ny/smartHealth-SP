import { StyleSheet } from 'react-native';

export const nutritionSummaryStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});