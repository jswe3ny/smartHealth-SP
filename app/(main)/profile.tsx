import {
  fontSize,
  fontWeight,
  radius,
  spacing,
  useThemeColors,
} from "@/assets/styles";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { ProhibitedIngredient } from "@/utils/types/user.types";
import { updateUserInfo } from "@/utils/user.repo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "@react-native-firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { currentUser } = useAuth();
  const userData = useUserInfo();
  const colors = useThemeColors();

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showEditHeightModal, setShowEditHeightModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Profile edit state
  const [firstName, setFirstName] = useState(userData.profile?.firstName || "");
  const [lastName, setLastName] = useState(userData.profile?.lastName || "");
  const [email, setEmail] = useState(userData.profile?.email || currentUser?.email || "");
  const [height, setHeight] = useState(userData.profile?.height?.toString() || "");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [dob, setDob] = useState(
    userData.profile?.dateOfBirth?.toDate() || new Date()
  );

  // Ingredient state
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientReason, setIngredientReason] = useState("");
  const [ingredientSeverity, setIngredientSeverity] = useState(2);

  // Latest weight from health data
  const [latestWeight, setLatestWeight] = useState<number | null>(null);

  // Sync profile state when userData changes
  useEffect(() => {
    if (userData.profile) {
      setFirstName(userData.profile.firstName || "");
      setLastName(userData.profile.lastName || "");
      setEmail(userData.profile.email || currentUser?.email || "");
      setHeight(userData.profile.height?.toString() || "");
      if (userData.profile.dateOfBirth) {
        setDob(userData.profile.dateOfBirth.toDate());
      }
    }
  }, [userData.profile, currentUser?.email]);

  // Fetch latest weight from health data
  useEffect(() => {
    const fetchHealthData = async () => {
      if (!currentUser) return;
      
      try {
        // Get today's health data
        const { getHealthDataByDate } = require("@/utils/health.repo");
        const today = new Date();
        const healthData = await getHealthDataByDate(currentUser.uid, today);
        
        if (healthData?.weight) {
          setLatestWeight(healthData.weight);
        }
      } catch (error) {
        console.error("Error fetching health data:", error);
      }
    };

    fetchHealthData();
  }, [currentUser]);

  const getInitials = () => {
    const first = userData.profile?.firstName || "";
    const last = userData.profile?.lastName || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "Not set";
    const dateObj = date instanceof Timestamp ? date.toDate() : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 3) return colors.error;
    if (severity === 2) return colors.warning;
    return colors.info;
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      const updates: any = {
        firstName,
        lastName,
        email,
        dateOfBirth: Timestamp.fromDate(dob),
      };

      await updateUserInfo(currentUser.uid, updates);
      setShowEditProfileModal(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleSaveHeight = async () => {
    if (!currentUser || !heightFeet.trim() || !heightInches.trim()) {
      Alert.alert("Error", "Please enter your height");
      return;
    }

    const feet = parseInt(heightFeet);
    const inches = parseInt(heightInches);
    
    if (isNaN(feet) || isNaN(inches) || feet < 3 || feet > 8 || inches < 0 || inches >= 12) {
      Alert.alert("Error", "Please enter a valid height (3-8 feet, 0-11 inches)");
      return;
    }

    try {
      const totalInches = feet * 12 + inches;
      await updateUserInfo(currentUser.uid, { height: totalInches });
      setShowEditHeightModal(false);
      Alert.alert("Success", "Height updated successfully!");
    } catch (error) {
      console.error("Error updating height:", error);
      Alert.alert("Error", "Failed to update height");
    }
  };

  const handleAddIngredient = async () => {
    if (!currentUser || !ingredientName.trim()) {
      Alert.alert("Error", "Please enter an ingredient name");
      return;
    }

    try {
      const newIngredient: ProhibitedIngredient = {
        name: ingredientName.trim(),
        reason: ingredientReason.trim() ? ingredientReason.trim() : undefined,
        severity: ingredientSeverity,
      };

      await updateUserInfo(currentUser.uid, {
        prohibitedIngredient: newIngredient,
      });

      setIngredientName("");
      setIngredientReason("");
      setIngredientSeverity(2);
      setShowAddIngredientModal(false);
      Alert.alert("Success", "Ingredient added successfully!");
    } catch (error) {
      console.error("Error adding ingredient:", error);
      Alert.alert("Error", "Failed to add ingredient");
    }
  };

  const handleDeleteIngredient = (ingredient: ProhibitedIngredient) => {
    if (!currentUser) return;

    Alert.alert(
      "Delete Ingredient",
      `Are you sure you want to remove ${ingredient.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { deleteGoal } = require("@/utils/user.repo");
              await deleteGoal(
                currentUser.uid,
                "prohibitedIngredients",
                "prohibitedIngredientId",
                (ingredient as any).prohibitedIngredientId || (ingredient as any).ingredientId!
              );
              Alert.alert("Success", "Ingredient removed!");
            } catch (error) {
              console.error("Error deleting ingredient:", error);
              Alert.alert("Error", "Failed to delete ingredient");
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    profileSection: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    avatarText: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.surface,
    },
    profileValue: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    profileLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    profileInfo: {
      width: "100%",
      marginTop: spacing.md,
    },
    profileRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    editButton: {
      marginTop: spacing.lg,
      backgroundColor: colors.pastelGreen,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
    },
    editButtonText: {
      color: colors.pastelGreenText,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: spacing.md,
      padding: spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    addButton: {
      fontSize: fontSize.md,
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
    emptyText: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: spacing.lg,
    },
    ingredientCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
    },
    ingredientInfo: {
      flex: 1,
    },
    ingredientName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    ingredientReason: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    severityBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    severityText: {
      fontSize: fontSize.xs,
      color: colors.surface,
      fontWeight: fontWeight.semibold,
    },
    deleteButton: {
      padding: spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      width: "90%",
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.xs,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: radius.sm,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputMultiline: {
      height: 80,
      textAlignVertical: "top",
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    severityContainer: {
      marginBottom: spacing.md,
    },
    severityOptions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    severityOption: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
    },
    severityOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "20",
    },
    severityOptionText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
    },
    severityOptionTextActive: {
      color: colors.primary,
    },
    modalButtons: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.sm,
      alignItems: "center",
    },
    modalButtonCancel: {
      backgroundColor: colors.backgroundTertiary,
    },
    modalButtonSave: {
      backgroundColor: colors.pastelGreen,
    },
    modalButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    modalButtonSaveText: {
      color: colors.pastelGreenText,
    },
    heightRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    heightInputContainer: {
      flex: 1,
    },
    heightLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
      textAlign: "center",
    },
    helpText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    datePickerButton: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: radius.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    datePickerButtonText: {
      fontSize: fontSize.md,
      color: colors.text,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <Text style={styles.profileValue}>
              {userData.profile?.firstName} {userData.profile?.lastName}
            </Text>
            <Text style={styles.profileLabel}>{userData.profile?.email}</Text>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>First Name</Text>
              <Text style={styles.profileValue}>
                {userData.profile?.firstName || "Not set"}
              </Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Last Name</Text>
              <Text style={styles.profileValue}>
                {userData.profile?.lastName || "Not set"}
              </Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>
                {userData.profile?.email || "Not set"}
              </Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Date of Birth</Text>
              <Text style={styles.profileValue}>
                {formatDate(userData.profile?.dateOfBirth)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileRow}
              onLongPress={() => {
                const totalInches = userData.profile?.height || 0;
                if (totalInches > 0) {
                  const feet = Math.floor(totalInches / 12);
                  const inches = totalInches % 12;
                  setHeightFeet(feet.toString());
                  setHeightInches(inches.toString());
                } else {
                  setHeightFeet("");
                  setHeightInches("");
                }
                setShowEditHeightModal(true);
              }}
            >
              <Text style={styles.profileLabel}>Height (Long press to edit)</Text>
              <Text style={styles.profileValue}>
                {userData.profile?.height ? 
                  `${Math.floor(userData.profile.height / 12)}'${userData.profile.height % 12}"` : 
                  "Not set"}
              </Text>
            </TouchableOpacity>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Weight</Text>
              <Text style={styles.profileValue}>
                {latestWeight ? `${latestWeight.toFixed(1)} lbs` : "No data"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setFirstName(userData.profile?.firstName || "");
              setLastName(userData.profile?.lastName || "");
              setEmail(userData.profile?.email || currentUser?.email || "");
              setDob(
                userData.profile?.dateOfBirth?.toDate() || new Date()
              );
              setShowEditProfileModal(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Prohibited Ingredients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prohibited Ingredients</Text>
            <TouchableOpacity
              onPress={() => setShowAddIngredientModal(true)}
            >
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {!userData.profile?.prohibitedIngredients ||
          userData.profile.prohibitedIngredients.length === 0 ? (
            <Text style={styles.emptyText}>
              No prohibited ingredients added yet
            </Text>
          ) : (
            userData.profile.prohibitedIngredients.map((ingredient: any, index) => (
              <View key={ingredient.prohibitedIngredientId || ingredient.ingredientId || index} style={styles.ingredientCard}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  {ingredient.reason && (
                    <Text style={styles.ingredientReason}>
                      {ingredient.reason}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(ingredient.severity) },
                    ]}
                  >
                    <Text style={styles.severityText}>
                      Severity: {ingredient.severity}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteIngredient(ingredient)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerButtonText}>
                {dob.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setDob(selectedDate);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Ingredient Modal */}
      <Modal
        visible={showAddIngredientModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddIngredientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Prohibited Ingredient</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddIngredientModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Ingredient Name</Text>
            <TextInput
              style={styles.input}
              value={ingredientName}
              onChangeText={setIngredientName}
              placeholder="e.g., Peanuts"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Reason (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={ingredientReason}
              onChangeText={setIngredientReason}
              placeholder="Why are you avoiding this?"
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <View style={styles.severityContainer}>
              <Text style={styles.label}>Severity</Text>
              <View style={styles.severityOptions}>
                {[1, 2, 3].map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.severityOption,
                      ingredientSeverity === severity &&
                        styles.severityOptionActive,
                    ]}
                    onPress={() => setIngredientSeverity(severity)}
                  >
                    <Text
                      style={[
                        styles.severityOptionText,
                        ingredientSeverity === severity &&
                          styles.severityOptionTextActive,
                      ]}
                    >
                      {severity === 1 ? "Mild" : severity === 2 ? "Moderate" : "Severe"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIngredientName("");
                  setIngredientReason("");
                  setIngredientSeverity(2);
                  setShowAddIngredientModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleAddIngredient}
              >
                <Text style={styles.modalButtonSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Height Modal */}
      <Modal
        visible={showEditHeightModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditHeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Height</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditHeightModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Height</Text>
            <View style={styles.heightRow}>
              <View style={styles.heightInputContainer}>
                <Text style={styles.heightLabel}>Feet</Text>
                <TextInput
                  style={styles.input}
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  placeholder="5"
                  keyboardType="numeric"
                  maxLength={1}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.heightInputContainer}>
                <Text style={styles.heightLabel}>Inches</Text>
                <TextInput
                  style={styles.input}
                  value={heightInches}
                  onChangeText={setHeightInches}
                  placeholder="10"
                  keyboardType="numeric"
                  maxLength={2}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <Text style={styles.helpText}>
              Enter height between 3-8 feet and 0-11 inches
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEditHeightModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveHeight}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}