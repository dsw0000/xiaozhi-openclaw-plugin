/**
 * Runtime management for xiaozhi-openclaw plugin
 * Handles plugin lifecycle, WebSocket client management, and service registration
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { XiaozhiWebSocketClient } from "./client/websocket.js";
import { XiaozhiWebSocketClient as WebSocketClientImpl } from "./client/websocket.js";
import { registerXiaozhiTools } from "./tools/index.js";
import { XiaozhiPluginConfigSchema, type XiaozhiPluginConfigInput } from "./config/schema.js";
import { DEFAULT_CONFIG } from "./config/types.js";

// Runtime state
interface PluginRuntimeState {
  client: XiaozhiWebSocketClient | null;
  isConnected: boolean;
  isConnecting: boolean;
}

let runtimeState: PluginRuntimeState = {
  client: null,
  isConnected: false,
  isConnecting: false,
};

/**
 * Load and validate plugin configuration
 */
function loadConfig(api: OpenClawPluginApi): XiaozhiPluginConfigInput {
  // Merge default config with plugin config
  const rawConfig = {
    ...DEFAULT_CONFIG,
    ...(api.pluginConfig ?? {}),
  };

  // Validate with Zod schema
  const result = XiaozhiPluginConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `${path}: ${issue.message}`;
    });
    throw new Error(`Invalid plugin configuration:\n${errors.join("\n")}`);
  }

  return result.data;
}

/**
 * Initialize the WebSocket client and connect
 */
async function initializeClient(
  api: OpenClawPluginApi,
): Promise<XiaozhiWebSocketClient> {
  const config = loadConfig(api);
  const client = new WebSocketClientImpl(config);

  // Set up event handlers
  client.on("connect", () => {
    api.logger.info("xiaozhi-openclaw: Connected to server");
    runtimeState.isConnected = true;
    runtimeState.isConnecting = false;
  });

  client.on("disconnect", (code, reason) => {
    api.logger.info(`xiaozhi-openclaw: Disconnected (${code}): ${reason}`);
    runtimeState.isConnected = false;
  });

  client.on("error", (error) => {
    api.logger.error(`xiaozhi-openclaw: Error: ${error.message}`);
  });

  client.on("reconnect", (attempt) => {
    api.logger.info(`xiaozhi-openclaw: Reconnecting (attempt ${attempt})`);
  });

  client.on("reconnectFailed", () => {
    api.logger.error("xiaozhi-openclaw: Reconnection failed, max attempts reached");
  });

  // Connect to server
  runtimeState.isConnecting = true;
  api.logger.info(`xiaozhi-openclaw: Connecting to ${config.serverUrl}`);
  await client.connect();

  return client;
}

/**
 * Start the plugin (called during plugin activation)
 */
export async function startPlugin(api: OpenClawPluginApi): Promise<void> {
  if (runtimeState.client) {
    api.logger.warn("xiaozhi-openclaw: Plugin already started");
    return;
  }

  try {
    // Initialize and connect WebSocket client
    const client = await initializeClient(api);
    runtimeState.client = client;

    // Register tools
    registerXiaozhiTools(client, api);
    api.logger.info("xiaozhi-openclaw: Tools registered");

    api.logger.info("xiaozhi-openclaw: Plugin started successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    api.logger.error(`xiaozhi-openclaw: Failed to start: ${message}`);
    throw error;
  }
}

/**
 * Stop the plugin (called during plugin deactivation)
 */
export async function stopPlugin(api: OpenClawPluginApi): Promise<void> {
  if (runtimeState.client) {
    api.logger.info("xiaozhi-openclaw: Stopping plugin");

    runtimeState.client.disconnect();
    runtimeState.client = null;
    runtimeState.isConnected = false;
    runtimeState.isConnecting = false;

    api.logger.info("xiaozhi-openclaw: Plugin stopped");
  }
}

/**
 * Get the current runtime state
 */
export function getRuntimeState(): PluginRuntimeState {
  return { ...runtimeState };
}

/**
 * Get the WebSocket client instance (for testing/debugging)
 */
export function getClient(): XiaozhiWebSocketClient | null {
  return runtimeState.client;
}
