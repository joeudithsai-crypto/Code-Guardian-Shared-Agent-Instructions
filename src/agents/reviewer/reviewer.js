import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callLLM } from '../../shared_tools/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs the Reviewer Agent to validate a patch.
 * @param {string} originalCode Original source code
 * @param {string} fixedCode Proposed fixed code
 * @param {Array<object>} findings Findings from the Scanner Agent
 * @param {number} iteration Current iteration count
 * @param {object} settings Swarm settings
 * @returns {Promise<{approved: boolean, feedback: string, report: string, rawResponse: string}>}
 */
export async function runReviewer(originalCode, fixedCode, findings, iteration, settings) {
  const instructionsPath = path.join(__dirname, 'instructions.md');
  const systemInstruction = fs.readFileSync(instructionsPath, 'utf8');

  // Handle Mock/Demo mode
  if (settings.provider === 'mock' || !settings.apiKey) {
    return runMockReviewer(originalCode, fixedCode, iteration);
  }

  const prompt = `Original Code:
\`\`\`
${originalCode}
\`\`\`

Proposed Fixed Code:
\`\`\`
${fixedCode}
\`\`\`

Scanner Findings:
${JSON.stringify(findings, null, 2)}

Current Swarm Iteration: ${iteration}

Please evaluate the safety and correctness of the patch.`;

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
      approved: !!result.approved,
      feedback: result.feedback || '',
      report: result.report || '',
      rawResponse
    };
  } catch (err) {
    console.error('Reviewer Agent LLM call failed. Falling back to mock output.', err);
    return {
      ...runMockReviewer(originalCode, fixedCode, iteration),
      error: err.message
    };
  }
}

function runMockReviewer(originalCode, fixedCode, iteration) {
  // SQL Injection Case
  if (originalCode.includes('sqlite3')) {
    if (iteration === 1) {
      return {
        approved: false,
        feedback: 'The fix uses manual string escaping via regex. This is prone to bypasses, does not support database-specific dialects, and is generally insecure. Please use standard SQL parameterization (?) instead of string concatenation.',
        report: '',
        rawResponse: 'Mock Reviewer Rejection'
      };
    } else {
      return {
        approved: true,
        feedback: '',
        report: `## Bug Description
The original code concatenates raw user inputs directly into an SQL command string. An attacker could exploit this SQL injection vulnerability by providing a username like \`admin' OR '1'='1\`, bypass authentication, or run destructive database scripts.

## Fix Explanation
We replaced the insecure string concatenation with safe parameterized query placeholders (\`?\`). The SQLite query is now pre-compiled, and the database engine treats input parameters strictly as data literals rather than executable SQL directives.

## Impact/Risks Mitigated
- **Mitigated SQL Injection (CWE-89)**: Prevents attackers from retrieving unauthorized records or deleting database tables.
- **Improved Performance**: Pre-compiled statement patterns can be cached by the database driver.

## Suggested Tests
1. **Malicious Payload Input Test**: Verify that queries with quotes (e.g., \`test' OR 1=1\`) are treated literally and do not return other user records.
2. **Standard Execution**: Ensure valid queries (e.g., \`joeudith\`) fetch the user object normally.`,
        rawResponse: 'Mock Reviewer Approval'
      };
    }
  }

  // OS Command Injection Case
  if (originalCode.includes('os.system')) {
    if (iteration === 1) {
      return {
        approved: false,
        feedback: 'The sanitization filter is insufficient. Command injection can still be bypassed using alternate shell metacharacters like backticks (\`\`), subshell expansion (\$(...)), or newlines (\\n). Please use the subprocess.run API with arguments passed as an array to bypass the shell command parsing entirely.',
        report: '',
        rawResponse: 'Mock Reviewer Rejection'
      };
    } else {
      return {
        approved: true,
        feedback: '',
        report: `## Bug Description
The code passes a shell string built from unescaped user inputs directly to \`os.system\`. By providing a string containing command separators (e.g. \`127.0.0.1; cat /etc/passwd\`), an attacker can execute arbitrary shell commands with the application's local user permissions.

## Fix Explanation
The fix refactors the system runner to use \`subprocess.run\` with shell execution disabled (default). The ping command and target host are passed as separate elements in a arguments list array. The operating system handles argument splitting directly rather than relying on a shell shell interpreter (like bash/zsh), rendering shell separators harmless.

## Impact/Risks Mitigated
- **Mitigated Remote Code Execution (RCE)** (CWE-78): Prevents attackers from injecting shell pipelines or downloading malware onto the server.

## Suggested Tests
1. **Command Injection Test**: Test the function with a target value of \`127.0.0.1; ls -la\`. Verify that the ping runs but the shell command \`ls -la\` is NOT executed.
2. **Normal Execution**: Verify that a normal IP address executes a standard ping request correctly.`,
        rawResponse: 'Mock Reviewer Approval'
      };
    }
  }

  // Path Traversal Case
  if (originalCode.includes('path.join') && originalCode.includes('fs.readFile')) {
    if (iteration === 1) {
      return {
        approved: false,
        feedback: "Manual replacement of '..' can be bypassed using nested sequences like '....//'. Please use path.normalize or verify that the fully resolved path begins with the allowed root directory.",
        report: '',
        rawResponse: 'Mock Reviewer Rejection'
      };
    } else {
      return {
        approved: true,
        feedback: '',
        report: `## Bug Description
The code joins an untrusted parameter onto a folder path using \`path.join\`. An attacker could supply path traversal elements (\`../../\`) to breakout of the intended folder directory and retrieve sensitive system configuration files.

## Fix Explanation
The fix normalizes the path using \`path.normalize\` and applies a check using \`startsWith\`. It verifies that the absolute resolved path starts with the prefix of the allowed public directory, safely throwing a 403 error for any traversal attempts.

## Impact/Risks Mitigated
- **Mitigated Directory Traversal** (CWE-22): Prevents reading arbitrary files on the local filesystem.

## Suggested Tests
1. **Traversal Test**: Attempt to fetch a file using \`../../etc/passwd\` or \`..\\..\\etc\\passwd\`. Ensure it returns a 403 Forbidden.
2. **Success Test**: Verify reading a valid file in the folder returns the expected text content.`,
        rawResponse: 'Mock Reviewer Approval'
      };
    }
  }

  // Generic Mock Approval
  return {
    approved: true,
    feedback: '',
    report: `## Bug Description
A code security issue was detected by the static scan.

## Fix Explanation
The proposed fix resolves the identified issue by implementing safer handling APIs.

## Impact/Risks Mitigated
- General security enhancement.

## Suggested Tests
1. Verify the module compiles and runs.`,
    rawResponse: 'Mock Reviewer Generic'
  };
}
