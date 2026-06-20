import React, {useEffect, useState} from 'react';
import {api} from '../lib/api';
import type {QueueEntry} from '../lib/types';

export default function QueuePage() {
  const [rows, setRows] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<QueueEntry[]>('/api/admin/queue');
      setRows(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{display: 'grid', gap: 16}}>
      <div className="card">
        <div className="row">
          <div>
            <div style={{fontWeight: 900, fontSize: 18}}>Live queue (all doctors)</div>
            <div className="muted" style={{fontSize: 13}}>
              {rows.length} active entries (Waiting/InProgress)
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
        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Arrived</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{fontWeight: 800}}>{r.patientName}</div>
                    <div className="muted" style={{fontSize: 12}}>
                      CNIC: {r.patientCNIC}
                    </div>
                    {r.symptoms ? (
                      <div className="muted" style={{fontSize: 12, marginTop: 4}}>
                        {r.symptoms}
                      </div>
                    ) : null}
                  </td>
                  <td className="muted" style={{fontSize: 13}}>
                    {r.doctorName || '—'}
                  </td>
                  <td>
                    <span className="pill">{r.status}</span>
                    {r.criticalFactors ? (
                      <div className="muted" style={{fontSize: 12, marginTop: 4}}>
                        {r.criticalFactors}
                      </div>
                    ) : null}
                  </td>
                  <td style={{fontWeight: 800}}>{r.priorityScore}</td>
                  <td className="muted" style={{fontSize: 13}}>
                    {new Date(r.arrivalTime).toLocaleString()}
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

