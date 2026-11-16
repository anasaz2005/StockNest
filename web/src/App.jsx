import { useState } from 'react';
import { Navigate, NavLink, Route, Routes, Outlet } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Inventory from './pages/Inventory.jsx';
import Customers from './pages/Customers.jsx';
import Orders from './pages/Orders.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';

// Route guard: needs login, and optionally the admin role
function Guard({ admin }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [['/', 'Dashboard'], ['/products', 'Products'], ['/inventory', 'Inventory'], ['/customers', 'Customers'], ['/orders', 'Orders']];
  if (isAdmin) links.push(['/reports', 'Reports'], ['/users', 'Users']);
  return (
    <div className="shell">
      <header className="topbar">
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">Menu</button>
        <strong className="brand">StockNest</strong>
        <span className="who">{user.name} ({user.role})</span>
      </header>
      <nav className={'side' + (open ? ' open' : '')} onClick={() => setOpen(false)}>
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
        <button className="linkbtn" onClick={logout}>Log out</button>
      </nav>
      <main className="main"><Outlet /></main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route element={<Guard admin />}>
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
