import { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import './DailyProd.css';

const DailyProd = () => {
  const [dailyProds, setDailyProds] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // ADD THIS LINE
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [viewMode, setViewMode] = useState('Standard');
  const [user, setUser] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCurrentUser();
    fetchAllUsers(); // ADD THIS LINE
  }, []);

  useEffect(() => {
    if (user && allUsers.length > 0) { // MODIFY THIS LINE
      fetchDailyProds();
    }
  }, [selectedMonth, selectedYear, user, allUsers]); // MODIFY THIS LINE

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/current_user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  // ADD THIS ENTIRE FUNCTION
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = await res.json();
      // Filter only active users (not guests)
      const activeUsers = users.filter(u => u.role !== 'guest' && u.status === 'active');
      setAllUsers(activeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDailyProds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/daily_prods?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      const groupedData = processData(data);
      setDailyProds(groupedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily prods:', error);
      setLoading(false);
    }
  };

  // REPLACE THE ENTIRE processData FUNCTION
  const processData = (data) => {
    const userMap = {};
    
    // Initialize all active users first
    allUsers.forEach(user => {
      userMap[user.id] = {
        userId: user.id,
        userName: user.name || user.email,
        entries: [],
        totals: {
          accepted: 0,
          dismissed: 0,
          autoMap: 0,
          duplicates: 0,
          manualMap: 0,
          cannotBeMapped: 0,
          createdProperty: 0,
          overallTotal: 0
        }
      };
    });
    
    // Process entries
    data.forEach(entry => {
      if (userMap[entry.user_id]) {
        userMap[entry.user_id].entries.push(entry);
        
        // Calculate totals
        const accepted = entry.accepted || 0;
        const dismissed = entry.dismissed || 0;
        const autoMap = accepted + dismissed;
        const duplicates = entry.duplicate || 0;
        const manualMap = entry.manually_mapped || 0;
        const cannotBeMapped = (entry.incorrect_supplier_data || 0) + (entry.insufficient_info || 0);
        const createdProperty = entry.created_property || 0;
        
        userMap[entry.user_id].totals.accepted += accepted;
        userMap[entry.user_id].totals.dismissed += dismissed;
        userMap[entry.user_id].totals.autoMap += autoMap;
        userMap[entry.user_id].totals.duplicates += duplicates;
        userMap[entry.user_id].totals.manualMap += manualMap;
        userMap[entry.user_id].totals.cannotBeMapped += cannotBeMapped;
        userMap[entry.user_id].totals.createdProperty += createdProperty;
        userMap[entry.user_id].totals.overallTotal += autoMap + manualMap + cannotBeMapped + createdProperty;
      }
    });

    return Object.values(userMap);
  };

  const getDatesForMonth = () => {
    const dates = [];
    const year = parseInt(selectedYear);
    const monthNumber = new Date(`${selectedMonth} 1, ${year}`).getMonth();
    const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, monthNumber, i));
    }
    return dates;
  };

  const formatDateHeader = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const getCellData = (userId, date) => {
    const userData = dailyProds.find(u => u.userId === userId);
    if (!userData) return null;
    
    const entry = userData.entries.find(e => 
      new Date(e.date).toDateString() === date.toDateString()
    );
    
    return entry;
  };

  const getCellColor = (entry) => {
    if (!entry) return '';
    
    // Check for special statuses first
    if (entry.status === 'Exempted') return 'exempted';
    if (entry.status === 'Day Off') return 'day-off';
    if (entry.status === 'Offset') return 'offset';
    if (entry.status === 'Sick Leave' || entry.status === 'On Leave') return 'leave';
    if (entry.status === 'Offset + Entry') return 'offset-entry';
    
    // Check mapping type (0 = Auto, 1 = Manual, 2 = Hybrid)
    if (entry.mapping_type === 0) return 'auto-mapping';
    if (entry.mapping_type === 1) return 'manual-mapping';
    if (entry.mapping_type === 2) return 'hybrid-mapping';
    
    return '';
  };

  const getCellValue = (entry) => {
    if (!entry) return '';
    
    // If it's a status, return the status
    if (['Exempted', 'Day Off', 'Offset', 'Sick Leave', 'On Leave', 'Offset + Entry'].includes(entry.status)) {
      return entry.status;
    }
    
    // Calculate total productivity (everything except duplicates)
    const autoMap = (entry.accepted || 0) + (entry.dismissed || 0);
    const manualMap = entry.manually_mapped || 0;
    const cannotBeMapped = (entry.incorrect_supplier_data || 0) + (entry.insufficient_info || 0);
    const createdProperty = entry.created_property || 0;
    
    const total = autoMap + manualMap + cannotBeMapped + createdProperty;
    
    return total > 0 ? total : '';
  };

  const handleCellClick = (userId, date) => {
    if (user?.role !== 'developer') return;
    
    const entry = getCellData(userId, date);
    const cellValue = getCellValue(entry);
    setEditingCell({ userId, date: date.toISOString() });
    setEditValue(cellValue.toString());
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;
    
    try {
      await fetch(`http://localhost:3000/api/daily_prods/update_cell`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: editingCell.userId,
          date: editingCell.date,
          value: editValue
        })
      });
      
      await fetchDailyProds();
    } catch (error) {
      console.error('Error updating cell:', error);
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // REPLACE calculateGrandTotals FUNCTION
  const calculateGrandTotals = () => {
    const grandTotals = {
      accepted: 0,
      dismissed: 0,
      autoMap: 0,
      duplicates: 0,
      manualMap: 0,
      cannotBeMapped: 0,
      createdProperty: 0,
      overallTotal: 0
    };
    
    dailyProds.forEach(user => {
      grandTotals.accepted += user.totals.accepted;
      grandTotals.dismissed += user.totals.dismissed;
      grandTotals.autoMap += user.totals.autoMap;
      grandTotals.duplicates += user.totals.duplicates;
      grandTotals.manualMap += user.totals.manualMap;
      grandTotals.cannotBeMapped += user.totals.cannotBeMapped;
      grandTotals.createdProperty += user.totals.createdProperty;
      grandTotals.overallTotal += user.totals.overallTotal;
    });
    
    return grandTotals;
  };

  const calculateDailyTotal = (date) => {
    let total = 0;
    dailyProds.forEach(user => {
      const entry = user.entries.find(e => 
        new Date(e.date).toDateString() === date.toDateString()
      );
      if (entry) {
        const cellValue = getCellValue(entry);
        if (typeof cellValue === 'number') {
          total += cellValue;
        }
      }
    });
    return total;
  };

  if (loading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const dates = getDatesForMonth();
  const grandTotals = calculateGrandTotals();
  const isDeveloper = user?.role === 'developer';

  return (
    <div>
      <Navbar user={user} />
      <div className="daily-prod-container">
        <h1>Daily Mapping Productivity</h1>
        
        <div className="controls-row">
          <div className="left-controls">
            <div className="control-group">
              <label>Month:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>

            <div className="control-group">
              <label>Year:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>

          <div className="right-controls">
            <div className="control-group">
              <label>Option:</label>
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
                <option value="Detailed">Detailed</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            <div className="legend">
              <div className="legend-item">
                <span className="legend-box auto-mapping"></span>
                <span>Auto</span>
              </div>
              <div className="legend-item">
                <span className="legend-box manual-mapping"></span>
                <span>Manual</span>
              </div>
              <div className="legend-item">
                <span className="legend-box hybrid-mapping"></span>
                <span>Hybrid</span>
              </div>
              <div className="legend-item">
                <span className="legend-box exempted"></span>
                <span>Exempted</span>
              </div>
              <div className="legend-item">
                <span className="legend-box day-off"></span>
                <span>Day Off</span>
              </div>
              <div className="legend-item">
                <span className="legend-box offset"></span>
                <span>Offset/Leave</span>
              </div>
              <div className="legend-item">
                <span className="legend-box offset-entry"></span>
                <span>Offset + Entry</span>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="daily-prod-table">
            <thead>
              <tr>
                <th className="pic-header">PIC</th>
                
                {/* MODIFY: Show metric columns based on view */}
                {viewMode === 'Detailed' ? (
                  <>
                    <th className="total-header">ACCEPTED</th>
                    <th className="total-header">DISMISSED</th>
                    <th className="total-header">AUTO<br/>MAP</th>
                    <th className="total-header">DUPLICATES</th>
                    <th className="total-header">MANUAL<br/>MAP</th>
                    <th className="total-header">CANNOT<br/>BE<br/>MAPPED</th>
                    <th className="total-header">CREATED<br/>PROPERTY</th>
                  </>
                ) : (
                  <>
                    {dates.map((date, idx) => (
                      <th key={idx} className="date-header">{formatDateHeader(date)}</th>
                    ))}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {/* Grand Total Row */}
              <tr className="grand-total-row">
                <td className="pic-cell"><strong>GRAND<br/>TOTAL</strong></td>
                
                {viewMode === 'Detailed' ? (
                  <>
                    <td className="total-cell"><strong>{grandTotals.accepted}</strong></td>
                    <td className="total-cell"><strong>{grandTotals.dismissed}</strong></td>
                    <td className="total-cell"><strong>{grandTotals.autoMap}</strong></td>
                    <td className="total-cell"><strong>{grandTotals.duplicates}</strong></td>
                    <td className="total-cell"><strong>{grandTotals.manualMap}</strong></td>
                    <td className="total-cell"><strong>{grandTotals.cannotBeMapped}</strong></td>
                    <td className="total-cell"><strong>{grandTotals.createdProperty}</strong></td>
                  </>
                ) : (
                  <>
                    {dates.map((date, dateIdx) => {
                      const dailyTotal = calculateDailyTotal(date);
                      return (
                        <td key={dateIdx} className="daily-total-cell">
                          <strong>{dailyTotal || ''}</strong>
                        </td>
                      );
                    })}
                  </>
                )}
              </tr>

              {/* User Rows */}
              {dailyProds.map((userData, userIdx) => (
                <tr key={userIdx}>
                  <td className="pic-cell">{userData.userName}</td>
                  
                  {viewMode === 'Detailed' ? (
                    <>
                      <td className="total-cell">{userData.totals.accepted}</td>
                      <td className="total-cell">{userData.totals.dismissed}</td>
                      <td className="total-cell">{userData.totals.autoMap}</td>
                      <td className="total-cell">{userData.totals.duplicates}</td>
                      <td className="total-cell">{userData.totals.manualMap}</td>
                      <td className="total-cell">{userData.totals.cannotBeMapped}</td>
                      <td className="total-cell">{userData.totals.createdProperty}</td>
                    </>
                  ) : (
                    <>
                      {dates.map((date, dateIdx) => {
                        const entry = getCellData(userData.userId, date);
                        const cellValue = getCellValue(entry);
                        const isEditing = editingCell?.userId === userData.userId && 
                                         editingCell?.date === date.toISOString();
                        
                        return (
                          <td 
                            key={dateIdx} 
                            className={`daily-cell ${getCellColor(entry)} ${isDeveloper ? 'editable' : ''}`}
                            onClick={() => handleCellClick(userData.userId, date)}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellBlur}
                                onKeyDown={handleKeyPress}
                                autoFocus
                                className="cell-input"
                              />
                            ) : (
                              cellValue
                            )}
                          </td>
                        );
                      })}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyProd;