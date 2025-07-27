// src/components/DisplayNameModal.js
import React, { useState } from 'react';
import { updateDisplayName } from '../services/api';

const DisplayNameModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      setError('Name can only contain letters and spaces');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await updateDisplayName(name.trim());
      onSave(name.trim());
      onClose();
      setName('');
    } catch (err) {
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setName('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Welcome! What should we call you? 🎉</h2>
          <p>Help us personalize your experience by telling us your preferred name.</p>
        </div>
        
        {error && (
          <div className="message error">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Your Name:</label>
            <input
              type="text"
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your preferred name"
              maxLength={50}
              disabled={loading}
              style={{ fontSize: '1.1rem', padding: '1rem' }}
            />
          </div>
          
          <div className="modal-actions">
            <button 
              type="submit" 
              className="btn primary" 
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-icons">check</span>
                  Save Name
                </>
              )}
            </button>
            
            <button 
              type="button" 
              className="btn secondary" 
              onClick={handleSkip}
              disabled={loading}
            >
              <span className="material-icons">skip_next</span>
              Skip for now
            </button>
          </div>
        </form>
        
        <div className="modal-footer">
          <small>You can always change this later in your profile settings.</small>
        </div>
      </div>
    </div>
  );
};

export default DisplayNameModal;
