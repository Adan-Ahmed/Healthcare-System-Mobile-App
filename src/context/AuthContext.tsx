import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthService, LoginResponse} from '../services/AuthService';

interface User {
  id: number;
  name: string;
  userType: 'Patient' | 'Doctor' | 'Receptionist';
  token: string;
}

export interface PatientRegisterPending {
  cnic: string;
  emailMasked?: string;
}

interface AuthContextType {
  user: User | null;
  login: (cnic: string, password: string, userType: 'Patient' | 'Doctor' | 'Receptionist') => Promise<void>;
  registerPatient: (data: {
    cnic: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth: Date;
    address?: string;
    gender?: string;
    password: string;
  }) => Promise<PatientRegisterPending>;
  applyAuthResponse: (response: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyAuthResponse = async (response: LoginResponse) => {
    const token = (response.token ?? '').trim();
    // Store token first so initial authenticated requests don't race before AsyncStorage is ready.
    if (token) {
      await AsyncStorage.setItem('token', token);
    } else {
      await AsyncStorage.removeItem('token');
    }

    const userData: User = {
      id: response.userId,
      name: response.name,
      userType: response.userType as User['userType'],
      token,
    };
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const login = async (cnic: string, password: string, userType: 'Patient' | 'Doctor' | 'Receptionist') => {
    const response = await AuthService.login(cnic, password, userType);
    await applyAuthResponse(response);
  };

  const registerPatient = async (data: Parameters<AuthContextType['registerPatient']>[0]) => {
    const response = await AuthService.register(data);
    if (!response.success || !response.requiresEmailVerification || !response.cnic) {
      throw new Error(response.message || 'Registration failed');
    }
    return {cnic: response.cnic, emailMasked: response.emailMasked};
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{user, login, registerPatient, applyAuthResponse, logout, isLoading}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
