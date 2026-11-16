import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Alert, Empty, Field, Modal, PageHead, useFetch } from '../components.jsx';

const blank = { name: '', phone: '', email: '', address: '' };

export default function Customers() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useFetch('/customers', { q });
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const { name, phone, email, address } = form;
      if (form._id) await api.put(`/customers/${form._id}`, { name, phone, email, address });
      else await api.post('/customers', { name, phone, email, address });
      setForm(null); reload();
    } catch (e2) { setErr(errMsg(e2)); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try { await api.delete(`/customers/${c._id}`); reload(); } catch (e2) { alert(errMsg(e2)); }
  };

  return (
    <>
      <PageHead title="Customers">
        <input className="search" placeholder="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="primary" onClick={() => { setErr(''); setForm(blank); }}>Add customer</button>
      </PageHead>
      <Alert>{error}</Alert>
      {loading ? <p>Loading...</p> : !data?.length ? <Empty>No customers yet. Add one to start taking orders.</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th></th></tr></thead>
          <tbody>{data.map((c) => (
            <tr key={c._id}><td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.address}</td>
              <td className="rowact">
                <button className="ghost" onClick={() => { setErr(''); setForm(c); }}>Edit</button>
                {isAdmin && <button className="ghost danger" onClick={() => remove(c)}>Delete</button>}
              </td></tr>
          ))}</tbody>
        </table></div>
      )}
      {form && (
        <Modal title={form._id ? 'Edit customer' : 'Add customer'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Alert>{err}</Alert>
            <Field label="Name" value={form.name} onChange={set('name')} required />
            <Field label="Phone" value={form.phone || ''} onChange={set('phone')} />
            <Field label="Email" type="email" value={form.email || ''} onChange={set('email')} />
            <Field label="Address" value={form.address || ''} onChange={set('address')} />
            <button className="primary">Save customer</button>
          </form>
        </Modal>
      )}
    </>
  );
}
