import React from 'react';
import { FileCode, AlertCircle, FilePlus, RefreshCw } from 'lucide-react';

const SAMPLES = {
  sqli: {
    filename: 'user_search.js',
    issue: 'A junior developer noticed SQL queries behave weirdly when searching usernames containing apostrophes.',
    code: `const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
const db = new sqlite3.Database(':memory:');

app.get('/user', (req, res) => {
  // Vulnerable: raw parameter query string concatenation
  let query = "SELECT * FROM users WHERE username = '" + req.query.username + "'";
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});`
  },
  cmdi: {
    filename: 'ping_service.py',
    issue: 'We need to secure a ping dashboard. Users can type any input and it gets executed by the server.',
    code: `import os
import sys

def ping_host(host):
    # Unsafe command execution allowing shell commands to append
    command = "ping -c 1 " + host
    return os.system(command)

if __name__ == "__main__":
    ping_host(sys.argv[1])`
  },
  path_traversal: {
    filename: 'file_server.js',
    issue: 'Static file server allowing users to request local templates. Security scan flagged path breakout.',
    code: `const fs = require('fs');
const path = require('path');

function serveFile(fileName, res) {
  // Unsafe direct path joining allowing traversal (e.g. filename = '../../etc/passwd')
  const filePath = path.join(__dirname, 'public', fileName);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Not found');
    res.send(data);
  });
}`
  }
};

export default function CodeInput({ code, setCode, filename, setFilename, description, setDescription, isScanning, onStartScan }) {
  const handleLoadSample = (key) => {
    const sample = SAMPLES[key];
    setCode(sample.code);
    setFilename(sample.filename);
    setDescription(sample.issue);
  };

  const lineCount = code.split('\n').length;
  const linesArr = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={18} className="text-secondary" style={{ color: 'hsl(var(--secondary))' }} />
          Input Source Code
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="tab-button" onClick={() => handleLoadSample('sqli')}>SQL Injection (JS)</button>
          <button className="tab-button" onClick={() => handleLoadSample('cmdi')}>Command Injection (PY)</button>
          <button className="tab-button" onClick={() => handleLoadSample('path_traversal')}>Path Traversal (JS)</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="filename-input">Filename</label>
          <input 
            id="filename-input"
            type="text" 
            className="form-input" 
            placeholder="e.g. auth_service.js" 
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            disabled={isScanning}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="issue-desc">Known Issue Description (Optional)</label>
          <input 
            id="issue-desc"
            type="text" 
            className="form-input" 
            placeholder="e.g. SQL Injection warning on user search..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isScanning}
          />
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-header">
          <div className="editor-title">
            <FilePlus size={14} />
            <span>{filename || 'untitled_snippet.js'}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Active Editor</span>
          </div>
        </div>
        <div className="editor-body">
          <div className="line-numbers">
            {linesArr.map(n => <div key={n}>{n}</div>)}
          </div>
          <textarea
            aria-label="Code Editor"
            className="code-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your code here...&#10;// Select one of the templates above to test a security vulnerability."
            disabled={isScanning}
            spellCheck="false"
          />
          {isScanning && <div className="pulse-overlay"></div>}
        </div>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={onStartScan} 
        disabled={isScanning || !code.trim() || !filename.trim()}
        style={{ width: '100%', height: '48px', fontSize: '15px' }}
      >
        <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} style={{ animation: isScanning ? 'spin 1.5s linear infinite' : 'none' }} />
        {isScanning ? 'Swarm Remediation Sweep Running...' : 'Deploy Secure Swarm Audit'}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
