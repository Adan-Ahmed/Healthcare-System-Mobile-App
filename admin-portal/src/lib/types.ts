export type AuthResponse = {
  token: string;
  userType: string;
  userId: number;
  name: string;
};

export type AdminDoctor = {
  id: number;
  name: string;
  specialization?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  licenseNumber?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type AdminReceptionist = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export type QueueEntry = {
  id: number;
  patientId: number;
  patientName: string;
  patientCNIC: string;
  doctorId?: number | null;
  doctorName?: string | null;
  priorityScore: number;
  status: string;
  arrivalTime: string;
  consultationStartTime?: string | null;
  consultationEndTime?: string | null;
  symptoms?: string | null;
  criticalFactors?: string | null;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminPatient = {
  id: number;
  name: string;
  cnic: string;
  email?: string | null;
  phoneNumber?: string | null;
  dateOfBirth: string;
  gender?: string | null;
  createdAt: string;
};

export type MedicalReport = {
  id: number;
  patientId: number;
  patientName: string;
  doctorId?: number | null;
  doctorName?: string | null;
  reportType: string;
  reportData: string;
  summary?: string | null;
  reportDate: string;
  createdAt: string;
};

export type PrescriptionItem = {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number;
  instructions?: string | null;
};

export type Prescription = {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  diagnosis?: string | null;
  instructions?: string | null;
  prescriptionDate: string;
  items: PrescriptionItem[];
};

export type MedicineReminder = {
  id: number;
  medicineName: string;
  dosage: string;
  reminderTime: string; // serialized TimeSpan
  isCompleted: boolean;
  completedAt?: string | null;
  reminderDate: string;
};

export type AdminPatientHistory = {
  patient: AdminPatient;
  reports: MedicalReport[];
  prescriptions: Prescription[];
  reminders: MedicineReminder[];
  visits: QueueEntry[];
};

