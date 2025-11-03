import { Link } from 'react-router-dom';
import './NavBar.css';
import logoWhite from '../../assets/PP_white.png';
import { useUser } from '../../App';

export default function NavBar() {
  const user = useUser();
  return (
    <nav className="navbar">
      <div className="app-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <img src={logoWhite} alt="PP Logo" className="navbar-logo" />
            <h3>Productivity Portal</h3>
          </div>

          <div className="navbar-links">
            <Link to="/dashboard">Dashboard</Link>
            
            {/* Productivity Entry - Junior, Leader, Developer */}
            {(user?.role === 'junior' || user?.role === 'leader' || user?.role === 'developer') && (
              <Link to="/prod-entries">Productivity Entry</Link>
            )}
            
            {/* Suppliers - Guest (view only), Leader (can edit), Developer */}
            {(user?.role === 'guest' || user?.role === 'leader' || user?.role === 'developer') && (
              <Link to="/suppliers">Suppliers</Link>
            )}
            
            {/* Daily Prod - Junior (no edit), Guest (no edit), Leader (can edit), Developer */}
            <Link to="/daily-prod">Daily Prod</Link>
            
            {/* Summary - Junior, Guest, Leader, Developer */}
            {(user?.role === 'junior' || user?.role === 'guest' || user?.role === 'leader' || user?.role === 'developer') && (
              <Link to="/summary">Summary</Link>
            )}
            
            {/* Upload History - Leader, Developer */}
            {(user?.role === 'leader' || user?.role === 'developer') && (
              <Link to="/upload-history">Upload History</Link>
            )}
            
            {/* User Management - Developer only */}
            {user?.role === 'developer' && (
              <Link to="/user-management">User Management</Link>
            )}
          </div>

          <div className="navbar-right">
            {user?.picture && (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="user-avatar"
              />
            )}
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