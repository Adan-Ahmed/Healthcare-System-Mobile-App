# Healthcare System Mobile App

## Overview
React Native mobile application for the Healthcare System, supporting both Patient and Doctor interfaces.

## Features
- Patient registration and login via CNIC
- Doctor login
- Symptoms input and sensor data collection
- AI-based queue system integration
- Medical reports viewing
- Prescription management
- Medicine reminders with checklist
- Real-time queue status updates

## Prerequisites
- Node.js (v18 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Backend API running

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API URL:**
   Update `src/services/config.ts` with your backend API URL:
   - For Android emulator: `http://10.0.2.2:5000`
   - For iOS simulator: `http://localhost:5000`
   - For physical device: Use your computer's IP address

3. **Run on Android:**
   ```bash
   npm run android
   ```

4. **Run on iOS:**
   ```bash
   npm run ios
   ```

## Project Structure

```
src/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── patient/
│   │   ├── PatientHomeScreen.tsx
│   │   ├── SymptomsInputScreen.tsx
│   │   ├── QueueStatusScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   ├── PrescriptionsScreen.tsx
│   │   ├── RemindersScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── doctor/
│       ├── DoctorHomeScreen.tsx
│       ├── DoctorQueueScreen.tsx
│       ├── ConsultationScreen.tsx
│       ├── CreatePrescriptionScreen.tsx
│       └── CreateReportScreen.tsx
├── services/
│   ├── api.ts
│   ├── config.ts
│   ├── AuthService.ts
│   ├── PatientService.ts
│   ├── QueueService.ts
│   ├── ReportService.ts
│   ├── PrescriptionService.ts
│   └── ReminderService.ts
├── context/
│   └── AuthContext.tsx
├── navigation/
│   └── AppNavigator.tsx
└── theme/
    └── theme.ts
```

## Key Features Implementation

### Authentication
- JWT token-based authentication
- Token stored in AsyncStorage
- Automatic token refresh on API calls

### Patient Flow
1. Register/Login with CNIC
2. Enter symptoms and sensor data
3. Join queue (AI calculates priority)
4. View queue status
5. Access medical reports and prescriptions
6. Manage medicine reminders

### Doctor Flow
1. Login with email
2. View patient queue (sorted by priority)
3. Start consultation
4. View patient history
5. Create prescriptions and reports
6. Complete consultation

## API Integration
All API calls are handled through service classes in `src/services/`. The API base URL is configured in `src/services/config.ts`.

## State Management
- React Context API for authentication state
- Local state for component-specific data
- AsyncStorage for persistent storage

## Dependencies
- React Navigation for navigation
- React Native Paper for UI components
- Axios for API calls
- AsyncStorage for local storage
- DateTimePicker for date selection

## Notes
- Ensure backend API is running before starting the app
- Update API_BASE_URL in config.ts for your environment
- For production, use environment variables for configuration
