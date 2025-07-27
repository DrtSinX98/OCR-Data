// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHomeStats, getProfile } from '../services/api';

// Icons for the stats cards
const StatIcon = ({ icon, color }) => (
  <div className="stat-icon">
    <span className="material-icons" style={{ color }}>{icon}</span>
  </div>
);

const Home = ({ user: propUser }) => {
  const [stats, setStats] = useState({ 
    totalAssigned: 0, 
    totalSubmitted: 0, 
    totalApproved: 0,
    totalInProgress: 0,
    accuracyRate: 0,
    recentActivity: 0
  });
  
  const [user, setUser] = useState(propUser);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, userData] = await Promise.all([
          getHomeStats(),
          getProfile()
        ]);
        
        setStats({
          ...statsData,
          totalInProgress: statsData.totalAssigned - statsData.totalSubmitted,
        });
        
        if (userData && userData.user) {
          setUser(userData.user);
          setRecentTasks(userData.recentTasks || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickAction = (action) => {
    switch(action) {
      case 'upload':
        navigate('/ocr');
        break;
      case 'assign':
        navigate('/ocr?action=assign');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'there';
  };

  const getTaskStatusBadge = (status) => {
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
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button 
          className="btn" 
          onClick={() => window.location.reload()}
        >
          <span className="material-icons">refresh</span>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {getDisplayName()}! 👋</h1>
        <p className="welcome-message">
          Here's what's happening with your Odia OCR tasks
        </p>
      </div>

      {/* Stats Overview */}
      <div className="stats-section">
        <h2>Task Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <StatIcon icon="assignment" color="var(--primary)" />
            <div className="stat-content">
              <h3>Total Assigned</h3>
              <p className="stat-value">{stats.totalAssigned}</p>
              <p className="stat-desc">All tasks assigned to you</p>
            </div>
          </div>
          
          <div className="stat-card">
            <StatIcon icon="hourglass_empty" color="var(--warning)" />
            <div className="stat-content">
              <h3>In Progress</h3>
              <p className="stat-value">{stats.totalInProgress}</p>
              <p className="stat-desc">Currently working on</p>
            </div>
          </div>
          
          <div className="stat-card">
            <StatIcon icon="check_circle" color="var(--success)" />
            <div className="stat-content">
              <h3>Approved</h3>
              <p className="stat-value">{stats.totalApproved}</p>
              <p className="stat-desc">Successfully completed</p>
            </div>
          </div>
          
          <div className="stat-card">
            <StatIcon icon="trending_up" color="var(--info)" />
            <div className="stat-content">
              <h3>Accuracy Rate</h3>
              <p className="stat-value">{stats.accuracyRate}%</p>
              <p className="stat-desc">Approval rate on submission</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <p style={{ color: 'var(--gray-600)', marginTop: '-0.5rem' }}>
          Get started with these common tasks
        </p>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => handleQuickAction('upload')}
          >
            <span className="material-icons">upload_file</span>
            <span>Upload New Image</span>
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => handleQuickAction('assign')}
          >
            <span className="material-icons">assignment_ind</span>
            <span>Assign Me a Task</span>
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => handleQuickAction('history')}
          >
            <span className="material-icons">history</span>
            <span>View My History</span>
          </button>
          
          <button 
            className="action-btn tertiary"
            onClick={() => handleQuickAction('profile')}
          >
            <span className="material-icons">person</span>
            <span>View Profile</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {recentTasks.length > 0 && (
        <div className="recent-activity-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Recent Activity</h2>
            <Link to="/history" className="view-all-link">
              View All
              <span className="material-icons">arrow_forward</span>
            </Link>
          </div>
          
          <div className="recent-tasks-grid">
            {recentTasks.slice(0, 3).map((task, index) => (
              <div key={task._id || index} className="task-card">
                <div className="task-image-preview">
                  {task.imageUrl ? (
                    <img 
                      src={`http://localhost:5000${task.imageUrl}`} 
                      alt="Task preview"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="no-preview">
                      <span className="material-icons">image</span>
                    </div>
                  )}
                </div>
                
                <div className="task-info">
                  <div className="task-status">
                    <span 
                      className="status-badge" 
                      style={{ background: getTaskStatusBadge(task.status).color }}
                    >
                      {getTaskStatusBadge(task.status).text}
                    </span>
                  </div>
                  
                  <p className="task-date">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                  
                  {task.status === 'in_progress' && (
                    <Link 
                      to={`/ocr/task/${task._id}`}
                      className="continue-btn"
                    >
                      Continue
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
