/**
 * Login/Register Page
 * Handles user authentication with tabs for login and registration
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../styles/colors';

type TabType = 'login' | 'register' | 'reset-request' | 'reset-confirm';

export function LoginPage() {
  const { login, register, requestPasswordReset, confirmPasswordReset, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(loginUsername, loginPassword);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(regEmail, regUsername, regPassword, regFullName || undefined);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await requestPasswordReset(resetEmail);
      if (response.reset_token) {
        // Demo mode: auto-fill the token
        setResetToken(response.reset_token);
      }
      setSuccess(response.message);
      setActiveTab('reset-confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(resetToken, newPassword);
      setSuccess('Password reset successful! You can now login with your new password.');
      // Clear reset fields and go back to login
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetEmail('');
      setActiveTab('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    backgroundColor: isActive ? COLORS.accent : 'transparent',
    color: isActive ? '#fff' : COLORS.textMuted,
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: COLORS.bgAlt,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    color: COLORS.textMuted,
    fontSize: '13px',
    fontWeight: 500,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    transition: 'all 0.2s ease',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: COLORS.bg,
      padding: '20px',
      fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
    }}>
      {/* Logo/Brand */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: COLORS.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '28px',
        }}>
          P
        </div>
        <h1 style={{
          color: COLORS.text,
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
        }}>
          Pronetheia
        </h1>
        <p style={{
          color: COLORS.textMuted,
          fontSize: '14px',
          margin: '8px 0 0',
        }}>
          AI-Powered Development Platform
        </p>
      </div>

      {/* Auth Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: COLORS.bgAlt,
        borderRadius: '16px',
        border: `1px solid ${COLORS.border}`,
        overflow: 'hidden',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <button
            style={tabStyle(activeTab === 'login')}
            onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
          >
            Login
          </button>
          <button
            style={tabStyle(activeTab === 'register')}
            onClick={() => { setActiveTab('register'); setError(null); setSuccess(null); }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px' }}>
          {/* Error/Success Messages */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${COLORS.error}`,
              borderRadius: '8px',
              color: COLORS.error,
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: `1px solid ${COLORS.success}`,
              borderRadius: '8px',
              color: COLORS.success,
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {success}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Username or Email</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab('reset-request'); setError(null); setSuccess(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.textMuted,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <button type="submit" style={buttonStyle} disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full Name (optional)</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Your full name"
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
              </div>
              <button type="submit" style={buttonStyle} disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p style={{
                marginTop: '16px',
                textAlign: 'center',
                color: COLORS.textMuted,
                fontSize: '12px',
              }}>
                By registering, you'll start with a FREE tier account.
                Upgrade anytime for more features.
              </p>
            </form>
          )}

          {/* Reset Password Request Form */}
          {activeTab === 'reset-request' && (
            <form onSubmit={handleResetRequest}>
              <p style={{
                color: COLORS.textMuted,
                fontSize: '13px',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                Enter your email address and we'll send you a reset token.
              </p>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <button type="submit" style={buttonStyle} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Token'}
              </button>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.accent,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Confirm Form */}
          {activeTab === 'reset-confirm' && (
            <form onSubmit={handleResetConfirm}>
              <p style={{
                color: COLORS.textMuted,
                fontSize: '13px',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                Enter the reset token and your new password.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Reset Token</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste your reset token"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>New Password</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  disabled={isLoading}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Confirm New Password</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                />
              </div>
              <button type="submit" style={buttonStyle} disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.accent,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
