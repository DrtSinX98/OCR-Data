// src/components/Ocr.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage, assignTask } from '../services/api';
import { FiUpload, FiDownload, FiImage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

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
      setMessage({ text: 'Please select a valid image file (JPEG, PNG, etc.)', type: 'error' });
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
      setMessage({ text: 'Please select an image file.', type: 'error' });
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
        type: 'error' 
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
        type: 'error' 
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
      setMessage({ text: 'Please drop a valid image file.', type: 'error' });
    }
  };

  const renderMessage = () => {
    if (!message.text) return null;
    
    const icon = message.type === 'error' ? (
      <FiAlertCircle className="message-icon error" />
    ) : message.type === 'success' ? (
      <FiCheckCircle className="message-icon success" />
    ) : (
      <div className="spinner"></div>
    );
    
    return (
      <div className={`message ${message.type}`}>
        {icon}
        <span>{message.text}</span>
      </div>
    );
  };

  return (
    <div className="ocr-container">
      <h1>OCR Tasks</h1>
      <p className="subtitle">Upload an image or get assigned a task to start transcribing Odia text</p>
      
      {renderMessage()}

      <div className="ocr-options">
        {/* Upload Section */}
        <div className="upload-section">
          <div 
            className={`drop-zone ${preview ? 'has-preview' : ''}`}
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
              <div className="image-preview">
                <img src={preview} alt="Preview" />
                <div className="overlay">
                  <FiUpload className="icon" />
                  <span>Click or drop to change image</span>
                </div>
              </div>
            ) : (
              <div className="upload-prompt">
                <FiImage className="icon" />
                <p>Drag & drop an image here, or click to select</p>
                <small>Supports JPG, PNG up to 10MB</small>
              </div>
            )}
          </div>
          
          <div className="action-buttons">
            <button 
              className={`btn primary ${!selectedFile || uploading ? 'disabled' : ''}`} 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <div className="spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiUpload />
                  <span>Upload & Process</span>
                </>
              )}
            </button>
            
            {selectedFile && !uploading && (
              <button 
                className="btn secondary" 
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setMessage({ text: '', type: '' });
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {/* Divider */}
        <div className="divider">
          <span>OR</span>
        </div>
        
        {/* Assign Task Section */}
        <div className="assign-section">
          <div className="assign-content">
            <FiDownload className="assign-icon" />
            <h3>Work on Existing Tasks</h3>
            <p>Get assigned an unclaimed OCR task to help transcribe and correct text</p>
            <button 
              className={`btn secondary ${assigning ? 'loading' : ''}`} 
              onClick={handleAssign}
              disabled={assigning}
            >
              {assigning ? (
                <>
                  <div className="spinner"></div>
                  <span>Finding Task...</span>
                </>
              ) : (
                'Assign Me a Task'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ocr;