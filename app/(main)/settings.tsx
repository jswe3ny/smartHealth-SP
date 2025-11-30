import {
  fontSize,
  fontWeight,
  radius,
  spacing,
  useThemeColors,
} from "@/assets/styles";
import { useAuth } from "@/contexts/authContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { ActivityLevel } from "@/utils/types/user.types";
import { deleteUserData, updateUserInfo } from "@/utils/user.repo";
import { Ionicons } from "@expo/vector-icons";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from "@react-native-firebase/auth";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const { currentUser, accountSignOut } = useAuth();
  const userData = useUserInfo();
  const colors = useThemeColors();

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Activity level state
  const [showActivityLevelModal, setShowActivityLevelModal] = useState(false);

  if (!currentUser) return null;

  const activityLevels: { value: ActivityLevel; label: string; description: string }[] = [
    {
      value: "sedentary",
      label: "Sedentary",
      description: "Little to no exercise",
    },
    {
      value: "lightly_active",
      label: "Lightly Active",
      description: "Light exercise 1-3 days/week",
    },
    {
      value: "active",
      label: "Active",
      description: "Moderate exercise 3-5 days/week",
    },
    {
      value: "very_active",
      label: "Very Active",
      description: "Hard exercise 6-7 days/week",
    },
  ];

  const getActivityLevelLabel = (level?: ActivityLevel) => {
    const found = activityLevels.find((a) => a.value === level);
    return found ? found.label : "Not set";
  };

  const handleUpdateActivityLevel = async (level: ActivityLevel) => {
    try {
      await updateUserInfo(currentUser.uid, {
        activityLevel: level,
      });
      setShowActivityLevelModal(false);
      Alert.alert("Success", "Activity level updated successfully!");
    } catch (error) {
      console.error("Error updating activity level:", error);
      Alert.alert("Error", "Failed to update activity level");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from current password");
      return;
    }

    if (!currentUser || !currentUser.email) {
      Alert.alert("Error", "User not found");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Clear form and close modal
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePasswordModal(false);
      Alert.alert("Success", "Password changed successfully!");
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "Failed to change password";
      
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please sign out and sign in again before changing your password";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("Error", "Please enter your password to confirm account deletion");
      return;
    }

    if (!currentUser || !currentUser.email) {
      Alert.alert("Error", "User not found");
      return;
    }

    // Final confirmation
    Alert.alert(
      "⚠️ Final Confirmation",
      "This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const auth = getAuth();
              const user = auth.currentUser;

              if (!user) {
                Alert.alert("Error", "User not authenticated");
                setIsDeleting(false);
                return;
              }

              // Re-authenticate user with password
              const credential = EmailAuthProvider.credential(
                currentUser.email,
                deletePassword
              );
              await reauthenticateWithCredential(user, credential);

              // Delete all user data from Firestore
              await deleteUserData(currentUser.uid);

              // Delete Firebase Auth account
              await user.delete();

              // Sign out and redirect
              await accountSignOut();
              
              Alert.alert(
                "Account Deleted",
                "Your account and all associated data have been permanently deleted.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.replace("/(auth)");
                    },
                  },
                ]
              );
            } catch (error: any) {
              setIsDeleting(false);
              console.error("Error deleting account:", error);
              let errorMessage = "Failed to delete account";
              
              if (error.code === "auth/wrong-password") {
                errorMessage = "Password is incorrect";
              } else if (error.code === "auth/requires-recent-login") {
                errorMessage = "Please sign out and sign in again before deleting your account";
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert("Error", errorMessage);
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
    header: {
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    headerTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    section: {
      backgroundColor: colors.surface,
      padding: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    settingsItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingsItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      flex: 1,
    },
    settingsItemText: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.medium,
    },
    settingsItemSubtext: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
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
    passwordInputContainer: {
      position: "relative",
    },
    passwordToggle: {
      position: "absolute",
      right: spacing.md,
      top: "50%",
      transform: [{ translateY: -10 }],
      padding: spacing.xs,
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
    dangerItem: {
      borderBottomColor: colors.error + "20",
    },
    activityLevelOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      marginBottom: spacing.md,
    },
    activityLevelOptionSelected: {
      borderColor: colors.pastelGreen,
      backgroundColor: colors.pastelGreen + "20",
    },
    activityLevelLabel: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    activityLevelLabelSelected: {
      color: colors.pastelGreenText,
    },
    activityLevelDescription: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    activityLevelDescriptionSelected: {
      color: colors.pastelGreenText + "CC",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView>
        {/* Health Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Preferences</Text>
          
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setShowActivityLevelModal(true)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="fitness-outline" size={20} color={colors.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsItemText}>Activity Level</Text>
                <Text style={styles.settingsItemSubtext}>
                  {getActivityLevelLabel(userData.profile?.activityLevel)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
              <Text style={styles.settingsItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={[styles.settingsItem, styles.dangerItem]}
            onPress={() => setShowDeleteAccountModal(true)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.settingsItemText, { color: colors.error }]}>
                Delete Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password (min 8 characters)"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowChangePasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleChangePassword}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonSaveText]}>
                    Change Password
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.error }]}>
                Delete Account
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowDeleteAccountModal(false);
                  setDeletePassword("");
                }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.error, fontSize: fontSize.md }]}>
                  ⚠️ Warning: This action cannot be undone
                </Text>
                <Text style={[styles.label, { fontWeight: fontWeight.regular, marginTop: spacing.sm }]}>
                  Deleting your account will permanently remove:
                </Text>
                <View style={{ marginLeft: spacing.md, marginTop: spacing.xs }}>
                  <Text style={[styles.label, { fontWeight: fontWeight.regular, fontSize: fontSize.sm }]}>
                    • Your profile information
                  </Text>
                  <Text style={[styles.label, { fontWeight: fontWeight.regular, fontSize: fontSize.sm }]}>
                    • All your meals and food journal entries
                  </Text>
                  <Text style={[styles.label, { fontWeight: fontWeight.regular, fontSize: fontSize.sm }]}>
                    • Your health tracking data
                  </Text>
                  <Text style={[styles.label, { fontWeight: fontWeight.regular, fontSize: fontSize.sm }]}>
                    • Your goals and preferences
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Enter your password to confirm</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showDeletePassword}
                    autoCapitalize="none"
                    editable={!isDeleting}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowDeletePassword(!showDeletePassword)}
                  >
                    <Ionicons
                      name={showDeletePassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowDeleteAccountModal(false);
                    setDeletePassword("");
                  }}
                  disabled={isDeleting}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.error }]}
                  onPress={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textInverse }]}>
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Activity Level Modal */}
      <Modal
        visible={showActivityLevelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityLevelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Activity Level</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowActivityLevelModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { marginBottom: spacing.lg }]}>
                Select your typical activity level to help us provide better health recommendations.
              </Text>

              {activityLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.activityLevelOption,
                    userData.profile?.activityLevel === level.value &&
                      styles.activityLevelOptionSelected,
                  ]}
                  onPress={() => handleUpdateActivityLevel(level.value)}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.activityLevelLabel,
                        userData.profile?.activityLevel === level.value &&
                          styles.activityLevelLabelSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text
                      style={[
                        styles.activityLevelDescription,
                        userData.profile?.activityLevel === level.value &&
                          styles.activityLevelDescriptionSelected,
                      ]}
                    >
                      {level.description}
                    </Text>
                  </View>
                  {userData.profile?.activityLevel === level.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.pastelGreenText}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

