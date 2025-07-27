// src/components/Profile.js - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
import { getProfile, updateDisplayName } from '../services/api';

const Profile = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(!propUser);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!propUser) {
      fetchProfile();
    } else {
      setUser(propUser);
    }
  }, [propUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setUser(data.user);
      setRecentTasks(data.recentTasks || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      await updateDisplayName(newDisplayName.trim());
      setUser(prev => ({ ...prev, displayName: newDisplayName.trim() }));
      setEditingName(false);
      setNewDisplayName('');
    } catch (err) {
      setError(err.message || 'Failed to update name');
    } finally {
      setUpdating(false);
    }
  };

  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'in_progress': { color: 'var(--warning)', text: 'In Progress' },
      'submitted': { color: 'var(--info)', text: 'Submitted' },
      'approved': { color: 'var(--success)', text: 'Approved' },
      'assigned': { color: 'var(--secondary)', text: 'Assigned' }
    };
    return badges[status] || { color: 'var(--secondary)', text: status };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button className="btn" onClick={fetchProfile}>
          <span className="material-icons">refresh</span>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      {error && (
        <div className="message error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="profile-content">
        {/* Profile Info Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <span className="material-icons">person</span>
          </div>
          
          <div className="profile-info">
            <div className="info-row">
              <label>Display Name:</label>
              <div className="info-value">
                {editingName ? (
                  <div className="edit-name-container">
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder={getDisplayName()}
                      maxLength={50}
                      disabled={updating}
                    />
                    <div className="edit-actions">
                      <button
                        className="btn small primary"
                        onClick={handleUpdateDisplayName}
                        disabled={updating || !newDisplayName.trim()}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className="btn small secondary"
                        onClick={() => {
                          setEditingName(false);
                          setNewDisplayName('');
                          setError('');
                        }}
                        disabled={updating}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="display-name-container">
                    <span>{getDisplayName()}</span>
                    <button
                      className="btn small secondary"
                      onClick={() => {
                        setEditingName(true);
                        setNewDisplayName(user?.displayName || '');
                      }}
                    >
                      <span className="material-icons">edit</span>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="info-row">
              <label>Email:</label>
              <div className="info-value">
                <span>{user?.email}</span>
              </div>
            </div>

            <div className="info-row">
              <label>Member Since:</label>
              <div className="info-value">
                <span>{new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="recent-tasks-card">
          <h3>Recent Tasks</h3>
          {recentTasks.length > 0 ? (
            <div className="tasks-list">
              {recentTasks.map((task, index) => {
                const badge = getStatusBadge(task.status);
                return (
                  <div key={task._id || index} className="task-item-profile">
                    <div className="task-thumbnail">
                      {task.imageUrl ? (
                        <img 
                          src={`http://localhost:5000${task.imageUrl}`} 
                          alt="Task"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="no-image-thumb">
                        <span className="material-icons">image</span>
                      </div>
                    </div>

                    <div className="task-details-profile">
                      <div className="task-status-date">
                        <span 
                          className="status-badge small"
                          style={{ background: badge.color }}
                        >
                          {badge.text}
                        </span>
                        <span className="task-date">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {task.correctedText && (
                        <div className="task-preview">
                          {task.correctedText.substring(0, 80)}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-tasks-profile">
              <span className="material-icons">inbox</span>
              <p>No recent tasks found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
