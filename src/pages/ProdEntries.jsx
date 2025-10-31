import { useEffect, useState } from 'react';
const apiUrl = import.meta.env.VITE_API_URL;
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import './ProdEntries.css';

export default function ProdEntries() {
  const [user, setUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [juniorUsers, setJuniorUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    date: new Date().toISOString().split('T')[0],
    source: 'autosheet' // default source
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
  const userRes = await fetch(`${apiUrl}/api/v1/current_user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!userRes.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await userRes.json();
      setUser(userData);
  // No longer need assigned_user_id
      
      // Fetch suppliers with error handling
      try {
  const suppliersRes = await fetch(`${apiUrl}/api/v1/suppliers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json();
          if (Array.isArray(suppliersData)) {
            setSuppliers(suppliersData);
          } else {
            console.warn('Suppliers response is not an array:', suppliersData);
            setSuppliers([]);
          }
        } else {
          console.warn('Failed to fetch suppliers, status:', suppliersRes.status);
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
      [name]: value
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
    if (!csvFile) {
      showNotification('Please attach a CSV file', 'error');
      return;
    }
    try {
  const formDataToSend = new FormData();
  formDataToSend.append('supplier_id', formData.supplier_id);
  formDataToSend.append('date', formData.date);
  formDataToSend.append('source', formData.source);
  formDataToSend.append('csv_file', csvFile);

      const res = await fetch(`${apiUrl}/api/v1/prod_entries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create prod entry');
      }

      const data = await res.json();
      showNotification('Productivity entry created successfully!', 'success');
      resetForm();
      setCsvFile(null);
    } catch (err) {
      console.error('Error creating prod entry:', err);
      showNotification(err.message || 'Failed to create entry. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      date: new Date().toISOString().split('T')[0],
      source: 'autosheet'
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
    return (
      <div>
        <Navbar user={user} />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
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
          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          {/* Source Selection */}
          <div className="form-group">
            <label>Source:</label>
            <div style={{ display: 'flex', gap: '2em', marginTop: '0.5em' }}>
              <label>
                <input
                  type="radio"
                  name="source"
                  value="autosheet"
                  checked={formData.source === 'autosheet'}
                  onChange={handleInputChange}
                /> Autosheet
              </label>
              <label>
                <input
                  type="radio"
                  name="source"
                  value="manualsheet"
                  checked={formData.source === 'manualsheet'}
                  onChange={handleInputChange}
                /> Manualsheet
              </label>
              <label>
                <input
                  type="radio"
                  name="source"
                  value="logs"
                  checked={formData.source === 'logs'}
                  onChange={handleInputChange}
                /> Logs
              </label>
            </div>
          </div>
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