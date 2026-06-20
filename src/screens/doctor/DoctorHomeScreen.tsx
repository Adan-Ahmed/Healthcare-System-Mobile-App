import React, {useCallback, useMemo, useState} from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {Card, Text, Button, Avatar, IconButton} from 'react-native-paper';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';
import {DoctorService} from '../../services/DoctorService';
import {QueueEntry} from '../../services/QueueService';

const DoctorHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user, logout} = useAuth();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<QueueEntry[]>([]);

  const loadQueue = useCallback(async () => {
    try {
      const queue = await DoctorService.getMyQueue(user?.id);
      setQueueEntries(queue ?? []);
    } catch (e) {
      // Silent fail: dashboard still usable even if queue fetch fails.
      setQueueEntries([]);
    }
  }, [user?.id]);

  const loadRecentCompleted = useCallback(async () => {
    try {
      const rows = await DoctorService.getRecentCompletedConsultations(5);
      setRecentCompleted(rows ?? []);
    } catch {
      setRecentCompleted([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQueue();
      loadRecentCompleted();
    }, [loadQueue, loadRecentCompleted]),
  );

  const waitingCount = useMemo(
    () => queueEntries.filter(e => e.status === 'Waiting').length,
    [queueEntries],
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to exit?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: logout, style: 'destructive'},
    ]);
  };

  return (
    <ScreenBackground>
      <View style={sharedScreen.flex}>
        <View style={styles.header}>
          <View>
            <Text variant="labelLarge" style={styles.headerEyebrow}>
              Doctor workspace
            </Text>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Dashboard
            </Text>
            <Text variant="bodyLarge" style={styles.headerSubtitle}>
              Welcome, Dr. {user?.name}
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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <Card
              style={[styles.statCard, {backgroundColor: AppColors.primaryTint}]}
              mode="elevated"
              onPress={() => navigation.navigate('DoctorQueue' as never)}>
              <Card.Content>
                <IconButton icon="account-group" iconColor={AppColors.primary} size={28} />
                <Text variant="titleSmall" style={styles.statLabel}>
                  Queue
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {waitingCount} waiting
                </Text>
              </Card.Content>
            </Card>

            <Card
              style={[styles.statCard, {backgroundColor: '#ECFDF5'}]}
              mode="elevated"
              onPress={() => (navigation as any).navigate('DoctorConsultationHistory')}>
              <Card.Content>
                <IconButton icon="history" iconColor={AppColors.success} size={28} />
                <Text variant="titleSmall" style={[styles.statLabel, {color: AppColors.success}]}>
                  History
                </Text>
                <Text variant="headlineSmall" style={[styles.statValue, {color: AppColors.success}]}>
                  Today
                </Text>
              </Card.Content>
            </Card>
          </View>

          <Card style={styles.mainActionCard} mode="elevated" onPress={() => navigation.navigate('DoctorQueue' as never)}>
            <Card.Content style={styles.mainActionContent}>
              <Avatar.Icon size={56} icon="clipboard-pulse" style={{backgroundColor: AppColors.primary}} />
              <View style={styles.mainActionText}>
                <Text variant="titleLarge" style={styles.mainTitle}>
                  Manage patients
                </Text>
                <Text variant="bodyMedium" style={styles.mainSub}>
                  Triage queue & consultations
                </Text>
              </View>
              <IconButton icon="chevron-right" iconColor={AppColors.textMuted} />
            </Card.Content>
          </Card>

          <View style={styles.recentTitleRow}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent consultations
            </Text>
            <Button
              mode="text"
              textColor={AppColors.primary}
              onPress={() => (navigation as any).navigate('DoctorConsultationHistory')}>
              See all
            </Button>
          </View>

          {recentCompleted.length === 0 ? (
            <Card style={styles.infoCard} mode="outlined">
              <Card.Content>
                <Text variant="bodyLarge" style={styles.emptyHint}>
                  No recent activity to show.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            recentCompleted.slice(0, 5).map(entry => (
              <Card
                key={entry.id}
                style={styles.recentCard}
                mode="elevated"
                onPress={() => (navigation as any).navigate('Consultation', {queueEntry: entry})}>
                <Card.Content style={styles.recentCardContent}>
                  <View style={styles.recentLeft}>
                    <Text variant="titleMedium" style={styles.recentName}>
                      {entry.patientName}
                    </Text>
                    <Text variant="bodySmall" style={styles.recentMeta}>
                      CNIC: {entry.patientCNIC}
                    </Text>
                    <Text variant="bodySmall" style={styles.recentMeta}>
                      Completed:{' '}
                      {entry.consultationEndTime ? new Date(entry.consultationEndTime).toLocaleString() : '—'}
                    </Text>
                  </View>
                  <IconButton icon="chevron-right" iconColor={AppColors.textMuted} />
                </Card.Content>
              </Card>
            ))
          )}
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
  headerEyebrow: {color: AppColors.primary, fontWeight: '600', letterSpacing: 0.5},
  headerTitle: {fontWeight: '800', color: AppColors.text},
  headerSubtitle: {color: AppColors.textSecondary, marginTop: 4},
  scrollContent: {padding: 20, paddingBottom: 36},
  statsRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18},
  statCard: {
    flex: 0.48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      ios: {shadowColor: AppColors.primary, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.08, shadowRadius: 12},
      android: {elevation: 3},
    }),
  },
  statLabel: {color: AppColors.primary, fontWeight: '600', marginTop: 4},
  statValue: {fontWeight: '800', color: AppColors.primary},
  mainActionCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.06, shadowRadius: 16},
      android: {elevation: 4},
    }),
  },
  mainActionContent: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  mainActionText: {flex: 1, marginLeft: 12},
  mainTitle: {fontWeight: '800', color: AppColors.text},
  mainSub: {color: AppColors.textSecondary, marginTop: 4},
  recentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {fontWeight: '700', color: AppColors.text},
  infoCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderStyle: 'dashed',
    borderColor: AppColors.border,
  },
  emptyHint: {textAlign: 'center', color: AppColors.textMuted},
  recentCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 12,
  },
  recentCardContent: {flexDirection: 'row', alignItems: 'center'},
  recentLeft: {flex: 1},
  recentName: {fontWeight: '800', color: AppColors.text},
  recentMeta: {color: AppColors.textSecondary, marginTop: 2},
});

export default DoctorHomeScreen;
