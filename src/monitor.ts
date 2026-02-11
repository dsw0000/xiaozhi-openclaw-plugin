/**
 * Xiaozhi Channel Monitor
 * Handles Gateway lifecycle events and message routing for xiaozhi channel
 */

import type { PluginRuntime } from "openclaw/plugin-sdk";
import type { XiaozhiConfig } from "./types.js";
import { XiaozhiWebSocketClient } from "./client/websocket.js";

interface MonitorXiaozhiChannelParams {
  runtime: PluginRuntime;
  abortSignal: AbortSignal;
  accountId: string;
  accountConfig: XiaozhiConfig;
}

export async function monitorXiaozhiChannel(params: MonitorXiaozhiChannelParams): Promise<void> {
  const { runtime, abortSignal, accountId, accountConfig } = params;

  // Create WebSocket client
  const client = new XiaozhiWebSocketClient(accountConfig);

  // Set up event handlers
  client.on("connect", () => {
    runtime.logger.info(`[${accountId}] Connected to xiaozhi server`);
  });

  client.on("disconnect", (code, reason) => {
    runtime.logger.warn(`[${accountId}] Disconnected: ${reason}`);
  });

  client.on("error", (error) => {
    runtime.logger.error(`[${accountId}] Error: ${error.message}`);
  });

  client.on("reconnect", (attempt) => {
    runtime.logger.info(`[${accountId}] Reconnecting (attempt ${attempt})`);
  });

  client.on("reconnectFailed", () => {
    runtime.logger.warn(`[${accountId}] Reconnection failed, will continue retrying`);
  });

  client.on("message", (data) => {
    // Handle incoming messages from xiaozhi server
    handleIncomingMessage(runtime, accountId, data);
  });

  // Start connection (non-blocking)
  client.connect().catch((error) => {
    runtime.logger.warn(`[${accountId}] Initial connection failed: ${error.message}`);
    runtime.logger.info(`[${accountId}] Will retry in background`);
  });

  // Wait for abort signal
  await new Promise<void>((resolve) => {
    abortSignal.addEventListener("abort", () => {
      runtime.logger.info(`[${accountId}] Stopping xiaozhi channel monitor`);
      client.disconnect();
      resolve();
    });
  });
}

function handleIncomingMessage(runtime: PluginRuntime, accountId: string, data: unknown): void {
  // Parse message and route to OpenClaw gateway
  // This is a placeholder for future implementation of inbound message routing
  runtime.logger.debug(`[${accountId}] Received message: ${JSON.stringify(data)}`);

  // TODO: Implement message routing to OpenClaw's reply pipeline
  // This would use runtime.channel.reply.dispatchReplyFromConfig or similar
  // when the OpenClaw gateway API supports it
}

/**
 * Send a message through the xiaozhi channel
 * This can be used by the outbound adapter
 */
export async function sendXiaozhiMessage(params: {
  client: XiaozhiWebSocketClient;
  to: string;
  text: string;
  accountId: string;
  runtime: PluginRuntime;
}): Promise<{ channel: string; timestamp: number }> {
  const { client, to, text, accountId, runtime } = params;

  if (!client.isConnected()) {
    runtime.logger.warn(`[${accountId}] Not connected, message not sent`);
    throw new Error("xiaozhi 服务器当前未连接");
  }

  runtime.logger.debug(`[${accountId}] Sending message to ${to}`);

  const result = await client.callTool("xiaozhi_send_message", {
    to,
    text,
  });

  if (!result.success) {
    throw new Error(result.error ?? "Failed to send message");
  }

  return {
    channel: "xiaozhi",
    timestamp: Date.now(),
  };
}
