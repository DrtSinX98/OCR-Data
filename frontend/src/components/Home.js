// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Spinner, Alert, Container } from 'react-bootstrap';
import { getHomeStats, getProfile } from '../services/api';

// Icons for the stats cards
const StatIcon = ({ icon, color }) => (
  <div className="d-flex align-items-center justify-content-center" style={{ 
    width: '60px', 
    height: '60px', 
    borderRadius: '12px',
    backgroundColor: `${color}20`,
    color: color
  }}>
    <i className="material-icons" style={{ fontSize: '2rem' }}>{icon}</i>
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
        <p className="text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center mt-5">
          <Alert variant="danger">
            <Alert.Heading>Error Loading Dashboard</Alert.Heading>
            <p>{error}</p>
            <Button 
              variant="outline-danger" 
              onClick={() => window.location.reload()}
            >
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
        <h1 className="text-primary mb-2">Welcome back, {getDisplayName()}! 👋</h1>
        <p className="text-muted fs-5">
          Here's what's happening with your Odia OCR tasks
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-5">
        <h2 className="mb-4">Task Overview</h2>
        <Row>
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="d-flex align-items-center">
                <StatIcon icon="assignment" color="#0d6efd" />
                <div className="ms-3">
                  <h6 className="text-muted text-uppercase mb-1">Total Assigned</h6>
                  <h3 className="mb-1 fw-bold">{stats.totalAssigned}</h3>
                  <small className="text-muted">All tasks assigned to you</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="d-flex align-items-center">
                <StatIcon icon="hourglass_empty" color="#ffc107" />
                <div className="ms-3">
                  <h6 className="text-muted text-uppercase mb-1">In Progress</h6>
                  <h3 className="mb-1 fw-bold">{stats.totalInProgress}</h3>
                  <small className="text-muted">Currently working on</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="d-flex align-items-center">
                <StatIcon icon="check_circle" color="#198754" />
                <div className="ms-3">
                  <h6 className="text-muted text-uppercase mb-1">Approved</h6>
                  <h3 className="mb-1 fw-bold">{stats.totalApproved}</h3>
                  <small className="text-muted">Successfully completed</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="d-flex align-items-center">
                <StatIcon icon="trending_up" color="#0dcaf0" />
                <div className="ms-3">
                  <h6 className="text-muted text-uppercase mb-1">Accuracy Rate</h6>
                  <h3 className="mb-1 fw-bold">{stats.accuracyRate}%</h3>
                  <small className="text-muted">Approval rate on submission</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm border-0 mb-5">
        <Card.Body className="p-4">
          <h2 className="mb-3">Quick Actions</h2>
          <p className="text-muted mb-4">
            Get started with these common tasks
          </p>
          <Row>
            <Col md={3} sm={6} className="mb-3">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => handleQuickAction('upload')}
              >
                <i className="material-icons me-2">upload_file</i>
                Upload New Image
              </Button>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
              <Button 
                variant="outline-primary" 
                size="lg" 
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => handleQuickAction('assign')}
              >
                <i className="material-icons me-2">assignment_ind</i>
                Assign Me a Task
              </Button>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
              <Button 
                variant="outline-secondary" 
                size="lg" 
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => handleQuickAction('history')}
              >
                <i className="material-icons me-2">history</i>
                View My History
              </Button>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
              <Button 
                variant="outline-info" 
                size="lg" 
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => handleQuickAction('profile')}
              >
                <i className="material-icons me-2">person</i>
                View Profile
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Recent Activity */}
      {recentTasks.length > 0 && (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Recent Activity</h2>
              <Link to="/history" className="text-decoration-none d-flex align-items-center">
                View All
                <i className="material-icons ms-1">arrow_forward</i>
              </Link>
            </div>
            
            <Row>
              {recentTasks.slice(0, 3).map((task, index) => (
                <Col lg={4} md={6} className="mb-3" key={task._id || index}>
                  <Card className="h-100 border">
                    <div style={{ height: '150px', overflow: 'hidden' }}>
                      {task.imageUrl ? (
                        <img 
                          src={`http://localhost:5000${task.imageUrl}`} 
                          alt="Task preview"
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                          <i className="material-icons text-muted" style={{ fontSize: '3rem' }}>image</i>
                        </div>
                      )}
                    </div>
                    
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg={getTaskStatusBadge(task.status).variant}>
                          {getTaskStatusBadge(task.status).text}
                        </Badge>
                        <small className="text-muted">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      
                      {task.status === 'in_progress' && (
                        <Link 
                          to={`/ocr/task/${task._id}`}
                          className="btn btn-primary btn-sm w-100"
                        >
                          Continue
                        </Link>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Home;
