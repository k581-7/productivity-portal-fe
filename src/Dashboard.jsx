import { useEffect } from 'react';
import NavBar from './components/NavBar';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
      }
    }
  }, [user]);

  const firstName = user?.name?.split(' ')[0] || 'Guest';

  return (
    <div>
      <NavBar user={user} />
      <div className="dashboard-container">
        <h1>Hi, {firstName}. What's on your mind?</h1>
      </div>
    </div>
  );
};

export default Dashboard;