import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Text, Button, ActivityIndicator, Avatar, Divider, List, IconButton, Chip} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import {QueueEntry} from '../../services/QueueService';
import {ReportService} from '../../services/ReportService';
import {PatientService, Patient} from '../../services/PatientService';
import {DoctorService, LatestVitals} from '../../services/DoctorService';
import {PrescriptionService, Prescription} from '../../services/PrescriptionService';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const ConsultationScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {queueEntry} = route.params as {queueEntry: QueueEntry};

  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitals, setVitals] = useState<LatestVitals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const [patientData, patientReports, rx, latestVitals] = await Promise.all([
        PatientService.getPatientByCNIC(queueEntry.patientCNIC),
        ReportService.getPatientReports(queueEntry.patientId),
        PrescriptionService.getPatientPrescriptions(queueEntry.patientId),
        DoctorService.getPatientLatestVitals(queueEntry.patientId),
      ]);
      setPatient(patientData);
      setReports(patientReports);
      setPrescriptions(rx);
      setVitals(latestVitals);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteConsultation = async () => {
    try {
      await DoctorService.completeConsultation(queueEntry.id);
      Alert.alert('Success', 'Consultation marked as complete', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete consultation');
    }
  };

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingHint}>Loading patient file…</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="close" iconColor={AppColors.text} onPress={() => navigation.goBack()} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Consultation
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.patientCard}>
          <Card.Content style={styles.patientCardContent}>
            <Avatar.Text size={60} label={patient?.name?.substring(0, 2).toUpperCase() || 'P'} style={styles.avatar} />
            <View style={styles.patientInfo}>
              <Text variant="titleLarge" style={styles.name}>{patient?.name}</Text>
              <Text variant="bodyMedium">CNIC: {patient?.cnic}</Text>
              <Text variant="bodySmall" style={styles.age}>Gender: {patient?.gender || 'N/A'}</Text>
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Vitals at check-in
        </Text>
        <Card style={styles.vitalsCard}>
          <Card.Content>
            {vitals ? (
              <>
                <View style={styles.vitalsRow}>
                  <Chip icon="thermometer" style={styles.vitalsChip} textStyle={styles.vitalsChipText}>
                    {vitals.temperature != null ? `${vitals.temperature} °F` : '— °F'}
                  </Chip>
                  <Chip icon="heart-pulse" style={styles.vitalsChip} textStyle={styles.vitalsChipText}>
                    {vitals.heartRate != null ? `${vitals.heartRate} BPM` : '— BPM'}
                  </Chip>
                </View>
                <View style={styles.vitalsRow}>
                  <Chip icon="gauge" style={styles.vitalsChip} textStyle={styles.vitalsChipText}>
                    BP{' '}
                    {vitals.bloodPressureSystolic != null && vitals.bloodPressureDiastolic != null
                      ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`
                      : '—/—'}
                  </Chip>
                  <Chip icon="air-filter" style={styles.vitalsChip} textStyle={styles.vitalsChipText}>
                    SpO₂ {vitals.oxygenSaturation != null ? `${vitals.oxygenSaturation}%` : '—'}
                  </Chip>
                </View>
                <Text variant="bodySmall" style={styles.vitalsRecorded}>
                  Recorded {new Date(vitals.recordedAt).toLocaleString()}
                </Text>
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.vitalsEmpty}>
                No vitals on file for this visit yet (reception should capture IoT readings at check-in).
              </Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.sectionRow}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Current Symptoms</Text>
          <IconButton icon="alert-circle-outline" iconColor="#F44336" />
        </View>
        <Card style={styles.symptomCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.symptomsText}>{queueEntry.symptoms || 'No symptoms reported'}</Text>
            {queueEntry.criticalFactors && (
              <View style={styles.criticalBadge}>
                <Text style={styles.criticalText}>Critical: {queueEntry.criticalFactors}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>Prescription history</Text>
        <Card style={styles.historyCard}>
          <Card.Content style={{padding: 0}}>
            {prescriptions.length === 0 ? (
              <List.Item title="No prior prescriptions" left={props => <List.Icon {...props} icon="pill" />} />
            ) : (
              prescriptions.map((rx, index) => (
                <View key={rx.id}>
                  <List.Item
                    title={`${new Date(rx.prescriptionDate).toLocaleDateString()} — ${rx.doctorName}`}
                    description={rx.diagnosis || rx.items.map(i => i.medicineName).join(', ')}
                    left={props => <List.Icon {...props} icon="pill" />}
                  />
                  {index < prescriptions.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>Medical reports</Text>
        <Card style={styles.historyCard}>
          <Card.Content style={{padding: 0}}>
            {reports.length === 0 ? (
              <List.Item title="No previous records found" left={props => <List.Icon {...props} icon="information-outline" />} />
            ) : (
              reports.map((report, index) => (
                <View key={report.id}>
                  <List.Item
                    title={report.reportType}
                    description={`${new Date(report.reportDate).toLocaleDateString()} — ${report.summary ? 'AI summary on file' : 'Open for full report & AI summary'}`}
                    left={props => <List.Icon {...props} icon="file-document-outline" />}
                    right={props => <IconButton {...props} icon="chevron-right" />}
                    onPress={() =>
                      (navigation as any).navigate('DoctorReportDetail', {
                        reportId: report.id,
                        initialReport: report,
                      })
                    }
                  />
                  {index < reports.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionGrid}>
          <Button 
            mode="contained-tonal" 
            icon="pill" 
            onPress={() => (navigation as any).navigate('CreatePrescription', {patientId: queueEntry.patientId})}
            style={styles.actionBtn}
          >
            Prescription
          </Button>
          <Button 
            mode="contained-tonal" 
            icon="file-plus" 
            onPress={() =>
              (navigation as any).navigate('CreateReport', {
                patientId: queueEntry.patientId,
                symptoms: queueEntry.symptoms,
                queueEntryId: queueEntry.id,
              })
            }
            style={styles.actionBtn}
          >
            New Report
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.completeHint}>
          Finishing removes this patient from the live queue and lets them check in again on a future visit.
        </Text>
        <Button
          mode="contained"
          onPress={handleCompleteConsultation}
          style={styles.completeBtn}
          contentStyle={{height: 56}}
          buttonColor={AppColors.success}>
          Complete consultation
        </Button>
      </ScrollView>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...sharedScreen.headerBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontWeight: '800',
    marginLeft: 4,
    color: AppColors.text,
  },
  loadingHint: {marginTop: 12, color: AppColors.textSecondary},
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 24,
  },
  patientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    backgroundColor: AppColors.primaryTint,
  },
  patientInfo: {
    marginLeft: 16,
  },
  name: {
    fontWeight: '800',
    color: AppColors.text,
  },
  age: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontWeight: '700',
    color: AppColors.textSecondary,
    marginVertical: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalsCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  vitalsChip: {
    backgroundColor: AppColors.primaryTint,
  },
  vitalsChipText: {
    fontSize: 13,
  },
  vitalsRecorded: {
    color: AppColors.textMuted,
    marginTop: 4,
  },
  vitalsEmpty: {
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  symptomCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.error,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  symptomsText: {
    lineHeight: 24,
  },
  criticalBadge: {
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 8,
  },
  criticalText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 12,
  },
  historyCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 0.48,
    borderRadius: 12,
  },
  completeHint: {
    color: AppColors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  completeBtn: {
    borderRadius: 16,
    marginBottom: 40,
  },
});

export default ConsultationScreen;
