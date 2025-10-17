import { useEffect, useState } from 'react';
import Navbar from './components/NavBar';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    const storedToken = localStorage.getItem('token');
    const activeToken = urlToken || storedToken;

    if (urlToken) {
      localStorage.setItem('token', urlToken); // Save token for future use
    }

    if (!activeToken) return;

    fetch('http://localhost:3000/api/v1/current_user', {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => {
        console.error('Failed to fetch user:', err);
        setUser(null);
      });
  }, []);

  return (
    <div>
      <Navbar user={user} />
      <div style={{ padding: '20px' }}>
        <h1>Welcome to your dashboard!</h1>
        {user ? (
          <p>
            Signed in as <strong>{user.name || user.email || 'Unknown'}</strong> ({user.role || 'guest'})
          </p>
        ) : (
          <p>Loading user info...</p>
        )}
      </div>
    </div>
  );
}