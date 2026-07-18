import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SANDBOX_DIR = path.join(__dirname, '../../sandbox_run');

// Ensure sandbox directory exists
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

/**
 * Run code in a safe local child process.
 * @param {string} code Code content to execute
 * @param {string} extension File extension (e.g., '.js', '.py')
 * @returns {Promise<{success: boolean, stdout: string, stderr: string, error?: string}>}
 */
export function runInSandbox(code, extension) {
  return new Promise((resolve) => {
    const filename = `temp_run_${Date.now()}${extension}`;
    const filePath = path.join(SANDBOX_DIR, filename);

    // Write file to disk
    fs.writeFileSync(filePath, code, 'utf-8');

    let command = '';
    if (extension === '.js') {
      command = `node "${filePath}"`;
    } else if (extension === '.py') {
      command = `python3 "${filePath}"`;
    } else {
      cleanup(filePath);
      return resolve({
        success: false,
        stdout: '',
        stderr: '',
        error: `Unsupported sandbox language extension: ${extension}`
      });
    }

    const child = exec(command, { timeout: 3000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      cleanup(filePath);

      if (error) {
        if (error.killed) {
          return resolve({
            success: false,
            stdout,
            stderr: stderr + '\nExecution timed out (3s max limit).',
            error: 'TIMEOUT'
          });
        }
        return resolve({
          success: false,
          stdout,
          stderr: stderr || error.message,
          error: error.message
        });
      }

      resolve({
        success: true,
        stdout,
        stderr
      });
    });
  });
}

function cleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error('Failed to clean up sandbox file:', e);
  }
}
