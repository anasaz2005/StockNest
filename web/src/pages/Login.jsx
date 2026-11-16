import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { errMsg } from '../api';
import { Alert, Field } from '../components.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); nav('/'); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-side"><h1>StockNest</h1><p>Know what is on the shelf, what just sold and what to reorder.</p></div>
      <form className="login-form" onSubmit={submit}>
        <h2>Log in</h2>
        <Alert>{error}</Alert>
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="primary" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      </form>
    </div>
  );
}
