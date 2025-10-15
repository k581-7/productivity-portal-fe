function LoginButton() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google_oauth2';
  };

  return (
    <button onClick={handleLogin}>
      Sign in with Google
    </button>
  );
}

export default LoginButton;
