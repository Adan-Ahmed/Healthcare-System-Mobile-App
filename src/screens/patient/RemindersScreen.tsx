import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {Card, Text, ActivityIndicator, Button, Checkbox} from 'react-native-paper';
import {ReminderService, MedicineReminder} from '../../services/ReminderService';
import {syncMedicationTriggerNotifications} from '../../services/medicationNotifications';
import ScreenBackground from '../../components/ScreenBackground';
import {sharedScreen} from '../../theme/screenStyles';
import {AppColors} from '../../theme/colors';

const RemindersScreen: React.FC = () => {
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = async () => {
    try {
      const patientReminders = await ReminderService.getReminders();
      // Filter for today and future reminders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = patientReminders.filter(
        r => new Date(r.reminderDate) >= today || !r.isCompleted,
      );
      setReminders(filtered);
      await syncMedicationTriggerNotifications(patientReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders();
  };

  const toggleReminder = async (reminder: MedicineReminder) => {
    try {
      await ReminderService.updateReminderStatus(reminder.id, !reminder.isCompleted);
      loadReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
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

  const todayReminders = reminders.filter(
    r => new Date(r.reminderDate).toDateString() === new Date().toDateString(),
  );
  const upcomingReminders = reminders.filter(
    r => new Date(r.reminderDate).toDateString() !== new Date().toDateString(),
  );

  return (
    <ScreenBackground>
      <ScrollView
        style={sharedScreen.flex}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />
        }>
        <View style={styles.hero}>
          <Text variant="labelLarge" style={styles.heroLabel}>
            Schedule
          </Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Medication reminders
          </Text>
        </View>
        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Today
          </Text>
          {todayReminders.length === 0 ? (
            <Card style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
              <Card.Content>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No reminders for today
                </Text>
              </Card.Content>
            </Card>
          ) : (
            todayReminders.map(reminder => (
              <Card
                key={reminder.id}
                style={[sharedScreen.surfaceCard, styles.card, reminder.isCompleted && styles.completedCard]}
                mode="elevated"
                onPress={() => toggleReminder(reminder)}>
                <Card.Content style={styles.reminderContent}>
                  <Checkbox
                    status={reminder.isCompleted ? 'checked' : 'unchecked'}
                    onPress={() => toggleReminder(reminder)}
                    color={AppColors.primary}
                  />
                <View style={styles.reminderInfo}>
                  <Text
                    variant="titleMedium"
                    style={reminder.isCompleted ? styles.completedText : {}}>
                    {reminder.medicineName}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    Dosage: {reminder.dosage}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    Time: {reminder.reminderTime} | Date: {new Date(reminder.reminderDate).toLocaleDateString()}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {upcomingReminders.length > 0 && (
          <>
            <Text variant="titleMedium" style={[styles.sectionTitle, styles.upcomingTitle]}>
              Upcoming
            </Text>
            {upcomingReminders.map(reminder => (
              <Card key={reminder.id} style={[sharedScreen.surfaceCard, styles.card]} mode="elevated">
                <Card.Content style={styles.reminderContent}>
                  <Checkbox status="unchecked" disabled />
                  <View style={styles.reminderInfo}>
                    <Text variant="titleMedium">{reminder.medicineName}</Text>
                    <Text variant="bodySmall" style={styles.meta}>
                      Dosage: {reminder.dosage}
                    </Text>
                    <Text variant="bodySmall" style={styles.meta}>
                      Time: {reminder.reminderTime} | Date:{' '}
                      {new Date(reminder.reminderDate).toLocaleDateString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
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
  hero: {paddingHorizontal: 22, paddingTop: 52, paddingBottom: 4},
  heroLabel: {color: AppColors.primary, fontWeight: '600', letterSpacing: 1},
  heroTitle: {fontWeight: '800', color: AppColors.text, marginTop: 4},
  content: {padding: 18, paddingBottom: 32},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  sectionTitle: {marginBottom: 12, fontWeight: '700', color: AppColors.text},
  upcomingTitle: {marginTop: 22},
  card: {marginBottom: 12},
  completedCard: {opacity: 0.65},
  reminderContent: {flexDirection: 'row', alignItems: 'center'},
  reminderInfo: {flex: 1, marginLeft: 8},
  meta: {color: AppColors.textSecondary, marginTop: 2},
  completedText: {textDecorationLine: 'line-through', color: AppColors.textMuted},
  emptyText: {textAlign: 'center', color: AppColors.textMuted},
  refreshButton: {marginTop: 16, borderColor: AppColors.primary},
});

export default RemindersScreen;
