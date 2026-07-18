import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callLLM } from '../../shared_tools/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs the Fixer Agent to propose a patch.
 * @param {string} originalCode Original source code
 * @param {Array<object>} findings Findings from the Scanner Agent
 * @param {string} reviewerFeedback Feedback from previous review rejection (if any)
 * @param {number} iteration Current iteration count (starts at 1)
 * @param {object} settings Swarm settings
 * @returns {Promise<{explanation: string, fixedCode: string, rawResponse: string}>}
 */
export async function runFixer(originalCode, findings, reviewerFeedback, iteration, settings) {
  const instructionsPath = path.join(__dirname, 'instructions.md');
  const systemInstruction = fs.readFileSync(instructionsPath, 'utf8');

  // Handle Mock/Demo mode
  if (settings.provider === 'mock' || !settings.apiKey) {
    return runMockFixer(originalCode, reviewerFeedback, iteration);
  }

  const prompt = `Original Code:
\`\`\`
${originalCode}
\`\`\`

Scanner Findings:
${JSON.stringify(findings, null, 2)}

Reviewer Rejection Feedback (if any):
${reviewerFeedback || 'None. This is the first iteration.'}

Current Swarm Iteration: ${iteration}

Please propose the corrected code.`;

  try {
    const rawResponse = await callLLM({
      systemInstruction,
      prompt,
      provider: settings.provider,
      apiKey: settings.apiKey,
      jsonMode: true
    });

    const cleanJSON = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJSON);
    return {
      explanation: result.explanation || '',
      fixedCode: result.fixedCode || originalCode,
      rawResponse
    };
  } catch (err) {
    console.error('Fixer Agent LLM call failed. Falling back to mock output.', err);
    return {
      ...runMockFixer(originalCode, reviewerFeedback, iteration),
      error: err.message
    };
  }
}

function runMockFixer(originalCode, reviewerFeedback, iteration) {
  // SQL Injection Case
  if (originalCode.includes('sqlite3') && originalCode.includes("'" + ' + req.query.')) {
    if (iteration === 1) {
      // First iteration: Naive regex escape fix (which the reviewer will reject)
      const naiveFixedCode = originalCode.replace(
        "'" + ' + req.query.username + ' + "'",
        "'" + ' + req.query.username.replace(/\'/g, "") + ' + "'"
      );
      return {
        explanation: 'Attempted to sanitize input by stripping single quotes from the query parameter.',
        fixedCode: naiveFixedCode,
        rawResponse: 'Mock Fixer Iteration 1'
      };
    } else {
      // Second iteration: Parameterized query fix
      const safeFixedCode = `const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
const db = new sqlite3.Database(':memory:');

app.get('/user', (req, res) => {
  let query = "SELECT * FROM users WHERE username = ?";
  db.all(query, [req.query.username], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});`;
      return {
        explanation: 'Replaced query concatenation with SQL placeholders (?) and parameterized parameters to prevent SQL injection.',
        fixedCode: safeFixedCode,
        rawResponse: 'Mock Fixer Iteration 2'
      };
    }
  }

  // OS Command Injection Case
  if (originalCode.includes('os.system') && originalCode.includes('ping -c 1')) {
    if (iteration === 1) {
      // First iteration: Naive sanitation (which the reviewer will reject)
      const naiveFixedCode = originalCode.replace(
        'command = "ping -c 1 " + host',
        '# Basic sanitization\n    clean_host = host.replace(";", "").replace("&", "")\n    command = "ping -c 1 " + clean_host'
      );
      return {
        explanation: 'Sanitized semicolons and ampersands from the host parameter before calling system command.',
        fixedCode: naiveFixedCode,
        rawResponse: 'Mock Fixer Iteration 1'
      };
    } else {
      // Second iteration: Secure subprocess implementation
      const safeFixedCode = `import subprocess
import sys

def ping_host(host):
    # Secure command execution using subprocess.run with arguments list
    result = subprocess.run(["ping", "-c", "1", host], capture_output=True, text=True)
    return result.returncode

if __name__ == "__main__":
    ping_host(sys.argv[1])`;
      return {
        explanation: 'Refactored os.system to subprocess.run using argument list syntax, preventing shell-injection vectors.',
        fixedCode: safeFixedCode,
        rawResponse: 'Mock Fixer Iteration 2'
      };
    }
  }

  // Path Traversal Case
  if (originalCode.includes('path.join') && originalCode.includes('fs.readFile')) {
    if (iteration === 1) {
      // First iteration: Naive check (rejected)
      const naiveFixedCode = originalCode.replace(
        "const filePath = path.join(__dirname, 'public', fileName);",
        "// Strip standard dot dots\n  const safeName = fileName.replace(/\\.\\./g, '');\n  const filePath = path.join(__dirname, 'public', safeName);"
      );
      return {
        explanation: 'Removed dot-dot (..) sequences from input path parameter.',
        fixedCode: naiveFixedCode,
        rawResponse: 'Mock Fixer Iteration 1'
      };
    } else {
      // Second iteration: Real safe traversal check
      const safeFixedCode = `const fs = require('fs');
const path = require('path');

function serveFile(fileName, res) {
  // Safe resolution checking that the target path is inside the public folder
  const safeName = path.normalize(fileName).replace(/^(\\.\\.(\\/|\\\\|$))+/, '');
  const filePath = path.join(__dirname, 'public', safeName);
  
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    return res.status(403).send('Forbidden');
  }
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Not found');
    res.send(data);
  });
}`;
      return {
        explanation: 'Used path.normalize, stripped leading parent directories, and verified that final resolved path starts with target root path.',
        fixedCode: safeFixedCode,
        rawResponse: 'Mock Fixer Iteration 2'
      };
    }
  }

  // Generic Mock Fallback
  return {
    explanation: 'Applied a generic code refactor to address scan issues.',
    fixedCode: originalCode + '\n// Fix applied by Code Guardian Fixer',
    rawResponse: 'Mock Fixer Generic'
  };
}
