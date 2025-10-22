import { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import './DailyProd.css';

const DailyProd = () => {
  const [dailyProds, setDailyProds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [viewMode, setViewMode] = useState('Standard');
  const [user, setUser] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    // fetch both; fetchDailyProds triggers when we set user (see next effect)
    fetchCurrentUser();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    // Fetch daily prods as soon as we have the current user.
    if (user) {
      fetchDailyProds();
    }
  }, [selectedMonth, selectedYear, user, allUsers]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/current_user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('fetchCurrentUser failed', res.status);
        return;
      }
      const userData = await res.json();
      console.log('DailyProd: fetched current_user', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('fetchAllUsers failed', res.status);
        setAllUsers([]);
        return;
      }
      const payload = await res.json();
      // Some APIs may return { users: [...] } or [...]. Handle both.
      const users = Array.isArray(payload) ? payload : (payload.users || payload.data || []);
      console.log('DailyProd: fetched users count', (users && users.length) || 0, payload);
      setAllUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
    }
  };

  // <-- Use the correct namespaced backend path (/api/v1/daily_prods)
  const fetchDailyProds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/v1/daily_prods?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('fetchDailyProds failed', response.status);
        setDailyProds([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      console.log('DailyProd: fetched daily_prods length', Array.isArray(data) ? data.length : 0, data);

      const groupedData = processData(data);

      // If no grouped rows but we have allUsers, show placeholder rows for active users
      if ((!groupedData || groupedData.length === 0) && allUsers.length > 0) {
        console.log('DailyProd: groupedData empty — creating placeholder rows from allUsers');
        const fallback = allUsers.map(u => ({
          userId: u.id,
          userName: u.name || u.email || `User ${u.id}`,
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
        }));
        setDailyProds(fallback);
      } else {
        setDailyProds(groupedData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily prods:', error);
      setDailyProds([]);
      setLoading(false);
    }
  };

  // processData ensures users referenced by entries are included even if not present in allUsers
  const processData = (data) => {
    const userMap = {};

    // Initialize from allUsers first
    allUsers.forEach(u => {
      userMap[u.id] = {
        userId: u.id,
        userName: u.name || u.email || `User ${u.id}`,
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

    // Process entries and add fallback users if needed
    (Array.isArray(data) ? data : []).forEach(entry => {
      const uid = entry.user_id;
      if (!userMap[uid]) {
        userMap[uid] = {
          userId: uid,
          userName: entry.user_name || entry.user_email || `User ${uid}`,
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
      }

      userMap[uid].entries.push(entry);

      // Calculate totals
      const accepted = entry.accepted || 0;
      const dismissed = entry.dismissed || 0;
      const autoMap = accepted + dismissed;
      const duplicates = entry.duplicate || 0;
      const manualMap = entry.manually_mapped || 0;
      const cannotBeMapped = (entry.incorrect_supplier_data || 0) + (entry.insufficient_info || 0);
      const createdProperty = entry.created_property || 0;

      userMap[uid].totals.accepted += accepted;
      userMap[uid].totals.dismissed += dismissed;
      userMap[uid].totals.autoMap += autoMap;
      userMap[uid].totals.duplicates += duplicates;
      userMap[uid].totals.manualMap += manualMap;
      userMap[uid].totals.cannotBeMapped += cannotBeMapped;
      userMap[uid].totals.createdProperty += createdProperty;
      userMap[uid].totals.overallTotal += autoMap + manualMap + cannotBeMapped + createdProperty;
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
      await fetch(`http://localhost:3000/api/v1/daily_prods/update_cell`, {
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

        <div style={{ marginBottom: 8, color: '#fff' }}>
          {/* Small debug helper visible in UI while you iterate */}
          <strong>Debug:</strong> users={allUsers.length} rows={dailyProds.length}
        </div>

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