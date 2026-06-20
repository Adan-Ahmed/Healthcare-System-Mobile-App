import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Text, ActivityIndicator, List, Divider, IconButton, Button} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import {QueueEntry} from '../../services/QueueService';
import {PatientService, Patient} from '../../services/PatientService';
import {ReportService, MedicalReport} from '../../services/ReportService';
import {PrescriptionService, Prescription} from '../../services/PrescriptionService';
import {DoctorService} from '../../services/DoctorService';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const DoctorPatientHistoryScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {queueEntry} = route.params as {queueEntry: QueueEntry};

  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, r, rx] = await Promise.all([
          PatientService.getPatientByCNIC(queueEntry.patientCNIC),
          ReportService.getPatientReports(queueEntry.patientId),
          PrescriptionService.getPatientPrescriptions(queueEntry.patientId),
        ]);
        setPatient(p);
        setReports(r);
        setPrescriptions(rx);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load patient records.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [queueEntry.patientCNIC, queueEntry.patientId]);

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingHint}>Loading history…</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={styles.flex}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={AppColors.text} onPress={() => navigation.goBack()} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Medical history
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.name}>
                {patient?.name ?? queueEntry.patientName}
              </Text>
              <Text variant="bodyMedium" style={styles.meta}>
                CNIC: {patient?.cnic ?? queueEntry.patientCNIC}
              </Text>
              {patient?.gender ? (
                <Text variant="bodySmall" style={styles.meta}>
                  Gender: {patient.gender}
                </Text>
              ) : null}
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            This visit (queue)
          </Text>
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="bodyLarge">{queueEntry.symptoms || '—'}</Text>
              {queueEntry.criticalFactors ? (
                <Text variant="bodySmall" style={styles.critical}>
                  Triage: {queueEntry.criticalFactors}
                </Text>
              ) : null}
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Prescriptions (past)
          </Text>
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content style={{paddingVertical: 0}}>
              {prescriptions.length === 0 ? (
                <List.Item title="No prescriptions on file" left={props => <List.Icon {...props} icon="pill-off" />} />
              ) : (
                prescriptions.map((rx, i) => (
                  <View key={rx.id}>
                    <List.Item
                      title={`${new Date(rx.prescriptionDate).toLocaleDateString()} · ${rx.doctorName || 'Doctor'}`}
                      description={rx.diagnosis || rx.items.map(it => it.medicineName).join(', ')}
                      left={props => <List.Icon {...props} icon="pill" />}
                    />
                    {i < prescriptions.length - 1 ? <Divider /> : null}
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Reports (past)
          </Text>
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content style={{paddingVertical: 0}}>
              {reports.length === 0 ? (
                <List.Item title="No reports on file" left={props => <List.Icon {...props} icon="file-remove-outline" />} />
              ) : (
                reports.map((rep, i) => (
                  <View key={rep.id}>
                    <List.Item
                      title={rep.reportType}
                      description={`${new Date(rep.reportDate).toLocaleDateString()} — ${rep.summary ? 'AI summary available' : 'Tap for report'}`}
                      left={props => <List.Icon {...props} icon="file-document-outline" />}
                      right={props => <List.Icon {...props} icon="chevron-right" />}
                      onPress={() =>
                        (navigation as any).navigate('DoctorReportDetail', {
                          reportId: rep.id,
                          initialReport: rep,
                        })
                      }
                    />
                    {i < reports.length - 1 ? <Divider /> : null}
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          <View style={styles.actions}>
            <Button
              mode="contained-tonal"
              icon="pill"
              onPress={() => (navigation as any).navigate('CreatePrescription', {patientId: queueEntry.patientId})}
              style={styles.actionBtn}>
              New prescription
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
              style={styles.actionBtn}>
              New report
            </Button>
          </View>

          {queueEntry.status === 'Waiting' ? (
            <Button
              mode="contained"
              icon="stethoscope"
              buttonColor={AppColors.primary}
              style={styles.startBtn}
              onPress={async () => {
                try {
                  await DoctorService.startConsultation(queueEntry.id);
                  (navigation as any).replace('Consultation', {
                    queueEntry: {...queueEntry, status: 'InProgress'},
                  });
                } catch (e: any) {
                  Alert.alert('Error', e.response?.data?.message || 'Could not start consultation');
                }
              }}>
              Start consultation
            </Button>
          ) : (
            <Button
              mode="contained"
              icon="stethoscope"
              buttonColor={AppColors.primary}
              style={styles.startBtn}
              onPress={() => (navigation as any).replace('Consultation', {queueEntry})}>
              Resume consultation
            </Button>
          )}
        </ScrollView>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingHint: {marginTop: 12, color: AppColors.textSecondary},
  header: {
    ...sharedScreen.headerBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {...sharedScreen.headerTitle, marginLeft: 4},
  scroll: {padding: 16, paddingBottom: 40},
  card: {marginBottom: 14},
  name: {fontWeight: '800', color: AppColors.text},
  meta: {color: AppColors.textSecondary, marginTop: 4},
  sectionTitle: {fontWeight: '700', color: AppColors.textSecondary, marginBottom: 8, marginTop: 8},
  critical: {marginTop: 10, color: AppColors.error, fontWeight: '600'},
  actions: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 12},
  actionBtn: {flex: 0.48, borderRadius: 12},
  startBtn: {borderRadius: 14, marginBottom: 24},
});

export default DoctorPatientHistoryScreen;
