// src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import './NavBar.css';

export default function Navbar({ user }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h3>Productivity Portal</h3>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/prod-entry">Prod Entry</Link>
        <Link to="/suppliers">Suppliers</Link>
        <Link to="/daily-prod">Daily Prod</Link>
        <Link to="/summary-dashboard">Summary</Link>
        {user?.role === 'developer' && (
          <Link to="/user-management">User Management</Link>
        )}
      </div>

      <div className="navbar-right">
        <span>{user?.name || 'Guest'}</span>
        <a href="/">Logout</a>
      </div>
    </nav>
  );
}