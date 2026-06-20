import React, {useCallback, useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {Card, Text, ActivityIndicator, Chip} from 'react-native-paper';
import {QueueService, QueueEntry} from '../../services/QueueService';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';
import {useFocusEffect} from '@react-navigation/native';

function sortQueue(a: QueueEntry, b: QueueEntry): number {
  const pr = b.priorityScore - a.priorityScore;
  if (pr !== 0) {
    return pr;
  }
  return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
}

const QueueDisplayScreen: React.FC = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const data = await QueueService.getQueue();
      setQueue([...data].sort(sortQueue));
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQueue();
      const interval = setInterval(loadQueue, 5000);
      return () => clearInterval(interval);
    }, [loadQueue]),
  );

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading live queue…</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <View style={sharedScreen.flex}>
        <View style={styles.header}>
          <View>
            <Text variant="labelLarge" style={styles.eyebrow}>
              Clinic display
            </Text>
            <Text variant="headlineMedium" style={styles.title}>
              Waiting list
            </Text>
          </View>
          <Chip icon="broadcast" style={styles.liveBadge} textStyle={styles.liveBadgeText}>
            LIVE
          </Chip>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadQueue} tintColor={AppColors.primary} />}>
          {queue.length === 0 ? (
            <Card style={[sharedScreen.surfaceCard, styles.emptyCard]} mode="elevated">
              <Card.Content>
                <Text variant="titleLarge" style={styles.emptyTitle}>
                  Queue is empty
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <>
              {queue
                .filter(e => e.status === 'InProgress')
                .map(entry => (
                  <Card
                    key={entry.id}
                    style={[sharedScreen.surfaceCard, styles.card, styles.activeCard]}
                    mode="elevated">
                    <Card.Content style={styles.cardContent}>
                      <View style={styles.left}>
                        <Text variant="labelLarge" style={styles.nowLabel}>
                          NOW
                        </Text>
                      </View>
                      <View style={styles.middle}>
                        <Text variant="titleLarge" style={styles.patientName}>
                          {entry.patientName}
                        </Text>
                        <Text variant="bodySmall" style={styles.sub}>
                          With {entry.doctorName || 'doctor'}
                        </Text>
                      </View>
                      <View style={styles.right}>
                        <Chip style={styles.statusChip} textStyle={{color: '#fff', fontWeight: '700'}}>
                          IN ROOM
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                ))}

              {queue.some(e => e.status === 'Waiting') ? (
                <Text variant="titleSmall" style={styles.waitingHeading}>
                  Waiting ({queue.filter(e => e.status === 'Waiting').length})
                </Text>
              ) : null}

              {queue.filter(e => e.status === 'Waiting').map((entry, index) => (
                <Card key={entry.id} style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.left}>
                      <Text variant="headlineSmall" style={styles.rank}>
                        #{index + 1}
                      </Text>
                    </View>
                    <View style={styles.middle}>
                      <Text variant="titleLarge" style={styles.patientName}>
                        {entry.patientName}
                      </Text>
                      <Text variant="bodySmall" style={styles.sub}>
                        Assigned to: {entry.doctorName || 'Assigning…'}
                      </Text>
                    </View>
                    <View style={styles.right}>
                      <Text variant="bodySmall" style={styles.priority}>
                        Priority {entry.priorityScore}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Emergency cases are prioritized by triage (rules + optional AI).
          </Text>
        </View>
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
  eyebrow: {color: AppColors.primary, fontWeight: '600'},
  title: {fontWeight: '800', color: AppColors.text, marginTop: 4},
  liveBadge: {backgroundColor: AppColors.error},
  liveBadgeText: {color: '#fff', fontWeight: '800'},
  scrollContent: {padding: 18, paddingBottom: 100},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 14, color: AppColors.textSecondary},
  card: {marginBottom: 12, borderRadius: 18},
  activeCard: {
    borderWidth: 2,
    borderColor: AppColors.success,
    backgroundColor: '#ECFDF5',
  },
  cardContent: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  left: {width: 56, alignItems: 'center'},
  rank: {fontWeight: '800', color: AppColors.primary},
  nowLabel: {fontWeight: '900', color: AppColors.success, fontSize: 12},
  waitingHeading: {marginTop: 8, marginBottom: 10, fontWeight: '800', color: AppColors.textSecondary},
  middle: {flex: 1, paddingHorizontal: 10},
  patientName: {fontWeight: '800', color: AppColors.text},
  sub: {color: AppColors.textSecondary, marginTop: 4},
  right: {alignItems: 'flex-end'},
  statusChip: {backgroundColor: AppColors.success},
  priority: {color: AppColors.textMuted, fontWeight: '600'},
  emptyCard: {marginTop: 24},
  emptyTitle: {textAlign: 'center', color: AppColors.textMuted},
  footer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  footerText: {color: AppColors.textSecondary, textAlign: 'center'},
});

export default QueueDisplayScreen;
