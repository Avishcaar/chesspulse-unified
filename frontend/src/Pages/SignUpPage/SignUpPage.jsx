import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AuthPageLayout, { GoogleMark } from '../../Components/Auth/AuthPageLayout';

const SignUpPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const strength = !password
    ? { label: '', color: 'transparent', width: '0%' }
    : password.length < 6
      ? { label: 'Add a few more characters', color: '#d8686d', width: '30%' }
      : password.length < 10
        ? { label: 'Getting there', color: '#d8a257', width: '65%' }
        : { label: 'Good password length', color: '#79a888', width: '100%' };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Those passwords don’t match yet. Check both fields and try again.');
      return;
    }
    if (password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, username, password);
      if (result.success) navigate('/');
      else setError(result.error || 'We couldn’t create your account. Please try again.');
    } catch {
      setError('We couldn’t create your account right now. Please try again.');
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
    <AuthPageLayout mode="signup">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-fields-row">
          <div className="auth-field">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Your chess name"
              minLength={3}
              maxLength={20}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <div className="auth-field-control has-toggle">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
              aria-describedby={password ? 'signup-password-strength' : undefined}
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
          {password && (
            <div className="auth-strength" id="signup-password-strength" aria-live="polite">
              <span className="auth-strength-track" aria-hidden="true">
                <span className="auth-strength-fill" style={{ display: 'block', width: strength.width, backgroundColor: strength.color }} />
              </span>
              <span>{strength.label}</span>
            </div>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="signup-confirm-password">Confirm password</label>
          <div className="auth-field-control has-toggle">
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
              required
            />
            <button
              className="auth-password-toggle"
              type="button"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="auth-actions">
          <button type="submit" disabled={isLoading} className="auth-button auth-button-primary">
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
          <div className="auth-divider">or sign up with</div>
          <button type="button" onClick={handleGoogleLogin} className="auth-button auth-button-secondary">
            <GoogleMark />
            Continue with Google
          </button>
          <button type="button" onClick={handleGuestAccess} disabled={isLoading} className="auth-button auth-button-secondary">
            Continue as guest
          </button>
        </div>

        <p className="auth-switch-copy">
          Already have an account? <Link to="/signin" className="auth-inline-link">Sign in</Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};

export default SignUpPage;
