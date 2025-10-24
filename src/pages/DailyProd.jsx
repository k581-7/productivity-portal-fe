import { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import TableViewIcon from '@mui/icons-material/TableView';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import './DailyProd.css';

// Styled components for custom table cells
const StyledTableCell = styled(TableCell)(({ theme, bgcolor, color }) => ({
  backgroundColor: bgcolor || theme.palette.common.white,
  color: color || theme.palette.common.black,
  padding: '12px',
  fontSize: 14,
  '&.header': {
    backgroundColor: '#7c3aed',
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  '&.pic': {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    backgroundColor: '#f3f4f6',
    fontWeight: 500,
  },
  '&.total': {
    backgroundColor: '#e5e7eb',
    fontWeight: 'bold',
  }
}));

const DailyProd = ({ user }) => {
  const [dailyProds, setDailyProds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [viewMode, setViewMode] = useState('Standard');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (user) {
      fetchAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (user && allUsers.length > 0) {
      fetchDailyProds();
    }
  }, [selectedMonth, selectedYear, user, allUsers]);

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
      const users = Array.isArray(payload) ? payload : (payload.users || payload.data || []);
      setAllUsers(users.filter(u => u.id));
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
    }
  };

  const createEmptyUserData = (user, dates) => ({
    userId: user.id,
    userName: user.name || user.email || `User ${user.id}`,
    entries: dates.map(date => ({
      date,
      accepted: 0,
      dismissed: 0,
      manually_mapped: 0,
      incorrect_supplier_data: 0,
      created_property: 0,
      insufficient_info: 0,
      duplicates: 0,
      no_result: 0,
      mapping_type: null,
      auto_total: 0,
      manual_total: 0,
      overall_total: 0
    })),
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
  });

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
      const dates = getDatesForMonth();

      // Create empty data structure for all users
      const processedData = allUsers.map(u => createEmptyUserData(u, dates));

      // Fill in actual data where it exists
      data.forEach(userData => {
        const userIndex = processedData.findIndex(u => u.userId === userData.user_id);
        if (userIndex >= 0) {
          userData.entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const existingEntry = processedData[userIndex].entries.find(
              e => e.date.toDateString() === entryDate.toDateString()
            );
            if (existingEntry) {
              Object.assign(existingEntry, {
                accepted: entry.accepted || 0,
                dismissed: entry.dismissed || 0,
                manually_mapped: entry.manually_mapped || 0,
                incorrect_supplier_data: entry.incorrect_supplier_data || 0,
                created_property: entry.created_property || 0,
                insufficient_info: entry.insufficient_info || 0,
                duplicates: entry.duplicates || 0,
                no_result: entry.no_result || 0,
                mapping_type: entry.mapping_type,
                auto_total: entry.auto_total || 0,
                manual_total: entry.manual_total || 0,
                overall_total: entry.overall_total || 0
              });

              // Update user totals
              const userTotals = processedData[userIndex].totals;
              userTotals.accepted += entry.accepted || 0;
              userTotals.dismissed += entry.dismissed || 0;
              userTotals.autoMap += entry.auto_total || 0;
              userTotals.duplicates += entry.duplicates || 0;
              userTotals.manualMap += entry.manual_total || 0;
              userTotals.cannotBeMapped += (entry.incorrect_supplier_data || 0) + 
                                         (entry.insufficient_info || 0);
              userTotals.createdProperty += entry.created_property || 0;
              userTotals.overallTotal += entry.overall_total || 0;
            }
          });
        }
      });

      setDailyProds(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily prods:', error);
      setDailyProds([]);
      setLoading(false);
    }
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

  const statusOptions = ['Exempted', 'Day Off', 'Offset/Leave'];

  const getCellData = (userId, date) => {
    const userData = dailyProds.find(u => u.userId === userId);
    if (!userData) return null;

    return userData.entries.find(e =>
      e.date.toDateString() === date.toDateString()
    );
  };

  const getCellColor = () => ''; // Deprecated - using getStatusColor instead

  const getCellValue = (entry) => {
    if (!entry) return '';

    // If it's a status, return the status
    if (['Exempted', 'Day Off', 'Offset', 'Sick Leave', 'On Leave', 'Offset + Entry'].includes(entry.status)) {
      return entry.status;
    }

    // Use the overall_total from backend which already excludes duplicates and no_result
    return entry.overall_total > 0 ? entry.overall_total : '';
  };

  const handleCellClick = (userId, date) => {
    if (user?.role !== 'developer') return;

    const entry = getCellData(userId, date);
    const cellValue = getCellValue(entry);
    setEditingCell({ userId, date: date.toISOString() });
    setEditValue(cellValue.toString());
  };

  const handleStatusSelect = (status) => {
    if (!editingCell) return;
    setEditValue(status);
    handleCellBlur();
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/daily_prods/update_cell`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: editingCell.userId,
          date: editingCell.date,
          value: editValue
        })
      });

      if (response.ok) {
        await fetchDailyProds();
      } else {
        console.error('Error updating cell:', await response.json());
      }
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
      if (!user.totals) return;
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
      const entry = user.entries?.find(e =>
        e.date.toDateString() === date.toDateString()
      );
      if (entry) {
        total += entry.overall_total || 0;
      }
    });
    return total || '';
  };

  if (loading) {
    return (
      <Box>
        <Navbar user={user} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Box>
    );
  }

  const dates = getDatesForMonth();
  const grandTotals = calculateGrandTotals();
  const isDeveloper = user?.role === 'developer';
  const chartData = dailyProds.map(user => ({
    name: user.userName,
    'Auto Mapping': user.totals.autoMap,
    'Manual Mapping': user.totals.manualMap,
    'Overall Total': user.totals.overallTotal
  }));

  // Helper function to determine cell colors and styles
  const getStatusColor = (entry) => {
    if (!entry || !entry.mapping_type) {
      return {};
    }

    const colors = {
      auto: { bgcolor: '#86efac', color: '#166534' },
      manual: { bgcolor: '#fb923c', color: '#ffffff' },
      hybrid: { bgcolor: '#fde68a', color: '#78350f' },
      Exempted: { bgcolor: '#fef08a', color: '#854d0e' },
      'Day Off': { bgcolor: '#bfdbfe', color: '#1e40af' },
      Offset: { bgcolor: '#fecaca', color: '#991b1b' },
      'Sick Leave': { bgcolor: '#fecaca', color: '#991b1b' },
      'On Leave': { bgcolor: '#fecaca', color: '#991b1b' },
      'Offset + Entry': { bgcolor: '#fef08a', color: '#854d0e' }
    };

    if (entry.status && colors[entry.status]) {
      return colors[entry.status];
    }

    if (entry.mapping_type && colors[entry.mapping_type]) {
      return colors[entry.mapping_type];
    }

    return {};
  };

  return (
    <Box>
      <Navbar user={user} />
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                Daily Mapping Productivity
              </Typography>
              {isDeveloper && (
                <Typography variant="caption" color="text.secondary">
                  Debug: Users: {allUsers.length} | Rows: {dailyProds.length}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Standard View">
                <IconButton 
                  color={viewMode === 'Standard' ? 'primary' : 'default'}
                  onClick={() => setViewMode('Standard')}
                >
                  <CalendarViewMonthIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Detailed View">
                <IconButton 
                  color={viewMode === 'Detailed' ? 'primary' : 'default'}
                  onClick={() => setViewMode('Detailed')}
                >
                  <TableViewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chart View">
                <IconButton 
                  color={viewMode === 'Chart' ? 'primary' : 'default'}
                  onClick={() => setViewMode('Chart')}
                >
                  <EqualizerIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                >
                  {[
                    'January', 'February', 'March', 'April',
                    'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'
                  ].map(month => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                >
                  {['2024', '2025', '2026'].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label="Auto" sx={{ bgcolor: '#86efac', color: '#166534' }} />
                  <Chip size="small" label="Manual" sx={{ bgcolor: '#fb923c', color: '#fff' }} />
                  <Chip size="small" label="Hybrid" sx={{ bgcolor: '#fde68a', color: '#78350f' }} />
                  <Chip size="small" label="Exempted" sx={{ bgcolor: '#fef08a', color: '#854d0e' }} />
                  <Chip size="small" label="Day Off" sx={{ bgcolor: '#bfdbfe', color: '#1e40af' }} />
                  <Chip size="small" label="Offset/Leave" sx={{ bgcolor: '#fecaca', color: '#991b1b' }} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {viewMode === 'Chart' && (
            <Box sx={{ height: 400, mt: 3 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="Auto Mapping" fill="#86efac" />
                  <Bar dataKey="Manual Mapping" fill="#fb923c" />
                  <Bar dataKey="Overall Total" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {viewMode === 'Detailed' && (
            <Box sx={{ height: 600, mt: 3 }}>
              <DataGrid
                rows={dailyProds.map((user, index) => ({
                  id: index,
                  userName: user.userName,
                  ...user.totals
                }))}
                columns={[
                  { field: 'userName', headerName: 'PIC', width: 180 },
                  { field: 'accepted', headerName: 'ACCEPTED', width: 130, type: 'number' },
                  { field: 'dismissed', headerName: 'DISMISSED', width: 130, type: 'number' },
                  { field: 'autoMap', headerName: 'AUTO MAP', width: 130, type: 'number' },
                  { field: 'duplicates', headerName: 'DUPLICATES', width: 130, type: 'number' },
                  { field: 'manualMap', headerName: 'MANUAL MAP', width: 130, type: 'number' },
                  { field: 'cannotBeMapped', headerName: 'CANNOT BE MAPPED', width: 170, type: 'number' },
                  { field: 'createdProperty', headerName: 'CREATED PROPERTY', width: 170, type: 'number' },
                  { field: 'overallTotal', headerName: 'OVERALL TOTAL', width: 150, type: 'number' }
                ]}
                components={{ Toolbar: GridToolbar }}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                sx={{
                  '& .MuiDataGrid-root': {
                    backgroundColor: '#fff',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#7c3aed',
                    color: '#000',
                  },
                  '& .MuiDataGrid-cell': {
                    color: '#000'
                  }
                }}
              />
            </Box>
          )}

          {viewMode === 'Standard' && (
            <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <StyledTableCell className="header pic">PIC</StyledTableCell>
                    {dates.map((date, idx) => (
                      <StyledTableCell key={idx} className="header" align="center">
                        {formatDateHeader(date)}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyProds.map((userData, userIdx) => (
                    <TableRow key={userIdx}>
                      <StyledTableCell className="pic">{userData.userName}</StyledTableCell>
                      {dates.map((date, dateIdx) => {
                        const entry = getCellData(userData.userId, date);
                        const cellValue = getCellValue(entry);
                        const isEditing = editingCell?.userId === userData.userId && 
                                        editingCell?.date === date.toISOString();
                        const { bgcolor, color } = getStatusColor(entry);
                        
                        return (
                          <StyledTableCell 
                            key={dateIdx}
                            align="center"
                            bgcolor={bgcolor}
                            color={color}
                            onClick={() => isDeveloper && handleCellClick(userData.userId, date)}
                            sx={{ cursor: isDeveloper ? 'pointer' : 'default' }}
                          >
                            {isEditing ? (
                              <Box>
                                <TextField
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleKeyPress}
                                  size="small"
                                  autoFocus
                                  sx={{ width: 60 }}
                                />
                                {isDeveloper && (
                                  <FormControl size="small" sx={{ ml: 1, minWidth: 120 }}>
                                    <Select
                                      value=""
                                      onChange={(e) => handleStatusSelect(e.target.value)}
                                      displayEmpty
                                      size="small"
                                    >
                                      <MenuItem value="" disabled>
                                        <em>Status</em>
                                      </MenuItem>
                                      {statusOptions.map((status) => (
                                        <MenuItem key={status} value={status}>
                                          {status}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                )}
                              </Box>
                            ) : (
                              cellValue
                            )}
                          </StyledTableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  <TableRow>
                    <StyledTableCell className="total">
                      GRAND TOTAL
                    </StyledTableCell>
                    {dates.map((date, dateIdx) => (
                      <StyledTableCell 
                        key={dateIdx}
                        align="center"
                        className="total"
                      >
                        {calculateDailyTotal(date)}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default DailyProd;