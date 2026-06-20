import api from './api';

export interface QueueEntry {
  id: number;
  patientId: number;
  patientName: string;
  patientCNIC: string;
  clinicId?: number;
  clinicName?: string;
  doctorId?: number;
  doctorName?: string;
  priorityScore: number;
  status: string;
  arrivalTime: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
  symptoms?: string;
  criticalFactors?: string;
}

export interface JoinQueueRequest {
  patientId?: number;
  symptoms: string[];
  sensorData?: {
    temperature?: number;
    heartRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    additionalData?: string;
  };
}

export class QueueService {
  static async joinQueue(request: JoinQueueRequest): Promise<QueueEntry> {
    const response = await api.post<QueueEntry>('/api/queue/join', request);
    return response.data;
  }

  static async getQueue(): Promise<QueueEntry[]> {
    const response = await api.get<QueueEntry[]>('/api/queue');
    return response.data;
  }

  static async getQueueEntry(id: number): Promise<QueueEntry> {
    const response = await api.get<QueueEntry>(`/api/queue/${id}`);
    return response.data;
  }
}
