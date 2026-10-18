import React from 'react';
import { Bot, Volume2, VolumeX, Settings } from 'lucide-react';

export default function Navbar({ 
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
              <span className="brand-badge">Interview studio</span>
            </div>
            <span className="brand-subtitle">A calmer way to prepare for what&apos;s next</span>
          </div>
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
            title="Settings"
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
