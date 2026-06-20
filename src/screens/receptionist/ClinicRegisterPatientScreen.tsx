import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {TextInput, Button, Text, Card, IconButton} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import {PatientService} from '../../services/PatientService';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const ClinicRegisterPatientScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    cnic: '',
    name: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: new Date(),
    address: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.cnic || !formData.name || !formData.password) {
      setError('CNIC, name, and password are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await PatientService.createPatientByClinic({
        cnic: formData.cnic,
        name: formData.name,
        email: formData.email || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
        password: formData.password,
      });
      Alert.alert('Patient added', `${formData.name} can sign in with CNIC and the password you set.`, [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not create patient');
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
            New patient (clinic)
          </Text>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="bodyMedium" style={styles.hint}>
                Register walk-in patients here. They do not need email verification and can use the mobile app with the password you assign.
              </Text>
              <TextInput
                label="CNIC *"
                value={formData.cnic}
                onChangeText={t => setFormData({...formData, cnic: t})}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />
              <TextInput
                label="Full name *"
                value={formData.name}
                onChangeText={t => setFormData({...formData, name: t})}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Email (optional)"
                value={formData.email}
                onChangeText={t => setFormData({...formData, email: t})}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                label="Phone"
                value={formData.phoneNumber}
                onChangeText={t => setFormData({...formData, phoneNumber: t})}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.input}
                textColor={AppColors.primary}>
                Date of birth: {formData.dateOfBirth.toLocaleDateString()}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (d) {
                      setFormData({...formData, dateOfBirth: d});
                    }
                  }}
                />
              )}
              <TextInput
                label="Address"
                value={formData.address}
                onChangeText={t => setFormData({...formData, address: t})}
                mode="outlined"
                multiline
                style={styles.input}
              />
              <TextInput
                label="Gender"
                value={formData.gender}
                onChangeText={t => setFormData({...formData, gender: t})}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="App password *"
                value={formData.password}
                onChangeText={t => setFormData({...formData, password: t})}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                label="Confirm password *"
                value={formData.confirmPassword}
                onChangeText={t => setFormData({...formData, confirmPassword: t})}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                buttonColor={AppColors.primary}
                style={styles.saveBtn}>
                Save patient
              </Button>
            </Card.Content>
          </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  wrap: {flex: 1},
  flex: {flex: 1},
  header: {
    ...sharedScreen.headerBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {...sharedScreen.headerTitle, marginLeft: 4},
  scroll: {...sharedScreen.scrollPad},
  card: {},
  hint: {color: AppColors.textSecondary, marginBottom: 16, lineHeight: 22},
  input: {marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.98)'},
  saveBtn: {marginTop: 8, borderRadius: 12},
  error: {color: AppColors.error, marginBottom: 8},
});

export default ClinicRegisterPatientScreen;
