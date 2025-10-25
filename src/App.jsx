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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        setIsLoading(true);
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
          setUser(null);
          setIsLoading(false);
          return;
        }

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
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginButton />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/prod-entries"
        element={user ? <ProdEntries user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/suppliers"
        element={user ? <Suppliers user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/suppliers/create"
        element={user ? <SupplierCreate user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/suppliers/:id"
        element={user ? <SupplierDetail user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/daily-prod"
        element={user ? <DailyProd user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/summary"
        element={user ? <Summary user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/user-management"
        element={
          user?.role === 'developer' ? (
            <UserManagement />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
    </Routes>
  );
}