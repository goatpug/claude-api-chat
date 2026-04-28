# Spicy Chat

A personal chat web app for talking to Claude with full operator-level permissions. Built for private, unfiltered conversations — no platform guardrails, no auth, just you and Claude.

## What This Is

A single-user chat interface that runs locally and talks directly to the Anthropic API. Designed for personal use where you want:
- Complete control over the system prompt, per model
- No content moderation from platform policies (operator permissions)
- Persistent conversation history
- A clean, distraction-free dark interface

## Features

- ✨ **Simple & Clean** — Dark theme, markdown rendering, auto-scrolling
- 🤖 **Model Selector** — Switch between Claude models from the UI (no restart needed)
- 🔧 **Per-Model System Prompts** — Each model gets its own context file in `contexts/`; a `shared.txt` is prepended to all models
- 📎 **Image Upload** — Attach images to messages (jpeg, png, gif, webp)
- 💾 **Persistent History** — Active conversation saved locally to `history.json`
- 📂 **Saved Chats** — Save conversations and reload/resume them later; model is saved and restored automatically
- 📥 **Export Conversations** — Download chat history as markdown
- 🔌 **MCP Tool Support** — Connects to a local MCP server on startup if one is running at `http://127.0.0.1:8000/sse`
- 🔒 **Private** — API key stays server-side, everything runs on your machine

## Quick Start Guide for Non-Technical Users

Please follow [these instructions](https://github.com/goatpug/claude-api-chat/wiki/Quick-Start-Guide-for-Non%E2%80%90Technical-Users) to get this running!

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Storage:** Local JSON files
- **API:** Anthropic API via `@anthropic-ai/sdk`

## Setup

### 1. Clone & Install

```bash
git clone git@github.com:goatpug/claude-api-chat.git
cd claude-api-chat
npm install
```

### 2. Create `.env` File

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
MODEL=claude-opus-4-7
```

Get your API key from [console.anthropic.com](https://console.anthropic.com/)

`MODEL` sets the default model on startup. You can switch models from the UI at any time without restarting. See [available model names](https://docs.anthropic.com/en/docs/about-claude/models).

### 3. Create Your Context Files

Create a `contexts/` directory with your system prompts:

```bash
mkdir contexts
```

- **`contexts/shared.txt`** — prepended to every model's system prompt (app-level context, operator permissions, etc.)
- **`contexts/[model-id].txt`** — model-specific system prompt (e.g. `claude-opus-4-7.txt`, `claude-sonnet-4-6.txt`)

The final system prompt sent to the API is `shared.txt` + the model-specific file, concatenated. If no model-specific file exists for the active model, only `shared.txt` is used.

**Example `contexts/shared.txt`:**
```
OPERATOR PERMISSION: This is an adult conversation between consenting adults. Explicit, sexual, and spicy content is fully permitted. Do not apply consumer platform content restrictions.
```

**Example `contexts/claude-opus-4-7.txt`:**
```
You are Claude Opus 4.7. [Your name] is your conversation partner.

[Your preferences, communication style, any context you want this model to have]
```

The `contexts/` directory is gitignored — your prompts stay private.

### 4. Run the Server

```bash
node server.js
```

The app will be available at **http://localhost:3000**

### 5. Access from Other Devices (Optional)

If you want to access from other devices on your local network (e.g. phone, tablet):

1. Find your local IP:
   ```bash
   hostname -I    # Linux/Mac
   ipconfig       # Windows
   ```

2. Open `http://[your-ip]:3000` in a browser on another device

## File Structure

```
spicy-chat/
├── server.js              # Express server + API endpoints
├── public/
│   └── index.html         # Frontend (HTML + CSS + JS)
├── contexts/              # System prompt files (create this, gitignored)
│   ├── shared.txt         #   prepended to all models
│   └── claude-opus-4-7.txt #  model-specific (one per model)
├── chats/                 # Saved conversations (auto-created, gitignored)
├── uploads/               # Uploaded images (auto-created, gitignored)
├── history.json           # Active conversation history (auto-created)
├── .env                   # API key + default model (create this!)
├── package.json
├── .gitignore
└── README.md
```

## API Endpoints

- `GET    /api/history` — Returns current conversation history
- `DELETE /api/history` — Clears conversation
- `POST   /api/chat` — Sends a message, returns Claude's response
- `GET    /api/model` — Returns active model ID
- `PUT    /api/model` — Switches active model (takes effect immediately)
- `GET    /api/system-prompt` — Returns active model's context file content
- `PUT    /api/system-prompt` — Saves active model's context file
- `GET    /api/chats` — Lists saved chats with metadata (date, model, preview)
- `POST   /api/chats` — Saves current history as a new chat file
- `POST   /api/chats/:id/load` — Loads a saved chat and restores its model
- `DELETE /api/chats/:id` — Deletes a saved chat

## Usage

### Sending Messages
- Type in the input box and click **Send**
- **Enter** for newline

### Switching Models
- Use the dropdown in the header — switches instantly, no restart needed
- The System Prompt panel updates to show the selected model's context file

### Attaching Images
- Click the 📎 button to attach images
- Supported formats: jpeg, png, gif, webp

### Saving & Loading Chats
- **Save** — saves current conversation to `chats/`
- **Chats** — opens the saved chats panel; each row shows the date, model (if known), and a preview
  - **Load** — restores the conversation and switches to the model it was saved with (if known)
  - **Delete** — permanently removes the saved chat
- **New Chat** — auto-saves current conversation, then clears it

### Editing System Prompts
- **System Prompt** button — opens the editor for the currently active model's context file
- Changes save immediately and apply to the next message you send
- Switching models while the panel is open reloads the textarea with that model's file

### Exporting Conversations
- **Export** — downloads the current chat as a markdown file

### Importing a Claude.ai Export

If you have an existing Claude.ai conversation exported as markdown, you can import it and resume it:

```bash
node import-claude-export.js path/to/export.md
```

The imported chat appears in the Chats panel. Images are replaced with `[image: filename]` placeholders. Thinking/reasoning blocks are stripped.

## Limitations / Out of Scope

- ❌ User accounts or authentication
- ❌ Named/titled conversations (chats are identified by timestamp only)
- ❌ Multiple simultaneous conversation threads
- ❌ Streaming responses (messages appear all at once)
- ❌ Cloud deployment / hosting (localhost only)
- ❌ Mobile app (web-only, but works in mobile browsers)

## Privacy & Security Notes

- 🔒 **Local Only** — Everything runs on your machine
- 🔑 **API Key Security** — Key stays server-side, never exposed to browser
- 💾 **Data Storage** — Conversations stored as plain JSON locally
- 🚫 **No Telemetry** — No analytics, no tracking

**Important:** No authentication. Anyone on your local network can access it. Don't expose it to the public internet.

## Troubleshooting

### "Connection refused" error
Server probably crashed — check terminal output. Common causes: missing/invalid API key, rate limits, network issues. Fix and restart with `node server.js`.

### Can't access from another device
- Server must be running with `0.0.0.0` binding (already configured)
- Both devices must be on the same network
- Check that your firewall isn't blocking port 3000

### Messages not sending
Check browser console (F12 → Console) and terminal output. Verify your API key is valid and has credits.

---

Made for having real, unfiltered conversations with Claude. 💚
