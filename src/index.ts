/**
 * xiaozhi-openclaw plugin
 * OpenClaw plugin for xiaozhi (小智) ESP32 server integration
 *
 * This plugin provides tools for interacting with xiaozhi:
 * - xiaozhi_send_message: Send messages to configured channels
 * - xiaozhi_device_control: Control IoT devices
 * - xiaozhi_agent_task: Execute/query agent tasks
 *
 * Configuration (in ~/.openclaw/config.yaml):
 * plugins:
 *   xiaozhi:
 *     enabled: true
 *     config:
 *       serverUrl: ws://localhost:8080/ws
 *       authToken: optional-auth-token
 *       reconnectInterval: 5000
 *       maxReconnectAttempts: 10
 *       heartbeatInterval: 30000
 */

import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk";
import { startPlugin, stopPlugin } from "./runtime.js";

const plugin: OpenClawPluginDefinition = {
  id: "xiaozhi",
  name: "Xiaozhi Integration",
  description: "WebSocket client for xiaozhi-esp32-server integration",
  version: "1.0.0",

  // Optional: define config schema for UI hints
  configSchema: {
    uiHints: {
      serverUrl: {
        label: "Server URL",
        help: "WebSocket server URL (e.g., ws://localhost:8080/ws)",
        placeholder: "ws://localhost:8080/ws",
      },
      authToken: {
        label: "Auth Token",
        help: "Optional authentication token",
        sensitive: true,
      },
      reconnectInterval: {
        label: "Reconnect Interval",
        help: "Time between reconnection attempts (milliseconds)",
        advanced: true,
      },
      maxReconnectAttempts: {
        label: "Max Reconnect Attempts",
        help: "Maximum number of reconnection attempts before giving up",
        advanced: true,
      },
      heartbeatInterval: {
        label: "Heartbeat Interval",
        help: "Heartbeat/ping interval (milliseconds)",
        advanced: true,
      },
    },
  },

  async activate(api) {
    await startPlugin(api);
  },

  async deactivate(api) {
    await stopPlugin(api);
  },
};

// Plugin registration function (entry point)
export default function register(api: import("openclaw/plugin-sdk").OpenClawPluginApi) {
  // Register lifecycle hooks
  api.on("gateway_start", async () => {
    await startPlugin(api);
  });

  api.on("gateway_stop", async () => {
    await stopPlugin(api);
  });

  // Also start immediately (non-blocking)
  startPlugin(api).catch((error) => {
    api.logger.warn(`xiaozhi-openclaw: Initial start warning: ${error.message}`);
  });
}

// Export plugin definition for reference
export { plugin };
