/**
 * Protocol tests for xiaozhi-openclaw plugin
 */

import { describe, it, expect } from "vitest";
import {
  createToolCallRequest,
  createHeartbeatRequest,
  isErrorResponse,
  isSuccessResponse,
  extractToolResult,
  parseJsonRpcMessage,
  stringifyJsonRpcMessage,
  createErrorResponse,
  createSuccessResponse,
  JsonRpcErrorCodes,
} from "../src/client/protocol.js";

describe("Protocol", () => {
  describe("createToolCallRequest", () => {
    it("should create a valid tool call request", () => {
      const request = createToolCallRequest(1, "test_tool", { foo: "bar" });

      expect(request.jsonrpc).toBe("2.0");
      expect(request.id).toBe(1);
      expect(request.method).toBe("tools/call");
      expect(request.params).toEqual({
        name: "test_tool",
        arguments: { foo: "bar" },
      });
    });

    it("should handle empty arguments", () => {
      const request = createToolCallRequest(2, "test_tool", {});

      expect(request.params).toEqual({
        name: "test_tool",
        arguments: {},
      });
    });
  });

  describe("createHeartbeatRequest", () => {
    it("should create a valid ping request", () => {
      const request = createHeartbeatRequest(1);

      expect(request.jsonrpc).toBe("2.0");
      expect(request.id).toBe(1);
      expect(request.method).toBe("ping");
      expect(request.params).toBeUndefined();
    });
  });

  describe("isErrorResponse / isSuccessResponse", () => {
    it("should identify error responses", () => {
      const errorResponse = {
        jsonrpc: "2.0" as const,
        id: 1,
        error: { code: -32000, message: "Server error" },
      };

      expect(isErrorResponse(errorResponse)).toBe(true);
      expect(isSuccessResponse(errorResponse)).toBe(false);
    });

    it("should identify success responses", () => {
      const successResponse = {
        jsonrpc: "2.0" as const,
        id: 1,
        result: { success: true, data: { foo: "bar" } },
      };

      expect(isSuccessResponse(successResponse)).toBe(true);
      expect(isErrorResponse(successResponse)).toBe(false);
    });
  });

  describe("extractToolResult", () => {
    it("should extract success result with data", () => {
      const response = {
        jsonrpc: "2.0" as const,
        id: 1,
        result: { success: true, data: { messageId: "msg_123" } },
      };

      const result = extractToolResult(response);

      expect(result).toEqual({
        success: true,
        data: { messageId: "msg_123" },
      });
    });

    it("should extract success result without data field", () => {
      const response = {
        jsonrpc: "2.0" as const,
        id: 1,
        result: { foo: "bar" },
      };

      const result = extractToolResult(response);

      expect(result).toEqual({
        success: true,
        data: { foo: "bar" },
      });
    });

    it("should extract error result", () => {
      const response = {
        jsonrpc: "2.0" as const,
        id: 1,
        error: { code: -32000, message: "Tool execution failed" },
      };

      const result = extractToolResult(response);

      expect(result).toEqual({
        success: false,
        error: "Tool execution failed",
      });
    });
  });

  describe("createErrorResponse", () => {
    it("should create a valid error response", () => {
      const response = createErrorResponse(1, JsonRpcErrorCodes.INVALID_PARAMS, "Invalid parameters", { details: "Missing required field" });

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(1);
      expect(response.error).toEqual({
        code: JsonRpcErrorCodes.INVALID_PARAMS,
        message: "Invalid parameters",
        data: { details: "Missing required field" },
      });
    });

    it("should create error response without data", () => {
      const response = createErrorResponse(2, JsonRpcErrorCodes.INTERNAL_ERROR, "Internal error");

      expect(response.error.data).toBeUndefined();
    });
  });

  describe("createSuccessResponse", () => {
    it("should create a valid success response", () => {
      const result = { success: true, data: { id: "123" } };
      const response = createSuccessResponse(1, result);

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(1);
      expect(response.result).toEqual(result);
    });
  });

  describe("parseJsonRpcMessage", () => {
    it("should parse valid request", () => {
      const message = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "test", arguments: {} },
      });

      const parsed = parseJsonRpcMessage(message);

      expect(parsed).not.toBeNull();
      expect(parsed?.jsonrpc).toBe("2.0");
    });

    it("should parse valid response", () => {
      const message = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: { success: true },
      });

      const parsed = parseJsonRpcMessage(message);

      expect(parsed).not.toBeNull();
      expect(parsed?.jsonrpc).toBe("2.0");
    });

    it("should return null for invalid JSON", () => {
      const parsed = parseJsonRpcMessage("not json");

      expect(parsed).toBeNull();
    });

    it("should return null for missing jsonrpc version", () => {
      const message = JSON.stringify({ id: 1, method: "test" });

      const parsed = parseJsonRpcMessage(message);

      expect(parsed).toBeNull();
    });
  });

  describe("stringifyJsonRpcMessage", () => {
    it("should stringify request message", () => {
      const request = {
        jsonrpc: "2.0" as const,
        id: 1,
        method: "ping",
      };

      const stringified = stringifyJsonRpcMessage(request);
      const parsed = JSON.parse(stringified);

      expect(parsed).toEqual(request);
    });

    it("should stringify response message", () => {
      const response = {
        jsonrpc: "2.0" as const,
        id: 1,
        result: { success: true },
      };

      const stringified = stringifyJsonRpcMessage(response);
      const parsed = JSON.parse(stringified);

      expect(parsed).toEqual(response);
    });
  });
});
