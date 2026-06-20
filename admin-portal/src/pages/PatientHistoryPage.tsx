import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {api} from '../lib/api';
import type {AdminPatientHistory} from '../lib/types';

export default function PatientHistoryPage() {
  const nav = useNavigate();
  const {id} = useParams();
  const patientId = Number(id);

  const [data, setData] = useState<AdminPatientHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    if (!Number.isFinite(patientId)) {
      setErr('Invalid patient id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<AdminPatientHistory>(`/api/admin/patients/${patientId}/history`);
      setData(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const title = useMemo(() => {
    if (!data) return 'Patient history';
    return `${data.patient.name} — medical history`;
  }, [data]);

  return (
    <div style={{display: 'grid', gap: 16}}>
      <div className="card">
        <div className="row">
          <div>
            <div style={{fontWeight: 900, fontSize: 18}}>{title}</div>
            {data ? (
              <div className="muted" style={{fontSize: 13}}>
                CNIC: {data.patient.cnic} · #{data.patient.id}
              </div>
            ) : null}
          </div>
          <div className="spacer" />
          <button className="secondary" onClick={() => nav('/patients')}>Back</button>
          <button className="secondary" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
        {err ? <div className="error" style={{marginTop: 10}}>{err}</div> : null}
      </div>

      <div className="card">
        {loading ? (
          <div className="muted">Loading…</div>
        ) : !data ? (
          <div className="muted">No data</div>
        ) : (
          <div style={{display: 'grid', gap: 18}}>
            <section>
              <div style={{fontWeight: 900, marginBottom: 8}}>Reports ({data.reports.length})</div>
              {data.reports.length === 0 ? (
                <div className="muted">No reports.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div style={{fontWeight: 800}}>{r.reportType}</div>
                          <div className="muted" style={{fontSize: 12}}>#{r.id}</div>
                        </td>
                        <td className="muted" style={{fontSize: 13}}>{r.doctorName || '—'}</td>
                        <td className="muted" style={{fontSize: 13}}>{new Date(r.reportDate).toLocaleString()}</td>
                        <td className="muted" style={{fontSize: 13, maxWidth: 520}}>
                          {r.summary ? r.summary : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <div style={{fontWeight: 900, marginBottom: 8}}>Prescriptions ({data.prescriptions.length})</div>
              {data.prescriptions.length === 0 ? (
                <div className="muted">No prescriptions.</div>
              ) : (
                <div style={{display: 'grid', gap: 12}}>
                  {data.prescriptions.map(p => (
                    <div key={p.id} className="card" style={{background: '#0b122008'}}>
                      <div className="row" style={{marginBottom: 8}}>
                        <div style={{fontWeight: 900}}>
                          Prescription #{p.id}
                        </div>
                        <div className="spacer" />
                        <div className="muted" style={{fontSize: 13}}>
                          {new Date(p.prescriptionDate).toLocaleString()}
                        </div>
                      </div>
                      <div className="muted" style={{fontSize: 13, marginBottom: 6}}>
                        Doctor: {p.doctorName} · Diagnosis: {p.diagnosis || '—'}
                      </div>
                      {p.instructions ? (
                        <div className="muted" style={{fontSize: 13, marginBottom: 10}}>
                          Instructions: {p.instructions}
                        </div>
                      ) : null}
                      <table>
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.items.map(i => (
                            <tr key={i.id}>
                              <td style={{fontWeight: 800}}>{i.medicineName}</td>
                              <td className="muted" style={{fontSize: 13}}>{i.dosage}</td>
                              <td className="muted" style={{fontSize: 13}}>{i.frequency}</td>
                              <td className="muted" style={{fontSize: 13}}>{i.duration} days</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div style={{fontWeight: 900, marginBottom: 8}}>Reminders ({data.reminders.length})</div>
              {data.reminders.length === 0 ? (
                <div className="muted">No reminders.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reminders.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div style={{fontWeight: 800}}>{r.medicineName}</div>
                          <div className="muted" style={{fontSize: 12}}>{r.dosage}</div>
                        </td>
                        <td className="muted" style={{fontSize: 13}}>{new Date(r.reminderDate).toLocaleDateString()}</td>
                        <td className="muted" style={{fontSize: 13}}>{r.reminderTime}</td>
                        <td>{r.isCompleted ? <span className="pill ok">Done</span> : <span className="pill">Pending</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <div style={{fontWeight: 900, marginBottom: 8}}>Visits / Queue ({data.visits.length})</div>
              {data.visits.length === 0 ? (
                <div className="muted">No queue visits.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Arrived</th>
                      <th>Status</th>
                      <th>Doctor</th>
                      <th>Symptoms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.visits.map(v => (
                      <tr key={v.id}>
                        <td className="muted" style={{fontSize: 13}}>{new Date(v.arrivalTime).toLocaleString()}</td>
                        <td><span className="pill">{v.status}</span></td>
                        <td className="muted" style={{fontSize: 13}}>{v.doctorName || '—'}</td>
                        <td className="muted" style={{fontSize: 13, maxWidth: 520}}>{v.symptoms || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

