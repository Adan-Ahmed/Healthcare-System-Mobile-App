import api from './api';
import {QueueEntry} from './QueueService';

export interface LatestVitals {
  temperature?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenSaturation?: number;
  recordedAt: string;
}

export class DoctorService {
  /** Active queue only (Waiting + InProgress), highest priority first. */
  static async getMyQueue(doctorId?: number): Promise<QueueEntry[]> {
    try {
      const response = await api.get<QueueEntry[]>('/api/Doctor/queue');
      return response.data ?? [];
    } catch (e: any) {
      // Fallback for backends that expose a single queue feed.
      const status = e?.response?.status;
      if (status && status !== 404 && status !== 405) {
        throw e;
      }
      console.warn('[DoctorService.getMyQueue] Falling back to /api/queue', {
        baseURL: api.defaults.baseURL,
        attempted: '/api/doctor/queue',
        status,
        message: e?.response?.data?.message ?? e?.message,
      });
      const response = await api.get<QueueEntry[]>('/api/queue');
      const all = response.data ?? [];
      const active = all.filter(q => q.status === 'Waiting' || q.status === 'InProgress');

      // If the backend does not attach doctorId on queue rows yet, filtering would hide everything.
      // Prefer showing active queue over an empty doctor view.
      if (doctorId == null) {
        return active;
      }

      const mine = active.filter(q => q.doctorId === doctorId);
      return mine.length > 0 ? mine : active;
    }
  }

  static async startConsultation(queueEntryId: number): Promise<void> {
    await api.post(`/api/Doctor/queue/${queueEntryId}/start`);
  }

  static async completeConsultation(queueEntryId: number): Promise<void> {
    await api.post(`/api/Doctor/queue/${queueEntryId}/complete`);
  }

  /** Last N completed consultations (most recent first). */
  static async getRecentCompletedConsultations(take = 5): Promise<QueueEntry[]> {
    const response = await api.get<QueueEntry[]>('/api/Doctor/consultations/completed', {
      params: {take},
    });
    return response.data ?? [];
  }

  /** Completed consultations for today (UTC day on server). */
  static async getTodayCompletedConsultations(): Promise<QueueEntry[]> {
    const response = await api.get<QueueEntry[]>('/api/Doctor/consultations/completed/today');
    return response.data ?? [];
  }

  /** Latest vitals stored for this patient (from check-in / IoT). */
  static async getPatientLatestVitals(patientId: number): Promise<LatestVitals | null> {
    const response = await api.get<LatestVitals | null>(`/api/Doctor/patient/${patientId}/latest-vitals`);
    return response.data ?? null;
  }
}
