import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit, Trash, Key, Mail } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin?: string;
}

interface AdminPanelProps {
  authToken: string | null;
}

export function AdminPanel({ authToken }: AdminPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    name: '',
    password: ''
  });
  const [resetPasswordUser, setResetPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const queryClient = useQueryClient();

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await makeAuthenticatedRequest('/api/admin/users');
      return response.json();
    },
    enabled: !!authToken
  });

  // Fetch authorized emails
  const { data: authorizedEmails = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/authorized-emails'],
    queryFn: async () => {
      const response = await makeAuthenticatedRequest('/api/admin/authorized-emails');
      return response.json();
    },
    enabled: !!authToken
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await makeAuthenticatedRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowCreateForm(false);
      setNewUser({ username: '', email: '', name: '', password: '' });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<AdminUser> }) => {
      const response = await makeAuthenticatedRequest(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingUser(null);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await makeAuthenticatedRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string, newPassword: string }) => {
      const response = await makeAuthenticatedRequest(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      return response.json();
    },
    onSuccess: () => {
      setResetPasswordUser(null);
      setNewPassword('');
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        updates: {
          username: editingUser.username,
          email: editingUser.email,
          name: editingUser.name,
          status: editingUser.status
        }
      });
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordUser && newPassword) {
      resetPasswordMutation.mutate({ userId: resetPasswordUser, newPassword });
    }
  };

  if (isLoading) {
    return (
      <section className="glass-panel-large swim-section">
        <div style={{ textAlign: 'center', padding: 'var(--panel-gap)' }}>
          Loading admin panel...
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel-large swim-section">
      <h3 className="panel-heading" style={{ color: '#ffd700' }}>
        🛡️ Admin Panel - User Management System
      </h3>
      
      <div className="swim-panel" style={{ background: 'linear-gradient(135deg, #ffd700 5%, #ffffff 100%)' }}>
        
        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 'var(--grid-unit)',
          marginBottom: 'var(--panel-gap)'
        }}>
          <div style={{ 
            background: '#e3f2fd', 
            padding: 'calc(var(--grid-unit) / 2)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
              {Array.isArray(users) ? users.length : 0}
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>Total Users</div>
          </div>
          <div style={{ 
            background: '#e8f5e8', 
            padding: 'calc(var(--grid-unit) / 2)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
              {Array.isArray(users) ? users.filter(u => u.status === 'active').length : 0}
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>Active</div>
          </div>
          <div style={{ 
            background: '#fff3e0', 
            padding: 'calc(var(--grid-unit) / 2)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
              {authorizedEmails.length}
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>Authorized</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--grid-unit)', marginBottom: 'var(--panel-gap)' }}>
          <button
            className="swim-button swim-button--primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            data-testid="button-create-user"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Add New User
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div style={{ 
            background: '#f0f8ff', 
            padding: 'var(--panel-gap)', 
            borderRadius: '8px',
            marginBottom: 'var(--panel-gap)'
          }}>
            <h4 style={{ margin: '0 0 var(--grid-unit) 0', color: '#333' }}>Create New User</h4>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--grid-unit)', marginBottom: 'var(--grid-unit)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Full Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--grid-unit)', marginBottom: 'var(--grid-unit)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Email (must be authorized)</label>
                  <select
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  >
                    <option value="">Select authorized email</option>
                    {authorizedEmails.map(email => (
                      <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--grid-unit)' }}>
                <button
                  type="submit"
                  className="swim-button swim-button--primary"
                  disabled={createUserMutation.isPending}
                  data-testid="button-submit-create-user"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="swim-button swim-button--ghost"
                  onClick={() => setShowCreateForm(false)}
                  data-testid="button-cancel-create-user"
                >
                  Cancel
                </button>
              </div>
            </form>
            {createUserMutation.error && (
              <div style={{ 
                marginTop: 'var(--grid-unit)', 
                padding: '8px', 
                background: '#ffebee', 
                color: '#c62828',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                Error: {createUserMutation.error.message}
              </div>
            )}
          </div>
        )}

        {/* Users Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Username</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) ? users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#333' }}>{user.username}</strong>
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>{user.name}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: user.status === 'active' ? '#e8f5e8' : '#ffebee',
                      color: user.status === 'active' ? '#2e7d32' : '#c62828'
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="swim-button swim-button--ghost"
                        onClick={() => setEditingUser(user)}
                        data-testid={`button-edit-${user.username}`}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        className="swim-button swim-button--ghost"
                        onClick={() => setResetPasswordUser(user.id)}
                        data-testid={`button-reset-password-${user.username}`}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <Key size={12} />
                      </button>
                      {user.username !== 'davidtowne' && user.username !== 'demo' && (
                        <button
                          className="swim-button swim-button--ghost"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          data-testid={`button-delete-${user.username}`}
                          style={{ padding: '4px 8px', fontSize: '12px', color: '#d32f2f' }}
                        >
                          <Trash size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    {isLoading ? 'Loading users...' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}>
            <div style={{
              background: 'white',
              padding: 'var(--panel-gap)',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 var(--grid-unit) 0' }}>Edit User: {editingUser.username}</h4>
              <form onSubmit={handleUpdateUser}>
                <div style={{ marginBottom: 'var(--grid-unit)' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Username</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  />
                </div>
                <div style={{ marginBottom: 'var(--grid-unit)' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  />
                </div>
                <div style={{ marginBottom: 'var(--grid-unit)' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Email</label>
                  <select
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  >
                    {authorizedEmails.map(email => (
                      <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 'var(--grid-unit)' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'disabled' })}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--grid-unit)' }}>
                  <button
                    type="submit"
                    className="swim-button swim-button--primary"
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-user-changes"
                  >
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="swim-button swim-button--ghost"
                    onClick={() => setEditingUser(null)}
                    data-testid="button-cancel-edit-user"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {updateUserMutation.error && (
                <div style={{ 
                  marginTop: 'var(--grid-unit)', 
                  padding: '8px', 
                  background: '#ffebee', 
                  color: '#c62828',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  Error: {updateUserMutation.error.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetPasswordUser && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}>
            <div style={{
              background: 'white',
              padding: 'var(--panel-gap)',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 var(--grid-unit) 0' }}>Reset Password</h4>
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: 'var(--grid-unit)' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid #ccc' 
                    }}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--grid-unit)' }}>
                  <button
                    type="submit"
                    className="swim-button swim-button--primary"
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-confirm-reset-password"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button
                    type="button"
                    className="swim-button swim-button--ghost"
                    onClick={() => {
                      setResetPasswordUser(null);
                      setNewPassword('');
                    }}
                    data-testid="button-cancel-reset-password"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {resetPasswordMutation.error && (
                <div style={{ 
                  marginTop: 'var(--grid-unit)', 
                  padding: '8px', 
                  background: '#ffebee', 
                  color: '#c62828',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  Error: {resetPasswordMutation.error.message}
                </div>
              )}
              {resetPasswordMutation.isSuccess && (
                <div style={{ 
                  marginTop: 'var(--grid-unit)', 
                  padding: '8px', 
                  background: '#e8f5e8', 
                  color: '#2e7d32',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  Password reset successfully!
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Info */}
        <div style={{ 
          marginTop: 'var(--panel-gap)', 
          padding: 'var(--panel-gap)', 
          background: '#f0f8ff', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#555'
        }}>
          <strong>System Information:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>User registration restricted to authorized email addresses</li>
            <li>Admin users (davidtowne, demo) cannot be deleted</li>
            <li>Password minimum length: 6 characters</li>
            <li>All changes are logged and tracked</li>
          </ul>
        </div>

      </div>
    </section>
  );
}