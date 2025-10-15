import {
    fontSize,
    fontWeight,
    neutralColors,
    radius,
    spacing,
    useThemeColors,
} from "@/assets/styles";
import { fetchProductByBarcode } from "@/utils/openfoodfacts.repo";
import { ProductData } from "@/utils/types/foodJournal.types";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
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
  const colors = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  const scanInProgress = useRef(false);

  useEffect(() => {
    if (visible) {
      setLoading(false);
      scanInProgress.current = false;
    }
  }, [visible]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: spacing.xxl * 2,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.xs,
    },
    cameraContainer: {
      flex: 1,
      margin: spacing.lg,
      borderRadius: radius.lg,
      overflow: "hidden",
      backgroundColor: colors.backgroundSecondary,
    },
    camera: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    scanFrame: {
      width: 280,
      height: 280,
      borderWidth: 3,
      borderColor: colors.pastelGreen,
      borderRadius: radius.lg,
      backgroundColor: "transparent",
    },
    scanFrameCorner: {
      position: "absolute",
      width: 40,
      height: 40,
      borderColor: colors.pastelGreen,
    },
    cornerTopLeft: {
      top: -3,
      left: -3,
      borderTopWidth: 6,
      borderLeftWidth: 6,
      borderTopLeftRadius: radius.lg,
    },
    cornerTopRight: {
      top: -3,
      right: -3,
      borderTopWidth: 6,
      borderRightWidth: 6,
      borderTopRightRadius: radius.lg,
    },
    cornerBottomLeft: {
      bottom: -3,
      left: -3,
      borderBottomWidth: 6,
      borderLeftWidth: 6,
      borderBottomLeftRadius: radius.lg,
    },
    cornerBottomRight: {
      bottom: -3,
      right: -3,
      borderBottomWidth: 6,
      borderRightWidth: 6,
      borderBottomRightRadius: radius.lg,
    },
    instructionBox: {
      position: "absolute",
      top: -80,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      shadowColor: neutralColors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    instructionText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      textAlign: "center",
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: radius.lg,
    },
    loadingContent: {
      alignItems: "center",
    },
    loadingText: {
      color: colors.textInverse,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      marginTop: spacing.md,
    },
    footer: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    cancelButton: {
      backgroundColor: colors.backgroundTertiary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    permissionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: "center",
      shadowColor: neutralColors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      maxWidth: 400,
    },
    permissionIcon: {
      marginBottom: spacing.lg,
    },
    permissionTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    permissionText: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.xl,
      lineHeight: 22,
    },
    permissionButtons: {
      width: "100%",
      gap: spacing.md,
    },
    grantButton: {
      backgroundColor: colors.pastelGreen,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
    },
    grantButtonText: {
      color: colors.pastelGreenText,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
  });

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <View style={styles.permissionContainer}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <Ionicons name="camera-outline" size={64} color={colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to scan product barcodes. Your
              privacy is important to us - we only use the camera for scanning.
            </Text>
            <View style={styles.permissionButtons}>
              <TouchableOpacity
                style={styles.grantButton}
                onPress={requestPermission}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.pastelGreenText}
                />
                <Text style={styles.grantButtonText}>Grant Permission</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Ionicons name="close-circle" size={20} color={colors.text} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <Text style={styles.headerSubtitle}>
            Position barcode within the frame
          </Text>
        </View>

        {/* Camera View with Overlay */}
        <View style={styles.cameraContainer}>
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

          {/* Scanning Frame Overlay */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                {loading ? "Processing..." : "Align barcode within frame"}
              </Text>
            </View>
            <View style={styles.scanFrame}>
              <View style={[styles.scanFrameCorner, styles.cornerTopLeft]} />
              <View style={[styles.scanFrameCorner, styles.cornerTopRight]} />
              <View style={[styles.scanFrameCorner, styles.cornerBottomLeft]} />
              <View style={[styles.scanFrameCorner, styles.cornerBottomRight]} />
            </View>
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={colors.pastelGreen} />
                <Text style={styles.loadingText}>Fetching product info...</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Ionicons name="close-circle" size={20} color={colors.text} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

