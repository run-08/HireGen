import React from 'react';
import { Bot, Sparkles, Volume2, VolumeX, Settings, Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Navbar({ 
  serviceStatus, 
  onRefreshHealth, 
  onOpenSettings, 
  audioEnabled, 
  onToggleAudio,
  activeSession,
  onResetInterview 
}) {
  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <div className="nav-brand">
          <div className="brand-icon-wrapper">
            <Bot className="brand-icon" />
            <span className="brand-glow" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-title">HireGen</span>
              <span className="brand-badge">AI Interviewer</span>
            </div>
            <span className="brand-subtitle">Reactive Spring WebFlux + Gemini Screening</span>
          </div>
        </div>

        {/* Center / Status */}
        <div className="nav-status-group">
          {/* Stripper Service Status */}
          <div className={`status-pill ${serviceStatus.stripper.alive ? 'online' : 'offline'}`} title={`ResumeTextStriper at ${serviceStatus.stripper.url}`}>
            <span className="status-dot" />
            <span className="status-label">Port 9090 (Stripper):</span>
            <span className="status-val">{serviceStatus.stripper.alive ? 'Active' : 'Offline'}</span>
          </div>

          {/* QuestionMaker Service Status */}
          <div className={`status-pill ${serviceStatus.interviewer.alive ? 'online' : 'offline'}`} title={`QuestionMaker at ${serviceStatus.interviewer.url}`}>
            <span className="status-dot" />
            <span className="status-label">Port 9091 (Interviewer):</span>
            <span className="status-val">{serviceStatus.interviewer.alive ? 'Active' : 'Offline'}</span>
          </div>

          <button 
            className="btn-icon" 
            onClick={onRefreshHealth} 
            title="Refresh Service Status"
          >
            <RefreshCw className="icon-sm" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Audio TTS toggle */}
          <button 
            className={`btn-action ${audioEnabled ? 'active' : ''}`}
            onClick={onToggleAudio}
            title={audioEnabled ? "Interviewer Voice Enabled (Click to Mute)" : "Interviewer Voice Muted (Click to Unmute)"}
          >
            {audioEnabled ? <Volume2 className="icon-sm text-accent" /> : <VolumeX className="icon-sm text-muted" />}
            <span className="btn-action-text">{audioEnabled ? "Voice ON" : "Voice OFF"}</span>
          </button>

          {/* Settings */}
          <button 
            className="btn-icon" 
            onClick={onOpenSettings}
            title="Backend Connection Settings"
          >
            <Settings className="icon-sm" />
          </button>

          {activeSession && (
            <button 
              className="btn-secondary btn-sm"
              onClick={onResetInterview}
            >
              New Interview
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
