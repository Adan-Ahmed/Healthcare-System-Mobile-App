import React from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {Card, Text, IconButton, Avatar} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const PatientHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user, logout} = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Sign out of your account?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: logout, style: 'destructive'},
    ]);
  };

  const menuItems = [
    {title: 'Medical reports', subtitle: 'View & export', icon: 'file-document-outline', route: 'Reports'},
    {title: 'Prescriptions', subtitle: 'From your doctor', icon: 'pill', route: 'Prescriptions'},
    {title: 'Medication reminders', subtitle: 'Doses & alerts', icon: 'bell-outline', route: 'Reminders'},
    {title: 'Profile', subtitle: 'Your details', icon: 'account-outline', route: 'Profile'},
  ];

  return (
    <ScreenBackground>
      <View style={sharedScreen.flex}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="labelLarge" style={styles.greeting}>
              Hello
            </Text>
            <Text variant="headlineMedium" style={styles.userName} numberOfLines={1}>
              {user?.name}
            </Text>
          </View>
          <IconButton
            icon="logout"
            mode="contained-tonal"
            containerColor={AppColors.primaryTint}
            iconColor={AppColors.primary}
            onPress={handleLogout}
          />
        </View>

        <ScrollView contentContainerStyle={[sharedScreen.scrollPad, styles.scroll]} showsVerticalScrollIndicator={false}>
          <Text variant="titleMedium" style={styles.sectionLabel}>
            Your care
          </Text>
          <View style={styles.grid}>
            {menuItems.map((item, index) => (
              <Card
                key={index}
                style={styles.gridCard}
                mode="elevated"
                onPress={() => navigation.navigate(item.route as never)}>
                <Card.Content style={styles.cardContent}>
                  <Avatar.Icon size={52} icon={item.icon} style={styles.avatar} color={AppColors.primary} />
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    {item.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.cardSubtitle}>
                    {item.subtitle}
                  </Text>
                </Card.Content>
              </Card>
            ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {flex: 1, marginRight: 8},
  greeting: {color: AppColors.textSecondary, letterSpacing: 0.5},
  userName: {fontWeight: '800', color: AppColors.text, marginTop: 2},
  scroll: {paddingTop: 8},
  sectionLabel: {color: AppColors.textSecondary, marginBottom: 12, fontWeight: '600'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  gridCard: {
    width: '48%',
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {elevation: 4},
    }),
  },
  cardContent: {alignItems: 'center', paddingVertical: 20},
  avatar: {backgroundColor: AppColors.primaryTint},
  cardTitle: {marginTop: 12, fontWeight: '700', textAlign: 'center', color: AppColors.text},
  cardSubtitle: {color: AppColors.textMuted, textAlign: 'center', marginTop: 4},
});

export default PatientHomeScreen;
