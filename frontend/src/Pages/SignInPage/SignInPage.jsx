import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AuthPageLayout, { GoogleMark } from '../../Components/Auth/AuthPageLayout';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) navigate('/');
      else setError(result.error || 'Invalid email or password. Check your details and try again.');
    } catch {
      setError('We couldn’t sign you in right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth/google`;
  };

  const handleGuestAccess = async () => {
    setIsLoading(true);
    try {
      const result = await login('demo@chesspulse.com', 'demo1234');
      if (result.success) {
        navigate('/');
      } else {
        localStorage.setItem('accessToken', 'guest-demo-token');
        localStorage.setItem('refreshToken', 'guest-demo-refresh');
        navigate('/');
      }
    } catch {
      localStorage.setItem('accessToken', 'guest-demo-token');
      localStorage.setItem('refreshToken', 'guest-demo-refresh');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout mode="signin">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="signin-email">Email address</label>
          <input
            id="signin-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signin-password">Password</label>
          <div className="auth-field-control has-toggle">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              className="auth-password-toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="auth-actions">
          <button type="submit" disabled={isLoading} className="auth-button auth-button-primary">
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="auth-divider">or continue with</div>
          <button type="button" onClick={handleGoogleLogin} className="auth-button auth-button-secondary">
            <GoogleMark />
            Continue with Google
          </button>
          <button type="button" onClick={handleGuestAccess} disabled={isLoading} className="auth-button auth-button-secondary">
            Continue as guest
          </button>
        </div>

        <p className="auth-switch-copy">
          New to ChessPulse? <Link to="/signup" className="auth-inline-link">Create an account</Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};

export default SignInPage;
