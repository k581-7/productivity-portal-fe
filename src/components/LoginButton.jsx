// src/LoginButton.jsx
export default function LoginButton() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google_oauth2';
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Welcome to the Productivity Portal</h2>
      <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Sign in with Google
      </button>
    </div>
  );
}