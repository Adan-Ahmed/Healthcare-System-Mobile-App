import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {api} from '../lib/api';
import {setAuth} from '../lib/auth';
import type {AuthResponse} from '../lib/types';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>('/api/auth/admin/login', {email, password});
      setAuth(res.data);
      nav('/doctors', {replace: true});
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{maxWidth: 520}}>
      <div style={{fontWeight: 900, fontSize: 18, marginBottom: 10}}>Admin login</div>
      <div className="muted" style={{marginBottom: 12}}>
        Uses `POST /api/auth/admin/login`
      </div>

      <div style={{display: 'grid', gap: 10}}>
        <div>
          <div className="muted" style={{fontSize: 12, marginBottom: 6}}>
            Email
          </div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div>
          <div className="muted" style={{fontSize: 12, marginBottom: 6}}>
            Password
          </div>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            onKeyDown={e => {
              if (e.key === 'Enter') submit();
            }}
          />
        </div>
        {error ? <div className="error">{error}</div> : null}
        <button onClick={submit} disabled={loading || !email || !password}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

