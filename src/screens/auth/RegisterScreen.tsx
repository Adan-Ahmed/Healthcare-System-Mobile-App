import React, {useState} from 'react';
import {StyleSheet, ScrollView, KeyboardAvoidingView, Platform} from 'react-native';
import {TextInput, Button, Text, Card} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useAuth} from '../../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import AppBrandMark from '../../components/AppBrandMark';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const RegisterScreen: React.FC = () => {
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

  const {registerPatient} = useAuth();
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!formData.cnic || !formData.name || !formData.password) {
      setError('Please fill in required fields');
      return;
    }
    if (!formData.email?.trim()) {
      setError('Email is required — we will send a verification code there');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const pending = await registerPatient({
        cnic: formData.cnic,
        name: formData.name,
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber || undefined,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
        password: formData.password,
      });
      (navigation as any).navigate('EmailVerify', {
        cnic: pending.cnic,
        emailMasked: pending.emailMasked,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = {outlineColor: AppColors.border, activeOutlineColor: AppColors.primary};

  return (
    <ScreenBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={sharedScreen.flex}>
        <ScrollView contentContainerStyle={sharedScreen.scrollPad} keyboardShouldPersistTaps="handled">
          <AppBrandMark subtitle="Create your patient account" />
          <Card style={[sharedScreen.heroCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.lead}>
                Your details
              </Text>
              <TextInput
                label="CNIC *"
                value={formData.cnic}
                onChangeText={text => setFormData({...formData, cnic: text})}
                mode="outlined"
                style={styles.input}
                {...inp}
                keyboardType="numeric"
              />
              <TextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={text => setFormData({...formData, name: text})}
                mode="outlined"
                style={styles.input}
                {...inp}
              />
              <TextInput
                label="Email * (verification code sent here)"
                value={formData.email}
                onChangeText={text => setFormData({...formData, email: text})}
                mode="outlined"
                style={styles.input}
                {...inp}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={text => setFormData({...formData, phoneNumber: text})}
                mode="outlined"
                style={styles.input}
                {...inp}
                keyboardType="phone-pad"
              />
              <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.input} textColor={AppColors.primary}>
                Date of Birth: {formData.dateOfBirth.toLocaleDateString()}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({...formData, dateOfBirth: selectedDate});
                    }
                  }}
                />
              )}
              <TextInput
                label="Address"
                value={formData.address}
                onChangeText={text => setFormData({...formData, address: text})}
                mode="outlined"
                style={styles.input}
                {...inp}
                multiline
              />
              <TextInput
                label="Gender"
                value={formData.gender}
                onChangeText={text => setFormData({...formData, gender: text})}
                mode="outlined"
                style={styles.input}
                {...inp}
              />
              <TextInput
                label="Password *"
                value={formData.password}
                onChangeText={text => setFormData({...formData, password: text})}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                {...inp}
              />
              <TextInput
                label="Confirm Password *"
                value={formData.confirmPassword}
                onChangeText={text => setFormData({...formData, confirmPassword: text})}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                {...inp}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={AppColors.primary}>
                Register
              </Button>
              <Button mode="text" onPress={() => navigation.goBack()} textColor={AppColors.primary} style={styles.backButton}>
                Back to Login
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  card: {marginTop: 4},
  lead: {textAlign: 'center', marginBottom: 18, color: AppColors.textSecondary, fontWeight: '600'},
  input: {marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.95)'},
  button: {marginTop: 10, borderRadius: 12},
  buttonContent: {paddingVertical: 6},
  backButton: {marginTop: 8},
  error: {color: AppColors.error, textAlign: 'center', marginBottom: 8},
});

export default RegisterScreen;
