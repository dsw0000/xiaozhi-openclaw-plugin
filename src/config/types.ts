/**
 * Configuration types for xiaozhi-openclaw plugin
 */

import type { XiaozhiPluginConfig } from "../types.js";

export type { XiaozhiPluginConfig };

// Default configuration values
export const DEFAULT_CONFIG: XiaozhiPluginConfig = {
  serverUrl: "ws://localhost:8080/ws",
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
};

// Configuration validation result
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}
