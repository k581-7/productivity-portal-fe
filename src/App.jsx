import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import UserManagement from './pages/UserManagement';
import PendingUsers from './pages/PendingUsers';
import LoginButton from './components/LoginButton';
import LoadingSpinner from './components/LoadingSpinner';
import ProdEntries from './pages/ProdEntries';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import SupplierCreate from './pages/SupplierCreate';
import DailyProd from "./pages/DailyProd";
import Summary from "./pages/Summary";
import UploadHistory from "./pages/UploadHistory";

export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

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
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/v1/current_user`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthAndFetchUser();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <UserContext.Provider value={user}>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginButton />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" replace />}
        />
        <Route
          path="/prod-entries"
          element={
            user && (user.role === 'junior' || user.role === 'leader' || user.role === 'developer') ? (
              <ProdEntries />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/suppliers"
          element={
            user && (user.role === 'guest' || user.role === 'leader' || user.role === 'developer') ? (
              <Suppliers />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/suppliers/create"
          element={
            user && (user.role === 'leader' || user.role === 'developer') ? (
              <SupplierCreate />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/suppliers/:id"
          element={
            user && (user.role === 'guest' || user.role === 'leader' || user.role === 'developer') ? (
              <SupplierDetail />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/daily-prod"
          element={user ? <DailyProd /> : <Navigate to="/" replace />}
        />
        <Route
          path="/summary"
          element={
            user && (user.role === 'guest' || user.role === 'leader' || user.role === 'developer') ? (
              <Summary />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/upload-history"
          element={
            user && (user.role === 'leader' || user.role === 'developer') ? (
              <UploadHistory />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
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
        <Route
          path="/pending-users"
          element={
            user?.role === 'developer' ? (
              <PendingUsers />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Routes>
    </UserContext.Provider>
  );
}