import React, {useEffect} from 'react';
import {NavLink, Route, Routes, useNavigate} from 'react-router-dom';
import {clearAuth, getAuth} from './lib/auth';
import LoginPage from './pages/LoginPage';
import DoctorsPage from './pages/DoctorsPage';
import ReceptionistsPage from './pages/ReceptionistsPage';
import QueuePage from './pages/QueuePage';
import AdminsPage from './pages/AdminsPage';
import PatientsPage from './pages/PatientsPage';
import PatientHistoryPage from './pages/PatientHistoryPage';

function RequireAuth({children}: {children: React.ReactNode}) {
  const nav = useNavigate();
  const auth = getAuth();
  useEffect(() => {
    if (!auth?.token) {
      nav('/login', {replace: true});
    }
  }, [auth?.token, nav]);

  if (!auth?.token) return null;
  return <>{children}</>;
}

export default function App() {
  const auth = getAuth();

  return (
    <div className="container">
      <div className="row" style={{marginBottom: 16}}>
        <div>
          <div style={{fontWeight: 900, fontSize: 18}}>Healthcare Admin Portal</div>
          <div className="muted" style={{fontSize: 13}}>
            {auth?.token ? `Signed in as ${auth.name} (${auth.userType})` : 'Not signed in'}
          </div>
        </div>
        <div className="spacer" />
        {auth?.token ? (
          <button
            className="secondary"
            onClick={() => {
              clearAuth();
              window.location.href = '/login';
            }}>
            Logout
          </button>
        ) : null}
      </div>

      {auth?.token ? (
        <div className="nav" style={{marginBottom: 16}}>
          <NavLink to="/admins" className={({isActive}) => (isActive ? 'active' : undefined)}>
            Admins
          </NavLink>
          <NavLink to="/doctors" className={({isActive}) => (isActive ? 'active' : undefined)}>
            Doctors
          </NavLink>
          <NavLink to="/receptionists" className={({isActive}) => (isActive ? 'active' : undefined)}>
            Receptionists
          </NavLink>
          <NavLink to="/patients" className={({isActive}) => (isActive ? 'active' : undefined)}>
            Patients
          </NavLink>
          <NavLink to="/queue" className={({isActive}) => (isActive ? 'active' : undefined)}>
            Queue
          </NavLink>
        </div>
      ) : null}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admins"
          element={
            <RequireAuth>
              <AdminsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/doctors"
          element={
            <RequireAuth>
              <DoctorsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/receptionists"
          element={
            <RequireAuth>
              <ReceptionistsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/queue"
          element={
            <RequireAuth>
              <QueuePage />
            </RequireAuth>
          }
        />
        <Route
          path="/patients"
          element={
            <RequireAuth>
              <PatientsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <RequireAuth>
              <PatientHistoryPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

