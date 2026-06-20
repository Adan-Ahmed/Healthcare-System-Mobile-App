import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {TextInput, Button, Text, Card, SegmentedButtons} from 'react-native-paper';
import {useAuth} from '../../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import AppBrandMark from '../../components/AppBrandMark';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const LoginScreen: React.FC = () => {
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'Patient' | 'Doctor' | 'Receptionist'>('Patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {login} = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!cnic || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(cnic, password, userType);
    } catch (err: any) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      if (code === 'email_not_verified') {
        setError(`${msg} Use Register if you still need to enter your email code.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={sharedScreen.flex}>
        <ScrollView contentContainerStyle={sharedScreen.scrollCenter} keyboardShouldPersistTaps="handled">
          <AppBrandMark subtitle="Sign in to your care portal" />
          <Card style={[sharedScreen.heroCard, styles.card]} mode="elevated">
            <Card.Content style={styles.cardInner}>
              <Text variant="titleMedium" style={styles.cardLead}>
                Welcome back
              </Text>

              <SegmentedButtons
                value={userType}
                onValueChange={value => setUserType(value as 'Patient' | 'Doctor' | 'Receptionist')}
                buttons={[
                  {value: 'Patient', label: 'Patient'},
                  {value: 'Doctor', label: 'Doctor'},
                  {value: 'Receptionist', label: 'Clinic'},
                ]}
                style={styles.segmented}
                density="medium"
              />

              <TextInput
                label={userType === 'Patient' ? 'CNIC' : 'Email'}
                value={cnic}
                onChangeText={setCnic}
                mode="outlined"
                style={styles.input}
                outlineColor={AppColors.border}
                activeOutlineColor={AppColors.primary}
                autoCapitalize="none"
                keyboardType={userType === 'Patient' ? 'numeric' : 'email-address'}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                outlineColor={AppColors.border}
                activeOutlineColor={AppColors.primary}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={AppColors.primary}>
                Sign in
              </Button>

              {userType === 'Patient' && (
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Register' as never)}
                  textColor={AppColors.primary}
                  style={styles.registerButton}>
                  New patient? Create account
                </Button>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  card: {marginTop: 8},
  cardInner: {paddingVertical: 4},
  cardLead: {
    textAlign: 'center',
    marginBottom: 18,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  segmented: {marginBottom: 18},
  input: {marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.9)'},
  button: {marginTop: 10, borderRadius: 12},
  buttonContent: {paddingVertical: 6},
  registerButton: {marginTop: 12},
  error: {
    color: AppColors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default LoginScreen;
