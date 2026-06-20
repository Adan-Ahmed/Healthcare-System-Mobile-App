import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {ActivityIndicator, View, Text, StyleSheet} from 'react-native';
import ScreenBackground from '../components/ScreenBackground';
import {AppColors} from '../theme/colors';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerifyScreen from '../screens/auth/EmailVerifyScreen';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import ReportsScreen from '../screens/patient/ReportsScreen';
import PrescriptionsScreen from '../screens/patient/PrescriptionsScreen';
import RemindersScreen from '../screens/patient/RemindersScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import DoctorQueueScreen from '../screens/doctor/DoctorQueueScreen';
import ConsultationScreen from '../screens/doctor/ConsultationScreen';
import CreatePrescriptionScreen from '../screens/doctor/CreatePrescriptionScreen';
import CreateReportScreen from '../screens/doctor/CreateReportScreen';
import DoctorPatientHistoryScreen from '../screens/doctor/DoctorPatientHistoryScreen';
import DoctorReportDetailScreen from '../screens/doctor/DoctorReportDetailScreen';
import DoctorConsultationHistoryScreen from '../screens/doctor/DoctorConsultationHistoryScreen';

// Receptionist Screens
import ClinicHomeScreen from '../screens/receptionist/ClinicHomeScreen';
import QueueDisplayScreen from '../screens/receptionist/QueueDisplayScreen';
import ClinicRegisterPatientScreen from '../screens/receptionist/ClinicRegisterPatientScreen';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return (
      <ScreenBackground>
        <View style={loadStyles.center}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={loadStyles.text}>Loading…</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="EmailVerify" component={EmailVerifyScreen} />
        </>
      ) : user.userType === 'Patient' ? (
        <>
          <Stack.Screen name="PatientHome" component={PatientHomeScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : user.userType === 'Doctor' ? (
        <>
          <Stack.Screen name="DoctorHome" component={DoctorHomeScreen} />
          <Stack.Screen name="DoctorQueue" component={DoctorQueueScreen} />
          <Stack.Screen name="DoctorConsultationHistory" component={DoctorConsultationHistoryScreen} />
          <Stack.Screen name="DoctorPatientHistory" component={DoctorPatientHistoryScreen} />
          <Stack.Screen name="Consultation" component={ConsultationScreen} />
          <Stack.Screen name="CreatePrescription" component={CreatePrescriptionScreen} />
          <Stack.Screen name="CreateReport" component={CreateReportScreen} />
          <Stack.Screen name="DoctorReportDetail" component={DoctorReportDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="ClinicHome" component={ClinicHomeScreen} />
          <Stack.Screen name="QueueDisplay" component={QueueDisplayScreen} />
          <Stack.Screen name="ClinicRegisterPatient" component={ClinicRegisterPatientScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const loadStyles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  text: {marginTop: 16, color: AppColors.textSecondary, fontSize: 16},
});

export default AppNavigator;
