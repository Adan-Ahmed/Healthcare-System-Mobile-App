import React, {useEffect, useMemo, useState} from 'react';
import {api} from '../lib/api';
import type {AdminDoctor} from '../lib/types';

type CreateDoctorRequest = {
  name: string;
  specialization: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  password: string;
};

export default function DoctorsPage() {
  const [rows, setRows] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<CreateDoctorRequest>({
    name: '',
    specialization: '',
    email: '',
    phoneNumber: '',
    licenseNumber: '',
    password: '',
  });

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<AdminDoctor[]>('/api/admin/doctors');
      setRows(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const activeCount = useMemo(() => rows.filter(r => r.isActive).length, [rows]);

  const create = async () => {
    setErr(null);
    try {
      await api.post('/api/admin/doctors', form);
      setForm({name: '', specialization: '', email: '', phoneNumber: '', licenseNumber: '', password: ''});
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Create failed');
    }
  };

  const setActive = async (id: number, isActive: boolean) => {
    setErr(null);
    try {
      await api.post(`/api/admin/doctors/${id}/active`, {isActive});
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Update status failed');
    }
  };

  const resetPassword = async (id: number) => {
    const newPassword = window.prompt('New password (min 6 chars):');
    if (!newPassword) return;
    setErr(null);
    try {
      await api.post(`/api/admin/doctors/${id}/reset-password`, {newPassword});
      alert('Password reset.');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Reset failed');
    }
  };

  const edit = async (doc: AdminDoctor) => {
    const name = window.prompt('Name:', doc.name) ?? '';
    if (!name.trim()) return;
    const specialization = window.prompt('Specialization:', doc.specialization ?? '') ?? '';
    const email = window.prompt('Email:', doc.email ?? '') ?? '';
    const phoneNumber = window.prompt('Phone:', doc.phoneNumber ?? '') ?? '';
    const licenseNumber = window.prompt('License #:', doc.licenseNumber ?? '') ?? '';

    setErr(null);
    try {
      await api.put(`/api/admin/doctors/${doc.id}`, {
        name,
        specialization,
        email,
        phoneNumber,
        licenseNumber,
      });
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div style={{display: 'grid', gap: 16}}>
      <div className="card">
        <div className="row">
          <div>
            <div style={{fontWeight: 900, fontSize: 18}}>Doctors</div>
            <div className="muted" style={{fontSize: 13}}>
              {rows.length} total · {activeCount} active
            </div>
          </div>
          <div className="spacer" />
          <button className="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
        {err ? <div className="error" style={{marginTop: 10}}>{err}</div> : null}
      </div>

      <div className="card">
        <div style={{fontWeight: 900, marginBottom: 10}}>Add doctor</div>
        <div style={{display: 'grid', gap: 10}}>
          <div className="row">
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            <input
              placeholder="Specialization"
              value={form.specialization}
              onChange={e => setForm(f => ({...f, specialization: e.target.value}))}
            />
          </div>
          <div className="row">
            <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            <input
              placeholder="Phone"
              value={form.phoneNumber}
              onChange={e => setForm(f => ({...f, phoneNumber: e.target.value}))}
            />
          </div>
          <div className="row">
            <input
              placeholder="License #"
              value={form.licenseNumber}
              onChange={e => setForm(f => ({...f, licenseNumber: e.target.value}))}
            />
            <input
              placeholder="Temp password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
            />
          </div>
          <button onClick={create} disabled={!form.name || !form.email || !form.password}>
            Create doctor
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{fontWeight: 800}}>{r.name}</div>
                    <div className="muted" style={{fontSize: 12}}>
                      #{r.id} · {r.specialization || '—'}
                    </div>
                  </td>
                  <td>
                    {r.isActive ? <span className="pill ok">Active</span> : <span className="pill bad">Inactive</span>}
                  </td>
                  <td className="muted" style={{fontSize: 13}}>
                    <div>{r.email || '—'}</div>
                    <div>{r.phoneNumber || '—'}</div>
                  </td>
                  <td>
                    <div className="row" style={{flexWrap: 'wrap'}}>
                      <button className="secondary" onClick={() => edit(r)}>
                        Edit
                      </button>
                      <button className="secondary" onClick={() => setActive(r.id, !r.isActive)}>
                        {r.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="secondary" onClick={() => resetPassword(r.id)}>
                        Reset password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

