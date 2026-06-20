import api from './api';

export interface MedicalReport {
  id: number;
  patientId: number;
  patientName: string;
  doctorId?: number;
  doctorName?: string;
  reportType: string;
  reportData: string;
  summary?: string;
  reportDate: string;
  createdAt: string;
}

export interface CreateReportRequest {
  patientId: number;
  reportType: string;
  reportData: string;
}

export class ReportService {
  static async getPatientReports(patientId: number): Promise<MedicalReport[]> {
    const response = await api.get<MedicalReport[]>(`/api/report/patient/${patientId}`);
    return response.data;
  }

  static async getReport(id: number): Promise<MedicalReport> {
    const response = await api.get<MedicalReport>(`/api/report/${id}`);
    return response.data;
  }

  static async createReport(request: CreateReportRequest): Promise<MedicalReport> {
    const response = await api.post<MedicalReport>('/api/report', request);
    return response.data;
  }

  /** Doctor only: recomputes AI summary from report body; returns updated report. */
  static async regenerateReportSummary(reportId: number): Promise<MedicalReport> {
    const response = await api.post<MedicalReport>(`/api/report/${reportId}/summary`);
    return response.data;
  }
}
