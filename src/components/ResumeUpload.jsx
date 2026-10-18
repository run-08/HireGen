import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Code,
  FileCheck2,
  X
} from 'lucide-react';

export default function ResumeUpload({ onStartProcessing, isProcessing, processStage, errorMessage }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setValidationError('');
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setValidationError('Only PDF documents (.pdf) are allowed. Please select a valid resume in PDF format.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setValidationError('PDF file size exceeds 15 MB limit. Please upload a smaller file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleStart = () => {
    if (!selectedFile) return;
    onStartProcessing(selectedFile);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="upload-wrapper">
      <div className="hero-section">
        <div className="hero-badge">
          <Sparkles className="icon-xs" />
          <span>Next-Gen Reactive Technical Interview</span>
        </div>
        <h1 className="hero-title">
          Autonomous AI Technical Interviewer
        </h1>
        <p className="hero-desc">
          Upload your resume in <strong>PDF format</strong>. Our two microservices will strip your technical skills via 
          Apache PDFBox (<span className="text-accent">Port 9090</span>) and dynamically conduct a real-time reactive screening interview (<span className="text-secondary">Port 9091</span>) with Spring AI chat memory.
        </p>
      </div>

      <div className="upload-card">
        {/* Upload Drop Zone */}
        <div 
          className={`dropzone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="application/pdf,.pdf" 
            style={{ display: 'none' }} 
            onChange={handleChange}
            disabled={isProcessing}
          />

          {!selectedFile ? (
            <div className="dropzone-content">
              <div className="upload-icon-circle">
                <FileUp className="upload-icon" />
              </div>
              <h3 className="dropzone-title">Upload Candidate Resume (PDF Only)</h3>
              <p className="dropzone-subtitle">
                Drag and drop your resume PDF here, or <span className="highlight-link">browse files</span>
              </p>
              <div className="dropzone-specs">
                <span className="spec-badge">
                  <ShieldCheck className="icon-xs" /> PDF Documents Only
                </span>
                <span className="spec-badge">Max 15MB</span>
              </div>
            </div>
          ) : (
            <div className="selected-file-card" onClick={(e) => e.stopPropagation()}>
              <div className="file-icon-box">
                <FileText className="file-icon" />
                <span className="pdf-tag">PDF</span>
              </div>
              <div className="file-details">
                <h4 className="file-name">{selectedFile.name}</h4>
                <div className="file-meta">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="text-success flex-center">
                    <CheckCircle2 className="icon-xs mr-1" /> Ready for Analysis
                  </span>
                </div>
              </div>
              {!isProcessing && (
                <button 
                  className="btn-icon-danger"
                  onClick={() => setSelectedFile(null)}
                  title="Remove File"
                >
                  <X className="icon-sm" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="alert-box alert-error">
            <AlertCircle className="icon-sm" />
            <span>{validationError}</span>
          </div>
        )}

        {/* System Error Message */}
        {errorMessage && (
          <div className="alert-box alert-error">
            <AlertCircle className="icon-sm" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Processing Indicator Steps */}
        {isProcessing && (
          <div className="processing-pipeline">
            <div className="pipeline-header">
              <div className="pipeline-spinner" />
              <span className="pipeline-title">{processStage || 'Initializing reactive interview stream...'}</span>
            </div>
            
            <div className="pipeline-steps">
              <div className={`step-item ${processStage.includes('Stripping') ? 'active' : 'completed'}`}>
                <span className="step-num">1</span>
                <span>ResumeTextStriper (9090)</span>
              </div>
              <div className={`step-item ${processStage.includes('QuestionMaker') || processStage.includes('Starting') ? 'active' : (processStage.includes('Stripping') ? 'pending' : 'completed')}`}>
                <span className="step-num">2</span>
                <span>QuestionMaker (9091)</span>
              </div>
              <div className={`step-item ${processStage.includes('Streaming') ? 'active' : 'pending'}`}>
                <span className="step-num">3</span>
                <span>Reactive Stream</span>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="upload-actions">
          <button 
            className="btn-primary btn-lg w-full"
            disabled={!selectedFile || isProcessing}
            onClick={handleStart}
          >
            {isProcessing ? (
              <>
                <span className="btn-spinner" />
                <span>Processing Resume & Starting Interview...</span>
              </>
            ) : (
              <>
                <span>Start Technical Screening</span>
                <ArrowRight className="icon-sm ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <Layers className="icon-sm text-cyan" />
            </div>
            <div className="feature-content">
              <h4>Reactive SSE Stream</h4>
              <p>Real-time token streaming with zero latency buffering.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <Cpu className="icon-sm text-violet" />
            </div>
            <div className="feature-content">
              <h4>10-Turn Context Window</h4>
              <p>Spring AI MessageWindowChatMemory manages conversational context.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon-wrapper">
              <Code className="icon-sm text-emerald" />
            </div>
            <div className="feature-content">
              <h4>Apache PDFBox Extraction</h4>
              <p>High-fidelity text stripping delivered directly to QuestionMaker.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
