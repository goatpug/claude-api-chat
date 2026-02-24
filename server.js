require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3000;
const HISTORY_FILE = path.join(__dirname, 'history.json');
const SYSTEM_PROMPT_FILE = path.join(__dirname, 'system-prompt.txt');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load history from disk, or return empty array
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Save history to disk
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

// Load system prompt from disk
function loadSystemPrompt() {
  if (!fs.existsSync(SYSTEM_PROMPT_FILE)) return '';
  return fs.readFileSync(SYSTEM_PROMPT_FILE, 'utf8');
}

// GET /api/history
app.get('/api/history', (req, res) => {
  res.json(loadHistory());
});

// DELETE /api/history
app.delete('/api/history', (req, res) => {
  saveHistory([]);
  res.json({ ok: true });
});

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const history = loadHistory();
  history.push({ role: 'user', content: message });

  try {
    const systemPrompt = loadSystemPrompt();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: history,
    });

    const assistantMessage = response.content[0].text;
    history.push({ role: 'assistant', content: assistantMessage });
    saveHistory(history);

    res.json({ response: assistantMessage });
  } catch (err) {
    // Remove the user message we optimistically added if the API call failed
    history.pop();
    saveHistory(history);
    console.error('Anthropic API error:', err.message);
    res.status(500).json({ error: err.message || 'API call failed' });
  }
});

// GET /api/system-prompt
app.get('/api/system-prompt', (req, res) => {
  res.json({ content: loadSystemPrompt() });
});

// PUT /api/system-prompt
app.put('/api/system-prompt', (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'content is required' });
  }
  fs.writeFileSync(SYSTEM_PROMPT_FILE, content, 'utf8');
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Spicy Chat running at http://localhost:${PORT}`);
  console.log(`Access from other devices at http://192.168.0.21:${PORT}`);
});
