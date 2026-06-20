import React, {useEffect, useMemo, useState} from 'react';
import {api} from '../lib/api';
import type {AdminReceptionist} from '../lib/types';

type CreateReceptionistRequest = {
  name: string;
  email: string;
  password: string;
};

export default function ReceptionistsPage() {
  const [rows, setRows] = useState<AdminReceptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<CreateReceptionistRequest>({name: '', email: '', password: ''});

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<AdminReceptionist[]>('/api/admin/receptionists');
      setRows(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to load receptionists');
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
      await api.post('/api/admin/receptionists', form);
      setForm({name: '', email: '', password: ''});
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Create failed');
    }
  };

  const setActive = async (id: number, isActive: boolean) => {
    setErr(null);
    try {
      await api.post(`/api/admin/receptionists/${id}/active`, {isActive});
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
      await api.post(`/api/admin/receptionists/${id}/reset-password`, {newPassword});
      alert('Password reset.');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Reset failed');
    }
  };

  const edit = async (r: AdminReceptionist) => {
    const name = window.prompt('Name:', r.name) ?? '';
    if (!name.trim()) return;
    const email = window.prompt('Email:', r.email) ?? '';
    if (!email.trim()) return;

    setErr(null);
    try {
      await api.put(`/api/admin/receptionists/${r.id}`, {name, email});
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
            <div style={{fontWeight: 900, fontSize: 18}}>Receptionists</div>
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
        <div style={{fontWeight: 900, marginBottom: 10}}>Add receptionist</div>
        <div style={{display: 'grid', gap: 10}}>
          <div className="row">
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </div>
          <div className="row">
            <input
              placeholder="Temp password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
            />
          </div>
          <button onClick={create} disabled={!form.name || !form.email || !form.password}>
            Create receptionist
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
                <th>User</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{fontWeight: 800}}>{r.name}</div>
                    <div className="muted" style={{fontSize: 12}}>
                      #{r.id} · {r.email}
                    </div>
                  </td>
                  <td>
                    {r.isActive ? <span className="pill ok">Active</span> : <span className="pill bad">Inactive</span>}
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

