import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import UserManagement from './pages/UserManagement';
import LoginButton from './components/LoginButton';
import ProdEntries from './pages/ProdEntries';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import SupplierCreate from './pages/SupplierCreate';
import DailyProd from "./pages/DailyProd";
import Summary from "./pages/Summary";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        window.history.replaceState({}, document.title, '/dashboard');
      }

      const token = tokenFromUrl || localStorage.getItem('token');
      console.log('Current token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        console.log('No token found, user needs to log in');
        window.location.href = '/';
        return;
      }

      try {
        console.log('Token found, fetching user data');

        const response = await fetch('http://localhost:3000/api/v1/current_user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        console.log('Fetched user:', data);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('token'); // Clear invalid token
      }
    };

    checkAuthAndFetchUser();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginButton />} />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/prod-entries" element={<ProdEntries user={user} />} />
      <Route path="/suppliers" element={<Suppliers user={user} />} />
      <Route path="/suppliers/create" element={<SupplierCreate user={user} />} />
      <Route path="/suppliers/:id" element={<SupplierDetail user={user} />} />
      <Route path="/daily-prod" element={<DailyProd user={user} />} />
      <Route path="/summary" element={<Summary user={user} />} />
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