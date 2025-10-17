import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import UserManagement from './pages/UserManagement';
import LoginButton from './components/LoginButton';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      window.history.replaceState({}, document.title, '/dashboard');
    }

    const token = tokenFromUrl || localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3000/api/v1/current_user', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Fetched user:', data);
        setUser(data);
      })
      .catch(err => console.error('Error fetching user:', err));
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginButton />} />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route
        path="/user-management"
        element={
          user?.role === 'developer' ? (
            <UserManagement />
          ) : (
            <Navigate to="/dashboard" />
          )
        }
      />
    </Routes>
  );
}