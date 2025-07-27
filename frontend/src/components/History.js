// src/components/History.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserHistory, getUserStats, getMonthlyProgress } from '../services/api';

const History = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [currentPage, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyData, statsData, progressData] = await Promise.all([
        getUserHistory(currentPage, 10, statusFilter),
        getUserStats(),
        getMonthlyProgress(6)
      ]);

      setTasks(historyData.tasks);
      setTotalPages(historyData.pagination.totalPages);
      setStats(statsData.stats);
      setProgress(progressData.progress);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'in_progress': { color: 'var(--warning)', text: 'In Progress', icon: 'hourglass_empty' },
      'submitted': { color: 'var(--info)', text: 'Submitted', icon: 'send' },
      'approved': { color: 'var(--success)', text: 'Approved', icon: 'check_circle' },
      'assigned': { color: 'var(--secondary)', text: 'Assigned', icon: 'assignment' }
    };
    return badges[status] || { color: 'var(--secondary)', text: status, icon: 'help' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTaskClick = (task) => {
    if (task.status === 'in_progress') {
      navigate(`/ocr/task/${task._id}`);
    } else {
      setSelectedTask(task);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h3>Error Loading History</h3>
        <p>{error}</p>
        <button className="btn" onClick={fetchData}>
          <span className="material-icons">refresh</span>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Task History</h1>
        <p>Track your OCR correction work and progress over time</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons" style={{ color: 'var(--primary)' }}>assignment</span>
          </div>
          <div className="stat-content">
            <h3>Total Tasks</h3>
            <p className="stat-value">{stats.totalAssigned || 0}</p>
            <p className="stat-desc">All time assigned</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons" style={{ color: 'var(--success)' }}>check_circle</span>
          </div>
          <div className="stat-content">
            <h3>Completion Rate</h3>
            <p className="stat-value">{stats.completionRate || 0}%</p>
            <p className="stat-desc">Tasks completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons" style={{ color: 'var(--info)' }}>trending_up</span>
          </div>
          <div className="stat-content">
            <h3>Accuracy Rate</h3>
            <p className="stat-value">{stats.accuracyRate || 0}%</p>
            <p className="stat-desc">First-try approvals</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons" style={{ color: 'var(--warning)' }}>schedule</span>
          </div>
          <div className="stat-content">
            <h3>Recent Activity</h3>
            <p className="stat-value">{stats.recentActivity || 0}</p>
            <p className="stat-desc">Last 7 days</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="filter-group">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Tasks</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="history-content">
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <span className="material-icons">inbox</span>
            <h3>No tasks found</h3>
            <p>No tasks match your current filter criteria.</p>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => {
              const badge = getStatusBadge(task.status);
              return (
                <div 
                  key={task._id} 
                  className={`task-item ${task.status === 'in_progress' ? 'clickable' : ''}`}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="task-image-thumb">
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

                  <div className="task-details">
                    <div className="task-meta">
                      <span 
                        className="status-badge"
                        style={{ background: badge.color }}
                      >
                        <span className="material-icons">{badge.icon}</span>
                        {badge.text}
                      </span>
                      <span className="task-date">{formatDate(task.createdAt)}</span>
                    </div>

                    {task.ocrText && (
                      <div className="task-preview">
                        <strong>OCR Text:</strong> 
                        <span>{task.ocrText.substring(0, 100)}...</span>
                      </div>
                    )}

                    {task.correctedText && (
                      <div className="task-preview">
                        <strong>Corrected:</strong> 
                        <span>{task.correctedText.substring(0, 100)}...</span>
                      </div>
                    )}

                    <div className="task-source">
                      <span className="material-icons">source</span>
                      Source: {task.source || 'System'}
                    </div>
                  </div>

                  <div className="task-actions">
                    {task.status === 'in_progress' && (
                      <span className="continue-hint">
                        <span className="material-icons">play_arrow</span>
                        Click to continue
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="material-icons">chevron_left</span>
              Previous
            </button>

            <div className="pagination-numbers">
              {getPaginationNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`pagination-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Task Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedTask(null)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="task-detail-content">
              {selectedTask.imageUrl && (
                <div className="task-image-full">
                  <img 
                    src={`http://localhost:5000${selectedTask.imageUrl}`} 
                    alt="Task"
                  />
                </div>
              )}

              <div className="task-texts">
                <div className="text-section">
                  <h4>Original OCR Text:</h4>
                  <div className="text-content ocr-text">
                    {selectedTask.ocrText || 'No OCR text available'}
                  </div>
                </div>

                {selectedTask.correctedText && (
                  <div className="text-section">
                    <h4>Your Correction:</h4>
                    <div className="text-content corrected-text">
                      {selectedTask.correctedText}
                    </div>
                  </div>
                )}
              </div>

              <div className="task-metadata">
                <div className="meta-item">
                  <strong>Status:</strong>
                  <span 
                    className="status-badge"
                    style={{ background: getStatusBadge(selectedTask.status).color }}
                  >
                    {getStatusBadge(selectedTask.status).text}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Created:</strong> {formatDate(selectedTask.createdAt)}
                </div>
                {selectedTask.updatedAt !== selectedTask.createdAt && (
                  <div className="meta-item">
                    <strong>Last Updated:</strong> {formatDate(selectedTask.updatedAt)}
                  </div>
                )}
                <div className="meta-item">
                  <strong>Source:</strong> {selectedTask.source || 'System'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
