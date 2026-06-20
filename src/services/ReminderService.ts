import api from './api';

export interface MedicineReminder {
  id: number;
  medicineName: string;
  dosage: string;
  reminderTime: string; // Time in HH:mm format
  isCompleted: boolean;
  completedAt?: string;
  reminderDate: string;
}

export class ReminderService {
  static async getReminders(): Promise<MedicineReminder[]> {
    const response = await api.get<MedicineReminder[]>('/api/reminder');
    return response.data;
  }

  static async updateReminderStatus(id: number, isCompleted: boolean): Promise<MedicineReminder> {
    const response = await api.put<MedicineReminder>(`/api/reminder/${id}`, {isCompleted});
    return response.data;
  }
}
