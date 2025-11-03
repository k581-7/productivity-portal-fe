import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/NavBar/NavBar';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './PendingUsers.css';

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
      const res = await api.get('/api/v1/users/pending');
      setPendingUsers(res.data);
    } catch (err) {
      showNotification('Error loading pending users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/v1/users/${id}/approve`);
      showNotification('User approved!', 'success');
      fetchPendingUsers();
    } catch (err) {
      showNotification('Error approving user', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.delete(`/api/v1/users/${id}`);
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
      <div className="pending-users-container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>{notification.message}</div>
        )}
        
        <div className="pending-users-content">
          <h1>Pending Users</h1>
          
          <div className="pending-users-header">
            <button className="btn-back" onClick={() => navigate('/user-management')}>
              ← Back to User Management
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <LoadingSpinner />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="empty-state">
              <p>No pending users.</p>
            </div>
          ) : (
            <div className="pending-users-table">
              <div className="table-header">
                <div className="col-name">Name</div>
                <div className="col-email">Email</div>
                <div className="col-actions">Actions</div>
              </div>
              
              {pendingUsers.map(user => (
                <div key={user.id} className="table-row">
                  <div className="col-name">{user.name}</div>
                  <div className="col-email">{user.email}</div>
                  <div className="col-actions">
                    <button className="btn-accept" onClick={() => handleApprove(user.id)}>
                      Accept
                    </button>
                    <button className="btn-reject" onClick={() => handleReject(user.id)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
