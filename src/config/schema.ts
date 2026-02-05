/**
 * Zod schema for plugin configuration validation
 */

import { z } from "zod";

export const XiaozhiPluginConfigSchema = z
  .object({
    serverUrl: z.string().url("serverUrl must be a valid WebSocket URL"),
    authToken: z.string().optional(),
    reconnectInterval: z
      .number()
      .int()
      .positive()
      .default(5000)
      .describe("Reconnection interval in milliseconds"),
    maxReconnectAttempts: z
      .number()
      .int()
      .positive()
      .default(10)
      .describe("Maximum number of reconnection attempts"),
    heartbeatInterval: z
      .number()
      .int()
      .positive()
      .default(30000)
      .describe("Heartbeat interval in milliseconds"),
    connectionTimeout: z
      .number()
      .int()
      .positive()
      .default(10000)
      .describe("Connection timeout in milliseconds"),
  })
  .strict();

export type XiaozhiPluginConfigInput = z.input<typeof XiaozhiPluginConfigSchema>;
export type XiaozhiPluginConfigOutput = z.output<typeof XiaozhiPluginConfigSchema>;
