// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import Ocr from './components/Ocr';
import OcrTask from './components/OcrTask';
import Profile from './components/Profile';
import History from './components/History'; // NEW
import DisplayNameModal from './components/DisplayNameModal'; // NEW
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isLoggedIn && (
          <nav className="navbar">
            <div>
              <Link to="/home">
                <span className="material-icons">home</span>
                Home
              </Link>
              <Link to="/ocr">
                <span className="material-icons">image_search</span>
                OCR
              </Link>
              <Link to="/history">
                <span className="material-icons">history</span>
                History
              </Link>
              <Link to="/profile">
                <span className="material-icons">person</span>
                Profile
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ opacity: 0.9 }}>
                Welcome, {getDisplayName()}!
              </span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                <span className="material-icons">logout</span>
                Logout
              </button>
            </div>
          </nav>
        )}
        
        <div className="main-content">
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
