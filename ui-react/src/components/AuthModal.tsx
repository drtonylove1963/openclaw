/**
 * Authentication Modal
 * Login/Register UI for Pronetheia
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Theme (matching CodeTab)
const THEME = {
  bg: {
    primary: '#1a1a1a',
    secondary: '#242424',
    tertiary: '#2d2d2d',
    hover: '#333333',
  },
  accent: {
    primary: '#e07a5f',
    secondary: '#81b29a',
    error: '#e63946',
  },
  text: {
    primary: '#e5e5e5',
    secondary: '#a3a3a3',
    muted: '#666666',
  },
  border: '#333333',
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, requestPasswordReset, confirmPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset-request' | 'reset-confirm'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(username || email, password);
        onClose();
      } else if (mode === 'register') {
        await register(email, username, password, fullName || undefined);
        onClose();
      } else if (mode === 'reset-request') {
        const response = await requestPasswordReset(email);
        if (response.reset_token) {
          // Demo mode: auto-fill the token
          setResetToken(response.reset_token);
        }
        setSuccessMessage(response.message);
        setMode('reset-confirm');
      } else if (mode === 'reset-confirm') {
        if (newPassword !== confirmNewPassword) {
          throw new Error('Passwords do not match');
        }
        await confirmPasswordReset(resetToken, newPassword);
        setSuccessMessage('Password reset successful! You can now login.');
        // Clear fields and go back to login
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
        setMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'reset-request': return 'Reset Password';
      case 'reset-confirm': return 'Set New Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Sign in to access your sessions';
      case 'register': return 'Join Pronetheia to start building';
      case 'reset-request': return 'Enter your email to receive a reset token';
      case 'reset-confirm': return 'Enter the reset token and your new password';
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: THEME.bg.tertiary,
    border: `1px solid ${THEME.border}`,
    borderRadius: 8,
    color: THEME.text.primary,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    color: THEME.text.secondary,
    fontSize: 13,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: THEME.bg.secondary,
          borderRadius: 16,
          padding: 32,
          width: 400,
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: THEME.text.primary, margin: 0, fontSize: 24 }}>
            {getTitle()}
          </h2>
          <p style={{ color: THEME.text.secondary, margin: '8px 0 0', fontSize: 14 }}>
            {getSubtitle()}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: `${THEME.accent.secondary}20`,
              border: `1px solid ${THEME.accent.secondary}50`,
              borderRadius: 8,
              color: THEME.accent.secondary,
              fontSize: 13,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: `${THEME.accent.error}20`,
              border: `1px solid ${THEME.accent.error}50`,
              borderRadius: 8,
              color: THEME.accent.error,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Reset Request Mode - Email only */}
          {mode === 'reset-request' && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          {/* Reset Confirm Mode - Token and New Password */}
          {mode === 'reset-confirm' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Reset Token</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  style={inputStyle}
                  placeholder="Paste your reset token here"
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="********"
                  required
                  minLength={8}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="********"
                  required
                  minLength={8}
                />
              </div>
            </>
          )}

          {/* Register Mode - Email and Full Name */}
          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full Name (optional)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                  placeholder="John Doe"
                />
              </div>
            </>
          )}

          {/* Login/Register Mode - Username and Password */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  {mode === 'login' ? 'Username or Email' : 'Username'}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  placeholder={mode === 'login' ? 'username or email' : 'username'}
                  required
                />
              </div>

              <div style={{ marginBottom: mode === 'login' ? 12 : 24 }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="********"
                  required
                  minLength={8}
                />
                {mode === 'register' && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: THEME.text.muted }}>
                    Min 8 chars, uppercase, lowercase, number, and special character
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              {mode === 'login' && (
                <div style={{ marginBottom: 24, textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset-request');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: THEME.text.secondary,
                      fontSize: 12,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: THEME.accent.primary,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {isLoading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'register'
              ? 'Create Account'
              : mode === 'reset-request'
              ? 'Send Reset Token'
              : 'Reset Password'}
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {(mode === 'reset-request' || mode === 'reset-confirm') ? (
            <button
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: THEME.accent.primary,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back to login
            </button>
          ) : (
            <>
              <span style={{ color: THEME.text.secondary, fontSize: 13 }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: THEME.accent.primary,
                  fontSize: 13,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
