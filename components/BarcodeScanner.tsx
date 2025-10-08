import { colors } from "@/assets/styles";
import { Button } from "@/components/button";
import { fetchProductByBarcode } from "@/utils/openfoodfacts.repo";
import { ProductData } from "@/utils/types/foodJournal.types";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: ProductData) => void;
}

export function BarcodeScanner({
  visible,
  onClose,
  onProductScanned,
}: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  // const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const scanInProgress = useRef(false);

  useEffect(() => {
    if (visible) {
      // setScanned(false);
      setLoading(false);
      scanInProgress.current = false;
    }
  }, [visible]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // if (scanInProgress.current) {
    //   // only one call can go out at once
    //   console.log("wait for call to be resolved");
    // }

    // IMPORTANT PREVENTS API CALLS FROM SPAMMING
    if (scanInProgress.current || loading) return;
    scanInProgress.current = true;

    setLoading(true);

    try {
      const product = await fetchProductByBarcode(data);

      // ==========IMPORTANT: IF TESTING/WORKING ON  API CAlls UNCOMMNET DELAY FUNCTIONS - PROTECTION AGAINST SPAMMING API AND GETTING BANNED ===========
      // function delay(time: number) {
      //   return new Promise((resolve) => setTimeout(resolve, time));
      // }
      // await delay(1000);
      // console.log("with ref delay");

      if (!product) {
        Alert.alert(
          "Product Not Found",
          "Could not find product information for this barcode.",
          [
            {
              text: "Scan Again",
              onPress: () => {
                //
                scanInProgress.current = false;
                setLoading(false);
              },
            },
            {
              text: "Cancel",
              onPress: onClose,
            },
          ]
        );
        return;
      }

      onProductScanned(product);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch product information. Please try again.",
        [
          {
            text: "Try Again",
            onPress: () => {
              scanInProgress.current = false;
              setLoading(false);
            },
          },
          {
            text: "Cancel",
            onPress: onClose,
          },
        ]
      );
    }
  };

  const handleClose = () => {
    scanInProgress.current = false;
    setLoading(false);
    onClose();
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <Text>We need camera permission to scan barcodes</Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            size="lg"
            bg={colors.primary}
          />
          <Button
            title="Cancel"
            onPress={handleClose}
            size="lg"
            bg={colors.gray}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <Text>Scan Barcode</Text>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
            ],
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />

        {loading && <ActivityIndicator size="large" />}

        <Button
          title="Cancel"
          onPress={handleClose}
          size="lg"
          bg={colors.gray}
          fullWidth
          disabled={loading}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 70,
    marginHorizontal: 10,
  },
  camera: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
});
