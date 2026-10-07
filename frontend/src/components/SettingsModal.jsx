import React, { useState } from 'react';
import { X, Save, Key, Cpu, Server, Volume2 } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, config, onSaveConfig }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    model_name: config?.model_name || 'llama3.2:latest',
    base_url: config?.base_url || 'http://localhost:11434/v1/',
    api_key: config?.api_key || '',
    voice_speed: config?.voice_speed || '1.0',
    preferred_speaker: config?.preferred_speaker || 'p230'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu style={{ color: 'var(--primary-light)' }} />
            <h2>Interview System Settings</h2>
          </div>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              LLM Model Name
            </label>
            <input
              type="text"
              name="model_name"
              value={formData.model_name}
              onChange={handleChange}
              placeholder="e.g. llama3.2:latest, gpt-4o-mini"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                fontSize: '0.95rem'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
              Compatible with Ollama models (llama3.2, mistral) or any OpenAI-compatible endpoint.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              API Base URL
            </label>
            <input
              type="text"
              name="base_url"
              value={formData.base_url}
              onChange={handleChange}
              placeholder="http://localhost:11434/v1/"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              API Key (Optional for local Ollama)
            </label>
            <input
              type="password"
              name="api_key"
              value={formData.api_key}
              onChange={handleChange}
              placeholder="ollama or sk-..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Voice Playback Speed
            </label>
            <select
              name="voice_speed"
              value={formData.voice_speed}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                fontSize: '0.95rem'
              }}
            >
              <option value="0.9">0.9x (Relaxed)</option>
              <option value="1.0">1.0x (Normal speed)</option>
              <option value="1.15">1.15x (Brisk)</option>
              <option value="1.3">1.3x (Fast)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
