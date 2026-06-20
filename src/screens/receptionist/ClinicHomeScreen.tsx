import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Text, Button, TextInput, IconButton, Avatar, List, Divider, Chip} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {PatientService, Patient} from '../../services/PatientService';
import {QueueService} from '../../services/QueueService';
import {IotService} from '../../services/IotService';
import {CLINIC_SYMPTOM_OPTIONS} from '../../constants/clinicSymptoms';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

type ClinicVitals = {
  temperature?: number;
  pulse?: number;
  bpUp?: number;
  bpDown?: number;
  source?: string;
  recordedAtUtc?: string;
};

const ClinicHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user, logout} = useAuth();

  const [searchCnic, setSearchCnic] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [vitals, setVitals] = useState<ClinicVitals | null>(null);
  const [vitalsLoading, setVitalsLoading] = useState({
    temperature: false,
    pulse: false,
    bp: false,
  });

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Exit Clinic Mode?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: logout, style: 'destructive'},
    ]);
  };

  const handleSearch = async () => {
    if (!searchCnic) {
      return;
    }
    setLoading(true);
    try {
      const patient = await PatientService.getPatientByCNIC(searchCnic);
      setFoundPatient(patient);
      setVitals(null);
    } catch (error) {
      Alert.alert('Not Found', 'No patient found with this CNIC. Please register them.');
      setFoundPatient(null);
      setVitals(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTemperature = async () => {
    if (!foundPatient) {
      return;
    }
    setVitalsLoading(prev => ({...prev, temperature: true}));
    try {
      const reading = await IotService.fetchTemperature();
      setVitals(prev => ({
        ...(prev ?? {}),
        temperature: reading.temperature,
        source: reading.source,
        recordedAtUtc: reading.recordedAtUtc,
      }));
    } catch (e: any) {
      Alert.alert('IoT', e.response?.data?.message || 'Could not fetch temperature. Try again.');
    } finally {
      setVitalsLoading(prev => ({...prev, temperature: false}));
    }
  };

  const handleFetchPulse = async () => {
    if (!foundPatient) {
      return;
    }
    setVitalsLoading(prev => ({...prev, pulse: true}));
    try {
      const reading = await IotService.fetchPulse();
      setVitals(prev => ({
        ...(prev ?? {}),
        pulse: reading.pulse,
        source: reading.source,
        recordedAtUtc: reading.recordedAtUtc,
      }));
    } catch (e: any) {
      Alert.alert('IoT', e.response?.data?.message || 'Could not fetch pulse. Try again.');
    } finally {
      setVitalsLoading(prev => ({...prev, pulse: false}));
    }
  };

  const handleFetchBloodPressure = async () => {
    if (!foundPatient) {
      return;
    }
    setVitalsLoading(prev => ({...prev, bp: true}));
    try {
      const reading = await IotService.fetchBloodPressure();
      setVitals(prev => ({
        ...(prev ?? {}),
        bpUp: reading.bpUp,
        bpDown: reading.bpDown,
        source: reading.source,
        recordedAtUtc: reading.recordedAtUtc,
      }));
    } catch (e: any) {
      Alert.alert('IoT', e.response?.data?.message || 'Could not fetch blood pressure. Try again.');
    } finally {
      setVitalsLoading(prev => ({...prev, bp: false}));
    }
  };

  const allVitalsFetched =
    vitals != null &&
    vitals.temperature != null &&
    vitals.pulse != null &&
    vitals.bpUp != null &&
    vitals.bpDown != null;

  const handleAddToQueue = async () => {
    if (!foundPatient || selectedSymptoms.length === 0) {
      Alert.alert('Check-in', 'Select a patient and choose at least one symptom.');
      return;
    }

    if (
      !vitals ||
      vitals.temperature == null ||
      vitals.pulse == null ||
      vitals.bpUp == null ||
      vitals.bpDown == null
    ) {
      Alert.alert(
        'Vitals required',
        'Fetch temperature, pulse, and blood pressure with all 3 buttons before adding this patient to the queue.',
      );
      return;
    }

    const symptomList = [...selectedSymptoms];

    setLoading(true);
    try {
      await QueueService.joinQueue({
        patientId: foundPatient.id,
        symptoms: symptomList,
        sensorData: {
          temperature: vitals.temperature,
          heartRate: vitals.pulse,
          bloodPressureSystolic: vitals.bpUp,
          bloodPressureDiastolic: vitals.bpDown,
          additionalData: JSON.stringify({
            source: vitals.source,
            recordedAtUtc: vitals.recordedAtUtc,
          }),
        },
      });

      Alert.alert(
        'Added to queue',
        `${foundPatient.name} was checked in. Priority is set by triage (rules + optional AI). They cannot be added again until the visit is completed.`,
      );
      setFoundPatient(null);
      setSearchCnic('');
      setSelectedSymptoms([]);
      setVitals(null);
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 409) {
        Alert.alert('Already in queue', msg || 'This patient is already waiting or in consultation.');
      } else {
        Alert.alert('Error', msg || 'Failed to add patient to queue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={sharedScreen.flex}>
        <View style={styles.header}>
          <View>
            <Text variant="labelLarge" style={styles.headerEyebrow}>
              Reception
            </Text>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Clinic desk
            </Text>
            <Text variant="bodyLarge" style={styles.headerSubtitle}>
              {user?.name}
            </Text>
          </View>
          <IconButton
            icon="logout"
            mode="contained-tonal"
            containerColor="#FEE2E2"
            iconColor={AppColors.error}
            onPress={handleLogout}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Patient check-in → vitals → queue
            </Text>
            <Text variant="bodySmall" style={styles.flowHint}>
              1) Find patient · 2) Tap symptoms (multi-select) · 3) Fetch temperature, pulse, and BP separately · 4)
              Add to queue (same patient blocked until the doctor completes the visit).
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                label="Patient CNIC"
                value={searchCnic}
                onChangeText={setSearchCnic}
                mode="outlined"
                style={styles.searchInput}
                keyboardType="numeric"
              />
              <IconButton
                icon="magnify"
                mode="contained-tonal"
                containerColor={AppColors.primaryTint}
                iconColor={AppColors.primary}
                onPress={handleSearch}
                loading={loading}
                style={styles.searchBtn}
              />
            </View>

            {foundPatient && (
              <View style={styles.patientResult}>
                <Divider style={styles.divider} />
                <List.Item
                  title={foundPatient.name}
                  description={`CNIC: ${foundPatient.cnic}`}
                  left={props => <Avatar.Text {...props} size={40} label={foundPatient.name.substring(0, 2)} />}
                />
                <Text variant="titleSmall" style={styles.symptomPickTitle}>
                  Current symptoms * (select all that apply)
                </Text>
                <View style={styles.symptomChipWrap}>
                  {CLINIC_SYMPTOM_OPTIONS.map(label => {
                    const on = selectedSymptoms.includes(label);
                    return (
                      <Chip
                        key={label}
                        selected={on}
                        onPress={() => toggleSymptom(label)}
                        style={[styles.symptomChip, on && styles.symptomChipOn]}
                        textStyle={on ? styles.symptomChipTextOn : undefined}>
                        {label}
                      </Chip>
                    );
                  })}
                </View>

                <Text variant="titleSmall" style={styles.vitalsTitle}>
                  Vitals (IoT) *
                </Text>
                <View style={styles.vitalsButtonsWrap}>
                  <Button
                    mode="outlined"
                    icon="thermometer"
                    onPress={handleFetchTemperature}
                    loading={vitalsLoading.temperature}
                    disabled={loading || vitalsLoading.temperature}
                    style={styles.vitalsBtn}
                    textColor={AppColors.primary}>
                    Fetch temperature
                  </Button>
                  <Button
                    mode="outlined"
                    icon="heart"
                    onPress={handleFetchPulse}
                    loading={vitalsLoading.pulse}
                    disabled={loading || vitalsLoading.pulse}
                    style={styles.vitalsBtn}
                    textColor={AppColors.primary}>
                    Fetch pulse
                  </Button>
                  <Button
                    mode="outlined"
                    icon="gauge"
                    onPress={handleFetchBloodPressure}
                    loading={vitalsLoading.bp}
                    disabled={loading || vitalsLoading.bp}
                    style={styles.vitalsBtn}
                    textColor={AppColors.primary}>
                    Fetch BP
                  </Button>
                </View>

                <Text variant="labelLarge" style={styles.fetchedReadingsTitle}>
                  Fetched readings
                </Text>
                <Card style={styles.vitalsCard} mode="outlined">
                  <Card.Content>
                    <View style={styles.vitalRow}>
                      <Text variant="bodyMedium" style={styles.vitalLabel}>
                        Temperature
                      </Text>
                      <Chip icon="thermometer" style={styles.vitalValueChip} compact>
                        {vitals?.temperature != null ? `${vitals.temperature} °F` : '—'}
                      </Chip>
                    </View>
                    <View style={styles.vitalRow}>
                      <Text variant="bodyMedium" style={styles.vitalLabel}>
                        Pulse
                      </Text>
                      <Chip icon="heart" style={styles.vitalValueChip} compact>
                        {vitals?.pulse != null ? `${vitals.pulse} BPM` : '—'}
                      </Chip>
                    </View>
                    <View style={[styles.vitalRow, styles.vitalRowLast]}>
                      <Text variant="bodyMedium" style={styles.vitalLabel}>
                        Blood pressure
                      </Text>
                      <Chip icon="gauge" style={styles.vitalValueChip} compact>
                        {vitals?.bpUp != null && vitals?.bpDown != null
                          ? `${vitals.bpUp} / ${vitals.bpDown}`
                          : '—'}
                      </Chip>
                    </View>
                    {vitals?.recordedAtUtc ? (
                      <Text variant="labelSmall" style={styles.vitalsMeta}>
                        Last update · {vitals.source ?? 'IoT'} · {new Date(vitals.recordedAtUtc).toLocaleString()}
                      </Text>
                    ) : null}
                    {!allVitalsFetched ? (
                      <Text variant="bodySmall" style={styles.vitalsPending}>
                        {vitals?.recordedAtUtc
                          ? 'Values update as you fetch. Complete all three readings before adding to queue.'
                          : 'Use each button above; values appear here as soon as they are fetched. All three are required before adding to queue.'}
                      </Text>
                    ) : null}
                  </Card.Content>
                </Card>

                <Button
                  mode="contained"
                  onPress={handleAddToQueue}
                  style={styles.actionBtn}
                  loading={loading}
                  buttonColor={AppColors.primary}>
                  Add to queue
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.grid}>
          <Card
            style={[sharedScreen.surfaceCard, styles.gridCard]}
            mode="elevated"
            onPress={() => navigation.navigate('ClinicRegisterPatient' as never)}>
            <Card.Content style={styles.gridContent}>
              <Avatar.Icon size={48} icon="account-plus" style={{backgroundColor: '#ECFDF5'}} color={AppColors.success} />
              <Text variant="titleMedium" style={styles.gridTitle}>
                New patient
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={[sharedScreen.surfaceCard, styles.gridCard]}
            mode="elevated"
            onPress={() => navigation.navigate('QueueDisplay' as never)}>
            <Card.Content style={styles.gridContent}>
              <Avatar.Icon size={48} icon="monitor-dashboard" style={{backgroundColor: AppColors.primaryTint}} color={AppColors.primary} />
              <Text variant="titleMedium" style={styles.gridTitle}>
                Live queue
              </Text>
            </Card.Content>
          </Card>
        </View>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    ...sharedScreen.headerBar,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerEyebrow: {color: AppColors.primary, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4},
  headerTitle: {
    ...sharedScreen.headerTitle,
  },
  headerSubtitle: {
    ...sharedScreen.headerSub,
  },
  scrollContent: {
    ...sharedScreen.scrollPad,
    paddingTop: 12,
  },
  card: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 8,
    color: AppColors.text,
  },
  flowHint: {
    color: AppColors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
  },
  searchBtn: {
    marginLeft: 8,
    marginTop: 6,
  },
  patientResult: {
    marginTop: 10,
  },
  divider: {
    marginVertical: 10,
  },
  input: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  vitalsTitle: {
    marginTop: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },
  vitalsBtn: {
    marginTop: 6,
  },
  vitalsButtonsWrap: {
    marginTop: 8,
  },
  fetchedReadingsTitle: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '700',
    color: AppColors.text,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  vitalRowLast: {
    marginBottom: 4,
  },
  vitalLabel: {
    flex: 1,
    color: AppColors.text,
    fontWeight: '600',
  },
  vitalValueChip: {
    maxWidth: '55%',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  vitalsCard: {
    marginTop: 8,
    backgroundColor: AppColors.primaryTint,
    borderColor: AppColors.border,
  },
  vitalsMeta: {
    color: AppColors.textMuted,
    marginTop: 4,
  },
  vitalsPending: {
    color: AppColors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  symptomPickTitle: {
    marginTop: 10,
    fontWeight: '700',
    color: AppColors.text,
  },
  symptomChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  symptomChip: {
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  symptomChipOn: {
    backgroundColor: AppColors.primaryTint,
    borderColor: AppColors.primary,
  },
  symptomChipTextOn: {
    fontWeight: '700',
  },
  actionBtn: {
    marginTop: 16,
    borderRadius: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
  },
  gridContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  gridTitle: {
    marginTop: 12,
    fontWeight: '800',
    color: AppColors.text,
  },
});

export default ClinicHomeScreen;
