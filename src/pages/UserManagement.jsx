
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import './UserManagement.css';
const apiUrl = import.meta.env.VITE_API_URL;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [dialogId, setDialogId] = useState(null);
  const [roleValue, setRoleValue] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type, user, newRole }
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      console.warn('No token found');
      return;
    }
    fetch(`${apiUrl}/api/v1/current_user`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCurrentUser(data))
      .catch(err => console.error('Error fetching current user:', err));

    fetch(`${apiUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Forbidden');
        return res.json();
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : (data.users || data.data || []));
      })
      .catch(err => {
        console.error('Access denied or error fetching users:', err);
      });
  }, [token]);

  const roles = [
    { value: 'guest', label: 'Guest' },
    { value: 'junior', label: 'Junior' },
    { value: 'leader', label: 'Leader' },
    { value: 'developer', label: 'Developer' }
  ];

  const updateRole = (id, role) => {
  fetch(`${apiUrl}/api/v1/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    })
      .then(res => res.json())
      .then(data => {
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, role: data.user.role } : u)));
        setDialogId(null);
        setConfirmAction(null);
      });
  };

  const disableUser = (id) => {
  fetch(`${apiUrl}/api/v1/users/${id}/disable`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.ok) {
          setUsers(prev => prev.map(u => (u.id === id ? { ...u, disabled: true } : u)));
        }
        return res.json();
      })
      .then(() => {
        setDialogId(null);
        setConfirmAction(null);
      });
  };

  const activateUser = (id) => {
  fetch(`${apiUrl}/api/v1/users/${id}/activate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.ok) {
          setUsers(prev => prev.map(u => (u.id === id ? { ...u, disabled: false } : u)));
        }
        return res.json();
      })
      .then(() => {
        setDialogId(null);
        setConfirmAction(null);
      });
  };

  const navigate = useNavigate();

  return (
    <div>
  <NavBar />
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', maxWidth: '1000px', margin: '0 auto', marginTop: '30px' }}>
        <button className="pending-users-btn" onClick={() => navigate('/pending-users')}>
          Pending Users
        </button>
      </div>
      <div className="user-management-container">
        <div className="user-management-table">
          <h1 className="user-management-title">User Management</h1>
          {users.length === 0 ? (
            <div className="no-users">
              <p>No users found or access denied.</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      {user.name || user.email}
                      <span style={{ marginLeft: 8, color: '#444', fontWeight: 500 }}>
                        ({roles.find(r => r.value === user.role)?.label || user.role})
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.disabled ? (
                        <span style={{ color: '#e53935', fontWeight: 600 }}>Disabled</span>
                      ) : (
                        <span style={{ color: '#388e3c', fontWeight: 600 }}>Active</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="update-user-btn"
                        style={{
                          background: (currentUser && currentUser.id === user.id) ? '#bdbdbd' : '#4CAF50',
                          color: (currentUser && currentUser.id === user.id) ? '#fff' : 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '8px 18px',
                          fontWeight: 600,
                          cursor: (currentUser && currentUser.id === user.id) ? 'not-allowed' : 'pointer',
                          fontSize: '15px',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => {
                          if (!(currentUser && currentUser.id === user.id)) {
                            setDialogId(user.id);
                            setRoleValue(user.role);
                          }
                        }}
                        disabled={currentUser && currentUser.id === user.id}
                      >
                        Update User
                      </button>
                      {dialogId === user.id && (
                        <div className="user-dialog-backdrop" onClick={() => setDialogId(null)}>
                          <div className="user-dialog" onClick={e => e.stopPropagation()}>
                            <h2>Update User</h2>
                            <div style={{ marginBottom: 18 }}>
                              <label htmlFor="role-select" style={{ fontWeight: 500 }}>Change Role:</label>
                              <select
                                id="role-select"
                                value={roleValue}
                                onChange={e => setRoleValue(e.target.value)}
                                style={{ marginLeft: 10 }}
                              >
                                {roles.map(role => (
                                  <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                              </select>
                              <button
                                className="dialog-action-btn"
                                style={{ marginLeft: 12, background: '#2563eb', color: 'white' }}
                                onClick={() => {
                                  if (roleValue && roleValue !== user.role) {
                                    setConfirmAction({ type: 'role', user, newRole: roleValue });
                                  }
                                }}
                              >
                                Save Role
                              </button>
                            </div>
                            <div>
                              {user.disabled ? (
                                <button
                                  className="dialog-action-btn"
                                  style={{ background: '#388e3c', color: 'white' }}
                                  onClick={() => setConfirmAction({ type: 'activate', user })}
                                >
                                  Reactivate User
                                </button>
                              ) : (
                                <button
                                  className="dialog-action-btn"
                                  style={{ background: '#e53935', color: 'white' }}
                                  onClick={() => setConfirmAction({ type: 'disable', user })}
                                >
                                  Disable User
                                </button>
                              )}
      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="user-dialog-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="user-dialog" onClick={e => e.stopPropagation()}>
            {confirmAction.type === 'disable' && (
              <>
                <h2>Are you sure you would like to disable {confirmAction.user.name || confirmAction.user.email}?</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <button
                    className="confirm-yes-btn"
                    onClick={() => disableUser(confirmAction.user.id)}
                  >Yes</button>
                  <button
                    className="confirm-no-btn"
                    onClick={() => setConfirmAction(null)}
                  >No</button>
                </div>
              </>
            )}
            {confirmAction.type === 'activate' && (
              <>
                <h2>Are you sure you would like to Reactivate {confirmAction.user.name || confirmAction.user.email}?</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <button
                    className="confirm-yes-btn"
                    onClick={() => activateUser(confirmAction.user.id)}
                  >Yes</button>
                  <button
                    className="confirm-no-btn"
                    onClick={() => setConfirmAction(null)}
                  >No</button>
                </div>
              </>
            )}
            {confirmAction.type === 'role' && (
              <>
                <h2>You're changing {confirmAction.user.name || confirmAction.user.email}'s role to {roles.find(r => r.value === confirmAction.newRole)?.label || confirmAction.newRole}. Proceed changing?</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <button
                    className="confirm-yes-btn"
                    onClick={() => updateRole(confirmAction.user.id, confirmAction.newRole)}
                  >Yes</button>
                  <button
                    className="confirm-no-btn"
                    onClick={() => setConfirmAction(null)}
                  >No</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
                              <button
                                className="dialog-action-btn"
                                style={{ marginLeft: 10 }}
                                onClick={() => setDialogId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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