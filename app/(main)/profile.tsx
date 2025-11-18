import {
    fontSize,
    fontWeight,
    radius,
    spacing,
    useThemeColors,
} from "@/assets/styles";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Goal, ProhibitedIngredient } from "@/utils/types/user.types";
import { deleteGoal, updateUserInfo } from "@/utils/user.repo";
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
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showProfileDatePicker, setShowProfileDatePicker] = useState(false);
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);

  // Profile edit state
  const [firstName, setFirstName] = useState(userData.profile?.firstName || "");
  const [lastName, setLastName] = useState(userData.profile?.lastName || "");
  const [dob, setDob] = useState(
    userData.profile?.dateOfBirth?.toDate() || new Date()
  );

  // Sync profile state when userData changes
  useEffect(() => {
    if (userData.profile) {
      setFirstName(userData.profile.firstName || "");
      setLastName(userData.profile.lastName || "");
      if (userData.profile.dateOfBirth) {
        setDob(userData.profile.dateOfBirth.toDate());
      }
    }
  }, [userData.profile]);

  // Prohibited ingredient state
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    reason: "",
    severity: "1",
  });

  // Goal state
  const [newGoal, setNewGoal] = useState({
    name: "",
    description: "",
    endDate: new Date(),
  });

  if (!currentUser) return null;

  const handleUpdateProfile = async () => {
    try {
      await updateUserInfo(currentUser.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: Timestamp.fromDate(dob),
      });
      setShowEditProfileModal(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) {
      Alert.alert("Error", "Please enter an ingredient name");
      return;
    }

    try {
      await updateUserInfo(currentUser.uid, {
        prohibitedIngredient: {
          name: newIngredient.name.trim(),
          reason: newIngredient.reason.trim() || "No reason specified",
          severity: parseInt(newIngredient.severity) || 1,
        },
      });
      setNewIngredient({ name: "", reason: "", severity: "1" });
      setShowAddIngredientModal(false);
      Alert.alert("Success", "Prohibited ingredient added!");
    } catch (error) {
      console.error("Error adding ingredient:", error);
      Alert.alert("Error", "Failed to add ingredient");
    }
  };

  const handleDeleteIngredient = (ingredient: ProhibitedIngredient) => {
    Alert.alert(
      "Delete Ingredient",
      `Are you sure you want to remove "${ingredient.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const currentIngredients =
                userData.profile?.prohibitedIngredients || [];
              const updated = currentIngredients.filter(
                (ing) => ing.ingredientId !== ingredient.ingredientId
              );
              await updateUserInfo(currentUser.uid, {
                prohibitedIngredients: updated,
              });
              Alert.alert("Success", "Ingredient removed");
            } catch (error) {
              console.error("Error deleting ingredient:", error);
              Alert.alert("Error", "Failed to delete ingredient");
            }
          },
        },
      ]
    );
  };

  const handleAddGoal = async () => {
    if (!newGoal.name.trim()) {
      Alert.alert("Error", "Please enter a goal name");
      return;
    }

    try {
      await updateUserInfo(currentUser.uid, {
        goal: {
          name: newGoal.name.trim(),
          description: newGoal.description.trim() || "",
          endDate: Timestamp.fromDate(newGoal.endDate),
        },
      });
      setNewGoal({ name: "", description: "", endDate: new Date() });
      setShowAddGoalModal(false);
      Alert.alert("Success", "Goal added successfully!");
    } catch (error) {
      console.error("Error adding goal:", error);
      Alert.alert("Error", "Failed to add goal");
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    if (!goal.goalId) return;

    Alert.alert("Delete Goal", `Are you sure you want to delete "${goal.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGoal(
              currentUser.uid,
              "currentGoals",
              "goalId",
              goal.goalId!
            );
            Alert.alert("Success", "Goal deleted");
          } catch (error) {
            console.error("Error deleting goal:", error);
            Alert.alert("Error", "Failed to delete goal");
          }
        },
      },
    ]);
  };

  const getInitials = () => {
    const first = userData.profile?.firstName?.charAt(0) || "";
    const last = userData.profile?.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    profileSection: {
      backgroundColor: colors.surface,
      padding: spacing.xl,
      marginBottom: spacing.md,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.pastelGreen,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    avatarText: {
      fontSize: fontSize.xxxl,
      fontWeight: fontWeight.bold,
      color: colors.pastelGreenText,
    },
    profileInfo: {
      gap: spacing.sm,
    },
    profileRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    profileLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: fontWeight.medium,
    },
    profileValue: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.semibold,
    },
    editButton: {
      backgroundColor: colors.pastelGreen,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: "center",
      marginTop: spacing.md,
    },
    editButtonText: {
      color: colors.pastelGreenText,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    section: {
      backgroundColor: colors.surface,
      padding: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    addButton: {
      fontSize: fontSize.md,
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textSecondary,
      paddingVertical: spacing.xl,
      fontSize: fontSize.md,
    },
    ingredientCard: {
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
    },
    severityBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      marginTop: spacing.xs,
      alignSelf: "flex-start",
    },
    severityText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textInverse,
    },
    deleteButton: {
      padding: spacing.sm,
    },
    goalCard: {
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
    },
    goalName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    goalDescription: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    goalDate: {
      fontSize: fontSize.xs,
      color: colors.textTertiary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.sm,
    },
    formGroup: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: radius.md,
      fontSize: fontSize.md,
      color: colors.text,
    },
    dateButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: radius.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateButtonText: {
      fontSize: fontSize.md,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
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
    },
    modalButtonCancelText: {
      color: colors.text,
    },
    modalButtonSaveText: {
      color: colors.pastelGreenText,
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
              <Text style={styles.profileLabel}>Date of Birth</Text>
              <Text style={styles.profileValue}>
                {formatDate(userData.profile?.dateOfBirth)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setFirstName(userData.profile?.firstName || "");
              setLastName(userData.profile?.lastName || "");
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
            userData.profile.prohibitedIngredients.map((ingredient) => (
              <View key={ingredient.ingredientId} style={styles.ingredientCard}>
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

        {/* Health Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Goals</Text>
            <TouchableOpacity onPress={() => setShowAddGoalModal(true)}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {!userData.profile?.currentGoals ||
          userData.profile.currentGoals.length === 0 ? (
            <Text style={styles.emptyText}>No goals set yet</Text>
          ) : (
            userData.profile.currentGoals.map((goal) => (
              <View key={goal.goalId} style={styles.goalCard}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    {goal.description && (
                      <Text style={styles.goalDescription}>
                        {goal.description}
                      </Text>
                    )}
                    <Text style={styles.goalDate}>
                      End Date: {formatDate(goal.endDate)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(goal)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
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
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowProfileDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {dob.toLocaleDateString()}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                {showProfileDatePicker && (
                  <DateTimePicker
                    value={dob}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowProfileDatePicker(Platform.OS === "ios");
                      if (selectedDate) setDob(selectedDate);
                    }}
                  />
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowEditProfileModal(false)}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleUpdateProfile}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonSaveText]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Prohibited Ingredient Modal */}
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
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ingredient Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newIngredient.name}
                  onChangeText={(text) =>
                    setNewIngredient({ ...newIngredient, name: text })
                  }
                  placeholder="e.g., Peanuts, Gluten"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newIngredient.reason}
                  onChangeText={(text) =>
                    setNewIngredient({ ...newIngredient, reason: text })
                  }
                  placeholder="Why is this prohibited?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Severity (1-5)</Text>
                <TextInput
                  style={styles.input}
                  value={newIngredient.severity}
                  onChangeText={(text) =>
                    setNewIngredient({ ...newIngredient, severity: text })
                  }
                  placeholder="1"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowAddIngredientModal(false);
                    setNewIngredient({ name: "", reason: "", severity: "1" });
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleAddIngredient}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonSaveText]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Health Goal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddGoalModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Goal Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newGoal.name}
                  onChangeText={(text) =>
                    setNewGoal({ ...newGoal, name: text })
                  }
                  placeholder="e.g., Lose 10 pounds"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newGoal.description}
                  onChangeText={(text) =>
                    setNewGoal({ ...newGoal, description: text })
                  }
                  placeholder="Describe your goal"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowGoalDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {newGoal.endDate.toLocaleDateString()}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                {showGoalDatePicker && (
                  <DateTimePicker
                    value={newGoal.endDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowGoalDatePicker(Platform.OS === "ios");
                      if (selectedDate)
                        setNewGoal({ ...newGoal, endDate: selectedDate });
                    }}
                  />
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowAddGoalModal(false);
                    setNewGoal({ name: "", description: "", endDate: new Date() });
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleAddGoal}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonSaveText]}>
                    Add Goal
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}