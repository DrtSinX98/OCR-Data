// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Ocr from './components/Ocr';
import OcrTask from './components/OcrTask';
import Profile from './components/Profile';
import History from './components/History';
import DisplayNameModal from './components/DisplayNameModal';
import { getToken, removeToken, getProfile } from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      const token = getToken();
      if (token) {
        try {
          // Get user profile to check if display name is set
          const profileData = await getProfile();
          if (profileData?.user) {
            setUser(profileData.user);
            setIsLoggedIn(true);
            
            // Show display name modal if user doesn't have one
            if (!profileData.user.displayName) {
              setShowDisplayNameModal(true);
            }
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          removeToken();
        }
      }
      setLoading(false);
    };

    initializeApp();
  }, []);



  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData.user);
    
    // Show display name modal for first-time users
    if (userData.isFirstTime || !userData.user?.displayName) {
      setShowDisplayNameModal(true);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleDisplayNameSave = (newDisplayName) => {
    setUser(prev => ({ ...prev, displayName: newDisplayName }));
    setShowDisplayNameModal(false);
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

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" role="status" variant="primary" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="text-muted">Loading application...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
                        {isLoggedIn && (
                  <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" fixed="top">
            <Container>
              <Navbar.Brand as={Link} to="/home" className="fw-bold">
                <i className="material-icons me-2">home</i>
                OCR Dashboard
              </Navbar.Brand>
              
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/home" className="d-flex align-items-center">
                    <i className="material-icons me-1">home</i>
                    Home
                  </Nav.Link>
                  <Nav.Link as={Link} to="/ocr" className="d-flex align-items-center">
                    <i className="material-icons me-1">image_search</i>
                    OCR
                  </Nav.Link>
                  <Nav.Link as={Link} to="/history" className="d-flex align-items-center">
                    <i className="material-icons me-1">history</i>
                    History
                  </Nav.Link>
                  <Nav.Link as={Link} to="/profile" className="d-flex align-items-center">
                    <i className="material-icons me-1">person</i>
                    Profile
                  </Nav.Link>
                </Nav>
                
                <Nav className="d-flex align-items-center">
                  <span className="text-light me-3">
                    Welcome, {getDisplayName()}!
                  </span>
                  <button 
                    className="btn btn-outline-light btn-sm d-flex align-items-center"
                    onClick={handleLogout}
                  >
                    <i className="material-icons me-1">logout</i>
                    Logout
                  </button>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        )}
        
        <div className="main-content">
          <Container>
            <Routes>
              <Route 
                path="/login" 
                element={isLoggedIn ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />} 
              />
              <Route 
                path="/signup" 
                element={isLoggedIn ? <Navigate to="/home" /> : <Signup onLogin={handleLogin} />} 
              />
              <Route 
                path="/home" 
                element={isLoggedIn ? <Home user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/ocr" 
                element={isLoggedIn ? <Ocr /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/ocr/task/:taskId" 
                element={isLoggedIn ? <OcrTask /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/history" 
                element={isLoggedIn ? <History /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/profile" 
                element={isLoggedIn ? <Profile user={user} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={<Navigate to={isLoggedIn ? "/home" : "/login"} />} 
              />
            </Routes>
          </Container>
        </div>

        {/* Display Name Modal */}
        <DisplayNameModal
          isOpen={showDisplayNameModal}
          onClose={() => setShowDisplayNameModal(false)}
          onSave={handleDisplayNameSave}
        />
      </div>
    </Router>
  );
}

export default App;
