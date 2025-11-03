import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import NavBar from '../../components/NavBar/NavBar';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Summary.css';

// Updated color scheme to match Daily Productivity
const COLORS = ['#166534', '#991b1b', '#ea580c', '#1e40af', '#854d0e'];

const Summary = ({ user }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
        return;
      }
    }
    fetchSummaryData();
  }, [dateRange, user]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/v1/summary/dashboard?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      setSummaryData(response.data);
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDailyTrendsChart = () => {
    if (!summaryData?.daily_trends) return null;

    return (
      <div className="chart-container">
        <h2>Daily Trends</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={summaryData.daily_trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="auto_total" name="Auto Mapping" stroke="#166534" strokeWidth={2} />
            <Line type="monotone" dataKey="manual_total" name="Manual Mapping" stroke="#991b1b" strokeWidth={2} />
            <Line type="monotone" dataKey="duplicates" name="Duplicates" stroke="#ea580c" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderUserMetricsChart = () => {
    if (!summaryData?.user_metrics) return null;
    // Show all users including guests
    return (
      <div className="chart-container">
        <h2>User Performance</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={summaryData.user_metrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
      </div>
    );
  };

  const renderOverallMetricsPie = () => {
    if (!summaryData?.overall_metrics) return null;

    const { manual_mapping, auto_mapping } = summaryData.overall_metrics;
    const data = [
      { name: 'Auto Accepted', value: auto_mapping.accepted },
      { name: 'Auto Dismissed', value: auto_mapping.dismissed },
      { name: 'Manually Mapped', value: manual_mapping.manually_mapped },
      { name: 'Incorrect Data', value: manual_mapping.incorrect_supplier_data },
      { name: 'Created Property', value: manual_mapping.created_property }
    ];

    return (
      <div className="chart-container">
        <h2>Overall Distribution</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <NavBar user={user} />
      {/* Notification removed */}
      <div className="summary-container">
        <div className="summary-content">
          <h1>Summary Dashboard</h1>
          
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

          <div className="charts-grid">
            {renderOverallMetricsPie()}
            {renderDailyTrendsChart()}
            {renderUserMetricsChart()}
          </div>


          {summaryData?.overall_metrics && (
            <div className="summary-stats">
              <h2>Summary Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Entries</h3>
                  <p className="stat-value">{summaryData.overall_metrics.total_entries}</p>
                </div>
                <div className="stat-card">
                  <h3>Auto Mapping</h3>
                  <p className="stat-value">{summaryData.overall_metrics.auto_mapping.total}</p>
                </div>
                <div className="stat-card">
                  <h3>Manual Mapping</h3>
                  <p className="stat-value">{summaryData.overall_metrics.manual_mapping.total}</p>
                </div>
                <div className="stat-card">
                  <h3>Duplicates</h3>
                  <p className="stat-value">{summaryData.overall_metrics.duplicates}</p>
                </div>
                <div className="stat-card">
                  <h3>Productivity Rate</h3>
                  <p className="stat-value">{summaryData.overall_metrics.productivity_rate}/day</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;