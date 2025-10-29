import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/NavBar';
import './SupplierDetail.css';

export default function SupplierDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchData();
  }, [id, token, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current user
  const userRes = await fetch(`${apiUrl}/api/v1/current_user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userRes.ok) throw new Error('Failed to fetch user');
      const userData = await userRes.json();
      setUser(userData);

      // Fetch supplier details
  const supplierRes = await fetch(`${apiUrl}/api/v1/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!supplierRes.ok) throw new Error('Failed to fetch supplier');
      const supplierData = await supplierRes.json();
      setSupplier(supplierData);
      setFormData(supplierData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      showNotification(err.message, 'error');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
  const res = await fetch(`${apiUrl}/api/v1/suppliers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ supplier: formData })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update supplier');
      }

      const updatedSupplier = await res.json();
      setSupplier(updatedSupplier);
      setIsEditing(false);
      showNotification('Supplier updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating supplier:', err);
      showNotification(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/v1/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete supplier');

      showNotification('Supplier deleted successfully!', 'success');
      setTimeout(() => navigate('/suppliers'), 1500);
    } catch (err) {
      console.error('Error deleting supplier:', err);
      showNotification(err.message, 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper functions to get readable labels
  const getPriorityLabel = (priority) => {
    if (!priority) return 'N/A';
    
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    };
    
    return labels[priority] || 'N/A';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'N/A';
    
    const labels = {
      queued: 'Queued',
      ongoing: 'Ongoing',
      cancelled: 'Cancelled',
      completed: 'Completed'
    };
    
    return labels[status] || 'N/A';
  };

  const canEdit = user?.role === 'leader' || user?.role === 'developer';

  if (loading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="supplier-detail-container">
          <div className="loading">Loading supplier details...</div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div>
        <Navbar user={user} />
        <div className="supplier-detail-container">
          <div className="error">Supplier not found</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} />

      <div className="supplier-detail-container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="detail-header">
          <button className="btn-back" onClick={() => navigate('/suppliers')}>
            ← Back to Suppliers
          </button>
          <div className="header-actions">
            {canEdit && !isEditing && (
              <>
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  Edit Supplier
                </button>
                <button className="btn-delete" onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}
            {isEditing && (
              <button className="btn-cancel" onClick={() => {
                setIsEditing(false);
                setFormData(supplier);
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="detail-content">
          <h1>{supplier.name}</h1>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="edit-form">
              {/* Basic Information */}
              <div className="form-section">
                <h2>Basic Information</h2>
                
                <div className="form-group">
                  <label htmlFor="name">Supplier Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="requester">Requester:</label>
                  <input
                    type="text"
                    id="requester"
                    name="requester"
                    value={formData.requester || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="priority">Priority:</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority || 'low'}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status:</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status || 'queued'}
                      onChange={handleInputChange}
                    >
                      <option value="queued">Queued</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="request_date">Request Date:</label>
                    <input
                      type="date"
                      id="request_date"
                      name="request_date"
                      value={formData.request_date || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="start_date">Start Date:</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="completed_date">Completed Date:</label>
                    <input
                      type="date"
                      id="completed_date"
                      name="completed_date"
                      value={formData.completed_date || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="form-section">
                <h2>Request Totals</h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="total_requests">Total Requests:</label>
                    <input
                      type="number"
                      id="total_requests"
                      name="total_requests"
                      value={formData.total_requests || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="total_mapped">Total Mapped:</label>
                    <input
                      type="number"
                      id="total_mapped"
                      name="total_mapped"
                      value={formData.total_mapped || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="total_pending">Total Pending:</label>
                    <input
                      type="number"
                      id="total_pending"
                      name="total_pending"
                      value={formData.total_pending || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Mapping Details */}
              <div className="form-section">
                <h2>Mapping Details</h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="automapping_covered_total">Automapping Covered:</label>
                    <input
                      type="number"
                      id="automapping_covered_total"
                      name="automapping_covered_total"
                      value={formData.automapping_covered_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="manual_total">Manual Total:</label>
                    <input
                      type="number"
                      id="manual_total"
                      name="manual_total"
                      value={formData.manual_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="manually_mapped">Manually Mapped:</label>
                    <input
                      type="number"
                      id="manually_mapped"
                      name="manually_mapped"
                      value={formData.manually_mapped || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="suggestions_total">Suggestions Total:</label>
                    <input
                      type="number"
                      id="suggestions_total"
                      name="suggestions_total"
                      value={formData.suggestions_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="accepted_total">Accepted Total:</label>
                    <input
                      type="number"
                      id="accepted_total"
                      name="accepted_total"
                      value={formData.accepted_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dismissed_total">Dismissed Total:</label>
                    <input
                      type="number"
                      id="dismissed_total"
                      name="dismissed_total"
                      value={formData.dismissed_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Data Quality */}
              <div className="form-section">
                <h2>Data Quality</h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="incorrect_supplier_data">Incorrect Supplier Data:</label>
                    <input
                      type="number"
                      id="incorrect_supplier_data"
                      name="incorrect_supplier_data"
                      value={formData.incorrect_supplier_data || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="duplicate_count">Duplicate Count:</label>
                    <input
                      type="number"
                      id="duplicate_count"
                      name="duplicate_count"
                      value={formData.duplicate_count || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="created_property">Created Property:</label>
                    <input
                      type="number"
                      id="created_property"
                      name="created_property"
                      value={formData.created_property || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reactivated_total">Reactivated Total:</label>
                    <input
                      type="number"
                      id="reactivated_total"
                      name="reactivated_total"
                      value={formData.reactivated_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Not Covered Section */}
              <div className="form-section">
                <h2>Not Covered</h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="not_covered">Not Covered:</label>
                    <input
                      type="number"
                      id="not_covered"
                      name="not_covered"
                      value={formData.not_covered || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nc_manually_mapped">NC Manually Mapped:</label>
                    <input
                      type="number"
                      id="nc_manually_mapped"
                      name="nc_manually_mapped"
                      value={formData.nc_manually_mapped || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nc_created_property">NC Created Property:</label>
                    <input
                      type="number"
                      id="nc_created_property"
                      name="nc_created_property"
                      value={formData.nc_created_property || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nc_incorrect_supplier">NC Incorrect Supplier:</label>
                    <input
                      type="number"
                      id="nc_incorrect_supplier"
                      name="nc_incorrect_supplier"
                      value={formData.nc_incorrect_supplier || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="jp_props">JP Props:</label>
                    <input
                      type="number"
                      id="jp_props"
                      name="jp_props"
                      value={formData.jp_props || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="form-section">
                <h2>Remarks</h2>
                <div className="form-group">
                  <label htmlFor="remarks">Additional Notes:</label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            // View Mode
            <div className="view-mode">
              {/* Basic Information */}
              <div className="info-section">
                <h2>Basic Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Requester:</span>
                    <span className="value">{supplier.requester || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Priority:</span>
                    <span className="value">{getPriorityLabel(supplier.priority)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className="value">{getStatusLabel(supplier.status)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Request Date:</span>
                    <span className="value">{formatDate(supplier.request_date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Start Date:</span>
                    <span className="value">{formatDate(supplier.start_date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Completed Date:</span>
                    <span className="value">{formatDate(supplier.completed_date)}</span>
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="info-section">
                <h2>Request Totals</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{supplier.total_requests || 0}</div>
                    <div className="stat-label">Total Requests</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{supplier.total_mapped || 0}</div>
                    <div className="stat-label">Total Mapped</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{supplier.total_pending || 0}</div>
                    <div className="stat-label">Total Pending</div>
                  </div>
                </div>
              </div>

              {/* Mapping Details */}
              <div className="info-section">
                <h2>Mapping Details</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Automapping Covered:</span>
                    <span className="value">{supplier.automapping_covered_total || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Manual Total:</span>
                    <span className="value">{supplier.manual_total || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Manually Mapped:</span>
                    <span className="value">{supplier.manually_mapped || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Suggestions Total:</span>
                    <span className="value">{supplier.suggestions_total || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Accepted Total:</span>
                    <span className="value">{supplier.accepted_total || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Dismissed Total:</span>
                    <span className="value">{supplier.dismissed_total || 0}</span>
                  </div>
                </div>
              </div>

              {/* Data Quality */}
              <div className="info-section">
                <h2>Data Quality</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Incorrect Supplier Data:</span>
                    <span className="value">{supplier.incorrect_supplier_data || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Duplicate Count:</span>
                    <span className="value">{supplier.duplicate_count || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Created Property:</span>
                    <span className="value">{supplier.created_property || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Reactivated Total:</span>
                    <span className="value">{supplier.reactivated_total || 0}</span>
                  </div>
                </div>
              </div>

              {/* Not Covered Section */}
              <div className="info-section">
                <h2>Not Covered</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Not Covered:</span>
                    <span className="value">{supplier.not_covered || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">NC Manually Mapped:</span>
                    <span className="value">{supplier.nc_manually_mapped || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">NC Created Property:</span>
                    <span className="value">{supplier.nc_created_property || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">NC Incorrect Supplier:</span>
                    <span className="value">{supplier.nc_incorrect_supplier || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">JP Props:</span>
                    <span className="value">{supplier.jp_props || 0}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {supplier.remarks && (
                <div className="info-section">
                  <h2>Remarks</h2>
                  <p className="remarks-text">{supplier.remarks}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}