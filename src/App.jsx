import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AddTransaction from './pages/AddTransaction';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Inventory from './pages/Inventory';
import AnalystTools from './pages/AnalystTools';
import { LayoutDashboard, UserCircle, LogOut, PlusCircle, Users as UsersIcon, ChartBar, Package, FileText } from 'lucide-react';

function PrivateRoute({ children, roles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" />;

  if (roles) {
    const userRole = user?.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    if (!allowedRoles.includes(userRole)) {
      // If unauthorized for dashboard, go to add-transaction or profile
      return <Navigate to={userRole === 'staff' ? '/add-transaction' : '/profile'} />;
    }
  }
  return children;
}

function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const userRole = user?.role?.toLowerCase();

  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

  // Role-based visibility (case-insensitive)
  const canSeeDashboard = ['admin', 'owner', 'accountant', 'analyst'].includes(userRole);
  const canSeeAddTx = ['admin', 'owner', 'accountant', 'staff', 'analyst'].includes(userRole);
  const canSeeAnalyst = userRole === 'analyst';
  const isAdmin = userRole === 'admin';
  const canSeeInventory = ['admin', 'owner', 'staff'].includes(userRole);

  return (
    <div className="sidebar">
      <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '2rem', lineHeight: '1.4' }}>Tech Business<br />Analyzer</h2>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {canSeeDashboard && (
          <Link to="/" className={isActive('/')}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
        )}
        {canSeeAddTx && (
          <Link to="/add-transaction" className={isActive('/add-transaction')}>
            <PlusCircle size={20} /> Add Transaction
          </Link>
        )}
        {(userRole === 'admin' || userRole === 'owner' || userRole === 'accountant' || userRole === 'analyst') && (
          <Link to="/reports" className={isActive('/reports')}>
            <FileText size={20} /> Reports
          </Link>
        )}
        {canSeeInventory && (
          <Link to="/inventory" className={isActive('/inventory')}>
            <Package size={20} /> Inventory
          </Link>
        )}
        {isAdmin && (
          <Link to="/users" className={isActive('/users')}>
            <UsersIcon size={20} /> Users
          </Link>
        )}
        {canSeeAnalyst && (
          <Link to="/analyst" className={isActive('/analyst')}>
            <ChartBar size={20} /> Analyst Tools
          </Link>
        )}
        <Link to="/profile" className={isActive('/profile')}>
          <UserCircle size={20} /> Profile
        </Link>
      </nav>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logged in as</div>
        <div style={{ fontWeight: '600', color: 'var(--accent)' }}>{user?.username}</div>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</div>
      </div>
      <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={
        userRole === 'staff' ? <Navigate to="/add-transaction" /> :
          <PrivateRoute roles={['Admin', 'Owner', 'Accountant', 'Analyst']}>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
      } />

      <Route path="/add-transaction" element={
        <PrivateRoute roles={['Admin', 'Owner', 'Accountant', 'Staff', 'Analyst']}>
          <Layout><AddTransaction /></Layout>
        </PrivateRoute>
      } />

      <Route path="/reports" element={
        <PrivateRoute roles={['Admin', 'Owner', 'Accountant', 'Analyst']}>
          <Layout><Reports /></Layout>
        </PrivateRoute>
      } />

      <Route path="/profile" element={
        <PrivateRoute>
          <Layout><Profile /></Layout>
        </PrivateRoute>
      } />

      <Route path="/inventory" element={
        <PrivateRoute roles={['Admin', 'Owner', 'Staff']}>
          <Layout><Inventory /></Layout>
        </PrivateRoute>
      } />

      <Route path="/users" element={
        <PrivateRoute roles={['Admin']}>
          <Layout><Users /></Layout>
        </PrivateRoute>
      } />

      <Route path="/analyst" element={
        <PrivateRoute roles={['Analyst']}>
          <Layout><AnalystTools /></Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
