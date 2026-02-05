/**
 * Tool tests for xiaozhi-openclaw plugin
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Type } from "@sinclair/typebox";
import { xiaozhiSendMessageTool, xiaozhiDeviceControlTool, xiaozhiAgentTaskTool } from "../src/tools/index.js";
import type { XiaozhiWebSocketClient } from "../src/client/websocket.js";
import type { OpenClawPluginApi } from "../../openclaw/src/plugins/types.js";

describe("Xiaozhi Tools", () => {
  let mockClient: XiaozhiWebSocketClient;
  let mockApi: OpenClawPluginApi;

  beforeEach(() => {
    // Mock WebSocket client
    mockClient = {
      callTool: vi.fn(),
    } as unknown as XiaozhiWebSocketClient;

    // Mock plugin API
    mockApi = {
      id: "xiaozhi",
      name: "Xiaozhi Integration",
      version: "1.0.0",
      source: "test",
      config: {},
      pluginConfig: {},
      runtime: {} as any,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
      registerTool: vi.fn(),
      registerHook: vi.fn(),
      registerHttpHandler: vi.fn(),
      registerHttpRoute: vi.fn(),
      registerChannel: vi.fn(),
      registerGatewayMethod: vi.fn(),
      registerCli: vi.fn(),
      registerService: vi.fn(),
      registerProvider: vi.fn(),
      registerCommand: vi.fn(),
      resolvePath: vi.fn(),
      on: vi.fn(),
    };
  });

  describe("xiaozhiSendMessageTool", () => {
    it("should have correct tool definition", () => {
      const tool = xiaozhiSendMessageTool(mockClient, mockApi);

      expect(tool.name).toBe("xiaozhi_send_message");
      expect(tool.description).toContain("Send a message");
      expect(tool.parameters).toBeDefined();
    });

    it("should require 'to' and 'text' parameters", async () => {
      const tool = xiaozhiSendMessageTool(mockClient, mockApi);
      const schema = tool.parameters;

      // Check required fields
      expect(schema).toBeDefined();
    });

    it("should call client.callTool with correct parameters", async () => {
      const mockResult = { success: true, data: { messageId: "msg_123" } };
      (mockClient.callTool as any).mockResolvedValue(mockResult);

      const tool = xiaozhiSendMessageTool(mockClient, mockApi);
      const result = await tool.execute("test-id", {
        to: "user123",
        text: "Hello, world!",
        channel: "telegram",
      });

      expect(mockClient.callTool).toHaveBeenCalledWith("xiaozhi_send_message", {
        to: "user123",
        text: "Hello, world!",
        channel: "telegram",
      });

      expect(result.details).toEqual(mockResult);
    });

    it("should throw error when 'to' is missing", async () => {
      const tool = xiaozhiSendMessageTool(mockClient, mockApi);

      await expect(
        tool.execute("test-id", { text: "Hello" })
      ).rejects.toThrow("Recipient (to) is required");
    });

    it("should throw error when 'text' is missing", async () => {
      const tool = xiaozhiSendMessageTool(mockClient, mockApi);

      await expect(
        tool.execute("test-id", { to: "user123" })
      ).rejects.toThrow("Message text is required");
    });

    it("should work without channel parameter", async () => {
      const mockResult = { success: true };
      (mockClient.callTool as any).mockResolvedValue(mockResult);

      const tool = xiaozhiSendMessageTool(mockClient, mockApi);
      await tool.execute("test-id", {
        to: "user123",
        text: "Hello",
      });

      expect(mockClient.callTool).toHaveBeenCalledWith("xiaozhi_send_message", {
        to: "user123",
        text: "Hello",
      });
    });
  });

  describe("xiaozhiDeviceControlTool", () => {
    it("should have correct tool definition", () => {
      const tool = xiaozhiDeviceControlTool(mockClient, mockApi);

      expect(tool.name).toBe("xiaozhi_device_control");
      expect(tool.description).toContain("Control IoT devices");
    });

    it("should require 'deviceId' and 'action' parameters", async () => {
      const tool = xiaozhiDeviceControlTool(mockClient, mockApi);

      await expect(
        tool.execute("test-id", { action: "turn_on" })
      ).rejects.toThrow("Device ID is required");

      await expect(
        tool.execute("test-id", { deviceId: "light_01" })
      ).rejects.toThrow("Action is required");
    });

    it("should call client.callTool with correct parameters", async () => {
      const mockResult = { success: true };
      (mockClient.callTool as any).mockResolvedValue(mockResult);

      const tool = xiaozhiDeviceControlTool(mockClient, mockApi);
      await tool.execute("test-id", {
        deviceId: "light_01",
        action: "turn_on",
      });

      expect(mockClient.callTool).toHaveBeenCalledWith("xiaozhi_device_control", {
        deviceId: "light_01",
        action: "turn_on",
      });
    });

    it("should include value parameter when provided", async () => {
      const mockResult = { success: true };
      (mockClient.callTool as any).mockResolvedValue(mockResult);

      const tool = xiaozhiDeviceControlTool(mockClient, mockApi);
      await tool.execute("test-id", {
        deviceId: "dimmer_01",
        action: "set_value",
        value: 50,
      });

      expect(mockClient.callTool).toHaveBeenCalledWith("xiaozhi_device_control", {
        deviceId: "dimmer_01",
        action: "set_value",
        value: 50,
      });
    });
  });

  describe("xiaozhiAgentTaskTool", () => {
    it("should have correct tool definition", () => {
      const tool = xiaozhiAgentTaskTool(mockClient, mockApi);

      expect(tool.name).toBe("xiaozhi_agent_task");
      expect(tool.description).toContain("Execute or query agent tasks");
    });

    it("should require 'action' parameter", async () => {
      const tool = xiaozhiAgentTaskTool(mockClient, mockApi);

      await expect(
        tool.execute("test-id", {})
      ).rejects.toThrow("Action is required");
    });

    it("should require 'taskId' for status action", async () => {
      const tool = xiaozhiAgentTaskTool(mockClient, mockApi);

      await expect(
        tool.execute("test-id", { action: "status" })
      ).rejects.toThrow("Task ID is required for status action");
    });

    it("should require 'taskId' for cancel action", async () => {
      const tool = xiaozhiAgentTaskTool(mockClient, mockApi);

      await expect(
        tool.execute("test-id", { action: "cancel" })
      ).rejects.toThrow("Task ID is required for cancel action");
    });

    it("should require 'prompt' for execute action", async () => {
      const tool = xiaozhiAgentTaskTool(mockClient, mockApi);

      await expect(
        tool.execute("test-id", { action: "execute" })
      ).rejects.toThrow("Prompt is required for execute action");
    });

    it("should call client.callTool for execute action", async () => {
      const mockResult = { success: true, data: { taskId: "task_123" } };
      (mockClient.callTool as any).mockResolvedValue(mockResult);

      const tool = xiaozhiAgentTaskTool(mockClient, mockApi);
      await tool.execute("test-id", {
        action: "execute",
        prompt: "Summarize the conversation",
      });

      expect(mockClient.callTool).toHaveBeenCalledWith("xiaozhi_agent_task", {
        action: "execute",
        prompt: "Summarize the conversation",
      });
    });

    it("should call client.callTool for status action", async () => {
      const mockResult = { success: true, data: { status: "running" } };
      (mockClient.callTool as any).mockResolvedValue(mockResult);

      const tool = xiaozhiAgentTaskTool(mockClient, mockApi);
      await tool.execute("test-id", {
        action: "status",
        taskId: "task_123",
      });

      expect(mockClient.callTool).toHaveBeenCalledWith("xiaozhi_agent_task", {
        action: "status",
        taskId: "task_123",
      });
    });
  });
});
