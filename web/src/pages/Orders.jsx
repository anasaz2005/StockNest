import { useState } from 'react';
import api, { errMsg, money } from '../api';
import { Alert, Empty, Modal, PageHead, useFetch } from '../components.jsx';

export default function Orders() {
  const orders = useFetch('/orders');
  const customers = useFetch('/customers');
  const products = useFetch('/products');
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1 }]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const price = (id) => products.data?.find((p) => p._id === id)?.price || 0;
  const total = lines.reduce((s, l) => s + price(l.product) * (Number(l.quantity) || 0), 0);
  const setLine = (i, patch) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const create = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api.post('/orders', { customer, items: lines.map((l) => ({ product: l.product, quantity: Number(l.quantity) })) });
      setOpen(false); setMsg('Order created and stock updated'); setLines([{ product: '', quantity: 1 }]); setCustomer('');
      orders.reload(); products.reload();
    } catch (e2) { setErr(errMsg(e2)); }
  };
  const cancel = async (o) => {
    if (!window.confirm('Cancel this order and return the items to stock?')) return;
    try { await api.patch(`/orders/${o._id}/cancel`); setMsg('Order cancelled and stock restored'); orders.reload(); products.reload(); }
    catch (e2) { setMsg(''); alert(errMsg(e2)); }
  };

  return (
    <>
      <PageHead title="Orders"><button className="primary" onClick={() => { setErr(''); setMsg(''); setOpen(true); }}>New order</button></PageHead>
      <Alert kind="ok">{msg}</Alert>
      <Alert>{orders.error}</Alert>
      {orders.loading ? <p>Loading...</p> : !orders.data?.length ? <Empty>No orders yet. Create the first one.</Empty> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>{orders.data.map((o) => (
            <tr key={o._id}>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td><td>{o.customer?.name}</td>
              <td>{o.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</td><td>{money(o.total)}</td>
              <td><span className={'tag ' + o.status}>{o.status}</span></td>
              <td>{o.status === 'completed' && <button className="ghost danger" onClick={() => cancel(o)}>Cancel</button>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {open && (
        <Modal title="New order" onClose={() => setOpen(false)}>
          <form onSubmit={create}>
            <Alert>{err}</Alert>
            <label className="field"><span>Customer</span>
              <select value={customer} onChange={(e) => setCustomer(e.target.value)} required>
                <option value="">Choose a customer</option>
                {customers.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </label>
            {lines.map((l, i) => (
              <div className="line" key={i}>
                <select value={l.product} onChange={(e) => setLine(i, { product: e.target.value })} required>
                  <option value="">Choose a product</option>
                  {products.data?.map((p) => <option key={p._id} value={p._id} disabled={p.stock < 1}>{p.name} - {money(p.price)} ({p.stock} left)</option>)}
                </select>
                <input type="number" min="1" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} aria-label="Quantity" required />
                {lines.length > 1 && <button type="button" className="ghost danger" onClick={() => setLines(lines.filter((_, j) => j !== i))}>Remove</button>}
              </div>
            ))}
            <button type="button" className="ghost" onClick={() => setLines([...lines, { product: '', quantity: 1 }])}>Add another item</button>
            <p className="total">Total: <b>{money(total)}</b></p>
            <button className="primary">Place order</button>
          </form>
        </Modal>
      )}
    </>
  );
}
