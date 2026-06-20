import api from './api';

export interface TemperatureReading {
  temperature: number;
  source: string;
  recordedAtUtc: string;
}

export interface PulseReading {
  pulse: number;
  source: string;
  recordedAtUtc: string;
}

export interface BloodPressureReading {
  bpUp: number;
  bpDown: number;
  source: string;
  recordedAtUtc: string;
}

export class IotService {
  static async fetchTemperature(): Promise<TemperatureReading> {
    const response = await api.get<TemperatureReading>('/api/iot/temperature');
    return response.data;
  }

  static async fetchPulse(): Promise<PulseReading> {
    const response = await api.get<PulseReading>('/api/iot/pulse');
    return response.data;
  }

  static async fetchBloodPressure(): Promise<BloodPressureReading> {
    const response = await api.get<BloodPressureReading>('/api/iot/bp');
    return response.data;
  }
}
