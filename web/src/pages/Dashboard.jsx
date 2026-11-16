import { Link } from 'react-router-dom';
import { useFetch, Alert, PageHead } from '../components.jsx';
import { money } from '../api';

export default function Dashboard() {
  const { data: d, loading, error } = useFetch('/reports/dashboard');
  if (loading) return <p>Loading...</p>;
  if (error) return <Alert>{error}</Alert>;
  const max = Math.max(1, ...d.dailySales.map((x) => x.total));
  const stats = [
    ['Products', d.products], ['Units in stock', d.totalStock], ['Stock value', money(d.stockValue)],
    ['Orders', d.orders], ['Sales', money(d.sales)], ['Low stock', d.lowStock, d.lowStock > 0],
  ];
  return (
    <>
      <PageHead title="Dashboard" />
      <div className="stats">
        {stats.map(([label, value, warn]) => (
          <div key={label} className={'stat' + (warn ? ' warn' : '')}><span>{label}</span><b>{value}</b></div>
        ))}
      </div>
      {d.lowStock > 0 && <Alert kind="warn">{d.lowStock} product(s) are at or below their low-stock level. <Link to="/inventory">Review and restock</Link></Alert>}
      <div className="grid2">
        <section className="panel">
          <h3>Sales, last 7 days</h3>
          {d.dailySales.length === 0 ? <p className="empty">No sales in the last 7 days.</p> : (
            <div className="bars">
              {d.dailySales.map((x) => (
                <div key={x._id} className="bar"><i style={{ height: `${(x.total / max) * 100}%` }} title={money(x.total)} /><small>{x._id.slice(5)}</small></div>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <h3>Recent orders</h3>
          {d.recentOrders.length === 0 ? <p className="empty">No orders yet. <Link to="/orders">Create the first order</Link></p> : (
            <table><tbody>
              {d.recentOrders.map((o) => (
                <tr key={o._id}><td>{o.customer?.name}</td><td>{money(o.total)}</td><td><span className={'tag ' + o.status}>{o.status}</span></td></tr>
              ))}
            </tbody></table>
          )}
        </section>
      </div>
    </>
  );
}
