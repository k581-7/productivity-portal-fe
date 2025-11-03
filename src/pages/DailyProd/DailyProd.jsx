import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/NavBar/NavBar';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import './DailyProd.css';

// Styled components for custom table cells
const StyledTableCell = styled(TableCell)(({ theme, bgcolor, color }) => ({
  backgroundColor: bgcolor || theme.palette.common.white,
  color: color || theme.palette.common.black,
  padding: '12px',
  fontSize: 14,
  '&.header': {
    backgroundColor: '#374151',
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  '&.header.pic': {
    backgroundColor: '#374151',
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
  const [editModeEnabled, setEditModeEnabled] = useState(false);

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
    if (user) {
      fetchDailyProds();
    }
  }, [selectedMonth, selectedYear, user]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/api/v1/current_user');
      setUser(res.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/api/v1/users');
      const users = Array.isArray(res.data) ? res.data : (res.data.users || res.data.data || []);
      setAllUsers(users.filter(u => u.id && u.role !== 'guest'));
    } catch (error) {
      console.error('Error fetching users:', error);
      // For junior users, try to fetch from daily_prods endpoint to get all users
      if (user?.role === 'junior') {
        console.log('Junior user detected, will fetch users from daily_prods data');
        setAllUsers([user]); // Temporary, will be populated after fetchDailyProds
      } else if (user) {
        setAllUsers([user]);
      } else {
        setAllUsers([]);
      }
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
      const response = await api.get(`/api/v1/daily_prods?month=${selectedMonth}&year=${selectedYear}`);
      const data = response.data;
      
      console.log('📡 Backend Response Summary:', {
        totalUsers: data.length,
        firstUser: data[0]?.user_name,
        firstUserEntries: data[0]?.entries?.length,
        sampleEntry: data[0]?.entries?.[0]
      });
      
      // Extract unique users from the daily_prods data if allUsers is not populated
      if (allUsers.length <= 1 && data.length > 0) {
        const uniqueUsers = [];
        const userIds = new Set();
        
        data.forEach(userData => {
          if (!userIds.has(userData.user_id)) {
            userIds.add(userData.user_id);
            uniqueUsers.push({
              id: userData.user_id,
              name: userData.user_name || `User ${userData.user_id}`,
              email: userData.user_email || ''
            });
          }
        });
        
        console.log('Populated users from daily_prods:', uniqueUsers);
        setAllUsers(uniqueUsers);
      }
      
      const dates = getDatesForMonth();
      const usersToProcess = allUsers.length > 1 ? allUsers : 
        data.map(ud => ({ 
          id: ud.user_id, 
          name: ud.user_name || `User ${ud.user_id}`,
          email: ud.user_email || ''
        })).filter((u, idx, arr) => arr.findIndex(a => a.id === u.id) === idx);
      
      const processedData = usersToProcess.map(u => createEmptyUserData(u, dates));

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
                status: entry.status,
                auto_total: entry.auto_total || 0,
                manual_total: entry.manual_total || 0,
                overall_total: entry.overall_total || 0,
                cannot_be_mapped: entry.cannot_be_mapped || 0
              });

              const userTotals = processedData[userIndex].totals;
              userTotals.accepted += entry.accepted || 0;
              userTotals.dismissed += entry.dismissed || 0;
              userTotals.autoMap += entry.auto_total || 0;
              userTotals.duplicates += entry.duplicates || 0;
              userTotals.manualMap += entry.manual_total || 0;
              userTotals.cannotBeMapped += entry.cannot_be_mapped || 0;
              userTotals.createdProperty += entry.created_property || 0;
              userTotals.overallTotal += entry.overall_total || 0;
            }
          });
        }
      });

      console.log('✅ Aggregated Totals:', processedData.map(u => ({
        user: u.userName,
        cannotBeMapped: u.totals.cannotBeMapped,
        createdProperty: u.totals.createdProperty,
        duplicates: u.totals.duplicates,
        overallTotal: u.totals.overallTotal
      })));

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

    // Show correct mapping type totals
    if (entry.mapping_type === 'auto') {
      return entry.auto_total > 0 ? entry.auto_total : '';
    }
    if (entry.mapping_type === 'manual') {
      return entry.manual_total > 0 ? entry.manual_total : '';
    }
    if (entry.mapping_type === 'hybrid') {
      const sum = (entry.auto_total || 0) + (entry.manual_total || 0);
      return sum > 0 ? sum : '';
    }
    return entry.overall_total > 0 ? entry.overall_total : '';
  };

  const handleCellClick = (userId, date, event) => {
    // Only allow editing if edit mode is enabled and user has proper role
    if (!editModeEnabled) return;
    if (user?.role !== 'developer' && user?.role !== 'leader') return;

    event?.preventDefault?.();
    event?.stopPropagation?.();

    const entry = getCellData(userId, date);
    const cellValue = getCellValue(entry);
    
    // Use a unique cell identifier combining userId and date string
    const cellKey = `${userId}-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
    
    // Format date as YYYY-MM-DD using local date (no timezone issues)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('🔵 CLICKED CELL:', {
      cellKey,
      userId,
      date: date.toDateString(),
      dateFormatted: dateString,
      entry: entry
    });
    
    setEditingCell({ 
      userId, 
      date: dateString,  // Store as YYYY-MM-DD string instead of ISO
      cellKey: cellKey
    });
    setEditValue(cellValue ? cellValue.toString() : '');
  };

  const handleStatusSelect = async (status) => {
    if (!editingCell || !status) return;
    
    const cellToUpdate = { ...editingCell };

    
    try {
      // Handle "Clear Status" option
      if (status === 'Clear Status') {
        
        // Parse the date from ISO string to get proper date parts
        const dateObj = new Date(cellToUpdate.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        
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
        const response = await api.delete('/api/v1/daily_prods/delete_status', {
          data: {
            user_id: cellToUpdate.userId,
            date: formattedDate  // Use YYYY-MM-DD format
          }
        });

        console.log('✅ Backend delete successful');
        // Refresh to get the recalculated totals from prod_entries
        await fetchDailyProds();
        return;
      }
      
      
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
      await api.patch('/api/v1/daily_prods/update_cell', {
        user_id: cellToUpdate.userId,
        date: formattedDate,  // Use YYYY-MM-DD format
        value: status,
        is_status: true
      });
    } catch (error) {
      console.error('Error in handleStatusSelect:', error);
    }
  };

  const handleDeleteEntry = async () => {
    if (!editingCell) return;

    const cellToDelete = { ...editingCell };
    
    try {
      console.log('🗑️ Deleting entry:', {
        userId: cellToDelete.userId,
        date: cellToDelete.date, // Already in YYYY-MM-DD format
        cellKey: cellToDelete.cellKey
      });

      // Immediately update UI - clear the entry
      setDailyProds(prevProds => {
        return prevProds.map(userData => {
          if (userData.userId === cellToDelete.userId) {
            const updatedEntries = userData.entries.map(entry => {
              const entryCellKey = `${cellToDelete.userId}-${entry.date.getDate()}-${entry.date.getMonth()}-${entry.date.getFullYear()}`;
              
              if (entryCellKey === cellToDelete.cellKey) {
                // Reset the entry to empty state
                return {
                  ...entry,
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
      
      // Send DELETE request to backend
      await api.delete('/api/v1/daily_prods/delete_entry', {
        data: {
          user_id: cellToDelete.userId,
          date: cellToDelete.date // Pass as-is (YYYY-MM-DD)
        }
      });

      console.log('✅ Entry deleted successfully');
      // Refresh to ensure UI is in sync with backend
      await fetchDailyProds();
    } catch (error) {
      console.error('Error in handleDeleteEntry:', error);
      // Refresh to restore correct state
      await fetchDailyProds();
    }
  };

  const handleCellBlur = async (e) => {
    // Don't blur if clicking on the dropdown or its menu
    if (e?.relatedTarget?.closest('.MuiSelect-root, .MuiMenu-root, .MuiMenuItem-root')) {
      return;
    }
    
    if (!editingCell) return;

    try {
      await api.patch('/api/v1/daily_prods/update_cell', {
        user_id: editingCell.userId,
        date: editingCell.date,
        value: editValue
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
    return <LoadingSpinner />;
  }

  const dates = getDatesForMonth();
  const isDeveloper = user?.role === 'developer';
  const canEdit = user?.role === 'developer' || user?.role === 'leader';
  const chartData = dailyProds.map(user => ({
    name: user.userName,
    'Accepted': user.totals.accepted,
    'Dismissed': user.totals.dismissed,
    'Duplicates': user.totals.duplicates,
    'Cannot Be Mapped': user.totals.cannotBeMapped,
    'Created Property': user.totals.createdProperty,
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
            {canEdit && (
              <Grid item xs={12} md="auto">
                <Tooltip title={editModeEnabled ? "Done Editing" : "Enable Editing"}>
                  <IconButton
                    onClick={() => {
                      setEditModeEnabled(!editModeEnabled);
                      setEditingCell(null);
                      setEditValue('');
                    }}
                    sx={{
                      bgcolor: editModeEnabled ? '#10b981' : '#6b7280',
                      color: '#fff',
                      '&:hover': {
                        bgcolor: editModeEnabled ? '#059669' : '#4b5563',
                      },
                    }}
                  >
                    {editModeEnabled ? <CheckIcon /> : <EditIcon />}
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
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
                  <Bar dataKey="Accepted" fill="#166534" />
                  <Bar dataKey="Dismissed" fill="#991b1b" />
                  <Bar dataKey="Duplicates" fill="#ea580c" />
                  <Bar dataKey="Cannot Be Mapped" fill="#991b1b" />
                  <Bar dataKey="Created Property" fill="#1e40af" />
                  <Bar dataKey="Overall Total" fill="#000000" />
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
                  { 
                    field: 'userName', 
                    headerName: 'Team Members', 
                    width: 200,
                    cellClassName: 'team-members-cell',
                    headerClassName: 'team-members-header',
                    headerAlign: 'center',
                    align: 'center'
                  },
                  { 
                    field: 'accepted', 
                    headerName: 'ACCEPTED', 
                    width: 180, 
                    type: 'number',
                    cellClassName: 'accepted-cell',
                    headerClassName: 'accepted-header',
                    headerAlign: 'center',
                    align: 'center'
                  },
                  { 
                    field: 'dismissed', 
                    headerName: 'DISMISSED', 
                    width: 180, 
                    type: 'number',
                    cellClassName: 'dismissed-cell',
                    headerClassName: 'dismissed-header',
                    headerAlign: 'center',
                    align: 'center'
                  },
                  { 
                    field: 'duplicates', 
                    headerName: 'DUPLICATES', 
                    width: 180, 
                    type: 'number',
                    cellClassName: 'duplicates-cell',
                    headerClassName: 'duplicates-header',
                    headerAlign: 'center',
                    align: 'center'
                  },
                  { 
                    field: 'cannotBeMapped', 
                    headerName: 'CANNOT BE MAPPED', 
                    width: 220, 
                    type: 'number',
                    cellClassName: 'cannot-be-mapped-cell',
                    headerClassName: 'cannot-be-mapped-header',
                    headerAlign: 'center',
                    align: 'center'
                  },
                  { 
                    field: 'createdProperty', 
                    headerName: 'CREATED PROPERTY', 
                    width: 220, 
                    type: 'number',
                    cellClassName: 'created-property-cell',
                    headerClassName: 'created-property-header',
                    headerAlign: 'center',
                    align: 'center'
                  }
                ]}
                slots={{ toolbar: GridToolbar }}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 }
                  }
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                sx={{
                    '& .MuiDataGrid-root': {
                      backgroundColor: '#fff',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#374151',
                      color: '#fff',
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      textAlign: 'center',
                      display: 'block',
                      width: '100%',
                      fontWeight: 'bold',
                    },
                    '& .MuiDataGrid-cell': {
                      fontWeight: 600,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    // Team Members - Black header, white background
                    '& .team-members-header': {
                      backgroundColor: '#1f2937 !important',
                      color: '#fff !important',
                      textAlign: 'center',
                    },
                    '& .team-members-cell': {
                      backgroundColor: '#fff',
                      color: '#000 !important',
                    },
                    // Accepted - Green header, white background
                    '& .accepted-header': {
                      backgroundColor: '#166534 !important',
                      color: '#fff !important',
                      textAlign: 'center',
                    },
                    '& .accepted-cell': {
                      backgroundColor: '#fff',
                      color: '#166534 !important',
                    },
                    // Dismissed - Red header, white background
                    '& .dismissed-header': {
                      backgroundColor: '#991b1b !important',
                      color: '#fff !important',
                      textAlign: 'center',
                    },
                    '& .dismissed-cell': {
                      backgroundColor: '#fff',
                      color: '#991b1b !important',
                    },
                    // Duplicates - Orange header, white background
                    '& .duplicates-header': {
                      backgroundColor: '#ea580c !important',
                      color: '#fff !important',
                      textAlign: 'center',
                    },
                    '& .duplicates-cell': {
                      backgroundColor: '#fff',
                      color: '#ea580c !important',
                    },
                    // Cannot Be Mapped - Red header, white background
                    '& .cannot-be-mapped-header': {
                      backgroundColor: '#991b1b !important',
                      color: '#fff !important',
                      textAlign: 'center',
                    },
                    '& .cannot-be-mapped-cell': {
                      backgroundColor: '#fff',
                      color: '#991b1b !important',
                    },
                    // Created Property - Blue header, white background
                    '& .created-property-header': {
                      backgroundColor: '#1e40af !important',
                      color: '#fff !important',
                      textAlign: 'center',
                    },
                    '& .created-property-cell': {
                      backgroundColor: '#fff',
                      color: '#1e40af !important',
                    },
                    '& .MuiDataGrid-row': {
                      backgroundColor: '#fff',
                      color: '#000'
                    },
                    '& .MuiTypography-root': {
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
                    <StyledTableCell className="header pic">Team Members</StyledTableCell>
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
                            onClick={(e) => canEdit && editModeEnabled && handleCellClick(userData.userId, date, e)}
                            sx={{ 
                              cursor: canEdit && editModeEnabled ? 'pointer' : 'default',
                              '&:hover': canEdit && editModeEnabled ? {
                                outline: '2px solid #3b82f6',
                                outlineOffset: '-2px'
                              } : {}
                            }}
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
                                {/* Show delete button if there's any data (overall_total, cannot_be_mapped, created_property, etc.) */}
                                {((entry?.overall_total > 0) || (entry?.cannot_be_mapped > 0) || (entry?.created_property > 0) || (entry?.duplicates > 0)) && !entry?.status && (
                                  <Tooltip title="Delete entry">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this entry?')) {
                                          handleDeleteEntry();
                                        } else {
                                          setEditingCell(null);
                                        }
                                      }}
                                      sx={{ padding: '4px' }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {/* Only show status dropdown for empty cells or cells with status */}
                                {canEdit && (entry?.overall_total === 0 || !!entry?.status) && (
                                  <FormControl 
                                    size="small" 
                                    sx={{ minWidth: 120 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Select
                                      displayEmpty
                                      value=""
                                      open={true}
                                      autoFocus={true}
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