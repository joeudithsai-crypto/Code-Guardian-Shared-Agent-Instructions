import React from 'react';
import { ClipboardCheck } from 'lucide-react';

export default function SummaryViewer({ report }) {
  if (!report) return null;

  // Simple, robust markdown line-by-line parser to avoid dependency loads
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let keyIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={keyIdx++} style={{ marginTop: '20px', marginBottom: '8px', fontSize: '15px', color: 'hsl(var(--secondary))', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={keyIdx++} style={{ marginTop: '14px', marginBottom: '6px', fontSize: '13.5px', color: 'hsl(var(--text-main))', fontWeight: '600' }}>
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <ul key={keyIdx++} style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>
              {parseInlineCode(line.substring(2))}
            </li>
          </ul>
        );
      } else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <ol key={keyIdx++} style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>
              {parseInlineCode(line.replace(/^\d+\.\s/, ''))}
            </li>
          </ol>
        );
      } else {
        elements.push(
          <p key={keyIdx++} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px', lineHeight: '1.6' }}>
            {parseInlineCode(line)}
          </p>
        );
      }
    }

    return elements;
  };

  // Helper to parse inline `code` blocks
  const parseInlineCode = (text) => {
    const parts = text.split('`');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <code key={index} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '2px 5px',
            borderRadius: '4px',
            color: '#a855f7'
          }}>
            {part}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ClipboardCheck size={18} className="text-secondary" style={{ color: 'hsl(var(--success))' }} />
        Reviewer Audit Report & Verdict
      </h2>
      <div className="markdown-report">
        {renderMarkdown(report)}
      </div>
    </div>
  );
}
