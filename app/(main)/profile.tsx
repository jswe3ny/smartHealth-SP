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

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showEditHeightModal, setShowEditHeightModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Profile edit state
  const [firstName, setFirstName] = useState(userData.profile?.firstName || "");
  const [lastName, setLastName] = useState(userData.profile?.lastName || "");
  const [email, setEmail] = useState(userData.profile?.email || currentUser?.email || "");
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
    if (severity >= 3) return "#F44336";
    if (severity === 2) return "#FF9800";
    return "#2196F3";
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
      backgroundColor: "#F5F5F5",
    },
    profileSection: {
      backgroundColor: "#fff",
      padding: 24,
      alignItems: "center",
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#2196F3",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: "700",
      color: "#fff",
    },
    profileValue: {
      fontSize: 18,
      fontWeight: "600",
      color: "#000",
      marginBottom: 4,
    },
    profileLabel: {
      fontSize: 14,
      color: "#666",
      marginTop: 4,
    },
    profileInfo: {
      width: "100%",
      marginTop: 16,
    },
    profileRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#E0E0E0",
    },
    editButton: {
      marginTop: 20,
      backgroundColor: "#2196F3",
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 8,
    },
    editButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    section: {
      backgroundColor: "#fff",
      marginBottom: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#000",
    },
    addButton: {
      fontSize: 16,
      color: "#2196F3",
      fontWeight: "600",
    },
    emptyText: {
      fontSize: 14,
      color: "#999",
      textAlign: "center",
      paddingVertical: 24,
    },
    ingredientCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: "#F9F9F9",
      borderRadius: 8,
      marginBottom: 12,
    },
    ingredientInfo: {
      flex: 1,
    },
    ingredientName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#000",
      marginBottom: 4,
    },
    ingredientReason: {
      fontSize: 14,
      color: "#666",
      marginBottom: 8,
    },
    severityBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    severityText: {
      fontSize: 11,
      color: "#fff",
      fontWeight: "600",
    },
    deleteButton: {
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 24,
      width: "90%",
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#000",
    },
    closeButton: {
      padding: 4,
    },
    input: {
      backgroundColor: "#F5F5F5",
      borderRadius: 8,
      padding: 14,
      fontSize: 16,
      color: "#000",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    inputMultiline: {
      height: 100,
      textAlignVertical: "top",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: "#000",
      marginBottom: 8,
    },
    severityContainer: {
      marginBottom: 16,
    },
    severityOptions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    severityOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "#E0E0E0",
      alignItems: "center",
    },
    severityOptionActive: {
      borderColor: "#2196F3",
      backgroundColor: "#E3F2FD",
    },
    severityOptionText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#666",
    },
    severityOptionTextActive: {
      color: "#2196F3",
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    modalButtonCancel: {
      backgroundColor: "#F5F5F5",
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    modalButtonSave: {
      backgroundColor: "#2196F3",
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#666",
    },
    modalButtonSaveText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    heightRow: {
      flexDirection: "row",
      gap: 12,
    },
    heightInputContainer: {
      flex: 1,
    },
    heightLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: "#000",
      marginBottom: 8,
      textAlign: "center",
    },
    helpText: {
      fontSize: 12,
      color: "#999",
      marginTop: -8,
      marginBottom: 16,
    },
    datePickerButton: {
      backgroundColor: "#F5F5F5",
      borderRadius: 8,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    datePickerButtonText: {
      fontSize: 16,
      color: "#000",
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
                    color="#F44336"
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
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              placeholderTextColor="#999"
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
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Ingredient Name</Text>
            <TextInput
              style={styles.input}
              value={ingredientName}
              onChangeText={setIngredientName}
              placeholder="e.g., Peanuts"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Reason (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={ingredientReason}
              onChangeText={setIngredientReason}
              placeholder="Why are you avoiding this?"
              placeholderTextColor="#999"
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
                <Ionicons name="close" size={24} color="#000" />
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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