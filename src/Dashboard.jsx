import { useEffect, useState } from 'react';

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/current_user', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log('User:', data);
        setUser(data);
      });
  }, []);

  return (
    <div>
      <h1>Welcome to your dashboard!</h1>
      {user && (
        <p>
          Signed in as <strong>{user.name}</strong> ({user.role})
        </p>
      )}
    </div>
  );
}

export default Dashboard;