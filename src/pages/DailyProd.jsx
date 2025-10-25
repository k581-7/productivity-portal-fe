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
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
  '&.header.pic': {
    backgroundColor: '#7c3aed',
    color: theme.palette.common.black,
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
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchCurrentUser();
  }, []);

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

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/current_user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('fetchCurrentUser failed', res.status);
        localStorage.removeItem('token');
        window.location.href = '/';
        return;
      }
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      window.location.href = '/';
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
      const users = Array.isArray(payload) ? payload : (payload.users || payload.data || []);
      setAllUsers(users.filter(u => u.id));
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
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
      status: null,
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
        return;
      }

      const data = await response.json();
      console.log('Raw backend response:', JSON.stringify(data, null, 2));
      const dates = getDatesForMonth();
      const processedData = allUsers.map(u => createEmptyUserData(u, dates));

      data.forEach(userData => {
        const userIndex = processedData.findIndex(u => u.userId === userData.user_id);
        if (userIndex >= 0) {
          console.log(`Processing entries for user ${userData.user_id}:`, userData.entries);
          userData.entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const existingEntry = processedData[userIndex].entries.find(
              e => e.date.toDateString() === entryDate.toDateString()
            );
            if (existingEntry) {
              console.log(`Updating entry for ${entryDate.toDateString()}:`, {
                status: entry.status,
                mapping_type: entry.mapping_type,
                overall_total: entry.overall_total
              });
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
                status: entry.status,
                auto_total: entry.auto_total || 0,
                manual_total: entry.manual_total || 0,
                overall_total: entry.overall_total || 0
              });

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
    } catch (error) {
      console.error('Error fetching daily prods:', error);
      setDailyProds([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateHeader = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    return day;
  };

  const statusOptions = ['Exempted', 'Day Off', 'Offset', 'Leave', 'Clear Status'];

  const getCellData = (userId, date) => {
    const userData = dailyProds.find(u => u.userId === userId);
    if (!userData) return null;

    const entry = userData.entries.find(e => 
      e.date.toDateString() === date.toDateString()
    );
    return entry;
  };

  const getStatusColor = (entry) => {
    if (!entry) return {};

    const colors = {
      auto: { bgcolor: '#86efac', color: '#166534' },
      manual: { bgcolor: '#fb923c', color: '#ffffff' },
      hybrid: { bgcolor: '#fde68a', color: '#78350f' },
      Exempted: { bgcolor: '#fef08a', color: '#854d0e' },
      'Day Off': { bgcolor: '#bfdbfe', color: '#1e40af' },
      Offset: { bgcolor: '#fecaca', color: '#991b1b' },
      Leave: { bgcolor: '#fecaca', color: '#991b1b' }
    };

    // Check status first (has priority)
    if (entry.status && colors[entry.status]) {
      return colors[entry.status];
    }

    // Then check mapping_type
    if (entry.mapping_type && colors[entry.mapping_type]) {
      return colors[entry.mapping_type];
    }

    return {};
  };

  const getCellValue = (entry) => {
    if (!entry) return '';

    if (entry.status && ['Exempted', 'Day Off', 'Offset', 'Leave'].includes(entry.status)) {
      return entry.status;
    }

    return entry.overall_total > 0 ? entry.overall_total : '';
  };

  const handleCellClick = (userId, date, event) => {
    if (user?.role !== 'developer') return;

    event?.preventDefault?.();
    event?.stopPropagation?.();

    const entry = getCellData(userId, date);
    const cellValue = getCellValue(entry);
    
    // Use a unique cell identifier combining userId and date string
    const cellKey = `${userId}-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
    
    console.log('🔵 CLICKED CELL:', {
      cellKey,
      userId,
      date: date.toDateString(),
      dateISO: date.toISOString(),
      entry: entry
    });
    
    setEditingCell({ 
      userId, 
      date: date.toISOString(),
      cellKey: cellKey  // Unique identifier for this specific cell
    });
    setEditValue(cellValue ? cellValue.toString() : '');
  };

  const handleStatusSelect = async (status) => {
    if (!editingCell || !status) return;
    
    const cellToUpdate = { ...editingCell };
    
    console.log('🟢 HANDLE STATUS SELECT:', {
      status,
      cellToUpdate
    });
    
    try {
      // Handle "Clear Status" option
      if (status === 'Clear Status') {
        console.log('🔴 CLEARING STATUS for cellKey:', cellToUpdate.cellKey);
        
        // Parse the date from ISO string to get proper date parts
        const dateObj = new Date(cellToUpdate.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        console.log('🔴 Sending to backend:', {
          user_id: cellToUpdate.userId,
          date: formattedDate,
          original_iso: cellToUpdate.date
        });
        
        // Immediately update UI - remove status, will show calculated totals on next fetch
        setDailyProds(prevProds => {
          return prevProds.map(userData => {
            if (userData.userId === cellToUpdate.userId) {
              const updatedEntries = userData.entries.map(entry => {
                // Use cellKey comparison - extract date parts and compare
                const entryCellKey = `${cellToUpdate.userId}-${entry.date.getDate()}-${entry.date.getMonth()}-${entry.date.getFullYear()}`;
                
                console.log('  Checking entry:', {
                  entryDate: entry.date.toDateString(),
                  entryCellKey,
                  targetCellKey: cellToUpdate.cellKey,
                  matches: entryCellKey === cellToUpdate.cellKey,
                  currentStatus: entry.status
                });
                
                if (entryCellKey === cellToUpdate.cellKey) {
                  console.log('  ✅ MATCH! Clearing status for:', entry.date.toDateString());
                  return {
                    ...entry,
                    status: null
                  };
                }
                return entry;
              });
              return { ...userData, entries: updatedEntries };
            }
            return userData;
          });
        });

        setEditingCell(null);
        setEditValue('');
        
        // Send DELETE request to backend with properly formatted date
        const response = await fetch(`http://localhost:3000/api/v1/daily_prods/delete_status`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: cellToUpdate.userId,
            date: formattedDate  // Use YYYY-MM-DD format
          })
        });

        if (response.ok) {
          console.log('✅ Backend delete successful');
          // Refresh to get the recalculated totals from prod_entries
          await fetchDailyProds();
        } else {
          const errorData = await response.json();
          console.error('❌ Backend error clearing status:', errorData);
        }
        return;
      }
      
      // Normal status update
      console.log('Setting status:', status, 'for cell:', cellToUpdate.cellKey);
      
      // Parse the date from ISO string to get proper date parts
      const dateObj = new Date(cellToUpdate.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      setDailyProds(prevProds => {
        return prevProds.map(userData => {
          if (userData.userId === cellToUpdate.userId) {
            const updatedEntries = userData.entries.map(entry => {
              // Use cellKey comparison - extract date parts and compare
              const entryCellKey = `${cellToUpdate.userId}-${entry.date.getDate()}-${entry.date.getMonth()}-${entry.date.getFullYear()}`;
              if (entryCellKey === cellToUpdate.cellKey) {
                console.log('Setting status for entry:', entry.date.toDateString());
                return {
                  ...entry,
                  status: status,
                  overall_total: 0
                };
              }
              return entry;
            });
            return { ...userData, entries: updatedEntries };
          }
          return userData;
        });
      });

      setEditingCell(null);
      setEditValue('');
      
      // Then send to backend with properly formatted date
      const response = await fetch(`http://localhost:3000/api/v1/daily_prods/update_cell`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: cellToUpdate.userId,
          date: formattedDate,  // Use YYYY-MM-DD format
          value: status,
          is_status: true
        })
      });

      if (!response.ok) {
        console.error('Error updating status:', await response.json());
      }
    } catch (error) {
      console.error('Error in handleStatusSelect:', error);
    }
  };

  const handleCellBlur = async (e) => {
    // Don't blur if clicking on the dropdown or its menu
    if (e?.relatedTarget?.closest('.MuiSelect-root, .MuiMenu-root, .MuiMenuItem-root')) {
      return;
    }
    
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

  if (!user || loading) {
    return (
      <Box>
        <Navbar user={user} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
          <Typography variant="h6">
            {!user ? 'Please log in...' : 'Loading data...'}
          </Typography>
        </Box>
      </Box>
    );
  }

  const dates = getDatesForMonth();
  const isDeveloper = user?.role === 'developer';
  const chartData = dailyProds.map(user => ({
    name: user.userName,
    'Auto Mapping': user.totals.autoMap,
    'Manual Mapping': user.totals.manualMap,
    'Overall Total': user.totals.overallTotal
  }));

  return (
    <Box>
      <Navbar user={user} />
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 3 }}>
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
                  <Chip size="small" label="Offset" sx={{ bgcolor: '#fecaca', color: '#991b1b' }} />
                  <Chip size="small" label="Leave" sx={{ bgcolor: '#fecaca', color: '#991b1b' }} />
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
            <TableContainer 
              component={Paper} 
              sx={{ 
                mt: 3, 
                maxHeight: 'calc(100vh - 350px)',
                '&::-webkit-scrollbar': {
                  width: '12px',
                  height: '12px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#7c3aed',
                  borderRadius: '10px',
                  '&:hover': {
                    background: '#6d28d9',
                  },
                },
              }}
            >
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
                        const cellKey = `${userData.userId}-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
                        const isEditing = editingCell?.cellKey === cellKey;
                        const { bgcolor, color } = getStatusColor(entry);
                        
                        return (
                          <StyledTableCell 
                            key={dateIdx}
                            align="center"
                            bgcolor={bgcolor}
                            color={color}
                            onClick={(e) => isDeveloper && handleCellClick(userData.userId, date, e)}
                            sx={{ cursor: isDeveloper ? 'pointer' : 'default' }}
                          >
                            {isEditing ? (
                              <Box 
                                component="div" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}
                              >
                                {/* Only show text input if current value is numeric (has overall_total) */}
                                {entry?.overall_total > 0 && !entry?.status && (
                                  <TextField
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleCellBlur}
                                    onKeyDown={handleKeyPress}
                                    size="small"
                                    autoFocus
                                    sx={{ width: 60 }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                {isDeveloper && (
                                  <FormControl 
                                    size="small" 
                                    sx={{ minWidth: 120 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Select
                                      displayEmpty
                                      value=""
                                      open={entry?.overall_total === 0 || !!entry?.status}
                                      autoFocus={entry?.overall_total === 0 || !!entry?.status}
                                      renderValue={() => entry?.status ? "Change Status" : "Set Status"}
                                      MenuProps={{
                                        anchorOrigin: {
                                          vertical: 'bottom',
                                          horizontal: 'left',
                                        },
                                        transformOrigin: {
                                          vertical: 'top',
                                          horizontal: 'left',
                                        },
                                        onClick: (e) => e.stopPropagation()
                                      }}
                                      onChange={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const selectedStatus = e.target.value;
                                        if (selectedStatus && statusOptions.includes(selectedStatus)) {
                                          handleStatusSelect(selectedStatus);
                                        }
                                      }}
                                      onClose={() => {
                                        setEditingCell(null);
                                      }}
                                    >
                                      {statusOptions
                                        .filter(status => {
                                          // Only show "Clear Status" if there's actually a status to clear
                                          if (status === 'Clear Status') {
                                            return !!entry?.status;
                                          }
                                          return true;
                                        })
                                        .map((status) => (
                                          <MenuItem 
                                            key={status} 
                                            value={status}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                          >
                                            {status}
                                          </MenuItem>
                                        ))
                                      }
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