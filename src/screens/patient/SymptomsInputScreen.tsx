import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {TextInput, Button, Text, Card, Chip} from 'react-native-paper';
import {QueueService} from '../../services/QueueService';
import {PatientService} from '../../services/PatientService';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const SymptomsInputScreen: React.FC = () => {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [sensorData, setSensorData] = useState({
    temperature: '',
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    oxygenSaturation: '',
  });
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const {user} = useAuth();

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleJoinQueue = async () => {
    if (symptoms.length === 0) {
      Alert.alert('Error', 'Please add at least one symptom');
      return;
    }

    setLoading(true);

    try {
      const sensorDataPayload = Object.values(sensorData).some(v => v)
        ? {
            temperature: sensorData.temperature ? parseFloat(sensorData.temperature) : undefined,
            heartRate: sensorData.heartRate ? parseInt(sensorData.heartRate) : undefined,
            bloodPressureSystolic: sensorData.bloodPressureSystolic
              ? parseInt(sensorData.bloodPressureSystolic)
              : undefined,
            bloodPressureDiastolic: sensorData.bloodPressureDiastolic
              ? parseInt(sensorData.bloodPressureDiastolic)
              : undefined,
            oxygenSaturation: sensorData.oxygenSaturation
              ? parseFloat(sensorData.oxygenSaturation)
              : undefined,
          }
        : undefined;

      await QueueService.joinQueue({
        symptoms,
        sensorData: sensorDataPayload,
      });

      Alert.alert('Success', 'You have been added to the queue', [
        {text: 'OK', onPress: () => navigation.navigate('QueueStatus' as never)},
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
    <ScrollView style={sharedScreen.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Enter your symptoms
          </Text>

          <View style={styles.symptomInput}>
            <TextInput
              label="Symptom"
              value={currentSymptom}
              onChangeText={setCurrentSymptom}
              mode="outlined"
              style={styles.input}
              onSubmitEditing={addSymptom}
            />
            <Button mode="contained" onPress={addSymptom} style={styles.addButton} buttonColor={AppColors.primary}>
              Add
            </Button>
          </View>

          <View style={styles.chipsContainer}>
            {symptoms.map((symptom, index) => (
              <Chip
                key={index}
                onClose={() => removeSymptom(index)}
                style={styles.chip}>
                {symptom}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Sensor data (optional)
          </Text>

          <TextInput
            label="Temperature (°F)"
            value={sensorData.temperature}
            onChangeText={text => setSensorData({...sensorData, temperature: text})}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <TextInput
            label="Heart Rate (BPM)"
            value={sensorData.heartRate}
            onChangeText={text => setSensorData({...sensorData, heartRate: text})}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              label="BP Systolic"
              value={sensorData.bloodPressureSystolic}
              onChangeText={text =>
                setSensorData({...sensorData, bloodPressureSystolic: text})
              }
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              label="BP Diastolic"
              value={sensorData.bloodPressureDiastolic}
              onChangeText={text =>
                setSensorData({...sensorData, bloodPressureDiastolic: text})
              }
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.halfInput]}
            />
          </View>

          <TextInput
            label="Oxygen Saturation (%)"
            value={sensorData.oxygenSaturation}
            onChangeText={text => setSensorData({...sensorData, oxygenSaturation: text})}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleJoinQueue}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
        buttonColor={AppColors.primary}>
        Join queue
      </Button>
    </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    ...sharedScreen.scrollPad,
    paddingTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: '800',
    color: AppColors.text,
  },
  symptomInput: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  addButton: {
    justifyContent: 'center',
    borderRadius: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  },
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 8,
    borderRadius: 12,
  },
});

export default SymptomsInputScreen;
