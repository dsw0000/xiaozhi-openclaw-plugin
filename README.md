# @dsw0000/xiaozhi

> **Xiaozhi (小智) ESP32 Integration Plugin** - WebSocket client for OpenClaw to connect with xiaozhi-esp32-server

[![npm version](https://badge.fury.io/js/%40dsw0000%2Fxiaozhi.svg)](https://www.npmjs.com/package/@dsw0000/xiaozhi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[中文文档](README_zh.md)**

## Overview

This is an [OpenClaw](https://github.com/anthropics/openclaw) plugin for connecting to the [xiaozhi-esp32-server](https://github.com/xiaozhi-esp32-server) project. Through this plugin, the OpenClaw gateway can communicate bidirectionally with Xiaozhi ESP32 smart hardware devices:

- 📤 Send messages to configured channels (Telegram, Discord, WeChat, etc.)
- 🏠 Control IoT devices (lights, switches, sensors, etc.)
- 🤖 Execute/query Agent tasks

## Features

- 🔌 **Bidirectional Communication** - WebSocket-based real-time communication
- 🔄 **Auto Reconnect** - Automatically reconnect on connection failure, configurable attempts and interval
- 💓 **Heartbeat Detection** - Regular heartbeat to keep connection alive
- 🔐 **Authentication Support** - Optional Bearer Token authentication
- 🛠️ **Three Tools** - `xiaozhi_send_message`, `xiaozhi_device_control`, `xiaozhi_agent_task`

## Requirements

- **Node.js**: >= 22.0.0
- **OpenClaw**: >= 2026.2.0
- **xiaozhi-esp32-server**: Any version (with OpenClaw adapter enabled)

## Installation

### Method 1: Install via npm (Recommended)

```bash
# Install using OpenClaw CLI
openclaw plugins install @dsw0000/xiaozhi

# Or install manually
npm install -g @dsw0000/xiaozhi
```

### Method 2: Install from GitHub

```bash
# Clone repository
git clone https://github.com/dsw0000/xiaozhi-openclaw-plugin.git
cd xiaozhi-openclaw-plugin

# Install dependencies
npm install

# Build
npm run build

# Install to OpenClaw
openclaw plugins install .
```

## Configuration

Add the following to `~/.openclaw/config.yaml`:

```yaml
plugins:
  xiaozhi:
    enabled: true
    config:
      # WebSocket server URL (required)
      serverUrl: ws://localhost:8080/ws

      # Authentication token (optional)
      authToken: your-auth-token-here

      # Reconnect interval (ms), default 5000
      reconnectInterval: 5000

      # Max reconnect attempts, default 10
      maxReconnectAttempts: 10

      # Heartbeat interval (ms), default 30000
      heartbeatInterval: 30000

      # Connection timeout (ms), default 10000
      connectionTimeout: 10000
```

### Configuration Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `serverUrl` | string | ✅ | - | Xiaozhi WebSocket server URL |
| `authToken` | string | ❌ | null | Bearer Token authentication |
| `reconnectInterval` | number | ❌ | 5000 | Reconnect interval (ms) |
| `maxReconnectAttempts` | number | ❌ | 10 | Max reconnect attempts |
| `heartbeatInterval` | number | ❌ | 30000 | Heartbeat interval (ms) |
| `connectionTimeout` | number | ❌ | 10000 | Connection timeout (ms) |

## Available Tools

After installing the plugin, the following tools will be available in OpenClaw:

### 1. xiaozhi_send_message

Send a message to a configured channel (Telegram, Discord, WeChat, etc.).

**Parameters:**
```json
{
  "to": "string",      // required - Recipient identifier
  "text": "string",    // required - Message content
  "channel": "string"  // optional - Channel name (telegram/discord/wechat)
}
```

**Example:**
```json
{
  "to": "123456789",
  "text": "Hello, this is a test message",
  "channel": "telegram"
}
```

### 2. xiaozhi_device_control

Control IoT devices connected to Xiaozhi.

**Parameters:**
```json
{
  "deviceId": "string",  // required - Device identifier
  "action": "string",    // required - Action type
  "value": "number"      // optional - Value to set (0-100, for set_value)
}
```

**Action types:** `turn_on`, `turn_off`, `toggle`, `set_value`

**Example:**
```json
{
  "deviceId": "light_01",
  "action": "turn_on"
}
```

```json
{
  "deviceId": "dimmer_01",
  "action": "set_value",
  "value": 50
}
```

### 3. xiaozhi_agent_task

Execute or query Agent tasks.

**Parameters:**
```json
{
  "action": "string",  // required - Action type
  "taskId": "string",  // optional - Task ID (for status/cancel)
  "prompt": "string"   // optional - Task prompt (for execute)
}
```

**Action types:** `execute`, `status`, `cancel`

**Example:**
```json
{
  "action": "execute",
  "prompt": "Summarize recent conversation history"
}
```

## Xiaozhi Server Configuration

On the xiaozhi-esp32-server side, you need to enable the OpenClaw adapter.

Config file: `xiaozhi-esp32-server/main/xiaozhi-server/data/.openclaw_adapter_settings.json`

```json
{
  "websocketServer": {
    "enabled": true,
    "host": "0.0.0.0",
    "port": 8080,
    "authToken": null
  }
}
```

After starting the Xiaozhi server, the WebSocket server will listen on `ws://host:port/ws`.

## Communication Protocol

The plugin uses JSON-RPC 2.0 protocol to communicate with the Xiaozhi server.

**Request format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "xiaozhi_send_message",
    "arguments": {
      "to": "user123",
      "text": "Hello",
      "channel": "telegram"
    }
  }
}
```

**Response format (success):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "data": {
      "messageId": "msg_123",
      "timestamp": 1707895200
    }
  }
}
```

**Response format (error):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Tool execution failed",
    "data": {
      "details": "Recipient not found"
    }
  }
}
```

## Workflow

```
User speaks
    ↓
Xiaozhi ASR recognition
    ↓
Xiaozhi Agent determines intent
    ↓
    ├─→ Simple conversation → Direct response → TTS broadcast
    │
    └─→ Need tools → Async call OpenClaw → Wait for result → TTS broadcast
```

## Troubleshooting

### Plugin cannot connect to Xiaozhi server

1. Confirm Xiaozhi server is running
2. Check `serverUrl` configuration is correct
3. Confirm firewall allows WebSocket connection
4. Check OpenClaw logs: `openclaw logs`

### Tool call failed

1. Confirm Xiaozhi server has OpenClaw adapter enabled
2. Check tool parameters are correct
3. Check Xiaozhi server logs

### Reconnect failed

- Increase `maxReconnectAttempts` value
- Check network connection stability
- Confirm server address and port are correct

## Development

### Clone repository

```bash
git clone https://github.com/dsw0000/xiaozhi-openclaw-plugin.git
cd xiaozhi-openclaw-plugin
```

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run tests

```bash
npm test
npm run test:coverage
```

### Project structure

```
xiaozhi-openclaw-plugin/
├── src/
│   ├── client/          # WebSocket client
│   │   ├── websocket.ts
│   │   └── protocol.ts
│   ├── config/          # Configuration management
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── tools/           # Tool implementations
│   │   ├── send-message.ts
│   │   ├── device-control.ts
│   │   ├── agent-task.ts
│   │   └── index.ts
│   ├── types.ts         # Type definitions
│   ├── runtime.ts       # Plugin lifecycle
│   └── index.ts         # Entry point
├── test/                # Test files
├── dist/                # Build output
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## License

[MIT](LICENSE)

## Acknowledgments

- [OpenClaw](https://github.com/anthropics/openclaw) - Powerful AI Agent gateway system
- [xiaozhi-esp32-server](https://github.com/xiaozhi-esp32-server) - ESP32 smart hardware server

## Related Projects

- [xiaozhi-openclaw-adapter](https://github.com/dsw0000/xiaozhi-openclaw-adapter) - Server-side adapter for xiaozhi-esp32-server

## Contact

- GitHub Issues: https://github.com/dsw0000/xiaozhi-openclaw-plugin/issues

---

**Note**: This plugin requires xiaozhi-esp32-server to be running with the OpenClaw adapter enabled.
