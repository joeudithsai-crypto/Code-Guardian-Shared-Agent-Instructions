import React from 'react';
import { Settings, X, ShieldAlert, Key, Globe, Database } from 'lucide-react';

export default function ConfigPanel({ settings, setSettings, isOpen, onClose }) {
  if (!isOpen) return null;

  const handleToggleSimulated = () => {
    setSettings(prev => ({
      ...prev,
      provider: prev.provider === 'mock' ? 'gemini' : 'mock'
    }));
  };

  const handleProviderChange = (e) => {
    setSettings(prev => ({
      ...prev,
      provider: e.target.value
    }));
  };

  const handleKeyChange = (e) => {
    const val = e.target.value;
    setSettings(prev => ({
      ...prev,
      apiKey: val
    }));
    localStorage.setItem('code_guardian_apikey', val);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} className="text-secondary" style={{ color: 'hsl(var(--secondary))' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Swarm Configuration</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Swarm Mode</span>
            <span className={`badge ${settings.provider === 'mock' ? 'badge-high' : 'badge-success'}`}>
              {settings.provider === 'mock' ? 'Simulation / Demo' : 'Live Swarm'}
            </span>
          </label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              className={`btn ${settings.provider === 'mock' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setSettings(prev => ({ ...prev, provider: 'mock' }))}
            >
              <Database size={16} /> Demo (No API Key)
            </button>
            <button 
              className={`btn ${settings.provider !== 'mock' ? 'btn-accent' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setSettings(prev => ({ ...prev, provider: 'gemini' }))}
            >
              <Globe size={16} /> Live LLM Swarm
            </button>
          </div>
        </div>

        {settings.provider !== 'mock' && (
          <>
            <div className="form-group">
              <label htmlFor="llm-provider">LLM Swarm Provider</label>
              <select 
                id="llm-provider"
                className="form-input" 
                value={settings.provider}
                onChange={handleProviderChange}
              >
                <option value="gemini">Google Gemini 1.5 Flash (Recommended)</option>
                <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                <option value="openai">OpenAI GPT-4o</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="api-key" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} />
                <span>API Key Credentials</span>
              </label>
              <input 
                id="api-key"
                type="password" 
                className="form-input" 
                placeholder="Enter your LLM provider API key..."
                value={settings.apiKey}
                onChange={handleKeyChange}
              />
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                Keys are stored only in your local browser workspace storage (`localStorage`) and never shared elsewhere.
              </p>
            </div>
          </>
        )}

        <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} style={{ color: 'hsl(var(--medium))' }} />
            Local Execution Sandbox
          </h4>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
            The backend execution sandbox runs code scripts locally using your computer's `node` and `python3` command interpreters. Runs are restricted to a max duration of 3 seconds.
          </p>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={onClose}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
