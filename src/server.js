import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runSwarm } from './agents/orchestrator/orchestrator.js';
import { runInSandbox } from './shared_tools/sandbox.js';
import { createPullRequest, createLinearIssue } from './shared_tools/github_mock.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Code Guardian Swarm Backend' });
});

// Run security swarm scan
app.post('/api/scan', async (req, res) => {
  const { code, description, filename, settings } = req.body;

  if (!code || !filename) {
    return res.status(400).json({ error: 'Code content and filename are required.' });
  }

  try {
    const result = await runSwarm({
      code,
      description,
      filename,
      settings: settings || { provider: 'mock' }
    });
    res.json(result);
  } catch (error) {
    console.error('Swarm process failed:', error);
    res.status(500).json({ error: 'Swarm process execution failed.', details: error.message });
  }
});

// Execute code in sandbox directly
app.post('/api/sandbox/execute', async (req, res) => {
  const { code, extension } = req.body;

  if (!code || !extension) {
    return res.status(400).json({ error: 'Code content and extension are required.' });
  }

  try {
    const result = await runInSandbox(code, extension);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Sandbox execution failed.', details: error.message });
  }
});

// Create Pull Request (Composio Mock)
app.post('/api/github/pr', async (req, res) => {
  const { filename, patch, title, body } = req.body;

  try {
    const result = await createPullRequest({ filename, patch, title, body });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'PR creation failed.', details: error.message });
  }
});

// Create Linear Issue (Linear Mock)
app.post('/api/linear/issue', async (req, res) => {
  const { title, description } = req.body;

  try {
    const result = await createLinearIssue({ title, description });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Linear issue creation failed.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Code Guardian Backend running on port ${PORT}`);
});
