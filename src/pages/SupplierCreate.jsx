import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import './SupplierDetail.css';

export default function SupplierCreate() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    requester: '',
    priority: 1,
    status: 1,
    request_date: new Date().toISOString().split('T')[0],
    start_date: '',
    completed_date: '',
    total_requests: 0,
    total_mapped: 0,
    total_pending: 0,
    total_bad_data: 0,
    // Automapping
    automapping_total: 0,
    accepted_total: 0,
    dismissed_total: 0,
    duplicate_count: 0,
    // Manual Mapping
    manual_mapping_total: 0,
    manually_mapped: 0,
    incorrect_supplier_data: 0,
    insufficient_info: 0,
    created_property: 0,
    reactivated_total: 0,
    // Not Covered
    not_covered_total: 0,
    nc_manually_mapped: 0,
    nc_incorrect_supplier: 0,
    nc_insufficient_info: 0,
    nc_created_property: 0,
    nc_reactivated_total: 0,
    // Bad Suggestions
    bad_suggestions_total: 0,
    bs_manually_mapped: 0,
    bs_incorrect_supplier: 0,
    bs_insufficient_info: 0,
    bs_created_property: 0,
    bs_reactivated_total: 0,
    // Others
    automapping_covered_total: 0,
    jp_props: 0,
    remarks: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchUser();
  }, [token, navigate]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/current_user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const userData = await res.json();
      setUser(userData);
      // Check if user can create suppliers
      if (userData.role !== 'leader' && userData.role !== 'developer') {
        showNotification('You do not have permission to create suppliers', 'error');
        setTimeout(() => navigate('/suppliers'), 2000);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
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

    // Convert string values to integers
    const submissionData = {
      ...formData,
      priority: parseInt(formData.priority),
      status: parseInt(formData.status),
      total_requests: parseInt(formData.total_requests) || 0,
      total_mapped: parseInt(formData.total_mapped) || 0,
      total_pending: parseInt(formData.total_pending) || 0,
      total_bad_data: parseInt(formData.total_bad_data) || 0,
      // Automapping
      automapping_total: parseInt(formData.automapping_total) || 0,
      accepted_total: parseInt(formData.accepted_total) || 0,
      dismissed_total: parseInt(formData.dismissed_total) || 0,
      duplicate_count: parseInt(formData.duplicate_count) || 0,
      // Manual Mapping
      manual_mapping_total: parseInt(formData.manual_mapping_total) || 0,
      manually_mapped: parseInt(formData.manually_mapped) || 0,
      incorrect_supplier_data: parseInt(formData.incorrect_supplier_data) || 0,
      insufficient_info: parseInt(formData.insufficient_info) || 0,
      created_property: parseInt(formData.created_property) || 0,
      reactivated_total: parseInt(formData.reactivated_total) || 0,
      // Not Covered
      not_covered_total: parseInt(formData.not_covered_total) || 0,
      nc_manually_mapped: parseInt(formData.nc_manually_mapped) || 0,
      nc_incorrect_supplier: parseInt(formData.nc_incorrect_supplier) || 0,
      nc_insufficient_info: parseInt(formData.nc_insufficient_info) || 0,
      nc_created_property: parseInt(formData.nc_created_property) || 0,
      nc_reactivated_total: parseInt(formData.nc_reactivated_total) || 0,
      // Bad Suggestions
      bad_suggestions_total: parseInt(formData.bad_suggestions_total) || 0,
      bs_manually_mapped: parseInt(formData.bs_manually_mapped) || 0,
      bs_incorrect_supplier: parseInt(formData.bs_incorrect_supplier) || 0,
      bs_insufficient_info: parseInt(formData.bs_insufficient_info) || 0,
      bs_created_property: parseInt(formData.bs_created_property) || 0,
      bs_reactivated_total: parseInt(formData.bs_reactivated_total) || 0,
      // Others
      automapping_covered_total: parseInt(formData.automapping_covered_total) || 0,
      jp_props: parseInt(formData.jp_props) || 0
    };

    try {
      const res = await fetch(`${apiUrl}/api/v1/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ supplier: submissionData })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.errors?.join(', ') || 'Failed to create supplier');
      }
      const newSupplier = await res.json();
      showNotification('Supplier created successfully!', 'success');
      setTimeout(() => navigate(`/suppliers/${newSupplier.id}`), 1500);
    } catch (err) {
      console.error('Error creating supplier:', err);
      showNotification(err.message, 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

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
        </div>

        <div className="detail-content">
          <h1>Create New Supplier</h1>

          <form onSubmit={handleSubmit} className="edit-form">
            {/* Basic Information */}
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label htmlFor="name">Supplier Name: <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
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
                  value={formData.requester}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority">Priority:</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value={0}>Low</option>
                    <option value={1}>Medium</option>
                    <option value={2}>High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value={0}>Queued</option>
                    <option value={1}>Ongoing</option>
                    <option value={2}>Cancelled</option>
                    <option value={3}>Completed</option>
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
                    value={formData.request_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="start_date">Start Date:</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="completed_date">Completed Date:</label>
                  <input
                    type="date"
                    id="completed_date"
                    name="completed_date"
                    value={formData.completed_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Request Totals */}
            <div className="form-section">
              <h2>Request Totals</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="total_requests">Total Requests:</label>
                  <input
                    type="number"
                    id="total_requests"
                    name="total_requests"
                    value={formData.total_requests}
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
                    value={formData.total_pending}
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
                    value={formData.total_mapped}
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
                    value={formData.total_bad_data}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Automapping */}
            <div className="form-section">
              <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Automapping</span>
                <input
                  type="number"
                  id="automapping_total"
                  name="automapping_total"
                  value={formData.automapping_total}
                  onChange={handleInputChange}
                  min="0"
                  style={{ width: '150px', textAlign: 'right', fontWeight: 'bold' }}
                />
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="accepted_total">Accepted Total:</label>
                  <input
                    type="number"
                    id="accepted_total"
                    name="accepted_total"
                    value={formData.accepted_total}
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
                    value={formData.dismissed_total}
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
                    value={formData.duplicate_count}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Manual Mapping */}
            <div className="form-section">
              <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Manual Mapping</span>
                <input
                  type="number"
                  id="manual_mapping_total"
                  name="manual_mapping_total"
                  value={formData.manual_mapping_total}
                  onChange={handleInputChange}
                  min="0"
                  style={{ width: '150px', textAlign: 'right', fontWeight: 'bold' }}
                />
              </h2>
              
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
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reactivated_total">Reactivated Total:</label>
                  <input
                    type="number"
                    id="reactivated_total"
                    name="reactivated_total"
                    value={formData.reactivated_total}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Not Covered */}
            <div className="form-section">
              <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Not Covered</span>
                <input
                  type="number"
                  id="not_covered_total"
                  name="not_covered_total"
                  value={formData.not_covered_total}
                  onChange={handleInputChange}
                  min="0"
                  style={{ width: '150px', textAlign: 'right', fontWeight: 'bold' }}
                />
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nc_manually_mapped">Manually Mapped:</label>
                  <input
                    type="number"
                    id="nc_manually_mapped"
                    name="nc_manually_mapped"
                    value={formData.nc_manually_mapped}
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
                    value={formData.nc_incorrect_supplier}
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
                    value={formData.nc_insufficient_info}
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
                    value={formData.nc_created_property}
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
                    value={formData.nc_reactivated_total}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Bad Suggestions */}
            <div className="form-section">
              <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Bad Suggestions</span>
                <input
                  type="number"
                  id="bad_suggestions_total"
                  name="bad_suggestions_total"
                  value={formData.bad_suggestions_total}
                  onChange={handleInputChange}
                  min="0"
                  style={{ width: '150px', textAlign: 'right', fontWeight: 'bold' }}
                />
              </h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bs_manually_mapped">Manually Mapped:</label>
                  <input
                    type="number"
                    id="bs_manually_mapped"
                    name="bs_manually_mapped"
                    value={formData.bs_manually_mapped}
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
                    value={formData.bs_incorrect_supplier}
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
                    value={formData.bs_insufficient_info}
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
                    value={formData.bs_created_property}
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
                    value={formData.bs_reactivated_total}
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
                    value={formData.automapping_covered_total}
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
                    value={formData.jp_props}
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
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Add any additional notes here..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Create Supplier
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/suppliers')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}