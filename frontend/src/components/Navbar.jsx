import React from 'react';
import { 
  Bot, 
  Settings, 
  RotateCcw, 
  Radio, 
  Volume2, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Navbar({ 
  config, 
  onOpenSettings, 
  onResetSession, 
  isInterviewActive 
}) {
  return (
    <header className="navbar" role="banner">
      <div className="app-container">
        <div className="navbar-inner">
          <div className="brand" onClick={onResetSession} title="Return to home screen">
            <div className="brand-icon-wrapper">
              <Bot />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-title">AIVA</span>
              <span className="brand-badge">Interview AI</span>
            </div>
          </div>

          <div className="nav-actions">
            {/* Status Indicators */}
            <div className="status-pill" title={`Model: ${config?.model_name || 'Loading...'}`}>
              <div className={`status-dot ${config?.model_name ? '' : 'warning'}`} />
              <span>{config?.model_name ? config.model_name : 'Connecting...'}</span>
            </div>

            <div className="status-pill" title={config?.tts_online ? 'Coqui TTS Server Online' : 'TTS: Browser Speech Active'}>
              <Volume2 size={14} style={{ color: config?.tts_online ? 'var(--accent-emerald)' : 'var(--primary-light)' }} />
              <span>{config?.tts_online ? 'Coqui Voice' : 'Browser Audio'}</span>
            </div>

            {/* Quick Actions */}
            {isInterviewActive && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                onClick={onResetSession}
                title="Restart this mock interview session"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}

            <button 
              className="btn btn-icon" 
              onClick={onOpenSettings} 
              title="Platform Settings & LLM Config"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
