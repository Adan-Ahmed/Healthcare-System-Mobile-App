import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {Card, Text, Button, TextInput, Chip, IconButton} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useRoute, useNavigation} from '@react-navigation/native';
import {PrescriptionService, CreatePrescriptionItem} from '../../services/PrescriptionService';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const DEFAULT_REMINDER_TIME = '09:00';

function formatTimeHHmm(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function parseTimeHHmm(time: string): Date {
  const d = new Date();
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    const [h, m] = DEFAULT_REMINDER_TIME.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }
  const hours = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const minutes = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function isValidReminderTime(time: string): boolean {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return false;
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function toApiReminderTime(time: string): string {
  const trimmed = time.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

interface PrescriptionItemForm {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminderTime: string;
}

const COMMON_MEDICINES = [
  { name: 'Paracetamol', dosage: '500mg', freq: '3 times a day', dur: '5' },
  { name: 'Amoxicillin', dosage: '250mg', freq: 'Every 8 hours', dur: '7' },
  { name: 'Ibuprofen', dosage: '400mg', freq: 'After meals', dur: '3' },
  { name: 'Cetirizine', dosage: '10mg', freq: 'Once daily (Night)', dur: '5' },
  { name: 'Omeprazole', dosage: '20mg', freq: 'Before breakfast', dur: '14' },
];

const CreatePrescriptionScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {patientId} = route.params as {patientId: number};

  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState<PrescriptionItemForm[]>([
    {
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      reminderTime: DEFAULT_REMINDER_TIME,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [timePickerIndex, setTimePickerIndex] = useState<number | null>(null);

  const addMedicine = () => {
    setItems([
      ...items,
      {
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        reminderTime: DEFAULT_REMINDER_TIME,
      },
    ]);
  };

  const selectSuggested = (index: number, med: typeof COMMON_MEDICINES[0]) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      medicineName: med.name,
      dosage: med.dosage,
      frequency: med.freq,
      duration: med.dur
    };
    setItems(updated);
  };

  const removeMedicine = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof PrescriptionItemForm, value: string) => {
    const updated = [...items];
    updated[index] = {...updated[index], [field]: value};
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (items.some(item => !item.medicineName || !item.dosage || !item.frequency || !item.duration)) {
      Alert.alert('Error', 'Please fill in all required medicine fields');
      return;
    }

    const invalidTime = items.find(item => !isValidReminderTime(item.reminderTime));
    if (invalidTime) {
      Alert.alert('Error', 'Please set a valid daily reminder time (HH:mm) for each medicine');
      return;
    }

    setLoading(true);
    try {
      const prescriptionItems: CreatePrescriptionItem[] = items.map(item => ({
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: parseInt(item.duration),
        instructions: item.instructions || undefined,
        reminderTime: toApiReminderTime(item.reminderTime),
      }));

      await PrescriptionService.createPrescription({
        patientId,
        diagnosis: diagnosis || undefined,
        instructions: instructions || undefined,
        items: prescriptionItems,
      });

      Alert.alert('Success', 'Prescription created and saved', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={AppColors.text} onPress={() => navigation.goBack()} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            New prescription
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Diagnosis / Findings"
              value={diagnosis}
              onChangeText={setDiagnosis}
              mode="outlined"
              multiline
              style={styles.input}
              placeholder="e.g. Common Flu, Hypertension"
            />
            <TextInput
              label="General Instructions"
              value={instructions}
              onChangeText={setInstructions}
              mode="outlined"
              multiline
              style={styles.input}
              placeholder="e.g. Bed rest for 2 days"
            />
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionLabel}>Medications</Text>

        {items.map((item, index) => (
          <Card key={index} style={styles.medCard}>
            <Card.Content>
              <View style={styles.medHeader}>
                <Text variant="titleMedium" style={{color: AppColors.primary, fontWeight: '700'}}>
                  Medicine {index + 1}
                </Text>
                {items.length > 1 && (
                  <IconButton icon="close-circle-outline" iconColor="#F44336" onPress={() => removeMedicine(index)} />
                )}
              </View>

              <Text variant="bodySmall" style={styles.suggestLabel}>Suggestions:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
                {COMMON_MEDICINES.map((med, mIdx) => (
                  <Chip key={mIdx} style={styles.chip} onPress={() => selectSuggested(index, med)}>{med.name}</Chip>
                ))}
              </ScrollView>

              <TextInput
                label="Medicine Name *"
                value={item.medicineName}
                onChangeText={text => updateMedicine(index, 'medicineName', text)}
                mode="outlined"
                style={styles.input}
              />

              <View style={styles.row}>
                <TextInput
                  label="Dosage"
                  value={item.dosage}
                  onChangeText={text => updateMedicine(index, 'dosage', text)}
                  mode="outlined"
                  style={[styles.input, {flex: 1, marginRight: 8}]}
                />
                <TextInput
                  label="Duration (Days)"
                  value={item.duration}
                  onChangeText={text => updateMedicine(index, 'duration', text)}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, {flex: 1}]}
                />
              </View>

              <TextInput
                label="Frequency"
                value={item.frequency}
                onChangeText={text => updateMedicine(index, 'frequency', text)}
                mode="outlined"
                style={styles.input}
              />

              <Text variant="bodySmall" style={styles.reminderLabel}>
                Patient daily reminder
              </Text>
              <Button
                mode="outlined"
                icon="bell-outline"
                onPress={() => setTimePickerIndex(index)}
                style={styles.reminderButton}
                textColor={AppColors.primary}>
                Reminder time: {item.reminderTime || DEFAULT_REMINDER_TIME}
              </Button>
              <TextInput
                label="Or enter time (HH:mm)"
                value={item.reminderTime}
                onChangeText={text => updateMedicine(index, 'reminderTime', text)}
                mode="outlined"
                style={styles.input}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
              />
              {timePickerIndex === index && (
                <DateTimePicker
                  value={parseTimeHHmm(item.reminderTime)}
                  mode="time"
                  is24Hour
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setTimePickerIndex(null);
                    }
                    if (event.type === 'dismissed') {
                      setTimePickerIndex(null);
                      return;
                    }
                    if (selectedDate) {
                      updateMedicine(index, 'reminderTime', formatTimeHHmm(selectedDate));
                    }
                    if (Platform.OS === 'ios') {
                      setTimePickerIndex(null);
                    }
                  }}
                />
              )}
            </Card.Content>
          </Card>
        ))}

        <Button mode="outlined" icon="plus" onPress={addMedicine} style={styles.addButton}>
          Add Another Medicine
        </Button>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={{height: 56}}
          buttonColor={AppColors.success}>
          Finish & Save Prescription
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
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    marginVertical: 12,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  medCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  suggestLabel: {
    marginBottom: 8,
    color: '#757575',
  },
  suggestions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    backgroundColor: AppColors.primaryTint,
  },
  reminderLabel: {
    marginBottom: 8,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  reminderButton: {
    marginBottom: 8,
    borderRadius: 12,
    borderColor: AppColors.primary,
  },
  addButton: {
    marginVertical: 16,
    borderRadius: 12,
  },
  submitButton: {
    marginBottom: 40,
    borderRadius: 12,
  },
});

export default CreatePrescriptionScreen;
