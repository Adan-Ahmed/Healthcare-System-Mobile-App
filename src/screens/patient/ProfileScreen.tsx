import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {Card, Text, Button, ActivityIndicator} from 'react-native-paper';
import {PatientService, Patient} from '../../services/PatientService';
import {useAuth} from '../../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const ProfileScreen: React.FC = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const {user, logout} = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await PatientService.getProfile();
      setPatient(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Login' as never);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView style={sharedScreen.flex} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text variant="labelLarge" style={styles.heroLabel}>
            Account
          </Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Profile
          </Text>
        </View>
        <View style={styles.content}>
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Your information
              </Text>

              <View style={styles.infoRow}>
                <Text variant="bodyLarge" style={styles.label}>
                  Name
                </Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {patient?.name}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyLarge" style={styles.label}>
                  CNIC
                </Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {patient?.cnic}
                </Text>
              </View>

              {patient?.email && (
                <View style={styles.infoRow}>
                  <Text variant="bodyLarge" style={styles.label}>
                    Email
                  </Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {patient.email}
                  </Text>
                </View>
              )}

              {patient?.phoneNumber && (
                <View style={styles.infoRow}>
                  <Text variant="bodyLarge" style={styles.label}>
                    Phone
                  </Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {patient.phoneNumber}
                  </Text>
                </View>
              )}

              {patient?.dateOfBirth && (
                <View style={styles.infoRow}>
                  <Text variant="bodyLarge" style={styles.label}>
                    Date of Birth
                  </Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {patient?.gender && (
                <View style={styles.infoRow}>
                  <Text variant="bodyLarge" style={styles.label}>
                    Gender
                  </Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {patient.gender}
                  </Text>
                </View>
              )}

              {patient?.address && (
                <View style={styles.infoRow}>
                  <Text variant="bodyLarge" style={styles.label}>
                    Address
                  </Text>
                  <Text variant="bodyLarge" style={[styles.value, styles.multiline]}>
                    {patient.address}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.logoutContent}
            buttonColor={AppColors.primary}>
            Logout
          </Button>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  scroll: {paddingBottom: 32},
  hero: {paddingHorizontal: 22, paddingTop: 52, paddingBottom: 8},
  heroLabel: {color: AppColors.primary, fontWeight: '600', letterSpacing: 1},
  heroTitle: {fontWeight: '800', color: AppColors.text, marginTop: 4},
  content: {paddingHorizontal: 18},
  card: {marginBottom: 20},
  cardTitle: {marginBottom: 18, fontWeight: '800', color: AppColors.text},
  infoRow: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  label: {color: AppColors.textMuted, fontWeight: '600', marginBottom: 4},
  value: {color: AppColors.text, fontWeight: '500'},
  multiline: {flexShrink: 1},
  logoutButton: {marginTop: 8, borderRadius: 12},
  logoutContent: {paddingVertical: 6},
});

export default ProfileScreen;
