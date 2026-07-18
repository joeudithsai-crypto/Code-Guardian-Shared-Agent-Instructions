import React, { useState, useEffect } from 'react';
import { Shield, Settings, AlertTriangle, ShieldCheck } from 'lucide-react';
import CodeInput from './components/CodeInput';
import SwarmVisualizer from './components/SwarmVisualizer';
import FindingsViewer from './components/FindingsViewer';
import DiffViewer from './components/DiffViewer';
import SummaryViewer from './components/SummaryViewer';
import ConfigPanel from './components/ConfigPanel';

export default function App() {
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('user_search.js');
  const [description, setDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [findings, setFindings] = useState([]);
  const [diff, setDiff] = useState('');
  const [report, setReport] = useState('');
  
  const [settings, setSettings] = useState({
    provider: 'mock',
    apiKey: ''
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Restore API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('code_guardian_apikey');
    if (savedKey) {
      setSettings(prev => ({
        ...prev,
        apiKey: savedKey,
        provider: 'gemini' // Default to live if key exists
      }));
    }
  }, []);

  const handleStartScan = async () => {
    setIsScanning(true);
    setLogs([]);
    setFindings([]);
    setDiff('');
    setReport('');

    try {
      // Hit backend API
      const response = await fetch('http://localhost:3001/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description,
          filename,
          settings
        })
      });

      if (!response.ok) {
        throw new Error('Backend failed to process scan request.');
      }

      const result = await response.json();
      
      // Animate the logs streaming in sequentially for beautiful visual effect
      animateLogs(result.logs, () => {
        setFindings(result.findings || []);
        setDiff(result.diff || '');
        setReport(result.report || '');
        setIsScanning(false);
      });

    } catch (e) {
      console.error(e);
      // Fallback local error log
      setLogs([{
        id: 'err-1',
        timestamp: new Date().toISOString(),
        agent: 'Orchestrator',
        message: `System Error: Failed to connect to Code Guardian backend server. Ensure backend is running.\nDetails: ${e.message}`
      }]);
      setIsScanning(false);
    }
  };

  const animateLogs = (rawLogs, onComplete) => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < rawLogs.length) {
        setLogs(prev => [...prev, rawLogs[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 1200); // 1.2 seconds delay per step makes it readable and look alive
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <Shield size={28} style={{ color: 'hsl(var(--primary))' }} />
          <div>
            <h1>Code Guardian</h1>
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Dev-Tool Security Agent Swarm</p>
          </div>
          <span>v1.2.0</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border))' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: settings.provider === 'mock' ? 'hsl(var(--high))' : 'hsl(var(--success))' }}></span>
            <span style={{ color: 'hsl(var(--text-muted))' }}>
              Mode: <strong>{settings.provider === 'mock' ? 'Simulation (Demo)' : `Live (${settings.provider.toUpperCase()})`}</strong>
            </span>
          </div>

          <button className="btn btn-secondary" onClick={() => setIsConfigOpen(true)}>
            <Settings size={16} />
            Configure
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">
        {/* Left Side: Code Editor Input & Findings List */}
        <div className="swarm-grid-panels">
          <CodeInput 
            code={code}
            setCode={setCode}
            filename={filename}
            setFilename={setFilename}
            description={description}
            setDescription={setDescription}
            isScanning={isScanning}
            onStartScan={handleStartScan}
          />
          <FindingsViewer findings={findings} />
        </div>

        {/* Right Side: Swarm Visualizer, Diffs & Report summaries */}
        <div className="swarm-grid-panels">
          <SwarmVisualizer logs={logs} isScanning={isScanning} />
          
          {diff && (
            <DiffViewer 
              diff={diff} 
              filename={filename} 
            />
          )}

          {report && (
            <SummaryViewer report={report} />
          )}
        </div>
      </main>

      {/* Config Dialog */}
      <ConfigPanel 
        settings={settings}
        setSettings={setSettings}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
}
