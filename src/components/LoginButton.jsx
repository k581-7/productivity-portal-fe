// src/LoginButton.jsx
import backgroundImage from '../assets/pexels-lara-jameson-8828454.jpg';
import googleLogo from '../assets/New-Google-Logo-removebg-preview.png';
import logoGreen from '../assets/PP_green.png';

export default function LoginButton() {
  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/auth/google_oauth2`;
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.75)',
        padding: '50px 60px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <img 
            src={logoGreen} 
            alt="PP Logo" 
            style={{ height: '50px', width: 'auto' }}
          />
          <h2 style={{ 
            margin: '0',
            color: '#0b6704',
            fontSize: '28px',
            fontWeight: '700'
          }}>
            Productivity Portal
          </h2>
        </div>
        <button 
          onClick={handleLogin} 
          style={{ 
            padding: '14px 32px', 
            fontSize: '16px',
            border: '2px solid #4285f4',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '600',
            color: '#1f2937',
            transition: 'all 0.3s ease',
            margin: '0 auto'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#4285f4';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#1f2937';
          }}
        >
          <img 
            src={googleLogo} 
            alt="Google" 
            style={{ width: '20px', height: '20px' }}
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}