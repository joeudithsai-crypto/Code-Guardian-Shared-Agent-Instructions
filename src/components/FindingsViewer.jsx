import React from 'react';
import { Bug, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';

export default function FindingsViewer({ findings }) {
  if (!findings || findings.length === 0) return null;

  const getSeverityBadge = (sev) => {
    const cleanSev = sev.toLowerCase();
    switch (cleanSev) {
      case 'critical': return <span className="badge badge-critical">Critical</span>;
      case 'high': return <span className="badge badge-high">High</span>;
      case 'medium': return <span className="badge badge-medium">Medium</span>;
      default: return <span className="badge badge-low">Low</span>;
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat.toLowerCase()) {
      case 'security': return <ShieldAlert size={16} style={{ color: 'hsl(var(--critical))' }} />;
      case 'bug': return <Bug size={16} style={{ color: 'hsl(var(--high))' }} />;
      case 'performance': return <Zap size={16} style={{ color: 'hsl(var(--medium))' }} />;
      default: return <AlertTriangle size={16} style={{ color: 'hsl(var(--low))' }} />;
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '8px' }}>
        Scanner Diagnostic Findings ({findings.length})
      </h2>
      <div className="findings-container">
        {findings.map((f, idx) => (
          <div key={f.id || idx} className="finding-card">
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ marginTop: '2px' }}>
                {getCategoryIcon(f.category || 'bug')}
              </div>
              <div>
                <h3 className="finding-title">{f.title}</h3>
                <p className="finding-desc">{f.description}</p>
                <div className="finding-meta">
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Line: {f.line}</span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'hsl(var(--border))' }}></span>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>Category: {f.category}</span>
                </div>
              </div>
            </div>
            <div>
              {getSeverityBadge(f.severity || 'medium')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
