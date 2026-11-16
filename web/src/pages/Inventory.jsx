import { useState } from 'react';
import api, { errMsg } from '../api';
import { Alert, Empty, Field, Modal, PageHead, useFetch } from '../components.jsx';

export default function Inventory() {
  const products = useFetch('/products');
  const low = useFetch('/inventory/low-stock');
  const moves = useFetch('/inventory/movements');
  const [dlg, setDlg] = useState(null); // { type: 'stock-in'|'stock-out', product, quantity, note }
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const refresh = () => { products.reload(); low.reload(); moves.reload(); };
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api.post(`/inventory/${dlg.type}`, { product: dlg.product, quantity: Number(dlg.quantity), note: dlg.note });
      setMsg(dlg.type === 'stock-in' ? 'Stock added' : 'Stock removed'); setDlg(null); refresh();
    } catch (e2) { setErr(errMsg(e2)); }
  };
  const open = (type, product = '') => { setErr(''); setMsg(''); setDlg({ type, product, quantity: 1, note: '' }); };

  return (
    <>
      <PageHead title="Inventory">
        <button className="primary" onClick={() => open('stock-in')}>Stock in</button>
        <button onClick={() => open('stock-out')}>Stock out</button>
      </PageHead>
      <Alert kind="ok">{msg}</Alert>
      <section className="panel">
        <h3>Low stock</h3>
        {!low.data?.length ? <Empty>Nothing is running low.</Empty> : (
          <table><tbody>
            {low.data.map((p) => (
              <tr key={p._id}><td>{p.name}</td><td className="mono">{p.sku}</td>
                <td><b>{p.stock}</b> left (alert at {p.lowStockThreshold})</td>
                <td><button className="ghost" onClick={() => open('stock-in', p._id)}>Restock</button></td></tr>
            ))}
          </tbody></table>
        )}
      </section>
      <section className="panel">
        <h3>Recent movements</h3>
        {!moves.data?.length ? <Empty>No stock movements yet.</Empty> : (
          <div className="tablewrap"><table>
            <thead><tr><th>When</th><th>Product</th><th>Type</th><th>Qty</th><th>Note</th><th>By</th></tr></thead>
            <tbody>{moves.data.map((m) => (
              <tr key={m._id}><td>{new Date(m.createdAt).toLocaleString()}</td><td>{m.product?.name}</td>
                <td><span className={'tag ' + m.type}>{m.type}</span></td><td>{m.quantity}</td><td>{m.note}</td><td>{m.user?.name}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      {dlg && (
        <Modal title={dlg.type === 'stock-in' ? 'Stock in' : 'Stock out'} onClose={() => setDlg(null)}>
          <form onSubmit={submit}>
            <Alert>{err}</Alert>
            <label className="field"><span>Product</span>
              <select value={dlg.product} onChange={(e) => setDlg({ ...dlg, product: e.target.value })} required>
                <option value="">Choose a product</option>
                {products.data?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.stock} in stock)</option>)}
              </select>
            </label>
            <Field label="Quantity" type="number" min="1" value={dlg.quantity} onChange={(e) => setDlg({ ...dlg, quantity: e.target.value })} required />
            <Field label="Note (optional)" value={dlg.note} onChange={(e) => setDlg({ ...dlg, note: e.target.value })} />
            <button className="primary">{dlg.type === 'stock-in' ? 'Add stock' : 'Remove stock'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
