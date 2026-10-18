import React, { useState } from 'react';
import { X, FileText, Copy, Check, Search, Download } from 'lucide-react';

export default function ResumeModal({ isOpen, onClose, resumeText }) {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-resume-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = resumeText.split('\n');
  const filteredLines = searchTerm 
    ? lines.filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <FileText className="icon-sm text-cyan" />
            <div>
              <h3 className="modal-title">Extracted Resume Content</h3>
              <p className="modal-subtitle">Text extracted by Apache PDFBox (ResumeTextStriper :9090)</p>
            </div>
          </div>

          <div className="modal-header-actions">
            <button className="btn-icon" onClick={handleCopy} title="Copy all text">
              {copied ? <Check className="icon-sm text-success" /> : <Copy className="icon-sm" />}
            </button>
            <button className="btn-icon" onClick={handleDownload} title="Download as text file">
              <Download className="icon-sm" />
            </button>
            <button className="btn-icon" onClick={onClose} title="Close modal">
              <X className="icon-sm" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="modal-search">
          <Search className="icon-xs text-muted" />
          <input 
            type="text" 
            placeholder="Search keywords, technologies, skills..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              <X className="icon-xs" />
            </button>
          )}
        </div>

        {/* Content Viewer */}
        <div className="modal-body">
          <pre className="resume-pre">
            {filteredLines.length > 0 ? (
              filteredLines.join('\n')
            ) : (
              <span className="text-muted">No matches found for "{searchTerm}"</span>
            )}
          </pre>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="text-muted text-xs">
            {lines.length} lines • {resumeText.split(/\s+/).filter(Boolean).length} words
          </span>
          <button className="btn-primary btn-sm" onClick={onClose}>
            Back to Interview
          </button>
        </div>
      </div>
    </div>
  );
}
