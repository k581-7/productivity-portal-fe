import { useState, useEffect } from 'react';
import Navbar from './components/NavBar';
import SummaryChart from './components/SummaryChart';
import MetricsCards from './components/MetricsCards';
import LoadingSpinner from './components/LoadingSpinner';
import Notification from './components/Notification';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(
        `http://localhost:3000/api/v1/daily_prods/summary?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data received from server');
      }
      
      setSummaryData(data);
    } catch (error) {
      setNotification({
        message: 'Error fetching dashboard data: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <Navbar user={user} />
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        
        <div className="date-filter">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>

        {summaryData && (
          <>
            <MetricsCards data={summaryData.totals} />
            <div className="chart-container">
              <h2>Productivity Trends</h2>
              <SummaryChart data={summaryData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;