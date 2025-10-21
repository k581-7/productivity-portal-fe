import { useState, useEffect } from 'react';
import './DailyProd.css';

const DailyProd = () => {
  const [dailyProds, setDailyProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [totals, setTotals] = useState({
    autoMapping: 0,
    duplicates: 0,
    manualMapping: 0,
    cannotBeMapped: 0,
    createdProperty: 0
  });

  useEffect(() => {
    fetchDailyProds();
  }, [selectedMonth]);

  const fetchDailyProds = async () => {
    try {
      // Replace with your actual backend URL
      const response = await fetch(`http://localhost:3000/api/daily_prods?month=${selectedMonth}`);
      const data = await response.json();
      
      // Group by user and date
      const groupedData = processData(data);
      setDailyProds(groupedData);
      calculateTotals(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily prods:', error);
      setLoading(false);
    }
  };

  const processData = (data) => {
    // Group entries by user
    const userMap = {};
    
    data.forEach(entry => {
      if (!userMap[entry.user_id]) {
        userMap[entry.user_id] = {
          userId: entry.user_id,
          userName: entry.user_name, // Assuming backend provides this
          entries: [],
          totals: {
            accepted: 0,
            dismissed: 0,
            dailyAverage: 0
          }
        };
      }
      
      userMap[entry.user_id].entries.push(entry);
      userMap[entry.user_id].totals.accepted += entry.auto_total || 0;
      userMap[entry.user_id].totals.dismissed += entry.duplicates_total || 0;
    });

    // Calculate daily average for each user
    Object.values(userMap).forEach(user => {
      const workDays = user.entries.filter(e => 
        e.overall_total > 0 && !['Day Off', 'Offset', 'On Leave', 'Sick Leave'].includes(e.status)
      ).length;
      
      const totalProd = user.entries.reduce((sum, e) => sum + (e.overall_total || 0), 0);
      user.totals.dailyAverage = workDays > 0 ? Math.round(totalProd / workDays) : 0;
    });

    return Object.values(userMap);
  };

  const calculateTotals = (data) => {
    const newTotals = {
      autoMapping: 0,
      duplicates: 0,
      manualMapping: 0,
      cannotBeMapped: 0,
      createdProperty: 0
    };

    data.forEach(entry => {
      newTotals.autoMapping += entry.auto_total || 0;
      newTotals.duplicates += entry.duplicates_total || 0;
      newTotals.manualMapping += entry.manual_total || 0;
      newTotals.createdProperty += entry.created_property_total || 0;
      // Cannot be mapped would come from prod_entries (incorrect_supplier_data + insufficient_info)
    });

    setTotals(newTotals);
  };

  const getCellColor = (entry) => {
    if (!entry.manual_total && !entry.auto_total) return '';
    if (entry.auto_total > 0 && entry.manual_total === 0) return 'auto-mapping'; // Green
    if (entry.manual_total > 0 && entry.auto_total === 0) return 'manual-mapping'; // Deep orange
    if (entry.manual_total > 0 && entry.auto_total > 0) return 'hybrid-mapping'; // Pale orange
    return '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${String(date.getFullYear()).slice(-2)}`;
  };

  // Generate date columns for the month (example: Oct 1-31)
  const getDatesForMonth = () => {
    const dates = [];
    const year = 2025;
    const monthNumber = new Date(`${selectedMonth} 1, ${year}`).getMonth();
    const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, monthNumber, i));
    }
    return dates;
  };

  if (loading) return <div className="loading">Loading...</div>;

  const dates = getDatesForMonth();

  return (
    <div className="daily-prod-container">
      <h1>DAILY MAPPING PRODUCTIVITY P1 & P2</h1>
      
      <div className="month-selector">
        <label>Month: </label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="October">October</option>
          <option value="November">November</option>
          <option value="December">December</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="daily-prod-table">
          <thead>
            <tr>
              <th rowSpan="2">OCT</th>
              <th rowSpan="2">PIC</th>
              <th rowSpan="2">Accepted</th>
              <th rowSpan="2">Dismissed</th>
              <th rowSpan="2">Daily Average</th>
              <th rowSpan="2">Total</th>
              {dates.map((date, idx) => (
                <th key={idx}>{formatDate(date)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dailyProds.map((user, userIdx) => (
              <tr key={userIdx}>
                <td></td>
                <td className="pic-cell">{user.userName}</td>
                <td>{user.totals.accepted}</td>
                <td>{user.totals.dismissed}</td>
                <td>{user.totals.dailyAverage}</td>
                <td>{user.entries.reduce((sum, e) => sum + (e.overall_total || 0), 0)}</td>
                {dates.map((date, dateIdx) => {
                  const entry = user.entries.find(e => 
                    new Date(e.date).toDateString() === date.toDateString()
                  );
                  return (
                    <td key={dateIdx} className={entry ? getCellColor(entry) : ''}>
                      {entry ? (entry.status || entry.overall_total) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan="2"><strong>Total</strong></td>
              <td><strong>{dailyProds.reduce((sum, u) => sum + u.totals.accepted, 0)}</strong></td>
              <td><strong>{dailyProds.reduce((sum, u) => sum + u.totals.dismissed, 0)}</strong></td>
              <td></td>
              <td><strong>{dailyProds.reduce((sum, u) => sum + u.entries.reduce((s, e) => s + (e.overall_total || 0), 0), 0)}</strong></td>
              <td colSpan={dates.length}></td>
            </tr>
          </tbody>
        </table>

        <div className="totals-section">
          <div className="total-item automap">
            <span>Automap</span>
            <span>{totals.autoMapping}</span>
          </div>
          <div className="total-item duplicates">
            <span>Duplicates</span>
            <span>{totals.duplicates}</span>
          </div>
          <div className="total-item manual">
            <span>Manual Map</span>
            <span>{totals.manualMapping}</span>
          </div>
          <div className="total-item cannot-map">
            <span>Cannot be mapped</span>
            <span>{totals.cannotBeMapped}</span>
          </div>
          <div className="total-item created">
            <span>Created property</span>
            <span>{totals.createdProperty}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProd;