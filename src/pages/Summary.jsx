import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './Summary.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Summary = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  const [dataView, setDataView] = useState('daily'); // 'daily' or 'supplier'

  useEffect(() => {
    fetchSummaryData();
  }, [dataView]);

  const fetchSummaryData = async () => {
    try {
      const endpoint = dataView === 'daily' 
        ? 'http://localhost:3000/api/daily_prods/summary'
        : 'http://localhost:3000/api/suppliers/summary';
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setSummaryData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  // Bar Chart Configuration
  const barChartData = {
    labels: summaryData?.labels || [],
    datasets: [
      {
        label: 'Manual Mapping',
        data: summaryData?.manualMapping || [],
        backgroundColor: '#FF8C00',
      },
      {
        label: 'Auto Mapping',
        data: summaryData?.autoMapping || [],
        backgroundColor: '#90EE90',
      },
      {
        label: 'Duplicates',
        data: summaryData?.duplicates || [],
        backgroundColor: '#87CEEB',
      },
      {
        label: 'Created Property',
        data: summaryData?.createdProperty || [],
        backgroundColor: '#DDA0DD',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${dataView === 'daily' ? 'Daily Productivity' : 'Supplier'} Summary - Trend Analysis`,
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
  };

  // Pie Chart Configuration
  const pieChartData = {
    labels: ['Manual Mapping', 'Auto Mapping', 'Duplicates', 'Cannot be Mapped', 'Created Property'],
    datasets: [
      {
        data: [
          summaryData?.totals?.manualMapping || 0,
          summaryData?.totals?.autoMapping || 0,
          summaryData?.totals?.duplicates || 0,
          summaryData?.totals?.cannotBeMapped || 0,
          summaryData?.totals?.createdProperty || 0,
        ],
        backgroundColor: [
          '#FF8C00',
          '#90EE90',
          '#87CEEB',
          '#FFB6C1',
          '#DDA0DD',
        ],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Overall Distribution',
      },
    },
  };

  return (
    <div className="summary-container">
      <h1>Summary Dashboard</h1>

      <div className="controls">
        <div className="control-group">
          <label>Data View:</label>
          <select value={dataView} onChange={(e) => setDataView(e.target.value)}>
            <option value="daily">Daily Productivity</option>
            <option value="supplier">Suppliers</option>
          </select>
        </div>

        <div className="control-group">
          <label>Chart Type:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
      </div>

      <div className="chart-container">
        {chartType === 'bar' ? (
          <Bar data={barChartData} options={barOptions} />
        ) : (
          <Pie data={pieChartData} options={pieOptions} />
        )}
      </div>

      <div className="summary-stats">
        <h2>Summary Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Manual Mapping</h3>
            <p className="stat-value">{summaryData?.totals?.manualMapping || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Auto Mapping</h3>
            <p className="stat-value">{summaryData?.totals?.autoMapping || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Duplicates</h3>
            <p className="stat-value">{summaryData?.totals?.duplicates || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Cannot be Mapped</h3>
            <p className="stat-value">{summaryData?.totals?.cannotBeMapped || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Created Property</h3>
            <p className="stat-value">{summaryData?.totals?.createdProperty || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;