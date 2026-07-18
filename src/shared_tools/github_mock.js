/**
 * Mock tool simulating GitHub and Linear integrations (e.g. via Composio).
 */

/**
 * Creates a simulated GitHub Pull Request.
 * @param {object} params
 * @param {string} params.filename
 * @param {string} params.patch
 * @param {string} params.title
 * @param {string} params.body
 * @returns {Promise<{success: boolean, prUrl: string, message: string}>}
 */
export async function createPullRequest({ filename, patch, title, body }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const prNumber = Math.floor(Math.random() * 100) + 1;
      resolve({
        success: true,
        prUrl: `https://github.com/code-guardian-swarm/sandbox-repo/pull/${prNumber}`,
        message: `Successfully created Pull Request #${prNumber} on code-guardian-swarm/sandbox-repo`
      });
    }, 1500);
  });
}

/**
 * Creates a simulated Linear issue.
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @returns {Promise<{success: boolean, issueUrl: string, message: string}>}
 */
export async function createLinearIssue({ title, description }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const issueId = `SEC-${Math.floor(Math.random() * 900) + 100}`;
      resolve({
        success: true,
        issueUrl: `https://linear.app/code-guardian/issue/${issueId}`,
        message: `Successfully opened Linear Ticket: ${issueId}`
      });
    }, 1200);
  });
}
