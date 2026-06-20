import api from './api';

export interface PrescriptionItem {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number;
  instructions?: string;
}

export interface Prescription {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  diagnosis?: string;
  instructions?: string;
  prescriptionDate: string;
  items: PrescriptionItem[];
}

export interface CreatePrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number;
  instructions?: string;
  reminderTime?: string; // Time in HH:mm format
}

export interface CreatePrescriptionRequest {
  patientId: number;
  diagnosis?: string;
  instructions?: string;
  items: CreatePrescriptionItem[];
}

export class PrescriptionService {
  static async getPatientPrescriptions(patientId: number): Promise<Prescription[]> {
    const response = await api.get<Prescription[]>(`/api/prescription/patient/${patientId}`);
    return response.data;
  }

  static async getPrescription(id: number): Promise<Prescription> {
    const response = await api.get<Prescription>(`/api/prescription/${id}`);
    return response.data;
  }

  static async createPrescription(request: CreatePrescriptionRequest): Promise<Prescription> {
    const response = await api.post<Prescription>('/api/prescription', request);
    return response.data;
  }
}
