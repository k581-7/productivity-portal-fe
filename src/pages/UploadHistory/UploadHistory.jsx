import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/NavBar/NavBar';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import DeleteIcon from '@mui/icons-material/Delete';
import './UploadHistory.css';

export default function UploadHistory() {
  const [user, setUser] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, uploadId: null });
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current user
      const userRes = await api.get('/api/v1/current_user');
      setUser(userRes.data);

      // Fetch upload history
      try {
        const uploadsRes = await api.get('/api/v1/prod_entries/upload_history');
        console.log('Upload history data:', uploadsRes.data);
        
        // Handle if backend returns object instead of array
        if (Array.isArray(uploadsRes.data)) {
          setUploads(uploadsRes.data);
        } else if (uploadsRes.data && typeof uploadsRes.data === 'object') {
          // If it's an object, try to extract array or convert to array
          setUploads(uploadsRes.data.uploads || Object.values(uploadsRes.data));
        } else {
          setUploads([]);
        }
      } catch (uploadErr) {
        if (uploadErr.response?.status === 404) {
          console.warn('Upload history endpoint not found - this feature may not be implemented yet');
          setUploads([]);
        } else {
          throw uploadErr;
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteClick = (batchId) => {
    setDeleteConfirm({ show: true, uploadId: batchId });
  };

  const handleDeleteConfirm = async () => {
    const uploadId = deleteConfirm.uploadId;
    setDeleteConfirm({ show: false, uploadId: null });

    try {
      await api.delete(`/api/v1/prod_entries/delete_upload/${uploadId}`);
      showNotification('Upload deleted successfully!', 'success');
      
      // Refresh the upload history
      fetchData();
    } catch (err) {
      console.error('Error deleting upload:', err);
      if (err.response?.status === 404) {
        showNotification('Delete feature not yet implemented on backend', 'error');
      } else {
        showNotification(err.response?.data?.error || err.message || 'Failed to delete upload', 'error');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, uploadId: null });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getTypeLabel = (source, manualsheetType) => {
    if (source === 'autosheet') return 'Autosheet';
    if (source === 'logs') return 'Logs';
    if (source === 'manualsheet') {
      if (manualsheetType === 'common') return 'Manualsheet (Common)';
      if (manualsheetType === 'bad_suggestions') return 'Manualsheet (Bad Suggestions)';
      if (manualsheetType === 'not_covered') return 'Manualsheet (Not Covered)';
      return 'Manualsheet';
    }
    return source;
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

  return (
    <div>
      <Navbar user={user} />

      <div className="upload-history-container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {deleteConfirm.show && (
          <div className="modal-overlay" onClick={handleDeleteCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this upload entry? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn-danger" onClick={handleDeleteConfirm}>
                  Delete
                </button>
                <button className="btn-secondary" onClick={handleDeleteCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="upload-history-content">
          <h1>CSV Upload History</h1>

          {uploads.length === 0 ? (
            <div className="empty-state">
              <p>No upload history found.</p>
              <p style={{ fontSize: '0.9rem', color: '#95a5a6', marginTop: '10px' }}>
                Upload history will appear here after you submit CSV files through the Productivity Entry page.
              </p>
            </div>
          ) : (
            <div className="upload-table">
              <div className="table-header">
                <div className="col-date">Date</div>
                <div className="col-filename">Filename</div>
                <div className="col-supplier">Supplier</div>
                <div className="col-uploaded-by">Uploaded By</div>
                <div className="col-entries">Entries</div>
                <div className="col-actions">Actions</div>
              </div>

              {uploads.map((upload) => (
                <div key={upload.id} className="table-row">
                  <div className="col-date">{formatDate(upload.upload_date || upload.date)}</div>
                  <div className="col-filename">{upload.filename || upload.file_name || 'N/A'}</div>
                  <div className="col-supplier">
                    {typeof upload.supplier_name === 'string' 
                      ? upload.supplier_name 
                      : upload.supplier?.name || upload.supplier_name?.name || 'N/A'}
                  </div>
                  <div className="col-uploaded-by">
                    {typeof upload.uploaded_by === 'string'
                      ? upload.uploaded_by
                      : upload.uploaded_by?.name || upload.user?.name || 'N/A'}
                  </div>
                  <div className="col-entries">{upload.entry_count || upload.entries_count || 0}</div>
                  <div className="col-actions">
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteClick(upload.batch_id)}
                      title="Delete upload"
                    >
                      <DeleteIcon sx={{ fontSize: 20 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
