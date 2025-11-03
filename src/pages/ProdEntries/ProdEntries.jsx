import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/NavBar/NavBar';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './ProdEntries.css';

export default function ProdEntries() {
  const [user, setUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [juniorUsers, setJuniorUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    source: 'autosheet', // default source
    manualsheet_type: '', // for manualsheet subcategory
    date: new Date().toISOString().split('T')[0] // default to today's date
  });
  const [csvFile, setCsvFile] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchInitialData();
  }, [token, navigate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch current user
      const userRes = await api.get('/api/v1/current_user');
      setUser(userRes.data);
  // No longer need assigned_user_id
      
      // Fetch suppliers with error handling
      try {
        const suppliersRes = await api.get('/api/v1/suppliers');
        if (Array.isArray(suppliersRes.data)) {
          // Filter to only show suppliers with 'ongoing' status
          const ongoingSuppliers = suppliersRes.data.filter(
            supplier => supplier.status === 'ongoing'
          );
          setSuppliers(ongoingSuppliers);
        } else {
          console.warn('Suppliers response is not an array:', suppliersRes.data);
          setSuppliers([]);
        }
      } catch (suppErr) {
        console.error('Error fetching suppliers:', suppErr);
        setSuppliers([]);
      }
      
      // No longer need junior users
      
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchInitialData:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset manualsheet_type if source changes away from manualsheet
      ...(name === 'source' && value !== 'manualsheet' && { manualsheet_type: '' })
    }));
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      showNotification('Please select a supplier', 'error');
      return;
    }
    if (!formData.date) {
      showNotification('Please select a date', 'error');
      return;
    }
    if (!csvFile) {
      showNotification('Please attach a CSV file', 'error');
      return;
    }
    if (formData.source === 'manualsheet' && !formData.manualsheet_type) {
      showNotification('Please select a manualsheet type', 'error');
      return;
    }
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('supplier_id', formData.supplier_id);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('source', formData.source);
      formDataToSend.append('csv_file', csvFile);
      if (formData.source === 'manualsheet' && formData.manualsheet_type) {
        formDataToSend.append('manualsheet_type', formData.manualsheet_type);
      }

      console.log('Submitting with:', {
        supplier_id: formData.supplier_id,
        date: formData.date,
        source: formData.source,
        manualsheet_type: formData.manualsheet_type,
        csv_file: csvFile?.name
      });

      const res = await api.post('/api/v1/prod_entries', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showNotification('Productivity entry created successfully!', 'success');
      resetForm();
      setCsvFile(null);
    } catch (err) {
      console.error('Error creating prod entry:', err);
      showNotification(err.response?.data?.error || err.response?.data?.errors?.join(', ') || err.message || 'Failed to create entry. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      source: 'autosheet',
      manualsheet_type: '',
      date: new Date().toISOString().split('T')[0]
    });
    setCsvFile(null);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Helper function to determine if a field should be disabled
  const isFieldDisabled = (fieldName) => {
    const mappingType = Number(formData.mapping_type);
    
    // Manual fields: manually_mapped, incorrect_supplier_data, created_property, insufficient_info, reactivated
    const manualFields = ['manually_mapped', 'incorrect_supplier_data', 'created_property', 'insufficient_info', 'reactivated'];
    
    // Auto fields: accepted, dismissed, no_result, duplicate
    const autoFields = ['accepted', 'dismissed', 'no_result', 'duplicate'];
    
    // Mapping Type 0 = Auto: disable manual fields
    if (mappingType === 0 && manualFields.includes(fieldName)) {
      return true;
    }
    
    // Mapping Type 1 = Manual: disable auto fields
    if (mappingType === 1 && autoFields.includes(fieldName)) {
      return true;
    }
    
    // Mapping Type 2 = Hybrid: all fields enabled
    // No fields are disabled for hybrid
    
    return false;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div>
        <Navbar user={user} />
        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
          <h2>Error: {error}</h2>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Navbar user={null} />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>No user found. Please log in.</h2>
        </div>
      </div>
    );
  }

  // Only leader/developer can access this page, so no need for assign to user

  return (
    <div>
      <Navbar user={user} />
      <div className="prod-entries-container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="prod-entry-form">
          <h1>Productivity Entry</h1>
          {/* Supplier Selection */}
          <div className="form-group">
            <label htmlFor="supplier_id">
              Supplier: <span className="required">*</span>
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled hidden>-- Select Supplier --</option>
              {suppliers.length === 0 ? (
                <option disabled>No suppliers available</option>
              ) : (
                suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))
              )}
            </select>
          </div>
          {/* Date Selection */}
          <div className="form-group">
            <label htmlFor="date">
              Date: <span className="required">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          {/* Source Selection */}
          <div className="form-group">
            <label>Source:</label>
            <div style={{ display: 'flex', gap: '2em', marginTop: '0.5em' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                <input
                  type="radio"
                  name="source"
                  value="autosheet"
                  checked={formData.source === 'autosheet'}
                  onChange={handleInputChange}
                />
                Autosheet
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                <input
                  type="radio"
                  name="source"
                  value="manualsheet"
                  checked={formData.source === 'manualsheet'}
                  onChange={handleInputChange}
                />
                Manualsheet
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                <input
                  type="radio"
                  name="source"
                  value="logs"
                  checked={formData.source === 'logs'}
                  onChange={handleInputChange}
                />
                Logs
              </label>
            </div>
          </div>
          {/* Manualsheet Type - Only shown when Manualsheet is selected */}
          {formData.source === 'manualsheet' && (
            <div className="form-group">
              <label htmlFor="manualsheet_type">
                Manualsheet Type: <span className="required">*</span>
              </label>
              <select
                id="manualsheet_type"
                name="manualsheet_type"
                value={formData.manualsheet_type}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled hidden>-- Select Type --</option>
                <option value="common">Common</option>
                <option value="bad_suggestions">Bad Suggestions</option>
                <option value="not_covered">Not Covered</option>
              </select>
            </div>
          )}
          {/* CSV File Attachment */}
          <div className="form-group">
            <label htmlFor="csvFile">Attach CSV File:</label>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileChange}
            />
            {csvFile && <span style={{ marginLeft: '1em' }}>{csvFile.name}</span>}
          </div>
          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Submit Entry
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}