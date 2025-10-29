import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';

const apiUrl = import.meta.env.VITE_API_URL;

export default function PendingUsers() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchPendingUsers();
  }, [token, navigate]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/users/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending users');
      const data = await res.json();
      setPendingUsers(data);
    } catch (err) {
      showNotification('Error loading pending users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/users/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve user');
      showNotification('User approved!', 'success');
      fetchPendingUsers();
    } catch (err) {
      showNotification('Error approving user', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');
      showNotification('User deleted!', 'success');
      fetchPendingUsers();
    } catch (err) {
      showNotification('Error deleting user', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  return (
    <div>
      <Navbar />
      <div className="supplier-detail-container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>{notification.message}</div>
        )}
        <div className="detail-header">
          <button className="btn-back" onClick={() => navigate('/user-management')}>
            ← Back to User Management
          </button>
        </div>
        <div className="detail-content">
          <h1>Pending Users</h1>
          {loading ? (
            <div>Loading...</div>
          ) : pendingUsers.length === 0 ? (
            <div>No pending users.</div>
          ) : (
            <table className="pending-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Domain</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.email.split('@')[1]}</td>
                    <td>
                      <button className="btn-primary" onClick={() => handleApprove(user.id)}>Accept</button>
                      <button className="btn-secondary" onClick={() => handleReject(user.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
