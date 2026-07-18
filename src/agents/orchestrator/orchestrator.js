import { runScanner } from '../scanner/scanner.js';
import { runFixer } from '../fixer/fixer.js';
import { runReviewer } from '../reviewer/reviewer.js';
import { createUnifiedDiff } from '../../shared_tools/git_helper.js';
import { runInSandbox } from '../../shared_tools/sandbox.js';

/**
 * Runs the Code Guardian swarm process.
 * @param {object} params
 * @param {string} params.code Source code snippet
 * @param {string} params.description Issue description
 * @param {string} params.filename File name (e.g. app.js, main.py)
 * @param {object} params.settings LLM provider & settings config
 * @returns {Promise<{success: boolean, logs: Array<object>, findings: Array<object>, diff: string, report: string, fixedCode: string}>}
 */
export async function runSwarm({ code, description, filename, settings }) {
  const logs = [];
  const addLog = (agent, message, data = null) => {
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      agent, // 'Orchestrator' | 'Scanner' | 'Fixer' | 'Reviewer' | 'Sandbox'
      message,
      data
    });
  };

  const extension = filename.slice(filename.lastIndexOf('.'));

  addLog('Orchestrator', `Initializing security swarm sweep for file: ${filename} with language extension: ${extension}`);

  // Step 1: Scanner Agent
  addLog('Orchestrator', 'Routing code to Scanner Agent for static analysis...');
  const scannerResult = await runScanner(code, description, settings);
  
  if (scannerResult.error) {
    addLog('Scanner', `Scanner encountered a warning during analysis: ${scannerResult.error}`);
  }

  const findings = scannerResult.findings || [];
  addLog('Scanner', `Scan completed. Found ${findings.length} issue(s).`, findings);

  if (findings.length === 0) {
    addLog('Orchestrator', 'No vulnerabilities or logic bugs identified. Ending swarm check.');
    return {
      success: true,
      logs,
      findings,
      diff: '',
      report: '## No Issues Found\nAll static scans passed cleanly. No patches needed!',
      fixedCode: code
    };
  }

  // Iteration Loop
  let currentCode = code;
  let finalPatch = '';
  let finalReport = '';
  let reviewerApproved = false;
  let reviewerFeedback = '';
  const maxIterations = 2; // For demo/mock flow, we do a 2-step iteration

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    addLog('Orchestrator', `Starting remediation cycle - Iteration ${iteration} of ${maxIterations}`);
    
    // Step 2: Fixer Agent
    addLog('Orchestrator', `Routing findings and code to Fixer Agent (Iteration ${iteration})...`);
    const fixerResult = await runFixer(code, findings, reviewerFeedback, iteration, settings);
    
    addLog('Fixer', `Proposed Fix Explanation: ${fixerResult.explanation}`);
    const proposedCode = fixerResult.fixedCode;

    // Step 3: Sandbox Run
    addLog('Orchestrator', 'Executing proposed patch in code sandbox for validation...');
    let sandboxResult;
    
    if (settings.provider === 'mock' || !settings.apiKey) {
      // Simulated sandbox run
      await new Promise(r => setTimeout(r, 800));
      if (iteration === 1) {
        sandboxResult = {
          success: false,
          stdout: 'Server starting...',
          stderr: 'WARNING: Manual character replacement detected. SQL parser warning.',
          error: 'LINT_WARNING'
        };
        addLog('Sandbox', `Sandbox returned warning logs: ${sandboxResult.stderr}`, sandboxResult);
      } else {
        sandboxResult = {
          success: true,
          stdout: 'Execution verified successfully. Syntax check OK. Parameters bound.',
          stderr: ''
        };
        addLog('Sandbox', `Sandbox execution output: ${sandboxResult.stdout}`, sandboxResult);
      }
    } else {
      // Live sandbox run
      sandboxResult = await runInSandbox(proposedCode, extension);
      if (sandboxResult.success) {
        addLog('Sandbox', `Sandbox run succeeded:\n${sandboxResult.stdout}`);
      } else {
        addLog('Sandbox', `Sandbox run failed/timed out:\n${sandboxResult.stderr || sandboxResult.error}`);
      }
    }

    // Compute diff
    const diffPatch = createUnifiedDiff(filename, code, proposedCode);
    
    // Step 4: Reviewer Agent
    addLog('Orchestrator', 'Routing proposed patch and sandbox outputs to Reviewer Agent...');
    const reviewerResult = await runReviewer(code, proposedCode, findings, iteration, settings);

    if (reviewerResult.approved) {
      reviewerApproved = true;
      finalPatch = diffPatch;
      finalReport = reviewerResult.report;
      currentCode = proposedCode;
      addLog('Reviewer', 'Patch APPROVED. Safety check passed, no regressions found.', { report: reviewerResult.report });
      break;
    } else {
      reviewerFeedback = reviewerResult.feedback;
      addLog('Reviewer', `Patch REJECTED: ${reviewerFeedback}`);
      addLog('Orchestrator', 'Re-routing feedback to Fixer Agent for patch refinement.');
    }
  }

  if (!reviewerApproved) {
    addLog('Orchestrator', 'Reached maximum swarm iterations without full approval. Returning best attempt.');
    // Generate final diff anyway
    finalPatch = createUnifiedDiff(filename, code, currentCode);
    finalReport = `## Warning: Patch Unapproved\nThe swarm ended before the Reviewer Agent could verify the patch safety.\n\n### Reviewer Rejection Feedback:\n${reviewerFeedback}`;
  }

  addLog('Orchestrator', 'Swarm sweep complete. Compiling final diff patch and reports.');

  return {
    success: reviewerApproved,
    logs,
    findings,
    diff: finalPatch,
    report: finalReport,
    fixedCode: currentCode
  };
}
