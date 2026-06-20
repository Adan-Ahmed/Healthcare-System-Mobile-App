import React, {useCallback, useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl, Alert} from 'react-native';
import {Card, Text, ActivityIndicator, Button, Chip} from 'react-native-paper';
import {QueueEntry} from '../../services/QueueService';
import {DoctorService} from '../../services/DoctorService';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';
import {useAuth} from '../../context/AuthContext';

function sortQueue(a: QueueEntry, b: QueueEntry): number {
  const pr = b.priorityScore - a.priorityScore;
  if (pr !== 0) {
    return pr;
  }
  return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
}

const DoctorQueueScreen: React.FC = () => {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const {user} = useAuth();

  const loadQueue = useCallback(async () => {
    try {
      const queue = await DoctorService.getMyQueue(user?.id);
      setQueueEntries([...queue].sort(sortQueue));
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadQueue();
      const interval = setInterval(loadQueue, 10000);
      return () => clearInterval(interval);
    }, [loadQueue]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  const handleStartConsultation = async (entry: QueueEntry) => {
    try {
      await DoctorService.startConsultation(entry.id);
      (navigation as any).navigate('Consultation', {
        queueEntry: {...entry, status: 'InProgress'},
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to start consultation');
    }
  };

  const handleResumeConsultation = (entry: QueueEntry) => {
    (navigation as any).navigate('Consultation', {queueEntry: entry});
  };

  const handleViewHistory = (entry: QueueEntry) => {
    (navigation as any).navigate('DoctorPatientHistory', {queueEntry: entry});
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

  const inConsultation = queueEntries.filter(e => e.status === 'InProgress').sort(sortQueue);
  const waiting = queueEntries.filter(e => e.status === 'Waiting').sort(sortQueue);

  const renderEntryCard = (entry: QueueEntry, rankLabel: string | number) => (
    <Card key={entry.id} style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
      <Card.Content>
        <View style={styles.rankRow}>
          <Text variant="headlineMedium" style={[styles.rank, rankLabel === 'NOW' && styles.rankNow]}>
            {typeof rankLabel === 'number' ? `#${rankLabel}` : rankLabel}
          </Text>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.patientName}>
              {entry.patientName}
            </Text>
            <Chip style={styles.priorityChip} textStyle={{color: '#fff', fontWeight: '700'}}>
              Priority {entry.priorityScore}
            </Chip>
          </View>
        </View>
        <Text variant="bodySmall" style={styles.cnic}>
          CNIC: {entry.patientCNIC}
        </Text>
        {entry.clinicName || entry.clinicId ? (
          <Text variant="bodySmall" style={styles.clinic}>
            Clinic: {entry.clinicName ?? `#${entry.clinicId}`}
          </Text>
        ) : null}
        <Chip
          style={[
            styles.statusChip,
            entry.status === 'InProgress' ? styles.statusInProgress : styles.statusWaiting,
          ]}
          textStyle={{
            fontWeight: '700',
            color: entry.status === 'InProgress' ? AppColors.success : AppColors.primary,
          }}>
          {entry.status === 'InProgress' ? 'In consultation' : 'Waiting'}
        </Chip>
        {entry.symptoms ? (
          <Text variant="bodySmall" style={styles.symptoms}>
            Symptoms: {entry.symptoms}
          </Text>
        ) : null}
        {entry.criticalFactors ? (
          <Text variant="bodySmall" style={styles.critical}>
            {entry.criticalFactors}
          </Text>
        ) : null}
        <Text variant="bodySmall" style={styles.time}>
          Arrived: {new Date(entry.arrivalTime).toLocaleString()}
        </Text>

        <View style={styles.btnRow}>
          <Button
            mode="outlined"
            compact
            onPress={() => handleViewHistory(entry)}
            textColor={AppColors.primary}
            style={styles.halfBtn}>
            History
          </Button>
          {entry.status === 'Waiting' ? (
            <Button
              mode="contained"
              compact
              onPress={() => handleStartConsultation(entry)}
              buttonColor={AppColors.primary}
              style={styles.halfBtn}>
              Start
            </Button>
          ) : (
            <Button
              mode="contained"
              compact
              onPress={() => handleResumeConsultation(entry)}
              buttonColor={AppColors.success}
              style={styles.halfBtn}>
              Resume
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScreenBackground>
      <ScrollView
        style={sharedScreen.flex}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text variant="labelLarge" style={styles.heroLabel}>
            Triage queue
          </Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Active patients ({queueEntries.length})
          </Text>
          <Text variant="bodySmall" style={styles.heroSub}>
            Tap Start before seeing the patient · Complete consultation removes them from this list
          </Text>
        </View>
        <View style={styles.content}>
          {queueEntries.length === 0 ? (
            <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
              <Card.Content>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No patients in your queue
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <>
              {inConsultation.length > 0 ? (
                <Text variant="titleSmall" style={styles.sectionLabel}>
                  In consultation
                </Text>
              ) : null}
              {inConsultation.map(entry => renderEntryCard(entry, 'NOW'))}
              {waiting.length > 0 ? (
                <Text variant="titleSmall" style={styles.sectionLabel}>
                  Waiting
                </Text>
              ) : null}
              {waiting.map((entry, index) => renderEntryCard(entry, index + 1))}
            </>
          )}

          <Button mode="outlined" onPress={onRefresh} style={styles.refreshButton} textColor={AppColors.primary}>
            Refresh
          </Button>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  hero: {paddingHorizontal: 22, paddingTop: 52, paddingBottom: 8},
  heroLabel: {color: AppColors.primary, fontWeight: '600', letterSpacing: 1},
  heroTitle: {fontWeight: '800', color: AppColors.text, marginTop: 4},
  heroSub: {color: AppColors.textMuted, marginTop: 6},
  sectionLabel: {fontWeight: '800', color: AppColors.textSecondary, marginBottom: 8, marginTop: 4},
  content: {padding: 18, paddingBottom: 32},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  card: {marginBottom: 14},
  rankRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8},
  rank: {fontWeight: '800', color: AppColors.primary, width: 52, marginRight: 4},
  rankNow: {fontSize: 14, color: AppColors.success},
  cardHeader: {flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  patientName: {fontWeight: '700', color: AppColors.text, flex: 1, marginRight: 8},
  priorityChip: {backgroundColor: AppColors.primary},
  cnic: {marginTop: 4, color: AppColors.textSecondary},
  statusChip: {alignSelf: 'flex-start', marginTop: 8},
  statusWaiting: {backgroundColor: AppColors.primaryTint},
  statusInProgress: {backgroundColor: '#ECFDF5'},
  symptoms: {marginTop: 8, color: AppColors.textSecondary},
  clinic: {marginTop: 4, color: AppColors.textSecondary},
  critical: {marginTop: 4, color: AppColors.error, fontWeight: '700'},
  time: {marginTop: 6, color: AppColors.textMuted},
  btnRow: {flexDirection: 'row', gap: 8, marginTop: 14},
  halfBtn: {flex: 1, borderRadius: 10},
  emptyText: {textAlign: 'center', color: AppColors.textMuted},
  refreshButton: {marginTop: 16, borderColor: AppColors.primary},
});

export default DoctorQueueScreen;
