# @openclaw/xiaozhi

> **Xiaozhi (小智) ESP32 集成插件** - 为 OpenClaw 提供与小智 ESP32 服务器的 WebSocket 通信能力

[![npm version](https://badge.fury.io/js/%40openclaw%2Fxiaozhi.svg)](https://www.npmjs.com/package/@openclaw/xiaozhi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 简介

这是一个 [OpenClaw](https://github.com/openclaw/openclaw) 插件，用于连接到 [xiaozhi-esp32-server](https://github.com/xiaozhi-esp32-server) 项目。通过这个插件，OpenClaw 网关可以与小智 ESP32 智能硬件设备进行双向通信，实现：

- 📤 发送消息到配置的渠道（Telegram、Discord、微信等）
- 🏠 控制 IoT 设备（灯光、开关、传感器等）
- 🤖 执行/查询 Agent 任务

## ✨ 功能特性

- 🔌 **双向通信** - 基于 WebSocket 的实时通信
- 🔄 **自动重连** - 连接断开时自动重连，可配置重连次数和间隔
- 💓 **心跳检测** - 定期发送心跳保持连接活跃
- 🔐 **认证支持** - 可选的 Bearer Token 认证
- 🛠️ **三个工具** - `xiaozhi_send_message`、`xiaozhi_device_control`、`xiaozhi_agent_task`

## 📋 系统要求

- **Node.js**: >= 22.0.0
- **OpenClaw**: >= 2026.2.0
- **xiaozhi-esp32-server**: 任意版本（需启用 OpenClaw 适配器）

## 🚀 安装

### 方式一：通过 npm 安装（推荐）

```bash
# 使用 OpenClaw CLI 安装
openclaw plugins install @openclaw/xiaozhi

# 或手动安装
npm install -g @openclaw/xiaozhi
```

### 方式二：从 GitHub 安装

```bash
# 克隆仓库
git clone https://github.com/openclaw/xiaozhi-openclaw-plugin.git
cd xiaozhi-openclaw-plugin

# 安装依赖
npm install

# 构建
npm run build

# 安装到 OpenClaw
openclaw plugins install .
```

## ⚙️ 配置

在 `~/.openclaw/config.yaml` 中添加以下配置：

```yaml
plugins:
  xiaozhi:
    enabled: true
    config:
      # WebSocket 服务器地址（必填）
      serverUrl: ws://localhost:8080/ws

      # 认证令牌（可选）
      authToken: your-auth-token-here

      # 重连间隔（毫秒），默认 5000
      reconnectInterval: 5000

      # 最大重连次数，默认 10
      maxReconnectAttempts: 10

      # 心跳间隔（毫秒），默认 30000
      heartbeatInterval: 30000

      # 连接超时（毫秒），默认 10000
      connectionTimeout: 10000
```

### 配置说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `serverUrl` | string | ✅ | - | xiaozhi WebSocket 服务器 URL |
| `authToken` | string | ❌ | null | Bearer Token 认证令牌 |
| `reconnectInterval` | number | ❌ | 5000 | 重连间隔（毫秒） |
| `maxReconnectAttempts` | number | ❌ | 10 | 最大重连次数 |
| `heartbeatInterval` | number | ❌ | 30000 | 心跳间隔（毫秒） |
| `connectionTimeout` | number | ❌ | 10000 | 连接超时（毫秒） |

## 🛠️ 可用工具

安装插件后，以下工具将在 OpenClaw 中可用：

### 1. xiaozhi_send_message

发送消息到配置的渠道（Telegram、Discord、微信等）。

**参数：**
```json
{
  "to": "string",      // 必填 - 接收者标识符
  "text": "string",    // 必填 - 消息内容
  "channel": "string"  // 可选 - 渠道名称（telegram/discord/wechat）
}
```

**示例：**
```json
{
  "to": "123456789",
  "text": "你好，这是一条测试消息",
  "channel": "telegram"
}
```

### 2. xiaozhi_device_control

控制连接到小智的 IoT 设备。

**参数：**
```json
{
  "deviceId": "string",  // 必填 - 设备标识符
  "action": "string",    // 必填 - 操作类型
  "value": "number"      // 可选 - 设置值（0-100，用于 set_value）
}
```

**操作类型：** `turn_on`、`turn_off`、`toggle`、`set_value`

**示例：**
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

执行或查询 Agent 任务。

**参数：**
```json
{
  "action": "string",  // 必填 - 操作类型
  "taskId": "string",  // 可选 - 任务 ID（用于 status/cancel）
  "prompt": "string"   // 可选 - 任务提示（用于 execute）
}
```

**操作类型：** `execute`、`status`、`cancel`

**示例：**
```json
{
  "action": "execute",
  "prompt": "总结最近的对话历史"
}
```

## 🏗️ 小智服务器配置

在 xiaozhi-esp32-server 端，需要启用 OpenClaw 适配器。

配置文件：`xiaozhi-esp32-server/main/xiaozhi-server/data/.openclaw_adapter_settings.json`

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

启动小智服务器后，WebSocket 服务器将在 `ws://host:port/ws` 监听连接。

## 📡 通信协议

插件使用 JSON-RPC 2.0 协议与 xiaozhi 服务器通信。

**请求格式：**
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

**响应格式（成功）：**
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

**响应格式（错误）：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "工具执行失败",
    "data": {
      "details": "接收者未找到"
    }
  }
}
```

## 🔄 工作流程

```
用户说话
    ↓
小志 ASR 识别
    ↓
小志 Agent 判断意图
    ↓
    ├─→ 简单对话 → 直接回复 → TTS播报
    │
    └─→ 需要工具 → 异步调用 OpenClaw → 等待结果 → TTS播报
```

## 🐛 故障排查

### 插件无法连接到 xiaozhi 服务器

1. 确认 xiaozhi 服务器已启动
2. 检查 `serverUrl` 配置是否正确
3. 确认防火墙允许 WebSocket 连接
4. 查看 OpenClaw 日志：`openclaw logs`

### 工具调用失败

1. 确认 xiaozhi 服务器启用了 OpenClaw 适配器
2. 检查工具参数是否正确
3. 查看 xiaozhi 服务器日志

### 重连失败

- 增加 `maxReconnectAttempts` 值
- 检查网络连接稳定性
- 确认服务器地址和端口正确

## 📦 开发

### 克隆仓库

```bash
git clone https://github.com/openclaw/xiaozhi-openclaw-plugin.git
cd xiaozhi-openclaw-plugin
```

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

### 运行测试

```bash
npm test
npm run test:coverage
```

### 项目结构

```
xiaozhi-openclaw-plugin/
├── src/
│   ├── client/          # WebSocket 客户端
│   │   ├── websocket.ts
│   │   └── protocol.ts
│   ├── config/          # 配置管理
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── tools/           # 工具实现
│   │   ├── send-message.ts
│   │   ├── device-control.ts
│   │   ├── agent-task.ts
│   │   └── index.ts
│   ├── types.ts         # 类型定义
│   ├── runtime.ts       # 插件生命周期
│   └── index.ts         # 入口文件
├── test/                # 测试文件
├── dist/                # 构建输出
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 📄 许可证

[MIT](LICENSE)

## 🙏 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - 强大的 AI Agent 网关系统
- [xiaozhi-esp32-server](https://github.com/xiaozhi-esp32-server) - ESP32 智能硬件服务器

## 📮 联系方式

- GitHub Issues: https://github.com/openclaw/xiaozhi-openclaw-plugin/issues
- OpenClaw Discord: https://discord.gg/openclaw

---

**注意**: 此插件需要同时运行 xiaozhi-esp32-server 并启用其 OpenClaw 适配器功能。
