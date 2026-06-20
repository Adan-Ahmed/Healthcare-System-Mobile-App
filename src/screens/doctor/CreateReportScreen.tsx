import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Text, Button, TextInput, IconButton, Chip, ActivityIndicator} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import {ReportService} from '../../services/ReportService';
import {DoctorService, LatestVitals} from '../../services/DoctorService';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const REPORT_TYPE_PRESETS = [
  'Laboratory report',
  'Radiology / imaging',
  'ECG',
  'Discharge summary',
  'Consultation note',
  'Procedure note',
];

const CreateReportScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {patientId, symptoms} = route.params as {patientId: number; symptoms?: string; queueEntryId?: number};

  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState('');
  const [loading, setLoading] = useState(false);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [latestVitals, setLatestVitals] = useState<LatestVitals | null>(null);

  const loadLatestVitals = useCallback(async () => {
    setVitalsLoading(true);
    try {
      const v = await DoctorService.getPatientLatestVitals(patientId);
      setLatestVitals(v);
    } catch {
      setLatestVitals(null);
    } finally {
      setVitalsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadLatestVitals();
  }, [loadLatestVitals]);

  const vitalsBlock = useMemo(() => {
    const lines: string[] = [];
    lines.push('Appointment symptoms');
    lines.push(symptoms?.trim() ? symptoms.trim() : '—');
    lines.push('');
    lines.push('Sensor data (latest)');
    lines.push(`Recorded: ${latestVitals?.recordedAt ? new Date(latestVitals.recordedAt).toLocaleString() : '—'}`);
    lines.push(
      `Temperature: ${
        latestVitals?.temperature != null ? `${latestVitals.temperature} °F` : '—'
      }`,
    );
    lines.push(`Pulse: ${latestVitals?.heartRate != null ? `${latestVitals.heartRate} BPM` : '—'}`);
    lines.push(
      `Blood pressure: ${
        latestVitals?.bloodPressureSystolic != null && latestVitals?.bloodPressureDiastolic != null
          ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic} mmHg`
          : '—'
      }`,
    );
    lines.push(`SpO₂: ${latestVitals?.oxygenSaturation != null ? `${latestVitals.oxygenSaturation}%` : '—'}`);
    return lines.join('\n');
  }, [latestVitals, symptoms]);

  const mergedReportBody = useMemo(() => {
    const marker = 'Sensor data (latest)';
    const trimmed = reportData.trim();
    if (!trimmed) {
      return vitalsBlock;
    }
    if (trimmed.includes(marker)) {
      return reportData;
    }
    return `${vitalsBlock}\n\n${reportData}`;
  }, [reportData, vitalsBlock]);

  const handleSubmit = async () => {
    if (!reportType || !reportData) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await ReportService.createReport({
        patientId,
        reportType,
        reportData: mergedReportBody,
      });

      Alert.alert('Success', 'Report created successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={AppColors.text} onPress={() => navigation.goBack()} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            New report
          </Text>
        </View>
        <ScrollView style={sharedScreen.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>
                Create medical report
              </Text>
              <Text variant="bodySmall" style={styles.aiHint}>
                After save, an AI-assisted clinical summary is generated from the detailed findings.
              </Text>

              <Text variant="labelLarge" style={styles.presetLabel}>
                Quick types
              </Text>
              <View style={styles.presetRow}>
                {REPORT_TYPE_PRESETS.map(p => (
                  <Chip
                    key={p}
                    mode={reportType === p ? 'flat' : 'outlined'}
                    selected={reportType === p}
                    onPress={() => setReportType(p)}
                    style={styles.presetChip}
                    textStyle={reportType === p ? styles.presetChipTextSel : undefined}>
                    {p}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Report type *"
                value={reportType}
                onChangeText={setReportType}
                mode="outlined"
                style={styles.input}
                placeholder="e.g. Laboratory report, CT chest"
              />

              <Card style={styles.vitalsCard} mode="outlined">
                <Card.Content>
                  <View style={styles.vitalsHeader}>
                    <Text variant="titleSmall" style={styles.vitalsTitle}>
                      Appointment + sensor data (auto-included)
                    </Text>
                    <Button mode="text" onPress={loadLatestVitals} textColor={AppColors.primary} compact>
                      Refresh
                    </Button>
                  </View>
                  {vitalsLoading ? (
                    <View style={styles.vitalsLoadingRow}>
                      <ActivityIndicator size="small" color={AppColors.primary} />
                      <Text variant="bodySmall" style={styles.vitalsLoadingText}>
                        Loading…
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text variant="bodySmall" style={styles.vitalsLine}>
                        Symptoms: {symptoms?.trim() ? symptoms.trim() : '—'}
                      </Text>
                      <Text variant="bodySmall" style={styles.vitalsLine}>
                        Recorded: {latestVitals?.recordedAt ? new Date(latestVitals.recordedAt).toLocaleString() : '—'}
                      </Text>
                      <Text variant="bodySmall" style={styles.vitalsLine}>
                        Temperature: {latestVitals?.temperature != null ? `${latestVitals.temperature} °F` : '—'}
                      </Text>
                      <Text variant="bodySmall" style={styles.vitalsLine}>
                        Pulse: {latestVitals?.heartRate != null ? `${latestVitals.heartRate} BPM` : '—'}
                      </Text>
                      <Text variant="bodySmall" style={styles.vitalsLine}>
                        BP:{' '}
                        {latestVitals?.bloodPressureSystolic != null && latestVitals?.bloodPressureDiastolic != null
                          ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic} mmHg`
                          : '—'}
                      </Text>
                    </>
                  )}
                  <Text variant="labelSmall" style={styles.vitalsHint}>
                    This section is prepended into the report body on save.
                  </Text>
                </Card.Content>
              </Card>

              <TextInput
                label="Detailed findings / report body *"
                value={reportData}
                onChangeText={setReportData}
                mode="outlined"
                multiline
                numberOfLines={10}
                style={styles.input}
                placeholder="Clinical findings, values, impression — this text drives the AI summary."
              />
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            buttonColor={AppColors.primary}>
            Create Report
          </Button>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  wrap: {flex: 1},
  header: {
    ...sharedScreen.headerBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 4,
  },
  headerTitle: {fontWeight: '800', color: AppColors.text, marginLeft: 4},
  content: {padding: 18, paddingBottom: 40},
  title: {fontWeight: '800', color: AppColors.text, marginBottom: 8},
  aiHint: {color: AppColors.textSecondary, marginBottom: 14, lineHeight: 20},
  presetLabel: {marginBottom: 8, color: AppColors.textMuted, fontWeight: '700'},
  presetRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  presetChip: {marginBottom: 4},
  presetChipTextSel: {fontWeight: '700'},
  card: {marginBottom: 16},
  input: {marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.98)'},
  vitalsCard: {
    marginBottom: 12,
    borderColor: AppColors.border,
    backgroundColor: AppColors.primaryTint,
  },
  vitalsHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6},
  vitalsTitle: {fontWeight: '800', color: AppColors.text},
  vitalsLine: {color: AppColors.textSecondary, marginTop: 2},
  vitalsHint: {marginTop: 8, color: AppColors.textMuted},
  vitalsLoadingRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6},
  vitalsLoadingText: {color: AppColors.textMuted},
  submitButton: {marginTop: 12, borderRadius: 12},
});

export default CreateReportScreen;
