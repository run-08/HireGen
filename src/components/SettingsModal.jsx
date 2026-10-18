import React, { useState } from 'react';
import { X, Settings, Server, Globe, Save, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEFAULT_CONFIG, checkBackendServices } from '../services/api';

export default function SettingsModal({ isOpen, onClose, config, onSaveConfig }) {
  if (!isOpen) return null;

  const [formConfig, setFormConfig] = useState({ ...config });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await checkBackendServices(formConfig);
      setTestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    setFormConfig({ ...DEFAULT_CONFIG });
    setTestResult(null);
  };

  const handleSave = () => {
    onSaveConfig(formConfig);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Settings className="icon-sm text-accent" />
            <div>
              <h3 className="modal-title">Microservice Endpoints Configuration</h3>
              <p className="modal-subtitle">Configure backend hosts and reactive communication mode</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X className="icon-sm" />
          </button>
        </div>

        <div className="modal-body settings-body">
          {/* Proxy toggle */}
          <div className="setting-toggle-box">
            <div className="toggle-info">
              <span className="toggle-label">Use Vite Dev Server Reverse Proxy</span>
              <span className="toggle-desc">
                Routes calls through Vite dev proxy (/api/stripper and /api/interviewer) to prevent any browser CORS issues.
              </span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={formConfig.useProxy}
                onChange={e => setFormConfig({ ...formConfig, useProxy: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {!formConfig.useProxy ? (
            <>
              {/* Stripper URL */}
              <div className="form-group">
                <label className="form-label">
                  <Server className="icon-xs mr-1 text-cyan" />
                  ResumeTextStriper URL (Spring Boot Port 9090)
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formConfig.stripperUrl}
                  onChange={e => setFormConfig({ ...formConfig, stripperUrl: e.target.value })}
                  placeholder="http://localhost:9090"
                />
                <span className="form-help">Handles PDF upload and text stripping via Apache PDFBox</span>
              </div>

              {/* QuestionMaker URL */}
              <div className="form-group">
                <label className="form-label">
                  <Globe className="icon-xs mr-1 text-violet" />
                  QuestionMaker URL (Spring Boot Port 9091)
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formConfig.interviewerUrl}
                  onChange={e => setFormConfig({ ...formConfig, interviewerUrl: e.target.value })}
                  placeholder="http://localhost:9091"
                />
                <span className="form-help">Conducts AI screening with reactive SSE Flux and 10-message chat memory</span>
              </div>
            </>
          ) : (
            <div className="alert-box alert-info">
              <Globe className="icon-sm" />
              <span>
                Vite proxy active: Requests to <strong>/api/stripper</strong> proxy to port 9090 and <strong>/api/interviewer</strong> proxy to port 9091.
              </span>
            </div>
          )}

          {/* Test results */}
          {testResult && (
            <div className="test-results-box">
              <div className="test-item">
                <span>ResumeTextStriper (9090):</span>
                <span className={testResult.stripper.alive ? 'text-success' : 'text-danger'}>
                  {testResult.stripper.alive ? '? Online' : '? Offline'}
                </span>
              </div>
              <div className="test-item">
                <span>QuestionMaker (9091):</span>
                <span className={testResult.interviewer.alive ? 'text-success' : 'text-danger'}>
                  {testResult.interviewer.alive ? '? Online' : '? Offline'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer settings-footer">
          <div className="left-actions">
            <button className="btn-outline-sm" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button className="btn-outline-sm" onClick={handleReset}>
              <RotateCcw className="icon-xs mr-1" /> Reset Defaults
            </button>
          </div>

          <div className="right-actions">
            <button className="btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary btn-sm" onClick={handleSave}>
              <Save className="icon-xs mr-1" /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
