import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import './Suppliers.css';

export default function Suppliers() {
  const [user, setUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

      if (!userRes.ok) throw new Error('Failed to fetch user');

      const userData = await userRes.json();
      setUser(userData);

      // Fetch suppliers
      await fetchSuppliers();

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchInitialData:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSuppliers(Array.isArray(data) ? data : []);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]);
    }
  };

  const handleSupplierClick = (supplierId) => {
    navigate(`/suppliers/${supplierId}`);
  };

  const canManageSuppliers = user?.role === 'leader' || user?.role === 'developer';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { label: 'Queued', class: 'status-queued' },
      1: { label: 'Ongoing', class: 'status-ongoing' },
      2: { label: 'Cancelled', class: 'status-cancelled' },
      3: { label: 'Completed ', class: 'status-completed' }
    };
    const statusInfo = statusMap[status] || { label: 'Unknown', class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="suppliers-container">
          <div className="loading">Loading suppliers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar user={user} />
        <div className="suppliers-container">
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} />

      <div className="suppliers-container">
        <div className="suppliers-header">
          <h1>Suppliers</h1>
          {canManageSuppliers && (
            <button
              className="btn-create"
              onClick={() => navigate('/suppliers/create')}
            >
              + Create New Supplier
            </button>
          )}
        </div>

        {suppliers.length === 0 ? (
          <div className="empty-state">
            <p>No suppliers found.</p>
            {canManageSuppliers && (
              <button
                className="btn-primary"
                onClick={() => navigate('/suppliers/create')}
              >
                Create Your First Supplier
              </button>
            )}
          </div>
        ) : (
          <div className="suppliers-list">
            <div className="suppliers-table">
              <div className="table-header">
                <div className="col-name">Supplier Name</div>
                <div className="col-status">Status</div>
                <div className="col-requests">Total Requests</div>
                <div className="col-date">Request Date</div>
                <div className="col-action">Action</div>
              </div>

              {suppliers.map(supplier => (
                <div
                  key={supplier.id}
                  className="table-row"
                  onClick={() => handleSupplierClick(supplier.id)}
                >
                  <div className="col-name">
                    <strong>{supplier.name}</strong>
                  </div>
                  <div className="col-status">
                    {getStatusBadge(supplier.status)}
                  </div>
                  <div className="col-requests">
                    {supplier.total_requests || 0}
                  </div>
                  <div className="col-date">
                    {formatDate(supplier.request_date)}
                  </div>
                  <div className="col-action">
                    <button
                      className="btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSupplierClick(supplier.id);
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}