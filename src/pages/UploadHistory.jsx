import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const apiUrl = import.meta.env.VITE_API_URL;

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
      const userRes = await fetch(`${apiUrl}/api/v1/current_user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userRes.ok) {
        throw new Error('Failed to fetch user');
      }

      const userData = await userRes.json();
      setUser(userData);

      // Fetch upload history
      const uploadsRes = await fetch(`${apiUrl}/api/v1/prod_entries/upload_history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!uploadsRes.ok) {
        if (uploadsRes.status === 404) {
          console.warn('Upload history endpoint not found - this feature may not be implemented yet');
          setUploads([]);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch upload history');
      }

      const uploadsData = await uploadsRes.json();
      console.log('Upload history data:', uploadsData);
      
      // Handle if backend returns object instead of array
      if (Array.isArray(uploadsData)) {
        setUploads(uploadsData);
      } else if (uploadsData && typeof uploadsData === 'object') {
        // If it's an object, try to extract array or convert to array
        setUploads(uploadsData.uploads || Object.values(uploadsData));
      } else {
        setUploads([]);
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
      const res = await fetch(`${apiUrl}/api/v1/prod_entries/delete_upload/${uploadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Delete response:', res);

      if (!res.ok) {
        if (res.status === 404) {
          showNotification('Delete feature not yet implemented on backend', 'error');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete upload');
      }

      showNotification('Upload deleted successfully!', 'success');
      
      // Refresh the upload history
      fetchData();
    } catch (err) {
      console.error('Error deleting upload:', err);
      showNotification(err.message || 'Failed to delete upload', 'error');
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
          <div className="modal-overlay">
            <div className="modal-content">
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

        <h1>CSV Upload History</h1>

        {uploads.length === 0 ? (
          <div className="empty-state">
            <p>No upload history found.</p>
            <p style={{ fontSize: '0.9rem', color: '#95a5a6', marginTop: '10px' }}>
              Upload history will appear here after you submit CSV files through the Productivity Entry page.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="upload-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Supplier</th>
                  <th>Uploaded By</th>
                  <th>Entries</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id}>
                    <td>{formatDate(upload.upload_date || upload.date)}</td>
                    <td>{upload.filename || upload.file_name || 'N/A'}</td>
                    <td>{getTypeLabel(upload.source, upload.manualsheet_type)}</td>
                    <td>
                      {typeof upload.supplier_name === 'string' 
                        ? upload.supplier_name 
                        : upload.supplier?.name || upload.supplier_name?.name || 'N/A'}
                    </td>
                    <td>
                      {typeof upload.uploaded_by === 'string'
                        ? upload.uploaded_by
                        : upload.uploaded_by?.name || upload.user?.name || 'N/A'}
                    </td>
                    <td>{upload.entry_count || upload.entries_count || 0}</td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteClick(upload.batch_id)}
                        title="Delete upload"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
