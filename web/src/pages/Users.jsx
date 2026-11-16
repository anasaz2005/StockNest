import { useState } from 'react';
import api, { errMsg } from '../api';
import { Alert, Field, Modal, PageHead, useFetch } from '../components.jsx';

export default function Users() {
  const { data, error, reload } = useFetch('/users');
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.post('/users', form); setForm(null); reload(); } catch (e2) { setErr(errMsg(e2)); }
  };
  const toggle = async (u) => { try { await api.patch(`/users/${u._id}/active`); reload(); } catch (e2) { alert(errMsg(e2)); } };

  return (
    <>
      <PageHead title="Users"><button className="primary" onClick={() => { setErr(''); setForm({ name: '', email: '', password: '', role: 'staff' }); }}>Add user</button></PageHead>
      <Alert>{error}</Alert>
      <div className="tablewrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
        <tbody>{data?.map((u) => (
          <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
            <td><span className={'tag ' + (u.active ? 'completed' : 'cancelled')}>{u.active ? 'active' : 'disabled'}</span></td>
            <td><button className="ghost" onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</button></td></tr>
        ))}</tbody>
      </table></div>
      {form && (
        <Modal title="Add user" onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Alert>{err}</Alert>
            <Field label="Name" value={form.name} onChange={set('name')} required />
            <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Field label="Password (min 6 characters)" type="password" minLength="6" value={form.password} onChange={set('password')} required />
            <label className="field"><span>Role</span>
              <select value={form.role} onChange={set('role')}><option value="staff">Staff</option><option value="admin">Admin</option></select></label>
            <button className="primary">Create user</button>
          </form>
        </Modal>
      )}
    </>
  );
}
