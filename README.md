# Pronetheia

**Autonomous AI Agent Platform powered by Athena**

> Forked from [OpenClaw](https://github.com/openclaw/openclaw) — Thank you to the OpenClaw team!

---

## What is Pronetheia?

Pronetheia is an autonomous AI agent platform. At its heart is **Athena**, the Universal Agent that can:

- **Execute instructions** via chat, voice, or API
- **Work autonomously** via scheduled tasks and heartbeats
- **Spawn sub-agents** for complex multi-step work
- **Connect to messaging channels** — Telegram, WhatsApp, Discord, Signal, and more
- **Remember** — Unified Memory System with semantic search
- **Speak** — Voice pipeline with wake word activation

**Anything a human can do within Pronetheia, they can instruct Athena to do.**

---

## Quick Start

```bash
# Install globally
npm install -g pronetheia

# Start the gateway
pronetheia gateway start

# Open the UI
open http://localhost:18789
```

---

## Features

### 🤖 102+ Specialized Agents
From developers to architects to security auditors — pre-configured specialists for any task.

### 🎯 Autonomous Operation
Cron jobs, heartbeats, and proactive tasks. Athena works even when you're not watching.

### 🔌 Multi-Channel Messaging
Telegram, WhatsApp, Discord, Slack, Signal, iMessage, and more.

### 🧠 Unified Memory System
Episodic, semantic, and working memory with automatic consolidation.

### 🗣️ Voice Interface
Wake word activation, real-time speech-to-text, natural text-to-speech.

### 🔐 Enterprise Security
KeyCloak integration, RBAC, HashiCorp Vault secrets, audit logging.

### 🛠️ Skills System
Extensible skills for specialized tasks. Add your own or use community skills.

---

## Architecture

```
Pronetheia
└── Athena (Universal Agent)
    ├── Gateway (daemon)
    ├── Skills System
    ├── Sub-agent Spawning
    ├── Memory System
    ├── Messaging Channels
    └── Voice Pipeline
```

---

## Configuration

Config directory: `~/.pronetheia/`

```
~/.pronetheia/
├── config.json          # Main configuration
├── agents/              # Agent definitions
├── skills/              # Custom skills
├── memory/              # Memory storage
└── workspace/           # Working directory
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRONETHEIA_MODEL` | Default LLM model |
| `PRONETHEIA_GATEWAY_PORT` | Gateway port (default: 18789) |
| `PRONETHEIA_LOG_LEVEL` | Logging level |

---

## Upstream Updates

This project maintains compatibility with OpenClaw upstream:

```bash
# Fetch upstream updates
git fetch upstream

# Merge updates (review carefully)
git merge upstream/main
```

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

## Credits

- Built on [OpenClaw](https://github.com/openclaw/openclaw)
- Created by Dr. Tony Love
- Powered by Athena 🏛️

---

*Pronetheia (προνήθεια): Foresight, providence, forward-thinking*
