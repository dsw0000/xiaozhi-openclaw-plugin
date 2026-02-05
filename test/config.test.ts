/**
 * Config schema tests for xiaozhi-openclaw plugin
 */

import { describe, it, expect } from "vitest";
import { XiaozhiPluginConfigSchema } from "../src/config/schema.js";
import { DEFAULT_CONFIG } from "../src/config/types.js";

describe("Config Schema", () => {
  describe("XiaozhiPluginConfigSchema", () => {
    it("should validate correct config", () => {
      const config = {
        serverUrl: "ws://localhost:8080/ws",
        authToken: "secret-token",
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        connectionTimeout: 10000,
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.serverUrl).toBe(config.serverUrl);
        expect(result.data.authToken).toBe(config.authToken);
        expect(result.data.reconnectInterval).toBe(5000);
        expect(result.data.maxReconnectAttempts).toBe(10);
        expect(result.data.heartbeatInterval).toBe(30000);
        expect(result.data.connectionTimeout).toBe(10000);
      }
    });

    it("should use defaults for optional fields", () => {
      const config = {
        serverUrl: "ws://localhost:8080/ws",
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reconnectInterval).toBe(5000);
        expect(result.data.maxReconnectAttempts).toBe(10);
        expect(result.data.heartbeatInterval).toBe(30000);
        expect(result.data.connectionTimeout).toBe(10000);
      }
    });

    it("should reject invalid serverUrl", () => {
      const config = {
        serverUrl: "not-a-valid-url",
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });

    it("should reject non-positive reconnectInterval", () => {
      const config = {
        serverUrl: "ws://localhost:8080/ws",
        reconnectInterval: -1000,
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });

    it("should reject non-positive maxReconnectAttempts", () => {
      const config = {
        serverUrl: "ws://localhost:8080/ws",
        maxReconnectAttempts: 0,
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });

    it("should reject non-positive heartbeatInterval", () => {
      const config = {
        serverUrl: "ws://localhost:8080/ws",
        heartbeatInterval: -1,
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });

    it("should reject non-positive connectionTimeout", () => {
      const config = {
        serverUrl: "ws://localhost:8080/ws",
        connectionTimeout: 0,
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });

    it("should reject extra fields", () => {
      const config = {
        serverUrl: "ws://localhost:8080/ws",
        extraField: "not-allowed",
      };

      const result = XiaozhiPluginConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("should have all required fields", () => {
      expect(DEFAULT_CONFIG.serverUrl).toBeDefined();
      expect(DEFAULT_CONFIG.reconnectInterval).toBeDefined();
      expect(DEFAULT_CONFIG.maxReconnectAttempts).toBeDefined();
      expect(DEFAULT_CONFIG.heartbeatInterval).toBeDefined();
      expect(DEFAULT_CONFIG.connectionTimeout).toBeDefined();
    });

    it("should have valid default values", () => {
      expect(DEFAULT_CONFIG.serverUrl).toBe("ws://localhost:8080/ws");
      expect(DEFAULT_CONFIG.reconnectInterval).toBe(5000);
      expect(DEFAULT_CONFIG.maxReconnectAttempts).toBe(10);
      expect(DEFAULT_CONFIG.heartbeatInterval).toBe(30000);
      expect(DEFAULT_CONFIG.connectionTimeout).toBe(10000);
    });

    it("should be valid according to schema", () => {
      const result = XiaozhiPluginConfigSchema.safeParse(DEFAULT_CONFIG);

      expect(result.success).toBe(true);
    });
  });
});
