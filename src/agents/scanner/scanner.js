import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callLLM } from '../../shared_tools/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs the static analysis / vulnerability scanner agent.
 * @param {string} code Source code snippet
 * @param {string} description Known issue description (optional)
 * @param {object} settings Swarm settings (provider, apiKey, etc.)
 * @returns {Promise<{findings: Array<object>, rawResponse: string}>}
 */
export async function runScanner(code, description, settings) {
  const instructionsPath = path.join(__dirname, 'instructions.md');
  const systemInstruction = fs.readFileSync(instructionsPath, 'utf8');

  // Handle Mock/Demo mode
  if (settings.provider === 'mock' || !settings.apiKey) {
    return runMockScanner(code);
  }

  const prompt = `Code to Scan:
\`\`\`
${code}
\`\`\`

Known Issue Context:
${description || 'None provided.'}`;

  try {
    const rawResponse = await callLLM({
      systemInstruction,
      prompt,
      provider: settings.provider,
      apiKey: settings.apiKey,
      jsonMode: true
    });

    // Parse JSON safely
    const cleanJSON = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJSON);
    return {
      findings: result.findings || [],
      rawResponse
    };
  } catch (err) {
    console.error('Scanner Agent LLM call failed. Falling back to mock output.', err);
    return {
      ...runMockScanner(code),
      error: err.message
    };
  }
}

function runMockScanner(code) {
  const findings = [];

  // SQL Injection detection (JS Sqlite example)
  if (code.includes('sqlite3') && code.includes("'" + ' + req.query.')) {
    findings.push({
      id: 'SCAN-SQLI',
      title: 'SQL Injection via Parameter Concatenation',
      description: 'SQL queries constructed via string concatenation are susceptible to SQL Injection. Attackers can escape string delimiters and run arbitrary queries.',
      severity: 'critical',
      line: 8,
      category: 'security',
      owaspCategory: 'A03:2021-Injection',
      businessRisk: 'High risk of customer PII exposure and unauthorized administrative database access.'
    });
  }

  // OS Command Injection (Python example)
  if (code.includes('os.system') && code.includes('ping -c 1')) {
    findings.push({
      id: 'SCAN-CMDI',
      title: 'Remote OS Command Injection',
      description: 'User input is directly appended to a shell command runner (os.system). An attacker can append commands (e.g. "; rm -rf /") causing remote code execution.',
      severity: 'critical',
      line: 6,
      category: 'security',
      owaspCategory: 'A03:2021-Injection',
      businessRisk: 'Critical risk of full operating system takeover, host server compromise, and malware deployment.'
    });
  }

  // Path Traversal (JS fs example)
  if (code.includes('path.join') && code.includes('fs.readFile') && !code.includes('indexOf') && !code.includes('replace')) {
    findings.push({
      id: 'SCAN-PTRAV',
      title: 'Directory / Path Traversal',
      description: 'The filename parameter is joined directly using path.join without sanitization. Attackers can supply path traversal components (e.g., "../") to access restricted files.',
      severity: 'high',
      line: 6,
      category: 'security',
      owaspCategory: 'A01:2021-Broken Access Control',
      businessRisk: 'High risk of sensitive system file leakage, exposing backend server credentials or customer datasets.'
    });
  }

  // Generic bug fallback if no template matches
  if (findings.length === 0) {
    findings.push({
      id: 'SCAN-GEN',
      title: 'General Code Cleanliness Warning',
      description: 'No critical security vulnerabilities matched the mock patterns. Reviewing standard exception handling and parameter checks is advised.',
      severity: 'low',
      line: 1,
      category: 'style',
      owaspCategory: 'A04:2021-Insecure Design',
      businessRisk: 'Minor code styling issue; minimal immediate business impact.'
    });
  }

  return {
    findings,
    rawResponse: JSON.stringify({ findings }, null, 2)
  };
}
