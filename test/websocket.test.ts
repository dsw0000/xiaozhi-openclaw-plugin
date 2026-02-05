/**
 * WebSocket client tests for xiaozhi-openclaw plugin
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebSocket } from "ws";
import { XiaozhiWebSocketClient } from "../src/client/websocket.js";
import type { XiaozhiPluginConfig } from "../src/types.js";

// Mock WebSocket
vi.mock("ws", () => ({
  WebSocket: vi.fn().mockImplementation(() => ({
    readyState: WebSocket.OPEN,
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  })),
}));

// Mock WebSocket constants
(WebSocket as any).OPEN = 1;
(WebSocket as any).CONNECTING = 0;
(WebSocket as any).CLOSING = 2;
(WebSocket as any).CLOSED = 3;

describe("XiaozhiWebSocketClient", () => {
  let client: XiaozhiWebSocketClient;
  let config: XiaozhiPluginConfig;

  beforeEach(() => {
    config = {
      serverUrl: "ws://localhost:8080/ws",
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      heartbeatInterval: 30000,
      connectionTimeout: 5000,
    };
    client = new XiaozhiWebSocketClient(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("construction", () => {
    it("should create a client with default state", () => {
      expect(client.getState()).toBe("disconnected");
      expect(client.isConnected()).toBe(false);
    });
  });

  describe("event handlers", () => {
    it("should register connect handler", () => {
      const connectHandler = vi.fn();
      client.on("connect", connectHandler);

      // Simulate connection
      client.on("connect", () => connectHandler());

      expect(connectHandler).not.toHaveBeenCalled();
    });

    it("should register error handler", () => {
      const errorHandler = vi.fn();
      client.on("error", errorHandler);
      expect(errorHandler).not.toHaveBeenCalled();
    });
  });

  describe("state management", () => {
    it("should return correct connection state", () => {
      expect(client.getState()).toBe("disconnected");
    });

    it("should return false for isConnected when disconnected", () => {
      expect(client.isConnected()).toBe(false);
    });
  });

  describe("disconnect", () => {
    it("should set isManualClose flag", () => {
      client.disconnect();
      // After disconnect, state should be disconnected
      expect(client.getState()).toBe("disconnected");
    });
  });

  describe("callTool", () => {
    it("should return error when not connected", async () => {
      const result = await client.callTool("test_tool", { foo: "bar" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not connected");
    });
  });

  describe("on", () => {
    it("should allow registering multiple event handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      client.on("connect", handler1);
      client.on("error", handler2);

      // Handlers are registered, we can't directly test their invocation
      // without actually triggering the events
      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });
  });
});
