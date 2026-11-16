import { useState } from 'react';
import { money } from '../api';
import { Alert, Empty, PageHead, useFetch } from '../components.jsx';

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const sales = useFetch('/reports/sales', { from: from || undefined, to: to || undefined });
  const inv = useFetch('/reports/inventory');
  const s = sales.data;

  const exportCsv = () => {
    const rows = [['Name', 'SKU', 'Category', 'Price', 'Stock', 'Value', 'Low'],
      ...inv.data.products.map((p) => [p.name, p.sku, p.category, p.price, p.stock, p.value, p.low ? 'yes' : 'no'])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'inventory-report.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead title="Reports" />
      <Alert>{sales.error || inv.error}</Alert>
      <section className="panel">
        <h3>Sales</h3>
        <div className="filters">
          <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        {s && (
          <>
            <div className="stats">
              <div className="stat"><span>Revenue</span><b>{money(s.revenue)}</b></div>
              <div className="stat"><span>Orders</span><b>{s.orders}</b></div>
              <div className="stat"><span>Average order</span><b>{money(s.averageOrder)}</b></div>
            </div>
            <div className="grid2">
              <div><h4>By day</h4>{!s.byDay.length ? <Empty>No sales in this period.</Empty> : (
                <table><tbody>{s.byDay.map((d) => <tr key={d._id}><td>{d._id}</td><td>{d.orders} orders</td><td>{money(d.revenue)}</td></tr>)}</tbody></table>)}</div>
              <div><h4>Top products</h4>{!s.topProducts.length ? <Empty>Nothing sold yet.</Empty> : (
                <table><tbody>{s.topProducts.map((p) => <tr key={p._id}><td>{p.name}</td><td>{p.units} sold</td><td>{money(p.revenue)}</td></tr>)}</tbody></table>)}</div>
            </div>
          </>
        )}
      </section>
      <section className="panel">
        <div className="pagehead"><h3>Inventory</h3>{inv.data && <button onClick={exportCsv}>Download CSV</button>}</div>
        {inv.data && (
          <>
            <p>Total stock value <b>{money(inv.data.totalValue)}</b>. Low-stock products: <b>{inv.data.lowStockCount}</b>.</p>
            <div className="tablewrap"><table>
              <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Price</th><th>Value</th></tr></thead>
              <tbody>{inv.data.products.map((p) => (
                <tr key={p._id}><td>{p.name}</td><td className="mono">{p.sku}</td>
                  <td>{p.stock} {p.low && <span className="tag low">low</span>}</td><td>{money(p.price)}</td><td>{money(p.value)}</td></tr>
              ))}</tbody>
            </table></div>
          </>
        )}
      </section>
    </>
  );
}
