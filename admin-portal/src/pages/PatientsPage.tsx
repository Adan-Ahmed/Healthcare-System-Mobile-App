import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {api} from '../lib/api';
import type {AdminPatient} from '../lib/types';

export default function PatientsPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<AdminPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<AdminPatient[]>('/api/admin/patients');
      setRows(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(s) || r.cnic.toLowerCase().includes(s) || (r.email ?? '').toLowerCase().includes(s));
  }, [q, rows]);

  return (
    <div style={{display: 'grid', gap: 16}}>
      <div className="card">
        <div className="row">
          <div>
            <div style={{fontWeight: 900, fontSize: 18}}>Patients</div>
            <div className="muted" style={{fontSize: 13}}>
              {rows.length} total
            </div>
          </div>
          <div className="spacer" />
          <input
            placeholder="Search name/CNIC/email…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{maxWidth: 320}}
          />
          <button className="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
        {err ? <div className="error" style={{marginTop: 10}}>{err}</div> : null}
      </div>

      <div className="card">
        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Demographics</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{fontWeight: 800}}>{p.name}</div>
                    <div className="muted" style={{fontSize: 12}}>
                      #{p.id} · CNIC: {p.cnic}
                    </div>
                  </td>
                  <td className="muted" style={{fontSize: 13}}>
                    <div>{p.email || '—'}</div>
                    <div>{p.phoneNumber || '—'}</div>
                  </td>
                  <td className="muted" style={{fontSize: 13}}>
                    <div>DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '—'}</div>
                    <div>Gender: {p.gender || '—'}</div>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <button className="secondary" onClick={() => nav(`/patients/${p.id}`)}>
                      View history
                    </button>
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

