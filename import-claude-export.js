#!/usr/bin/env node
/**
 * Import a Claude.ai markdown chat export into Spicy Chat.
 *
 * Usage:
 *   node import-claude-export.js path/to/export.md
 *
 * The imported chat will appear in the Chats panel in Spicy Chat.
 * Images are replaced with [image: filename] placeholders.
 * Thinking/reasoning blocks are stripped from assistant messages.
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node import-claude-export.js <exported-markdown-file>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

const CHATS_DIR = path.join(__dirname, 'chats');
if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR);

const content = fs.readFileSync(inputFile, 'utf8')
  .replace(/\n---\nPowered by \[Claude Exporter\][^\n]*/g, '\n\n---\n*Exported from Claude.ai*');

// Split on ## Prompt: and ## Response: headers
// Result: [preamble, 'Prompt', content, 'Response', content, ...]
const sections = content.split(/^## (Prompt|Response):$/m);

if (sections.length < 3) {
  console.error('Could not find any Prompt/Response sections. Is this a Claude.ai export?');
  process.exit(1);
}

const messages = [];

for (let i = 1; i < sections.length - 1; i += 2) {
  const label = sections[i].trim();       // 'Prompt' or 'Response'
  const raw = sections[i + 1] || '';
  const role = label === 'Prompt' ? 'user' : 'assistant';

  let text = raw;

  // Strip leading blank lines
  text = text.replace(/^\n+/, '');

  // Strip timestamp line (first line, e.g. "3/6/2026, 1:22:03 PM")
  text = text.replace(/^[^\n]+\n/, '');

  // Strip leading blank lines again after timestamp
  text = text.replace(/^\n+/, '');

  // For assistant: strip the ````plaintext thinking block at the start
  if (role === 'assistant') {
    text = text.replace(/^````plaintext\n[\s\S]*?\n````\n*/,'');
  }

  // Replace inline base64 images with a placeholder (they're huge and not resumable anyway)
  text = text.replace(/!\[([^\]]*)\]\(data:[^)]{20,}\)/g, (_, alt) => {
    return alt ? `[image: ${alt}]` : '[image]';
  });

  text = text.trim();
  if (text) messages.push({ role, content: text });
}

if (messages.length === 0) {
  console.error('No messages found after parsing. The export format may not be supported.');
  process.exit(1);
}

const id = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const outFile = path.join(CHATS_DIR, `${id}.json`);
fs.writeFileSync(outFile, JSON.stringify(messages, null, 2), 'utf8');

console.log(`✓ Imported ${messages.length} messages`);
console.log(`  Saved to: chats/${id}.json`);
console.log(`  Open the Chats panel in Spicy Chat to load it.`);
