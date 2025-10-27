import { useEffect, useState } from 'react';
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
    assigned_user_id: '',
    date: new Date().toISOString().split('T')[0],
    mapping_type: 0,
    manually_mapped: 0,
    incorrect_supplier_data: 0,
    created_property: 0,
    insufficient_info: 0,
    accepted: 0,
    dismissed: 0,
    no_result: 0,
    duplicate: 0,
    reactivated: 0,
    source: 0, //kept, but unused
    remarks: ''
  });
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
      const userRes = await fetch('http://localhost:3000/api/v1/current_user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!userRes.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const userData = await userRes.json();
      setUser(userData);
      setFormData(prev => ({ ...prev, assigned_user_id: userData.id }));
      
      // Fetch suppliers with error handling
      try {
        const suppliersRes = await fetch('http://localhost:3000/api/v1/suppliers', {
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
      
      // Fetch junior users if user is leader or developer
      if (userData.role === 'leader' || userData.role === 'developer') {
        try {
          const juniorRes = await fetch('http://localhost:3000/api/v1/users?role=junior', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (juniorRes.ok) {
            const juniorData = await juniorRes.json();
            let juniors = [];
            if (Array.isArray(juniorData)) {
              juniors = juniorData;
            } else if (Array.isArray(juniorData.users)) {
              juniors = juniorData.users;
            } else if (Array.isArray(juniorData.data)) {
              juniors = juniorData.data;
            }
            setJuniorUsers(juniors);
            console.log('Junior users set:', juniors.length, 'users');
          } else {
            console.error('Failed to fetch junior users, status:', juniorRes.status);
            setJuniorUsers([]);
          }
        } catch (juniorErr) {
          console.error('Error fetching junior users:', juniorErr);
          setJuniorUsers([]);
        }
      } else {
        console.log('User is not leader/developer, role:', userData.role);
      }
      
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
      [name]: name === 'remarks' ? value : (value === '' ? '' : Number(value) || value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      showNotification('Please select a supplier', 'error');
      return;
    }

    try {
      const payload = {
        prod_entry: {
          ...formData,
          entered_by_user_id: user.id,
          source: 0 // Always send source: 0 (API) since we removed the field
        }
      };

      const res = await fetch('http://localhost:3000/api/v1/prod_entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create prod entry');
      }

      const data = await res.json();
      showNotification('Productivity entry created successfully!', 'success');
      resetForm();
    } catch (err) {
      console.error('Error creating prod entry:', err);
      showNotification(err.message || 'Failed to create entry. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      assigned_user_id: user?.id || '',
      date: new Date().toISOString().split('T')[0],
      mapping_type: 0,
      manually_mapped: 0,
      incorrect_supplier_data: 0,
      created_property: 0,
      insufficient_info: 0,
      accepted: 0,
      dismissed: 0,
      no_result: 0,
      duplicate: 0,
      reactivated: 0,
      source: 0,
      remarks: ''
    });
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

  const canAssignToOthers = user?.role === 'leader' || user?.role === 'developer';

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
          {/* User Selection - Show for both leader and developer */}
          {canAssignToOthers && (
            <div className="form-group">
              <label htmlFor="assigned_user_id">
                Assign to User: <span className="required">*</span>
              </label>
              <select
                id="assigned_user_id"
                name="assigned_user_id"
                value={formData.assigned_user_id}
                onChange={handleInputChange}
                required
              >
                  <option value={user.id}>Me ({user.email})</option>
                  {/* Show junior users except current user */}
                  {juniorUsers.length > 0 ? (
                    juniorUsers
                      .filter(junior => junior.id !== user.id)
                      .map(junior => (
                        <option key={junior.id} value={junior.id}>
                          {junior.name || junior.email}
                        </option>
                      ))
                  ) : (
                    <option disabled>No junior users found</option>
                  )}
              </select>
              <small style={{ color: '#666', fontSize: '12px' }}>
              </small>
            </div>
          )}

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
            />
          </div>

          {/* Mapping Type */}
          <div className="form-group">
            <label htmlFor="mapping_type">Mapping Type:</label>
            <select
              id="mapping_type"
              name="mapping_type"
              value={formData.mapping_type}
              onChange={handleInputChange}
            >
              <option value={0}>Auto</option>
              <option value={1}>Manual</option>
              <option value={2}>Hybrid</option>
            </select>
          </div>

          {/* SOURCE FIELD REMOVED FROM UI - but still sent in payload with value 0 */}

          {/* Numeric Fields Grid */}
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="manually_mapped">Manually Mapped:</label>
              <input
                type="number"
                id="manually_mapped"
                name="manually_mapped"
                value={formData.manually_mapped}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('manually_mapped')}
                className={isFieldDisabled('manually_mapped') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="incorrect_supplier_data">Incorrect Supplier Data:</label>
              <input
                type="number"
                id="incorrect_supplier_data"
                name="incorrect_supplier_data"
                value={formData.incorrect_supplier_data}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('incorrect_supplier_data')}
                className={isFieldDisabled('incorrect_supplier_data') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="created_property">Created Property:</label>
              <input
                type="number"
                id="created_property"
                name="created_property"
                value={formData.created_property}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('created_property')}
                className={isFieldDisabled('created_property') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="insufficient_info">Insufficient Info:</label>
              <input
                type="number"
                id="insufficient_info"
                name="insufficient_info"
                value={formData.insufficient_info}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('insufficient_info')}
                className={isFieldDisabled('insufficient_info') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="accepted">Accepted:</label>
              <input
                type="number"
                id="accepted"
                name="accepted"
                value={formData.accepted}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('accepted')}
                className={isFieldDisabled('accepted') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dismissed">Dismissed:</label>
              <input
                type="number"
                id="dismissed"
                name="dismissed"
                value={formData.dismissed}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('dismissed')}
                className={isFieldDisabled('dismissed') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="no_result">No Result:</label>
              <input
                type="number"
                id="no_result"
                name="no_result"
                value={formData.no_result}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('no_result')}
                className={isFieldDisabled('no_result') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="duplicate">Duplicate:</label>
              <input
                type="number"
                id="duplicate"
                name="duplicate"
                value={formData.duplicate}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('duplicate')}
                className={isFieldDisabled('duplicate') ? 'disabled-field' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reactivated">Reactivated:</label>
              <input
                type="number"
                id="reactivated"
                name="reactivated"
                value={formData.reactivated}
                onChange={handleInputChange}
                min="0"
                disabled={isFieldDisabled('reactivated')}
                className={isFieldDisabled('reactivated') ? 'disabled-field' : ''}
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="form-group">
            <label htmlFor="remarks">Remarks:</label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows="4"
              placeholder="Add any additional notes here..."
            />
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