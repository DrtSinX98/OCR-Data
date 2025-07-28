// src/components/History.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Spinner, Alert, Container, Form, Modal, Pagination } from 'react-bootstrap';
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
      'in_progress': { variant: 'warning', text: 'In Progress', icon: 'hourglass_empty' },
      'submitted': { variant: 'info', text: 'Submitted', icon: 'send' },
      'approved': { variant: 'success', text: 'Approved', icon: 'check_circle' },
      'assigned': { variant: 'secondary', text: 'Assigned', icon: 'assignment' }
    };
    return badges[status] || { variant: 'secondary', text: status, icon: 'help' };
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

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" role="status" variant="primary" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="text-muted">Loading your history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center mt-5">
          <Alert variant="danger">
            <Alert.Heading>Error Loading History</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchData}>
              <i className="material-icons me-2">refresh</i>
              Try Again
            </Button>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="text-center mb-5">
        <h1 className="text-primary mb-2">Task History</h1>
        <p className="text-muted fs-5">Track your OCR correction work and progress over time</p>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-5">
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center">
              <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded" style={{ width: '60px', height: '60px' }}>
                <i className="material-icons text-primary" style={{ fontSize: '2rem' }}>assignment</i>
              </div>
              <div className="ms-3">
                <h6 className="text-muted text-uppercase mb-1">Total Tasks</h6>
                <h3 className="mb-1 fw-bold">{stats.totalAssigned || 0}</h3>
                <small className="text-muted">All time assigned</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center">
              <div className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded" style={{ width: '60px', height: '60px' }}>
                <i className="material-icons text-success" style={{ fontSize: '2rem' }}>check_circle</i>
              </div>
              <div className="ms-3">
                <h6 className="text-muted text-uppercase mb-1">Completion Rate</h6>
                <h3 className="mb-1 fw-bold">{stats.completionRate || 0}%</h3>
                <small className="text-muted">Tasks completed</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center">
              <div className="d-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded" style={{ width: '60px', height: '60px' }}>
                <i className="material-icons text-info" style={{ fontSize: '2rem' }}>trending_up</i>
              </div>
              <div className="ms-3">
                <h6 className="text-muted text-uppercase mb-1">Accuracy Rate</h6>
                <h3 className="mb-1 fw-bold">{stats.accuracyRate || 0}%</h3>
                <small className="text-muted">First-try approvals</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="d-flex align-items-center">
              <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded" style={{ width: '60px', height: '60px' }}>
                <i className="material-icons text-warning" style={{ fontSize: '2rem' }}>schedule</i>
              </div>
              <div className="ms-3">
                <h6 className="text-muted text-uppercase mb-1">Recent Activity</h6>
                <h3 className="mb-1 fw-bold">{stats.recentActivity || 0}</h3>
                <small className="text-muted">Last 7 days</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <Form.Group>
            <Form.Label htmlFor="statusFilter">Filter by Status</Form.Label>
            <Form.Select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ maxWidth: '200px' }}
            >
              <option value="all">All Tasks</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Task List */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {tasks.length === 0 ? (
            <div className="text-center py-5">
              <i className="material-icons text-muted mb-3" style={{ fontSize: '4rem' }}>inbox</i>
              <h3>No tasks found</h3>
              <p className="text-muted">No tasks match your current filter criteria.</p>
            </div>
          ) : (
            <div>
              {tasks.map((task) => {
                const badge = getStatusBadge(task.status);
                return (
                  <div 
                    key={task._id} 
                    className={`d-flex gap-3 p-4 border-bottom ${
                      task.status === 'in_progress' ? 'cursor-pointer' : ''
                    }`}
                    style={{ cursor: task.status === 'in_progress' ? 'pointer' : 'default' }}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                      {task.imageUrl ? (
                        <img 
                          src={`http://localhost:5000${task.imageUrl}`} 
                          alt="Task"
                          className="w-100 h-100 rounded"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-100 h-100 bg-light rounded d-flex align-items-center justify-content-center">
                          <i className="material-icons text-muted">image</i>
                        </div>
                      )}
                    </div>

                    <div className="flex-fill">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg={badge.variant} className="d-flex align-items-center gap-1">
                          <i className="material-icons" style={{ fontSize: '1rem' }}>{badge.icon}</i>
                          {badge.text}
                        </Badge>
                        <small className="text-muted">{formatDate(task.createdAt)}</small>
                      </div>

                      {task.ocrText && (
                        <p className="mb-2 small">
                          <strong>OCR Text:</strong> 
                          <span className="text-muted ms-1">{task.ocrText.substring(0, 100)}...</span>
                        </p>
                      )}

                      {task.correctedText && (
                        <p className="mb-2 small">
                          <strong>Corrected:</strong> 
                          <span className="text-muted ms-1">{task.correctedText.substring(0, 100)}...</span>
                        </p>
                      )}

                      <div className="d-flex align-items-center gap-1 text-muted small">
                        <i className="material-icons" style={{ fontSize: '1rem' }}>source</i>
                        Source: {task.source || 'System'}
                      </div>
                    </div>

                    <div className="flex-shrink-0 d-flex align-items-center">
                      {task.status === 'in_progress' && (
                        <span className="text-primary d-flex align-items-center gap-1">
                          <i className="material-icons" style={{ fontSize: '1rem' }}>play_arrow</i>
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
            <div className="d-flex justify-content-between align-items-center p-4 border-top">
              <Button
                variant="outline-primary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="material-icons me-1">chevron_left</i>
                Previous
              </Button>

              <Pagination className="mb-0">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Pagination.Item>
                ))}
              </Pagination>

              <Button
                variant="outline-primary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <i className="material-icons ms-1">chevron_right</i>
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Task Detail Modal */}
      <Modal show={!!selectedTask} onHide={() => setSelectedTask(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Task Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <div>
              {selectedTask.imageUrl && (
                <div className="text-center mb-4">
                  <img 
                    src={`http://localhost:5000${selectedTask.imageUrl}`} 
                    alt="Task"
                    className="img-fluid rounded"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              )}

              <div className="mb-4">
                <h5>Original OCR Text:</h5>
                <div className="p-3 bg-light rounded border-start border-info border-4">
                  {selectedTask.ocrText || 'No OCR text available'}
                </div>
              </div>

              {selectedTask.correctedText && (
                <div className="mb-4">
                  <h5>Your Correction:</h5>
                  <div className="p-3 bg-light rounded border-start border-success border-4">
                    {selectedTask.correctedText}
                  </div>
                </div>
              )}

              <div className="p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Status:</strong>
                  <Badge bg={getStatusBadge(selectedTask.status).variant}>
                    {getStatusBadge(selectedTask.status).text}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Created:</strong> {formatDate(selectedTask.createdAt)}
                </div>
                {selectedTask.updatedAt !== selectedTask.createdAt && (
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Last Updated:</strong> {formatDate(selectedTask.updatedAt)}
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <strong>Source:</strong> {selectedTask.source || 'System'}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default History;
