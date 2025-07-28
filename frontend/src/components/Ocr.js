// src/components/Ocr.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { uploadImage, assignTask } from '../services/api';

const Ocr = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setMessage({ text: 'Please select a valid image file (JPEG, PNG, etc.)', type: 'danger' });
      return;
    }
    
    // Set file and create preview
    setSelectedFile(file);
    setMessage({ text: '', type: '' });
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ text: 'Please select an image file.', type: 'danger' });
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    setUploading(true);
    setMessage({ text: 'Uploading and processing image...', type: 'info' });
    
    try {
      const data = await uploadImage(formData);
      setMessage({ 
        text: data.message || 'Image uploaded successfully!', 
        type: 'success' 
      });
      
      // Navigate to the task detail page after a short delay
      if (data.task?._id) {
        setTimeout(() => navigate(`/ocr/task/${data.task._id}`), 1500);
      }
    } catch (err) {
      setMessage({ 
        text: err.message || 'Failed to upload image. Please try again.', 
        type: 'danger' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    setMessage({ text: 'Finding an available task for you...', type: 'info' });
    
    try {
      const data = await assignTask();
      setMessage({ 
        text: data.message || 'Task assigned successfully!', 
        type: 'success' 
      });
      
      // Redirect to task details page after a short delay
      if (data.task?._id) {
        setTimeout(() => navigate(`/ocr/task/${data.task._id}`), 1500);
      }
    } catch (err) {
      setMessage({ 
        text: err.message || 'Failed to assign task. Please try again.', 
        type: 'danger' 
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.match('image.*')) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setMessage({ text: 'Please drop a valid image file.', type: 'danger' });
    }
  };

  return (
    <Container>
      <div className="text-center mb-5">
        <h1 className="text-primary mb-2">OCR Tasks</h1>
        <p className="text-muted fs-5">
          Upload an image or get assigned a task to start transcribing Odia text
        </p>
      </div>
      
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
          {message.text}
        </Alert>
      )}

      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Upload Section */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <div 
                className={`border-2 border-dashed rounded p-5 text-center ${
                  preview ? 'border-success bg-light' : 'border-secondary'
                }`}
                style={{ 
                  borderStyle: 'dashed',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                
                {preview ? (
                  <div className="position-relative">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="img-fluid rounded"
                      style={{ maxHeight: '300px' }}
                    />
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded" style={{ opacity: 0, transition: 'opacity 0.3s' }}>
                      <div className="text-white text-center">
                        <i className="material-icons mb-2" style={{ fontSize: '3rem' }}>upload_file</i>
                        <p className="mb-0">Click or drop to change image</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <i className="material-icons text-muted mb-3" style={{ fontSize: '4rem' }}>image</i>
                    <h5>Drag & drop an image here, or click to select</h5>
                    <p className="text-muted mb-0">Supports JPG, PNG up to 10MB</p>
                  </div>
                )}
              </div>
              
              <div className="d-flex gap-3 mt-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  className="flex-fill d-flex align-items-center justify-content-center"
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="material-icons me-2">upload_file</i>
                      Upload & Process
                    </>
                  )}
                </Button>
                
                {selectedFile && !uploading && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setMessage({ text: '', type: '' });
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {/* Divider */}
          <div className="text-center my-4">
            <div className="position-relative">
              <hr />
              <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">OR</span>
            </div>
          </div>
          
          {/* Assign Task Section */}
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4 text-center">
              <i className="material-icons text-info mb-3" style={{ fontSize: '4rem' }}>assignment_ind</i>
              <h3>Work on Existing Tasks</h3>
              <p className="text-muted mb-4">
                Get assigned an unclaimed OCR task to help transcribe and correct text
              </p>
              <Button 
                variant="outline-primary" 
                size="lg"
                onClick={handleAssign}
                disabled={assigning}
              >
                {assigning ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Finding Task...
                  </>
                ) : (
                  'Assign Me a Task'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Ocr;