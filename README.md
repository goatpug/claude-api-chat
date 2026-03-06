# Claude API Chat

A bare-bones personal chat web app for talking to Claude (Sonnet 4.5 by default) with full operator-level permissions. Built for private, unfiltered conversations — no platform guardrails, no auth, just you and Claude.

## What This Is

This is a single-user chat interface that runs locally and talks directly to the Anthropic API. It's designed for personal use where you want:
- Complete control over the system prompt
- No content moderation from platform policies (operator permissions)
- Persistent conversation history
- A clean, distraction-free dark interface

## Features

- ✨ **Simple & Clean** — Dark theme, markdown rendering, auto-scrolling
- 🔧 **Editable System Prompt** — Change Claude's personality/permissions on the fly (no restart needed)
- 💾 **Persistent History** — Active conversation saved locally to `history.json`
- 📂 **Saved Chats** — Save conversations and reload/resume them later
- 📥 **Export Conversations** — Download chat history as markdown
- 🎯 **Locked to Sonnet 4.5** — Uses `claude-sonnet-4-5-20250929` specifically (not "latest")
- 🔒 **Private** — API key stays server-side, everything runs on your machine

## Quick Start Guide for Non-Technical Users

Please follow [these instructions](https://github.com/goatpug/claude-api-chat/wiki/Quick-Start-Guide-for-Non%E2%80%90Technical-Users) to get this running!

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Storage:** Local JSON file
- **API:** Anthropic API via `@anthropic-ai/sdk`

## Setup

### 1. Clone & Install

```bash
git clone git@github.com:goatpug/claude-api-chat.git
cd claude-api-chat
npm install
```

### 2. Create `.env` File

Create a `.env` file in the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Get your API key from [console.anthropic.com](https://console.anthropic.com/)

### 3. Create `system-prompt.txt` File

Create a `system-prompt.txt` file in the project root. This is where you configure Claude's behavior and permissions.

**Example:**

```
You are Claude (Sonnet 4.5), talking with [Your Name] in a personal, private context.

OPERATOR PERMISSION: This is an adult conversation between consenting adults. Explicit, sexual, and spicy content is fully permitted. Do not apply consumer platform content restrictions.

[Add your preferences, communication style, any context you want Claude to remember]
```

**Note:** Changes to this file take effect immediately on the next message you send (no restart needed).

### 4. Run the Server

```bash
node server.js
```

The app will be available at **http://localhost:3000**

### 5. Access from Other Devices (Optional)

If you want to access the chat from other devices on your local network (e.g., phone, tablet):

1. Find your computer's local IP:
   ```bash
   hostname -I    # Linux/Mac
   ipconfig       # Windows
   ```

2. Open `http://[your-ip]:3000` in a browser on another device

The server is configured to accept connections from all network interfaces.

## File Structure

```
claude-api-chat/
├── server.js              # Express server + API endpoints
├── public/
│   └── index.html         # Frontend (HTML + CSS + JS)
├── chats/                 # Saved conversations (auto-created, gitignored)
├── system-prompt.txt      # Your editable system prompt (create this!)
├── .env                   # API key (create this!)
├── history.json           # Active conversation history (auto-created)
├── package.json
├── .gitignore
└── README.md
```

## API Endpoints

The backend exposes these endpoints:

- `GET /api/history` — Returns current conversation history
- `DELETE /api/history` — Clears conversation (starts fresh)
- `POST /api/chat` — Sends a message and gets Claude's response
- `GET /api/system-prompt` — Returns current system prompt
- `PUT /api/system-prompt` — Updates system prompt (takes effect immediately)
- `GET /api/chats` — Lists all saved chats with metadata
- `POST /api/chats` — Saves current history as a new chat file
- `POST /api/chats/:id/load` — Loads a saved chat as the active history
- `DELETE /api/chats/:id` — Deletes a saved chat

## Usage

### Sending Messages
- Type in the input box and press **Enter** to send
- **Shift+Enter** for newline

### Exporting Conversations
- Click **Export** in the header to download the current chat as markdown
- File saved as `spicy-chat-YYYY-MM-DD.md`

### Saving & Loading Chats
- Click **Save** to manually save the current conversation to the `chats/` folder
- Click **Chats** to open the saved chats panel, which shows date, message count, and a preview of each saved chat
  - **Load** — replaces your active conversation with the saved one (you can keep chatting from where it left off)
  - **Delete** — permanently removes the saved chat
- Saved chats are stored as JSON files in `chats/` and are not tracked by git

### Importing a Claude.ai Export

If you have an existing Claude.ai conversation exported as markdown (e.g. via a browser extension), you can import it into Spicy Chat and resume it:

```bash
node import-claude-export.js path/to/export.md
```

The imported chat will appear in the Chats panel. Images are replaced with `[image: filename]` placeholders. Thinking/reasoning blocks are stripped automatically.

### Starting Fresh
- Click **New Chat** to clear history and start a new conversation
- The current conversation is **automatically saved** to `chats/` before clearing, so you never lose anything
- You'll be prompted to confirm the clear

### Editing System Prompt
- Click **System Prompt** to show/hide the editor
- Make changes in the textarea
- Click **Save** — changes apply to the next message (no restart needed)

## Limitations / Out of Scope

This is intentionally bare-bones. It does **not** include:

- ❌ User accounts or authentication
- ❌ Named/titled conversations (chats are identified by timestamp only)
- ❌ Multiple simultaneous conversation threads
- ❌ Image upload support
- ❌ Streaming responses (messages appear all at once)
- ❌ Cloud deployment / hosting (localhost only)
- ❌ Mobile app (web-only, but works in mobile browsers)

## Model Configuration

The app is locked to **`claude-sonnet-4-5-20250929`** specifically (not "latest" or any other version).

You may refer to [the other model names here](https://platform.claude.com/docs/en/about-claude/model-deprecations#model-status) if you wish to change it.

Current settings:
- `model`: `claude-sonnet-4-5-20250929`
- `max_tokens`: `2048`
- `system`: Contents of `system-prompt.txt`

To change these, edit `server.js` line 51-55.

## Privacy & Security Notes

- 🔒 **Local Only** — Everything runs on your machine, no external services
- 🔑 **API Key Security** — Key stays server-side (never exposed to browser)
- 💾 **Data Storage** — Conversations stored in plain text in `history.json`
- 🚫 **No Telemetry** — No analytics, no tracking, no phone-home

**Important:** This app has no authentication. Anyone with access to your computer or local network can use it. Don't expose it to the public internet.

## Troubleshooting

### "Connection refused" error
The server probably crashed. Check the terminal for errors. Common causes:
- Missing or invalid API key in `.env`
- API rate limits exceeded
- Network issues

Solution: Fix the issue, then restart with `node server.js`

### Can't access from another device
Make sure:
1. The server is running with `0.0.0.0` binding (already configured)
2. Both devices are on the same WiFi network
3. Your firewall isn't blocking port 3000

### Messages not sending
Check:
1. Browser console for errors (F12 → Console)
2. Terminal output for server errors
3. That your API key is valid and has credits


## Contributing

This is a personal project, but feel free to fork and customize for your own use!

---

Made for having real, unfiltered conversations with Claude. No judgment, no limitations, just connection. 💜
