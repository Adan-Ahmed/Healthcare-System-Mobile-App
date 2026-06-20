import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {Card, Text, ActivityIndicator, Button} from 'react-native-paper';
import {QueueService, QueueEntry} from '../../services/QueueService';
import {useAuth} from '../../context/AuthContext';
import ScreenBackground from '../../components/ScreenBackground';
import {AppColors} from '../../theme/colors';
import {sharedScreen} from '../../theme/screenStyles';

const QueueStatusScreen: React.FC = () => {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {user} = useAuth();

  const loadQueue = async () => {
    try {
      const queue = await QueueService.getQueue();
      // Filter for current user's entries
      const userEntries = queue.filter(entry => entry.patientId === user?.id);
      setQueueEntries(userEntries);
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
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
    <ScrollView
      style={sharedScreen.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />
      }>
      <View>
        {queueEntries.length === 0 ? (
          <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No queue entries found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          queueEntries.map(entry => (
            <Card key={entry.id} style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
              <Card.Content>
                <Text variant="titleLarge" style={styles.status}>
                  Status: {entry.status}
                </Text>
                <Text variant="bodyMedium">Priority Score: {entry.priorityScore}</Text>
                <Text variant="bodyMedium">
                  Arrival Time: {new Date(entry.arrivalTime).toLocaleString()}
                </Text>
                {entry.symptoms && (
                  <Text variant="bodySmall" style={styles.symptoms}>
                    Symptoms: {entry.symptoms}
                  </Text>
                )}
                {entry.criticalFactors && (
                  <Text variant="bodySmall" style={styles.critical}>
                    Critical Factors: {entry.criticalFactors}
                  </Text>
                )}
                {entry.consultationStartTime && (
                  <Text variant="bodySmall" style={styles.time}>
                    Consultation Started:{' '}
                    {new Date(entry.consultationStartTime).toLocaleString()}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))
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
  content: {
    ...sharedScreen.scrollPad,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 12,
  },
  status: {
    fontWeight: '800',
    marginBottom: 8,
    color: AppColors.text,
  },
  symptoms: {
    marginTop: 8,
    color: AppColors.textSecondary,
  },
  critical: {
    marginTop: 4,
    color: AppColors.error,
    fontWeight: '700',
  },
  time: {
    marginTop: 4,
    color: AppColors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: AppColors.textMuted,
  },
  refreshButton: {
    marginTop: 16,
    borderRadius: 12,
  },
});

export default QueueStatusScreen;
