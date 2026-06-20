import notifee, {AndroidImportance, TimestampTrigger, TriggerType} from '@notifee/react-native';
import {Platform} from 'react-native';
import type {MedicineReminder} from './ReminderService';

const CHANNEL_ID = 'medication-reminders';

function parseReminderDateTime(reminderDate: string, reminderTime: string): Date {
  // Backend sends reminderDate as a DateTime (often midnight UTC). Using `new Date(reminderDate)`
  // can shift the date on devices with non-UTC timezones. We want the calendar day + local time.
  const dateOnly = reminderDate.split('T')[0]; // "YYYY-MM-DD"
  const d = new Date(`${dateOnly}T00:00:00`);
  const [h, m] = reminderTime.split(':').map(x => parseInt(x, 10));
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export async function ensureMedicationNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Medication reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

export async function syncMedicationTriggerNotifications(reminders: MedicineReminder[]): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      return;
    }
    const settings = await notifee.requestPermission();
    if (__DEV__) {
      console.log('[medicationNotifications] permission', settings);
    }

    if (Platform.OS === 'android') {
      await ensureMedicationNotificationChannel();
    }

    // Only clear medication reminders, not all app triggers.
    const existing = await notifee.getTriggerNotificationIds();
    const toCancel = existing.filter(id => id.startsWith('med-'));
    for (const id of toCancel) {
      await notifee.cancelTriggerNotification(id);
    }

    const now = Date.now();
    for (const r of reminders) {
      if (r.isCompleted) {
        continue;
      }
      const when = parseReminderDateTime(r.reminderDate, r.reminderTime).getTime();
      if (when <= now) {
        continue;
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: when,
      };

      await notifee.createTriggerNotification(
        {
          id: `med-${r.id}`,
          title: 'Time for your medication',
          body: `${r.medicineName} — ${r.dosage}`,
          android: {
            channelId: CHANNEL_ID,
            pressAction: {id: 'default'},
          },
        },
        trigger,
      );
    }
  } catch (e) {
    console.warn('Medication notifications unavailable:', e);
  }
}
