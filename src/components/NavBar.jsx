import { Link } from 'react-router-dom';
import './NavBar.css';

export default function NavBar({ user }) {
  return (
    <nav className="navbar">
      <div className="app-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h3>Productivity Portal</h3>
          </div>

          <div className="navbar-links">
            <Link to="/dashboard">Dashboard</Link>
            {/* Hide Productivity Entry for guests */}
            {user?.role !== 'guest' && <Link to="/prod-entries">Productivity Entry</Link>}
            <Link to="/suppliers">Suppliers</Link>
            <Link to="/daily-prod">Daily Prod</Link>
            <Link to="/summary">Summary</Link>
            {user?.role === 'developer' && (
              <Link to="/user-management">User Management</Link>
            )}
          </div>

          <div className="navbar-right">
            <span>{user?.name || 'Guest'}</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
            >
              Logout
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}