import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl, Platform} from 'react-native';
import {Card, Text, ActivityIndicator, Button} from 'react-native-paper';
import {PrescriptionService, Prescription} from '../../services/PrescriptionService';
import {useAuth} from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const PrescriptionsScreen: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {user} = useAuth();

  const loadPrescriptions = async () => {
    if (!user) {
      return;
    }
    try {
      const patientPrescriptions = await PrescriptionService.getPatientPrescriptions(user.id);
      setPrescriptions(patientPrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPrescriptions();
  };

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={sharedScreen.flex}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}>
        <View style={styles.hero}>
          <Text variant="labelLarge" style={styles.heroLabel}>
            Medications
          </Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Prescriptions
          </Text>
          <Text variant="bodyMedium" style={styles.heroSub}>
            Active plans from your clinician.
          </Text>
        </View>
        <View style={styles.content}>
          {prescriptions.length === 0 ? (
            <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
              <Card.Content>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No prescriptions found
                </Text>
              </Card.Content>
            </Card>
          ) : (
            prescriptions.map(prescription => (
              <Card key={prescription.id} style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
                <Card.Content>
                  <Text variant="titleLarge" style={styles.rxTitle}>
                    Prescription
                  </Text>
                  <Text variant="bodyMedium" style={styles.date}>
                    {new Date(prescription.prescriptionDate).toLocaleDateString()}
                  </Text>
                  {prescription.diagnosis && (
                    <Text variant="bodyMedium" style={styles.diagnosis}>
                      Diagnosis: {prescription.diagnosis}
                    </Text>
                  )}
                  {prescription.instructions && (
                    <Text variant="bodySmall" style={styles.instructions}>
                      Instructions: {prescription.instructions}
                    </Text>
                  )}
                  <Text variant="titleMedium" style={styles.medicinesTitle}>
                    Medicines
                  </Text>
                  {prescription.items.map((item, index) => (
                    <View key={item.id} style={styles.medicineItem}>
                      <Text variant="bodyMedium" style={styles.medicineName}>
                        {index + 1}. {item.medicineName}
                      </Text>
                      <Text variant="bodySmall" style={styles.meta}>
                        Dosage: {item.dosage}
                      </Text>
                      <Text variant="bodySmall" style={styles.meta}>
                        Frequency: {item.frequency}
                      </Text>
                      <Text variant="bodySmall" style={styles.meta}>
                        Duration: {item.duration} days
                      </Text>
                      {item.instructions && (
                        <Text variant="bodySmall" style={styles.medicineInstructions}>
                          {item.instructions}
                        </Text>
                      )}
                    </View>
                  ))}
                  <Text variant="bodySmall" style={styles.doctor}>
                    Prescribed by: {prescription.doctorName}
                  </Text>
                </Card.Content>
              </Card>
            ))
          )}
          <Button mode="outlined" onPress={onRefresh} style={styles.refreshButton} textColor={AppColors.primary}>
            Refresh
          </Button>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  hero: {paddingHorizontal: 22, paddingTop: 52, paddingBottom: 6},
  heroLabel: {color: AppColors.primary, letterSpacing: 1, fontWeight: '600'},
  heroTitle: {fontWeight: '800', color: AppColors.text, marginTop: 4},
  heroSub: {color: AppColors.textSecondary, marginTop: 6},
  content: {padding: 18, paddingBottom: 32},
  card: {marginBottom: 14},
  rxTitle: {fontWeight: '800', color: AppColors.text},
  date: {marginTop: 6, color: AppColors.textMuted},
  diagnosis: {marginTop: 10, fontWeight: '700', color: AppColors.primary},
  instructions: {marginTop: 6, color: AppColors.textSecondary},
  medicinesTitle: {marginTop: 14, fontWeight: '700', color: AppColors.text},
  medicineItem: {
    marginTop: 10,
    padding: 12,
    backgroundColor: AppColors.bgMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  medicineName: {fontWeight: '700', color: AppColors.text},
  meta: {color: AppColors.textSecondary, marginTop: 2},
  medicineInstructions: {marginTop: 6, fontStyle: 'italic', color: AppColors.textMuted},
  doctor: {marginTop: 14, color: AppColors.success, fontWeight: '600'},
  emptyText: {textAlign: 'center', color: AppColors.textMuted},
  refreshButton: {marginTop: 16, borderColor: AppColors.primary},
});

export default PrescriptionsScreen;
