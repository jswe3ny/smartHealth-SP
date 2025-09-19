import { allergyAlertStyles as styles } from '@/assets/styles/componentStyles/AllergyAlert';
import { allergyUtils } from "@/utils/allergyUtils";
import { AllergyAlert as AllergyAlertType } from "@/utils/types/food.types";
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface AllergyAlertProps {
  alert: AllergyAlertType;
  onDismiss: () => void;
  onProceed: () => void;
  onCancel: () => void;
}

export const AllergyAlert: React.FC<AllergyAlertProps> = ({ alert, onDismiss, onProceed, onCancel }) => {
  const severityColor = allergyUtils.getSeverityColor(alert.highestSeverity || 5);
  const severityLabel = allergyUtils.getSeverityLabel(alert.highestSeverity || 5);
  const isHighRisk = alert.highestSeverity >= 8;

  return (
    <View style={styles.overlay}>
      <View style={styles.alertContainer}>
        <View style={[styles.severityBand, { backgroundColor: severityColor }]}>
          <Text style={styles.severityText}>{severityLabel}</Text>
        </View>
        
        <Text style={[styles.alertTitle, { color: severityColor }]}>
          {alert.title}
        </Text>
        
        <ScrollView style={styles.messageContainer}>
          <Text style={styles.alertMessage}>{alert.message}</Text>
          
          {alert.matches && alert.matches.length > 0 && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Detected Issues:</Text>
              {alert.matches.map((match, index) => (
                <View key={index} style={styles.matchItem}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchName}>{match.name}</Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: allergyUtils.getSeverityColor(match.severity || 5) }
                    ]}>
                      <Text style={styles.severityBadgeText}>{match.severity || 5}</Text>
                    </View>
                  </View>
                  {match.reason && (
                    <Text style={styles.matchReason}>Reason: {match.reason}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.proceedButton,
              { backgroundColor: isHighRisk ? '#ff5722' : '#ff9800' }
            ]}
            onPress={onProceed}
          >
            <Text style={styles.proceedButtonText}>
              {isHighRisk ? 'Override Risk' : 'Add Anyway'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Text style={styles.dismissText}>
            Don't warn me about {alert.matches?.length > 1 ? 'these ingredients' : 'this ingredient'} again
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
