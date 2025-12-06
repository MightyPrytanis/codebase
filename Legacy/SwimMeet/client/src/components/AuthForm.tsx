import React, { useState } from 'react';

interface AuthFormProps {
  onAuth: (token: string, user: { id: string; username: string }) => void;
}

export function AuthForm({ onAuth }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store token in localStorage for persistence
      localStorage.setItem('authToken', data.token);
      
      onAuth(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src="/logo.png"
            alt="SwimMeet Logo"
            style={{
              width: '120px',
              height: 'auto',
              margin: '0 auto 16px auto',
              display: 'block'
            }}
          />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#0c4a6e',
            margin: '0 0 8px 0'
          }}>
            SWIM MEET
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '14px'
          }}>
            AI Orchestration Platform
          </p>
        </div>

        {/* Toggle between Login/Register */}
        <div style={{
          display: 'flex',
          marginBottom: '24px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: isLogin ? 'white' : 'transparent',
              color: isLogin ? '#0c4a6e' : '#6b7280',
              fontWeight: isLogin ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            data-testid="button-login-tab"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: !isLogin ? 'white' : 'transparent',
              color: !isLogin ? '#0c4a6e' : '#6b7280',
              fontWeight: !isLogin ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            data-testid="button-register-tab"
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              data-testid="input-username"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              data-testid="input-password"
            />
          </div>

          {/* Security Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #16a34a',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#15803d'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              marginRight: '8px',
              backgroundColor: '#16a34a',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              🔒
            </div>
            <span style={{ fontWeight: 'bold' }}>
              Protected by enterprise-grade adaptive security
            </span>
          </div>

          {error && (
            <div style={{
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '16px',
              padding: '8px',
              backgroundColor: '#fee2e2',
              borderRadius: '6px'
            }} data-testid="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#6b7280' : '#0c4a6e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            data-testid="button-auth-submit"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        {/* Info about data persistence */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0c4a6e'
        }}>
          💾 All your conversations, statistics, and documents are permanently saved to the database. 
          Access your research projects and analysis work anytime by logging in.
        </div>

        {/* Copyright disclaimer - fine print */}
        <div style={{
          marginTop: '16px',
          fontSize: '9px',
          color: '#9ca3af',
          lineHeight: '1.3',
          textAlign: 'center',
          padding: '0 8px'
        }}>
          Significant coding and other content Copyright 2025 Cyrano LLC; Patents pending, all rights reserved to their respective owners. Cyrano does not sell your personal private data without your consent, and then only after it has been thoroughly scrubbed and all personal identifying information has been removed.
        </div>
      </div>
    </div>
  );
}