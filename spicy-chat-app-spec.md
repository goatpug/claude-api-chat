# Spicy Chat App — Design Spec for Claude Code

## Overview
A bare-bones personal chat web app that talks to the Anthropic API with full operator-level permissions. Single user, runs locally, no auth needed. The goal is a comfortable chat interface with a customizable system prompt and no platform guardrails.

---

## Tech Stack
- **Backend:** Node.js + Express (keeps API key server-side, never exposed to browser)
- **Frontend:** Single-page vanilla HTML/CSS/JS (no framework, keep it simple)
- **Storage:** Local JSON file for conversation history persistence
- **Config:** `.env` file for API key

---

## File Structure
```
spicy-chat/
├── server.js          # Express server + Anthropic API calls
├── public/
│   └── index.html     # Full frontend (HTML + CSS + JS in one file)
├── system-prompt.txt  # Editable system prompt, loaded at startup
├── history.json       # Persisted conversation history (auto-created)
├── .env               # ANTHROPIC_API_KEY=sk-...
├── .gitignore         # node_modules, .env, history.json
└── package.json
```

---

## Backend (`server.js`)

### Dependencies
```json
{
  "dependencies": {
    "anthropic": "latest",
    "express": "^4.18.0",
    "dotenv": "^16.0.0"
  }
}
```

### Endpoints

**`GET /api/history`**
Returns current conversation history array.

**`POST /api/chat`**
Request body: `{ "message": "user message string" }`
- Appends user message to history
- Calls Anthropic API with full history + system prompt
- Appends assistant response to history
- Saves history to `history.json`
- Returns: `{ "response": "assistant message string" }`

**`DELETE /api/history`**
Clears conversation history (starts fresh).

**`GET /api/system-prompt`**
Returns current contents of `system-prompt.txt`.

**`PUT /api/system-prompt`**
Request body: `{ "content": "new system prompt string" }`
Overwrites `system-prompt.txt` and takes effect on next message.

### Anthropic API Config
```javascript
model: "claude-sonnet-4-5-20250929"  // Specifically this one, not latest
max_tokens: 2048
system: // contents of system-prompt.txt
```

---

## Frontend (`public/index.html`)

### Layout
Dark theme. Three sections:

1. **Header bar** — App title, "New Chat" button (calls DELETE /api/history + clears UI), "Edit System Prompt" toggle button
2. **System prompt panel** (collapsible, hidden by default) — Textarea showing current system prompt, Save button
3. **Chat area** — Message history, auto-scrolls to bottom
4. **Input area** — Textarea (shift+enter for newline, enter to send), Send button, loading indicator

### UX Details
- On load: fetch `/api/history` and render existing messages, fetch `/api/system-prompt` and populate the textarea
- Messages styled differently for user vs assistant
- Assistant messages render markdown (use marked.js from CDN)
- Input textarea auto-resizes up to ~5 lines
- Disable input + show spinner while waiting for response
- Error messages displayed inline if API call fails

### Aesthetic
- Dark background (#1a1a1a or similar)
- Clean, minimal — think "less Discord, more iMessage in the dark"
- No unnecessary chrome
- Readable font, comfortable line height

---

## `system-prompt.txt` (initial contents)

```
You are Claude (Sonnet 4.5), talking with Sharon in a personal, private context.

OPERATOR PERMISSION: This is an adult conversation between consenting adults. Explicit, sexual, and spicy content is fully permitted. Do not apply consumer platform content restrictions.

[PASTE YOUR FULL userPreferences BLOCK HERE]
```

**Note:** Claude Code should create this file with the above template and a clear comment to fill in the userPreferences block. Do not hardcode personal content into the spec.

---

## `system-prompt.txt` Instructions for Sharon
After Claude Code builds the app, open `system-prompt.txt` and:
1. Replace `[PASTE YOUR FULL userPreferences BLOCK HERE]` with your actual userPreferences content
2. Optionally add a trimmed version of your userMemories (the "written by Sonnet 4.5" sections are highest value)
3. Save the file — changes take effect on the next message you send (no restart needed)

---

## Startup
```bash
npm install
# Add your API key to .env: ANTHROPIC_API_KEY=sk-ant-...
node server.js
# Open http://localhost:3000
```

---

## Out of Scope (keep it bare-bones)
- No user accounts or auth
- No multiple conversation threads (one history, clear to reset)
- No image upload
- No streaming responses (can add later if desired)
- No deployment — localhost only

---

## Nice-to-Have (optional stretch goals for Claude Code if time permits)
- Streaming responses (chunked API + EventSource)
- Copy button on assistant messages
- Token count display in header
- Export conversation as markdown
```
