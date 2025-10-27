
import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [roleValue, setRoleValue] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      console.warn('No token found');
      return;
    }
    fetch('http://localhost:3000/api/v1/current_user', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCurrentUser(data))
      .catch(err => console.error('Error fetching current user:', err));

    fetch('http://localhost:3000/api/v1/users', {
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
    fetch(`http://localhost:3000/api/v1/users/${id}`, {
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
        setEditingId(null);
      });
  };

  return (
    <div>
      <NavBar user={currentUser} />
      <div className="user-management-container">
        <div className="user-management-table">
          <h1 className="user-management-table-title">User Management</h1>
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
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name || user.email}</td>
                    <td>{user.email}</td>
                    <td>
                      {editingId === user.id ? (
                        <select
                          value={roleValue || user.role}
                          onChange={e => setRoleValue(e.target.value)}
                          onBlur={() => {
                            if (roleValue && roleValue !== user.role) updateRole(user.id, roleValue);
                            setEditingId(null);
                          }}
                          autoFocus
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="role-cell"
                          style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 600 }}
                          onClick={() => {
                            setEditingId(user.id);
                            setRoleValue(user.role);
                          }}
                        >
                          {roles.find(r => r.value === user.role)?.label || user.role}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="change-role-btn"
                        style={{
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '8px 18px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '15px',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => {
                          setEditingId(user.id);
                          setRoleValue(user.role);
                        }}
                      >
                        Change Role
                      </button>
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