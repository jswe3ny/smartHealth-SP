import { ProductData } from '@/utils/types/foodJournal.types';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: ProductData) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scanning box dimensions (centered on screen)
const BOX_WIDTH = SCREEN_WIDTH * 0.7;
const BOX_HEIGHT = 200;

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  visible,
  onClose,
  onProductScanned,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [torch, setTorch] = useState(false);
  
  // IMPORTANT: Prevents API call spam
  const scanInProgress = useRef(false);

  // Request camera permission on mount
  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const handleBarCodeScanned = async ({ data }: any) => {
    // IMPORTANT: Prevents API call spam
    if (scanInProgress.current || loading || !isScanning) {
      return;
    }

    // Set locks IMMEDIATELY for instant feedback
    scanInProgress.current = true;
    setIsScanning(false);
    setLoading(true);

    // Haptic feedback (optional)
    try {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Haptics not available, continue
    }

    try {
      // IMPORTANT: Uncomment delay for testing/development to prevent API spam and getting banned
      // function delay(time: number) {
      //   return new Promise((resolve) => setTimeout(resolve, time));
      // }
      // await delay(1000);

      // Fetch product data from Open Food Facts
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`
      );
      const apiData = await response.json();

      if (apiData.status === 1 && apiData.product) {
        const product = apiData.product;
        
        // Extract nutrition data per 100g
        const nutriments = product.nutriments || {};
        
        const productData: ProductData = {
          barcode: data,
          productName: product.product_name || 'Unknown Product',
          servingSize: product.serving_size || null,
          calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || null,
          protein: nutriments.proteins_100g || nutriments.proteins || null,
          carbs: nutriments.carbohydrates_100g || nutriments.carbohydrates || null,
          fat: nutriments.fat_100g || nutriments.fat || null,
          sugar: nutriments.sugars_100g || nutriments.sugars || null,
          fiber: nutriments.fiber_100g || nutriments.fiber || null,
          sodium: nutriments.sodium_100g || nutriments.sodium || null,
          saturatedFat: nutriments['saturated-fat_100g'] || nutriments['saturated-fat'] || null,
          transFat: nutriments['trans-fat_100g'] || nutriments['trans-fat'] || null,
          cholesterol: nutriments.cholesterol_100g || nutriments.cholesterol || null,
          ingredients: product.ingredients_text 
            ? product.ingredients_text.split(',').map((i: string) => i.trim())
            : [],
        };

        onProductScanned(productData);
      } else {
        // Product not found
        alert('Product not found in database. Please try another barcode.');
        setIsScanning(true);
        scanInProgress.current = false;
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      alert('Failed to fetch product data. Please try again.');
      setIsScanning(true);
      scanInProgress.current = false;
    } finally {
      setLoading(false);
      // Reset after successful scan or error
      if (!isScanning) {
        scanInProgress.current = false;
      }
    }
  };

  if (!visible) return null;

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>
            Camera permission is required to scan barcodes
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'upc_e',
            'upc_a',
            'code128',
            'code39',
            'code93',
            'codabar',
            'itf14',
          ],
        }}
        enableTorch={torch}
      />

      {/* Dark overlay with transparent scanning box */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanBox}>
            {/* Scanning box corners */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            
            {/* Animated scanning line */}
            {isScanning && !loading && (
              <View style={styles.scanLine} />
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          {loading ? '✓ Barcode Detected!' : 'Align barcode in center'}
        </Text>
        <Text style={styles.instructionsText}>
          {loading 
            ? 'Fetching product information...'
            : 'Position the barcode in the highlighted area'}
        </Text>
      </View>

      {/* Loading indicator with success feedback */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.successOverlay}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.successText}>Barcode Scanned!</Text>
          </View>
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        </View>
      )}

      {/* Close button */}
      <TouchableOpacity style={styles.closeButtonTop} onPress={onClose}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Torch button */}
      <TouchableOpacity 
        style={styles.torchButton}
        onPress={() => setTorch(!torch)}
      >
        <Ionicons 
          name={torch ? "flash" : "flash-outline"} 
          size={28} 
          color={torch ? "#FFD700" : "#fff"} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#666',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: BOX_HEIGHT,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanBox: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00FF00',
    top: '50%',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    alignItems: 'center',
    width: 200,
  },
  successOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 12,
  },
  closeButtonTop: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});