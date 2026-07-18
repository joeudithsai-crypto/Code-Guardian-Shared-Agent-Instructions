import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, Eye, Wrench, Play, FileCheck } from 'lucide-react';

export default function SwarmVisualizer({ logs, isScanning }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Determine active agent
  const activeAgent = logs.length > 0 && isScanning && logs[logs.length - 1]
    ? logs[logs.length - 1].agent 
    : isScanning ? 'Orchestrator' : null;

  const getAgentGlow = (agent) => {
    if (activeAgent !== agent) return 'rgba(255, 255, 255, 0.05)';
    switch (agent) {
      case 'Orchestrator': return 'rgba(139, 92, 246, 0.25)';
      case 'Scanner': return 'rgba(244, 63, 94, 0.25)';
      case 'Fixer': return 'rgba(6, 182, 212, 0.25)';
      case 'Sandbox': return 'rgba(234, 179, 8, 0.25)';
      case 'Reviewer': return 'rgba(16, 185, 129, 0.25)';
      default: return 'transparent';
    }
  };

  const getAgentBorder = (agent) => {
    if (activeAgent !== agent) return '1px solid hsl(var(--border))';
    switch (agent) {
      case 'Orchestrator': return '2px solid hsl(var(--primary))';
      case 'Scanner': return '2px solid hsl(var(--critical))';
      case 'Fixer': return '2px solid hsl(var(--secondary))';
      case 'Sandbox': return '2px solid hsl(var(--medium))';
      case 'Reviewer': return '2px solid hsl(var(--success))';
      default: return '1px solid hsl(var(--border))';
    }
  };

  return (
    <div className="glass-card visualizer-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Terminal size={18} className="text-secondary" style={{ color: 'hsl(var(--secondary))' }} />
        Agent Swarm Orchestration Visualizer
      </h2>

      {/* Swarm Graph */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '20px 10px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid hsl(var(--border))',
        position: 'relative',
        minHeight: '120px'
      }}>
        {/* Node: Orchestrator */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: getAgentGlow('Orchestrator'),
          border: getAgentBorder('Orchestrator'),
          transition: 'all 0.3s ease',
          width: '90px'
        }}>
          <Shield size={20} style={{ color: activeAgent === 'Orchestrator' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', textAlign: 'center' }}>Orchestrator</span>
        </div>

        {/* Arrow */}
        <div style={{ height: '2px', background: 'hsl(var(--border))', flexGrow: 1, margin: '0 4px', maxWidth: '30px' }} />

        {/* Node: Scanner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: getAgentGlow('Scanner'),
          border: getAgentBorder('Scanner'),
          transition: 'all 0.3s ease',
          width: '90px'
        }}>
          <Eye size={20} style={{ color: activeAgent === 'Scanner' ? 'hsl(var(--critical))' : 'hsl(var(--text-muted))' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', textAlign: 'center' }}>Scanner</span>
        </div>

        {/* Arrow */}
        <div style={{ height: '2px', background: 'hsl(var(--border))', flexGrow: 1, margin: '0 4px', maxWidth: '30px' }} />

        {/* Node: Fixer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: getAgentGlow('Fixer'),
          border: getAgentBorder('Fixer'),
          transition: 'all 0.3s ease',
          width: '90px'
        }}>
          <Wrench size={20} style={{ color: activeAgent === 'Fixer' ? 'hsl(var(--secondary))' : 'hsl(var(--text-muted))' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', textAlign: 'center' }}>Fixer</span>
        </div>

        {/* Arrow */}
        <div style={{ height: '2px', background: 'hsl(var(--border))', flexGrow: 1, margin: '0 4px', maxWidth: '30px' }} />

        {/* Node: Sandbox */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: getAgentGlow('Sandbox'),
          border: getAgentBorder('Sandbox'),
          transition: 'all 0.3s ease',
          width: '90px'
        }}>
          <Play size={20} style={{ color: activeAgent === 'Sandbox' ? 'hsl(var(--medium))' : 'hsl(var(--text-muted))' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', textAlign: 'center' }}>Sandbox</span>
        </div>

        {/* Arrow */}
        <div style={{ height: '2px', background: 'hsl(var(--border))', flexGrow: 1, margin: '0 4px', maxWidth: '30px' }} />

        {/* Node: Reviewer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: getAgentGlow('Reviewer'),
          border: getAgentBorder('Reviewer'),
          transition: 'all 0.3s ease',
          width: '90px'
        }}>
          <FileCheck size={20} style={{ color: activeAgent === 'Reviewer' ? 'hsl(var(--success))' : 'hsl(var(--text-muted))' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', textAlign: 'center' }}>Reviewer</span>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="swarm-log-box">
        {logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--text-muted))' }}>
            <Terminal size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <span>Idle. Start a securtity audit sweep to spin up the agent swarm.</span>
          </div>
        ) : (
          <>
            {logs.map((log, idx) => {
              if (!log) return null;
              const agentClass = log.agent ? log.agent.toLowerCase() : '';
              return (
                <div key={log.id || idx} className={`swarm-log-entry ${agentClass}`}>
                  <div className="swarm-log-meta">
                    <span className={`agent-tag ${agentClass}`}>{log.agent || 'System'}</span>
                    <span className="swarm-log-time">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                  </div>
                  <div className="swarm-log-msg">{log.message || ''}</div>
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </>
        )}
      </div>
    </div>
  );
}
