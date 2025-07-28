// src/components/DisplayNameModal.js
import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
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

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="text-center w-100">
          <h2 className="text-primary mb-2">Welcome! What should we call you? 🎉</h2>
          <p className="text-muted mb-0">Help us personalize your experience by telling us your preferred name.</p>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label htmlFor="displayName">Your Name</Form.Label>
            <Form.Control
              type="text"
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your preferred name"
              maxLength={50}
              disabled={loading}
              size="lg"
            />
          </Form.Group>
          
          <div className="d-flex gap-3">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              className="flex-fill d-flex align-items-center justify-content-center"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="material-icons me-2">check</i>
                  Save Name
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline-secondary"
              size="lg"
              onClick={handleSkip}
              disabled={loading}
            >
              <i className="material-icons me-2">skip_next</i>
              Skip for now
            </Button>
          </div>
        </Form>
      </Modal.Body>
      
      <Modal.Footer className="justify-content-center">
        <small className="text-muted">You can always change this later in your profile settings.</small>
      </Modal.Footer>
    </Modal>
  );
};

export default DisplayNameModal;
