import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import TodoList from './components/TodoList/TodoList';
import { useUser } from './App';
import api from './api/axios';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import './Dashboard.css';

const Dashboard = () => {
  const user = useUser();
  const navigate = useNavigate();
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [userMetrics, setUserMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week'); // 'week' or 'month'

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserMetrics();
    }
  }, [user, dateRange]);

  const fetchUserMetrics = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let startDate;
      
      if (dateRange === 'week') {
        // Get start of current week (Monday)
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so adjust
        startDate = new Date(today);
        startDate.setDate(today.getDate() - diff);
      } else {
        // Get start of current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }
      
      const endDate = today.toISOString().split('T')[0];
      const start = startDate.toISOString().split('T')[0];
      
      const response = await api.get(
        `/api/v1/summary/dashboard?start_date=${start}&end_date=${endDate}`
      );
      
      // Show all users including guests
      setUserMetrics(response.data.user_metrics || []);
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      setUserMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Guest';

  return (
    <div>
      <NavBar user={user} />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Hi, {firstName}. What's on your mind?</h1>
          <button 
            className="notes-button" 
            onClick={() => setShowNotesModal(true)}
            title="Open Notes"
          >
            <StickyNote2Icon sx={{ fontSize: 28, transform: 'scaleY(1.15)' }} />
          </button>
        </div>

        {/* Upload Productivity Entry Button - Junior, Leader, Developer only */}
        {(user?.role === 'junior' || user?.role === 'leader' || user?.role === 'developer') && (
          <div className="quick-action">
            <button 
              className="btn-upload-entry"
              onClick={() => navigate('/prod-entries')}
            >
              <UploadFileIcon sx={{ fontSize: 24 }} />
              Upload Productivity Entry
            </button>
          </div>
        )}

        {/* User Performance Chart */}
        <div className="performance-section">
          <div className="performance-header">
            <h2>Team Performance</h2>
            <div className="date-range-toggle">
              <button 
                className={dateRange === 'week' ? 'active' : ''}
                onClick={() => setDateRange('week')}
              >
                This Week
              </button>
              <button 
                className={dateRange === 'month' ? 'active' : ''}
                onClick={() => setDateRange('month')}
              >
                This Month
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-chart">Loading performance data...</div>
          ) : userMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={userMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="metrics.auto_total" name="Auto Mapping" fill="#166534" />
                <Bar dataKey="metrics.manual_total" name="Manual Mapping" fill="#991b1b" />
                <Bar dataKey="metrics.duplicates" name="Duplicates" fill="#ea580c" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No performance data available for this period.</div>
          )}
        </div>

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>My Notes</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowNotesModal(false)}
                >
                  ×
                </button>
              </div>
              <TodoList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;