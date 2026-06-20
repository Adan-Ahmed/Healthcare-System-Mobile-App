import api from './api';

export interface Patient {
  id: number;
  cnic: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth: string;
  address?: string;
  gender?: string;
}

export interface SymptomInput {
  symptomDescription: string;
  severity?: string;
}

export interface SensorData {
  temperature?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenSaturation?: number;
  additionalData?: string;
}

export interface CreatePatientByClinicPayload {
  cnic: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth: Date;
  address?: string;
  gender?: string;
  password: string;
}

export class PatientService {
  static async createPatientByClinic(payload: CreatePatientByClinicPayload): Promise<Patient> {
    const response = await api.post<Patient>('/api/patient/clinic-register', {
      ...payload,
      dateOfBirth: payload.dateOfBirth.toISOString(),
    });
    return response.data;
  }

  static async getProfile(): Promise<Patient> {
    const response = await api.get<Patient>('/api/patient/profile');
    return response.data;
  }

  static async getPatientByCNIC(cnic: string): Promise<Patient> {
    const response = await api.get<Patient>(`/api/patient/cnic/${cnic}`);
    return response.data;
  }

  static async addSymptom(symptom: SymptomInput): Promise<void> {
    await api.post('/api/patient/symptoms', symptom);
  }

  static async addSensorData(data: SensorData): Promise<void> {
    await api.post('/api/patient/sensor-data', data);
  }
}
