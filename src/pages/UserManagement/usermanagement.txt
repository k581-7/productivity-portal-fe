import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      console.warn('No token found');
      return;
    }

    // Fetch current user
    fetch('http://localhost:3000/api/v1/current_user', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setCurrentUser(data))
      .catch(err => console.error('Error fetching current user:', err));

    // Fetch all users
    fetch('http://localhost:3000/api/v1/users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Forbidden');
        return res.json();
      })
      .then(data => {
        console.log('Fetched users:', data);
        setUsers(data);
      })
      .catch(err => {
        console.error('Access denied or error fetching users:', err);
      });
  }, [token]);

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
        console.log('Updated:', data);
        setUsers(prev =>
          prev.map(u => (u.id === id ? { ...u, role: data.user.role } : u))
        );
      });
  };

  const roles = [
    { value: 'guest', label: 'Guest' },
    { value: 'junior', label: 'Junior' },
    { value: 'leader', label: 'Leader' },
    { value: 'developer', label: 'Developer' }
  ];

  return (
    <div>
      <NavBar user={currentUser} />
      
      <div className="user-management-container">
        <h1>User Management</h1>

        <div className="user-management-form">
          {users.length === 0 ? (
            <div className="no-users">
              <p>No users found or access denied.</p>
            </div>
          ) : (
            <form>
              {users.map(user => (
                <div key={user.id} className="user-role-group">
                  <label className="user-name-label">
                    {user.name || user.email}
                  </label>
                  
                  <div className="role-options">
                    {roles.map(role => (
                      <label
                        key={role.value}
                        className="role-radio-label"
                      >
                        <input
                          type="radio"
                          name={`role-${user.id}`}
                          value={role.value}
                          checked={user.role === role.value}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          className="role-radio-input"
                        />
                        <span className={user.role === role.value ? 'selected' : ''}>
                          {role.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}