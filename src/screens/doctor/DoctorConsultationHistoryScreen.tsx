import React, {useCallback, useMemo, useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {Card, Text, ActivityIndicator, IconButton} from 'react-native-paper';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {DoctorService} from '../../services/DoctorService';
import {QueueEntry} from '../../services/QueueService';

function sortByEndDesc(a: QueueEntry, b: QueueEntry): number {
  const at = a.consultationEndTime ? new Date(a.consultationEndTime).getTime() : 0;
  const bt = b.consultationEndTime ? new Date(b.consultationEndTime).getTime() : 0;
  return bt - at;
}

const DoctorConsultationHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [rows, setRows] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await DoctorService.getTodayCompletedConsultations();
      setRows((data ?? []).slice().sort(sortByEndDesc));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const total = rows.length;
  const subtitle = useMemo(() => {
    if (total === 0) return 'No completed consultations today.';
    return `${total} completed today`;
  }, [total]);

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
      <View style={sharedScreen.flex}>
        <View style={styles.header}>
          <View>
            <Text variant="labelLarge" style={styles.eyebrow}>
              History
            </Text>
            <Text variant="headlineMedium" style={styles.title}>
              Completed consultations
            </Text>
            <Text variant="bodySmall" style={styles.sub}>
              {subtitle}
            </Text>
          </View>
          <IconButton icon="arrow-left" onPress={() => (navigation as any).goBack()} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />}
          showsVerticalScrollIndicator={false}>
          {rows.length === 0 ? (
            <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
              <Card.Content>
                <Text variant="bodyLarge" style={styles.empty}>
                  No completed consultations today
                </Text>
              </Card.Content>
            </Card>
          ) : (
            rows.map(entry => (
              <Card key={entry.id} style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
                <Card.Content>
                  <Text variant="titleMedium" style={styles.name}>
                    {entry.patientName}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    CNIC: {entry.patientCNIC}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    Completed:{' '}
                    {entry.consultationEndTime ? new Date(entry.consultationEndTime).toLocaleString() : '—'}
                  </Text>
                  {entry.symptoms ? (
                    <Text variant="bodySmall" style={styles.meta}>
                      Symptoms: {entry.symptoms}
                    </Text>
                  ) : null}
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
  eyebrow: {color: AppColors.primary, fontWeight: '600'},
  title: {fontWeight: '800', color: AppColors.text, marginTop: 4},
  sub: {color: AppColors.textSecondary, marginTop: 6},
  scroll: {padding: 18, paddingBottom: 32},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  card: {marginBottom: 12},
  name: {fontWeight: '800', color: AppColors.text},
  meta: {color: AppColors.textSecondary, marginTop: 4},
  empty: {textAlign: 'center', color: AppColors.textMuted},
});

export default DoctorConsultationHistoryScreen;

