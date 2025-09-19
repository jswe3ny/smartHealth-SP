import { StyleSheet } from 'react-native';

export const foodSearchInputStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  resultsContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  resultsList: {
    maxHeight: 250,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  nutritionPreview: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionText: {
    fontSize: 12,
    color: '#666',
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontStyle: 'italic',
  },
});