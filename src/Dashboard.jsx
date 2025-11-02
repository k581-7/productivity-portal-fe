import { useEffect } from 'react';
import NavBar from './components/NavBar';
import TodoList from './components/TodoList';
import { useUser } from './App';
import './Dashboard.css';

const Dashboard = () => {
  const user = useUser();

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
        {/* <TodoList /> */}
        <p style={{ color: '#666', marginTop: '20px' }}>Todo list temporarily disabled for testing</p>
      </div>
    </div>
  );
};

export default Dashboard;