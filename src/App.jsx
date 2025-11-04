import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api/axios';
import Dashboard from './Dashboard';
import UserManagement from './pages/UserManagement/UserManagement';
import PendingUsers from './pages/PendingUsers/PendingUsers';
import LoginButton from './components/LoginButton/LoginButton';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import ProdEntries from './pages/ProdEntries/ProdEntries';
import Suppliers from './pages/Suppliers/Suppliers';
import SupplierDetail from './pages/SupplierDetail/SupplierDetail';
import SupplierCreate from './pages/SupplierCreate/SupplierCreate';
import DailyProd from './pages/DailyProd/DailyProd';
import Summary from './pages/Summary/Summary';
import UploadHistory from './pages/UploadHistory/UploadHistory';

export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        setIsLoading(true);
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get('token');

        if (tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl);
          navigate('/dashboard', { replace: true });
        }

        const token = tokenFromUrl || localStorage.getItem('token');
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const response = await api.get('/api/v1/current_user');
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthAndFetchUser();
  }, [navigate, location.search]);

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
            user && (user.role === 'junior' || user.role === 'guest' || user.role === 'leader' || user.role === 'developer') ? (
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

export default function App() {
  return <AppContent />;
}