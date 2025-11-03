import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/NavBar/NavBar';
import DeleteIcon from '@mui/icons-material/Delete';
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
      const userRes = await api.get('/api/v1/current_user');
      setUser(userRes.data);

      // Fetch supplier details
      const supplierRes = await api.get(`/api/v1/suppliers/${id}`);
      setSupplier(supplierRes.data);
      setFormData(supplierRes.data);

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
      const res = await api.patch(`/api/v1/suppliers/${id}`, { supplier: formData });
      setSupplier(res.data);
      setIsEditing(false);
      showNotification('Supplier updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating supplier:', err);
      showNotification(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/v1/suppliers/${id}`);
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
                  <DeleteIcon sx={{ fontSize: 18 }} />
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

              {/* Request Totals Section */}
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
                    <label htmlFor="total_bad_data">Total Bad Data:</label>
                    <input
                      type="number"
                      id="total_bad_data"
                      name="total_bad_data"
                      value={formData.total_bad_data || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Automapping */}
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ margin: 0 }}>Automapping</h2>
                  <div className="form-group" style={{ margin: 0, width: '150px' }}>
                    <input
                      type="number"
                      name="automapping_total"
                      value={formData.automapping_total || 0}
                      onChange={handleInputChange}
                      min="0"
                      style={{ textAlign: 'right', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
                
                <div className="form-grid">
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
                </div>
              </div>

              {/* Manual Mapping */}
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ margin: 0 }}>Manual Mapping</h2>
                  <div className="form-group" style={{ margin: 0, width: '150px' }}>
                    <input
                      type="number"
                      name="manual_mapping_total"
                      value={formData.manual_mapping_total || 0}
                      onChange={handleInputChange}
                      min="0"
                      style={{ textAlign: 'right', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
                
                <div className="form-grid">
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
                    <label htmlFor="insufficient_info">Insufficient Info:</label>
                    <input
                      type="number"
                      id="insufficient_info"
                      name="insufficient_info"
                      value={formData.insufficient_info || 0}
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

              {/* Not Covered */}
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ margin: 0 }}>Not Covered</h2>
                  <div className="form-group" style={{ margin: 0, width: '150px' }}>
                    <input
                      type="number"
                      name="not_covered_total"
                      value={formData.not_covered_total || 0}
                      onChange={handleInputChange}
                      min="0"
                      style={{ textAlign: 'right', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="nc_manually_mapped">Manually Mapped:</label>
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
                    <label htmlFor="nc_incorrect_supplier">Incorrect Supplier Data:</label>
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
                    <label htmlFor="nc_insufficient_info">Insufficient Info:</label>
                    <input
                      type="number"
                      id="nc_insufficient_info"
                      name="nc_insufficient_info"
                      value={formData.nc_insufficient_info || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nc_created_property">Created Property:</label>
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
                    <label htmlFor="nc_reactivated_total">Reactivated Total:</label>
                    <input
                      type="number"
                      id="nc_reactivated_total"
                      name="nc_reactivated_total"
                      value={formData.nc_reactivated_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Bad Suggestions */}
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ margin: 0 }}>Bad Suggestions</h2>
                  <div className="form-group" style={{ margin: 0, width: '150px' }}>
                    <input
                      type="number"
                      name="bad_suggestions_total"
                      value={formData.bad_suggestions_total || 0}
                      onChange={handleInputChange}
                      min="0"
                      style={{ textAlign: 'right', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="bs_manually_mapped">Manually Mapped:</label>
                    <input
                      type="number"
                      id="bs_manually_mapped"
                      name="bs_manually_mapped"
                      value={formData.bs_manually_mapped || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bs_incorrect_supplier">Incorrect Supplier Data:</label>
                    <input
                      type="number"
                      id="bs_incorrect_supplier"
                      name="bs_incorrect_supplier"
                      value={formData.bs_incorrect_supplier || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bs_insufficient_info">Insufficient Info:</label>
                    <input
                      type="number"
                      id="bs_insufficient_info"
                      name="bs_insufficient_info"
                      value={formData.bs_insufficient_info || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bs_created_property">Created Property:</label>
                    <input
                      type="number"
                      id="bs_created_property"
                      name="bs_created_property"
                      value={formData.bs_created_property || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bs_reactivated_total">Reactivated Total:</label>
                    <input
                      type="number"
                      id="bs_reactivated_total"
                      name="bs_reactivated_total"
                      value={formData.bs_reactivated_total || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Others */}
              <div className="form-section">
                <h2>Others</h2>
                
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
                    <label htmlFor="jp_props">JPN Properties:</label>
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

              {/* Request Totals Section */}
              <div className="info-section">
                <h2>Request Totals</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{supplier.total_requests || 0}</div>
                    <div className="stat-label">Total Requests</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{supplier.total_pending || 0}</div>
                    <div className="stat-label">Total Pending</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{supplier.total_mapped || 0}</div>
                    <div className="stat-label">Total Mapped</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{supplier.total_bad_data || 0}</div>
                    <div className="stat-label">Total Bad Data</div>
                  </div>
                </div>
              </div>

              {/* Automapping */}
              <div className="info-section">
                <h2>Automapping: <span className="value">{supplier.automapping_total || 0}</span></h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Accepted Total:</span>
                    <span className="value">{supplier.accepted_total || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Dismissed Total:</span>
                    <span className="value">{supplier.dismissed_total || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Duplicate Count:</span>
                    <span className="value">{supplier.duplicate_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Manual Mapping */}
              <div className="info-section">
                <h2>Manual Mapping: <span className="value">{supplier.manual_mapping_total || 0}</span></h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Manually Mapped:</span>
                    <span className="value">{supplier.manually_mapped || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Incorrect Supplier Data:</span>
                    <span className="value">{supplier.incorrect_supplier_data || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Insufficient Info:</span>
                    <span className="value">{supplier.insufficient_info || 0}</span>
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

              {/* Not Covered */}
              <div className="info-section">
                <h2>Not Covered: <span className="value">{supplier.not_covered_total || 0}</span></h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Manually Mapped:</span>
                    <span className="value">{supplier.nc_manually_mapped || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Incorrect Supplier Data:</span>
                    <span className="value">{supplier.nc_incorrect_supplier || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Insufficient Info:</span>
                    <span className="value">{supplier.nc_insufficient_info || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Created Property:</span>
                    <span className="value">{supplier.nc_created_property || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Reactivated Total:</span>
                    <span className="value">{supplier.nc_reactivated_total || 0}</span>
                  </div>
                </div>
              </div>

              {/* Bad Suggestions */}
              <div className="info-section">
                <h2>Bad Suggestions: <span className="value">{supplier.bad_suggestions_total || 0}</span></h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Manually Mapped:</span>
                    <span className="value">{supplier.bs_manually_mapped || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Incorrect Supplier Data:</span>
                    <span className="value">{supplier.bs_incorrect_supplier || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Insufficient Info:</span>
                    <span className="value">{supplier.bs_insufficient_info || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Created Property:</span>
                    <span className="value">{supplier.bs_created_property || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Reactivated Total:</span>
                    <span className="value">{supplier.bs_reactivated_total || 0}</span>
                  </div>
                </div>
              </div>

              {/* Others */}
              <div className="info-section">
                <h2>Others</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Automapping Covered:</span>
                    <span className="value">{supplier.automapping_covered_total || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">JPN Properties:</span>
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