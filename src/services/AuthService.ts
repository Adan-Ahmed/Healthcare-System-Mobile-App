import axios from 'axios';
import {API_BASE_URL} from './config';

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {'Content-Type': 'application/json'},
});

export interface LoginResponse {
  token: string;
  userType: string;
  userId: number;
  name: string;
}

export interface PatientRegisterResponse {
  success: boolean;
  requiresEmailVerification: boolean;
  message: string;
  cnic?: string;
  emailMasked?: string;
}

export class AuthService {
  static async login(cnic: string, password: string, userType: 'Patient' | 'Doctor' | 'Receptionist'): Promise<LoginResponse> {
    let endpoint = '';
    let data: Record<string, unknown> = {};

    if (userType === 'Patient') {
      endpoint = '/api/auth/patient/login';
      data = {cnic, password};
    } else if (userType === 'Doctor') {
      endpoint = '/api/auth/doctor/login';
      data = {email: cnic, password};
    } else {
      endpoint = '/api/auth/receptionist/login';
      data = {email: cnic, password};
    }

    const response = await publicApi.post<LoginResponse>(endpoint, data);
    return response.data;
  }

  static async register(data: {
    cnic: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth: Date;
    address?: string;
    gender?: string;
    password: string;
  }): Promise<PatientRegisterResponse> {
    const response = await publicApi.post<PatientRegisterResponse>('/api/auth/patient/register', {
      ...data,
      dateOfBirth: data.dateOfBirth.toISOString(),
    });
    return response.data;
  }

  static async verifyPatientEmail(cnic: string, code: string): Promise<LoginResponse> {
    const response = await publicApi.post<LoginResponse>('/api/auth/patient/verify-email', {
      cnic,
      code,
    });
    return response.data;
  }

  static async resendPatientOtp(cnic: string): Promise<PatientRegisterResponse> {
    const response = await publicApi.post<PatientRegisterResponse>('/api/auth/patient/resend-otp', {cnic});
    return response.data;
  }
}
