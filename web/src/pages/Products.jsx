import { useState } from 'react';
import api, { errMsg, money } from '../api';
import { useAuth } from '../auth.jsx';
import { Alert, Empty, Field, Modal, PageHead, useFetch } from '../components.jsx';

const blank = { name: '', sku: '', category: '', price: '', stock: 0, lowStockThreshold: 10 };

export default function Products() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useFetch('/products', { q });
  const [form, setForm] = useState(null); // null = closed
  const [err, setErr] = useState('');

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock), lowStockThreshold: Number(form.lowStockThreshold) };
      if (form._id) await api.put(`/products/${form._id}`, body); else await api.post('/products', body);
      setForm(null); reload();
    } catch (e2) { setErr(errMsg(e2)); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try { await api.delete(`/products/${p._id}`); reload(); } catch (e2) { alert(errMsg(e2)); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHead title="Products">
        <input className="search" placeholder="Search name, SKU or category" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="primary" onClick={() => { setErr(''); setForm(blank); }}>Add product</button>
      </PageHead>
      <Alert>{error}</Alert>
      {loading ? <p>Loading...</p> : !data?.length ? <Empty>No products found. Add your first product.</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td><td className="mono">{p.sku}</td><td>{p.category}</td><td>{money(p.price)}</td>
                <td>{p.stock} {p.stock <= p.lowStockThreshold && <span className="tag low">low</span>}</td>
                <td className="rowact">
                  <button className="ghost" onClick={() => { setErr(''); setForm(p); }}>Edit</button>
                  {isAdmin && <button className="ghost danger" onClick={() => remove(p)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {form && (
        <Modal title={form._id ? 'Edit product' : 'Add product'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Alert>{err}</Alert>
            <Field label="Name" value={form.name} onChange={set('name')} required />
            <Field label="SKU" value={form.sku} onChange={set('sku')} required />
            <Field label="Category" value={form.category} onChange={set('category')} />
            <Field label="Price (₹)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
            {!form._id && <Field label="Opening stock" type="number" min="0" value={form.stock} onChange={set('stock')} />}
            <Field label="Low-stock level" type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
            <button className="primary">Save product</button>
          </form>
        </Modal>
      )}
    </>
  );
}
