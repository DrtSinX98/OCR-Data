// src/components/Profile.js - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Spinner, Alert, Container, Form } from 'react-bootstrap';
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
      'in_progress': { variant: 'warning', text: 'In Progress' },
      'submitted': { variant: 'info', text: 'Submitted' },
      'approved': { variant: 'success', text: 'Approved' },
      'assigned': { variant: 'secondary', text: 'Assigned' }
    };
    return badges[status] || { variant: 'secondary', text: status };
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" role="status" variant="primary" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="text-muted">Loading your profile...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <Container>
        <div className="text-center mt-5">
          <Alert variant="danger">
            <Alert.Heading>Error Loading Profile</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchProfile}>
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
        <h1 className="text-primary mb-2">My Profile</h1>
        <p className="text-muted fs-5">Manage your account information and preferences</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={8} className="mb-4">
          {/* Profile Info Card */}
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <div className="d-flex gap-4 align-items-start">
                <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle" style={{ width: '100px', height: '100px' }}>
                  <i className="material-icons text-primary" style={{ fontSize: '3rem' }}>person</i>
                </div>
                
                <div className="flex-fill">
                  <div className="mb-4">
                    <h6 className="text-muted text-uppercase mb-2">Display Name</h6>
                    {editingName ? (
                      <div>
                        <Form.Control
                          type="text"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          placeholder={getDisplayName()}
                          maxLength={50}
                          disabled={updating}
                          className="mb-2"
                        />
                        <div className="d-flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleUpdateDisplayName}
                            disabled={updating || !newDisplayName.trim()}
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setEditingName(false);
                              setNewDisplayName('');
                              setError('');
                            }}
                            disabled={updating}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center gap-3">
                        <span className="fs-5 fw-bold">{getDisplayName()}</span>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setEditingName(true);
                            setNewDisplayName(user?.displayName || '');
                          }}
                        >
                          <i className="material-icons me-1">edit</i>
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <h6 className="text-muted text-uppercase mb-1">Email</h6>
                    <p className="mb-0 fs-6">{user?.email}</p>
                  </div>

                  <div>
                    <h6 className="text-muted text-uppercase mb-1">Member Since</h6>
                    <p className="mb-0 fs-6">{new Date(user?.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Recent Tasks */}
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <h3 className="mb-4">Recent Tasks</h3>
              {recentTasks.length > 0 ? (
                <div>
                  {recentTasks.map((task, index) => {
                    const badge = getStatusBadge(task.status);
                    return (
                      <div key={task._id || index} className="d-flex gap-3 p-3 border rounded mb-3">
                        <div className="flex-shrink-0" style={{ width: '60px', height: '60px' }}>
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
                            <Badge bg={badge.variant} className="fs-6">
                              {badge.text}
                            </Badge>
                            <small className="text-muted">
                              {new Date(task.createdAt).toLocaleDateString()}
                            </small>
                          </div>

                          {task.correctedText && (
                            <p className="mb-0 text-muted small">
                              {task.correctedText.substring(0, 80)}...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="material-icons text-muted mb-3" style={{ fontSize: '3rem' }}>inbox</i>
                  <p className="text-muted mb-0">No recent tasks found</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
