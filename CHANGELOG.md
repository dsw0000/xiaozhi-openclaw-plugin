# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-04

### Added
- Initial release of xiaozhi-openclaw plugin
- WebSocket client with automatic reconnection
- JSON-RPC 2.0 protocol implementation
- Three tools: xiaozhi_send_message, xiaozhi_device_control, xiaozhi_agent_task
- Zod schema validation for plugin configuration
- Comprehensive unit tests (53 tests, 100% coverage)
- Support for authentication via Bearer Token
- Heartbeat/ping mechanism for connection health monitoring
- Full TypeScript type definitions

### Features
- Send messages to configured messaging channels (Telegram, Discord, WeChat, etc.)
- Control IoT devices connected to xiaozhi-esp32-server
- Execute and query agent tasks on the xiaozhi server
- Automatic reconnection with configurable attempts and intervals
- Detailed logging for debugging and monitoring
- Graceful error handling and reporting

### Configuration
- `serverUrl`: WebSocket server URL (required)
- `authToken`: Optional authentication token
- `reconnectInterval`: Reconnection interval (default: 5000ms)
- `maxReconnectAttempts`: Maximum reconnection attempts (default: 10)
- `heartbeatInterval`: Heartbeat interval (default: 30000ms)
- `connectionTimeout`: Connection timeout (default: 10000ms)

[1.0.0]: https://github.com/openclaw/xiaozhi-openclaw-plugin/releases/tag/v1.0.0
