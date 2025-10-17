import { useEffect, useState } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      console.warn('No token found');
      return;
    }

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
        console.log('Fetched users:', data); // Add this to verify data
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

  return (
    <div>
      <h2>User Management</h2>

      {users.length === 0 ? (
        <p>No users found or access denied.</p>
      ) : (
        users.map(user => (
          <div key={user.id}>
            <p>{user.name || user.email} - {user.role}</p>
            <select
              onChange={e => updateRole(user.id, e.target.value)}
              defaultValue={user.role}
            >
              <option value="guest">Guest</option>
              <option value="junior">Junior</option>
              <option value="leader">Leader</option>
              <option value="developer">Dev</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
}