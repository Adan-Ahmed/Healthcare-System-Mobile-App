import React, {useEffect, useMemo, useState} from 'react';
import {api} from '../lib/api';
import type {AdminUser} from '../lib/types';

type CreateAdminRequest = {
  name: string;
  email: string;
  password: string;
};

export default function AdminsPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAdminRequest>({name: '', email: '', password: ''});

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<AdminUser[]>('/api/admin/admins');
      setRows(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to load admins');
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
      await api.post('/api/admin/admins', form);
      setForm({name: '', email: '', password: ''});
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Create failed');
    }
  };

  const setActive = async (id: number, isActive: boolean) => {
    setErr(null);
    try {
      await api.post(`/api/admin/admins/${id}/active`, {isActive});
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
      await api.post(`/api/admin/admins/${id}/reset-password`, {newPassword});
      alert('Password reset.');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div style={{display: 'grid', gap: 16}}>
      <div className="card">
        <div className="row">
          <div>
            <div style={{fontWeight: 900, fontSize: 18}}>Admins</div>
            <div className="muted" style={{fontSize: 13}}>
              {rows.length} total · {activeCount} active
            </div>
            <div className="muted" style={{fontSize: 12, marginTop: 6}}>
              Dev default (first run): <code>admin@clinic.com</code> / <code>admin123</code>
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
        <div style={{fontWeight: 900, marginBottom: 10}}>Add admin</div>
        <div style={{display: 'grid', gap: 10}}>
          <div className="row">
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </div>
          <div className="row">
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
            />
          </div>
          <button onClick={create} disabled={!form.name || !form.email || !form.password}>
            Create admin
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

