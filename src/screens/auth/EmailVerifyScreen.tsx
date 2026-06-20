import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {TextInput, Button, Text, Card} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AuthService} from '../../services/AuthService';
import {useAuth} from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import AppBrandMark from '../../components/AppBrandMark';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const EmailVerifyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {applyAuthResponse} = useAuth();
  const params = route.params ?? {};
  const cnic = params.cnic as string | undefined;
  const emailMasked = params.emailMasked as string | undefined;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleVerify = async () => {
    if (!cnic) {
      return;
    }
    if (!code.trim() || code.trim().length < 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const auth = await AuthService.verifyPatientEmail(cnic, code.trim());
      await applyAuthResponse(auth);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!cnic) {
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const r = await AuthService.resendPatientOtp(cnic);
      if (!r.success) {
        setError(r.message || 'Could not resend code');
      } else {
        setInfo(r.message || 'A new code was sent.');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Could not resend code');
    } finally {
      setLoading(false);
    }
  };

  if (!cnic) {
    return (
      <ScreenBackground>
        <View style={styles.missing}>
          <AppBrandMark subtitle="Verification" />
          <Text variant="bodyLarge" style={styles.missingText}>
            Missing verification context. Please register again.
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('Register' as never)} buttonColor={AppColors.primary}>
            Back to Register
          </Button>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={sharedScreen.flex}>
        <ScrollView contentContainerStyle={sharedScreen.scrollCenter} keyboardShouldPersistTaps="handled">
          <AppBrandMark subtitle="Email verification" />
          <Card style={[sharedScreen.heroCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>
                Check your inbox
              </Text>
              <Text variant="bodyMedium" style={styles.sub}>
                We sent a code to {emailMasked ?? 'your email'}. Enter it below to activate your account.
              </Text>

              <TextInput
                label="6-digit code"
                value={code}
                onChangeText={setCode}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={8}
                style={styles.input}
                outlineColor={AppColors.border}
                activeOutlineColor={AppColors.primary}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {info ? <Text style={styles.info}>{info}</Text> : null}

              <Button
                mode="contained"
                onPress={handleVerify}
                loading={loading}
                disabled={loading}
                style={styles.btn}
                contentStyle={styles.btnContent}
                buttonColor={AppColors.primary}>
                Verify & continue
              </Button>
              <Button mode="text" onPress={handleResend} disabled={loading} textColor={AppColors.primary}>
                Resend code
              </Button>
              <Button mode="text" onPress={() => navigation.navigate('Login' as never)} textColor={AppColors.textSecondary}>
                Back to sign in
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  card: {marginTop: 8},
  title: {fontWeight: '800', marginBottom: 10, textAlign: 'center', color: AppColors.text},
  sub: {textAlign: 'center', color: AppColors.textSecondary, marginBottom: 20, lineHeight: 22},
  input: {marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.95)'},
  error: {color: AppColors.error, textAlign: 'center', marginBottom: 8},
  info: {color: AppColors.primary, textAlign: 'center', marginBottom: 8},
  btn: {marginTop: 8, borderRadius: 12},
  btnContent: {paddingVertical: 6},
  missing: {flex: 1, justifyContent: 'center', padding: 24},
  missingText: {textAlign: 'center', marginBottom: 20, color: AppColors.text},
});

export default EmailVerifyScreen;
