require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3000;
const HISTORY_FILE = path.join(__dirname, 'history.json');
const SYSTEM_PROMPT_FILE = path.join(__dirname, 'system-prompt.txt');
const CHATS_DIR = path.join(__dirname, 'chats');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

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

// Convert stored history to API-ready messages (resolves image_ref → base64 image blocks)
function historyToApiMessages(history) {
  return history.map(msg => {
    if (typeof msg.content === 'string') return msg;
    const content = msg.content.map(block => {
      if (block.type !== 'image_ref') return block;
      const filePath = path.join(UPLOADS_DIR, block.filename);
      if (!fs.existsSync(filePath)) return { type: 'text', text: '[image unavailable]' };
      const data = fs.readFileSync(filePath).toString('base64');
      return { type: 'image', source: { type: 'base64', media_type: block.mediaType, data } };
    });
    return { role: msg.role, content };
  });
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
  const { message = '', images } = req.body;
  const hasImages = images && images.length > 0;
  if (!message.trim() && !hasImages) {
    return res.status(400).json({ error: 'message or images required' });
  }

  // Build user message content
  let userContent;
  if (hasImages) {
    userContent = [];
    for (const img of images) {
      const ext = (img.mediaType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), Buffer.from(img.data, 'base64'));
      userContent.push({ type: 'image_ref', filename, mediaType: img.mediaType });
    }
    if (message.trim()) userContent.push({ type: 'text', text: message });
  } else {
    userContent = message;
  }

  const history = loadHistory();
  history.push({ role: 'user', content: userContent });

  try {
    const systemPrompt = loadSystemPrompt();
    const response = await client.messages.create({
      model: process.env.MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: historyToApiMessages(history),
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

// GET /api/chats — list saved chats, newest first
app.get('/api/chats', (req, res) => {
  const files = fs.readdirSync(CHATS_DIR).filter(f => f.endsWith('.json'));
  const chats = files.map(file => {
    const id = file.replace('.json', '');
    try {
      const messages = JSON.parse(fs.readFileSync(path.join(CHATS_DIR, file), 'utf8'));
      const firstUser = messages.find(m => m.role === 'user');
      let preview = '(empty)';
      if (firstUser) {
        if (typeof firstUser.content === 'string') {
          preview = firstUser.content.slice(0, 80).replace(/\n/g, ' ');
        } else {
          const textBlock = firstUser.content.find(b => b.type === 'text');
          const hasImage = firstUser.content.some(b => b.type === 'image_ref');
          preview = (hasImage ? '📷 ' : '') + (textBlock ? textBlock.text.slice(0, 80).replace(/\n/g, ' ') : '(image)');
        }
      }
      return { id, messageCount: messages.length, preview };
    } catch {
      return { id, messageCount: 0, preview: '(unreadable)' };
    }
  });
  // Newest first (filenames are timestamps so lexicographic sort works)
  chats.sort((a, b) => b.id.localeCompare(a.id));
  res.json(chats);
});

// POST /api/chats — save current history as a new chat file
app.post('/api/chats', (req, res) => {
  const history = loadHistory();
  if (history.length === 0) return res.json({ ok: true, id: null });
  const id = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  fs.writeFileSync(path.join(CHATS_DIR, `${id}.json`), JSON.stringify(history, null, 2), 'utf8');
  res.json({ ok: true, id });
});

// POST /api/chats/:id/load — load a saved chat as the current history
app.post('/api/chats/:id/load', (req, res) => {
  const file = path.join(CHATS_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Chat not found' });
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(HISTORY_FILE, content, 'utf8');
  res.json(JSON.parse(content));
});

// DELETE /api/chats/:id — delete a saved chat
app.delete('/api/chats/:id', (req, res) => {
  const file = path.join(CHATS_DIR, `${req.params.id}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
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
