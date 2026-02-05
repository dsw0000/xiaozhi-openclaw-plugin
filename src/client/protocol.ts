/**
 * JSON-RPC 2.0 protocol implementation for xiaozhi-openclaw communication
 */

import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcResponseSuccess,
  JsonRpcResponseError,
  ToolCallParams,
  ToolCallResult,
} from "../types.js";

// JSON-RPC 2.0 error codes
export const JsonRpcErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ServerErrorStart: -32000,
  ServerErrorEnd: -32099,
} as const;

/**
 * Create a JSON-RPC 2.0 tool call request
 */
export function createToolCallRequest(
  id: number,
  toolName: string,
  args: Record<string, unknown>,
): JsonRpcRequest {
  return {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    } as ToolCallParams,
  };
}

/**
 * Create a JSON-RPC 2.0 heartbeat request
 */
export function createHeartbeatRequest(id: number): JsonRpcRequest {
  return {
    jsonrpc: "2.0",
    id,
    method: "ping",
  };
}

/**
 * Check if a JSON-RPC response is an error response
 */
export function isErrorResponse(
  response: JsonRpcResponse,
): response is JsonRpcResponseError {
  return "error" in response;
}

/**
 * Check if a JSON-RPC response is a success response
 */
export function isSuccessResponse(
  response: JsonRpcResponse,
): response is JsonRpcResponseSuccess {
  return "result" in response;
}

/**
 * Extract tool call result from JSON-RPC response
 */
export function extractToolResult(
  response: JsonRpcResponse,
): ToolCallResult {
  if (isErrorResponse(response)) {
    return {
      success: false,
      error: response.error.message,
    };
  }

  const result = response.result;
  if (typeof result === "object" && result !== null) {
    if ("success" in result) {
      return result as ToolCallResult;
    }
    return {
      success: true,
      data: result,
    };
  }

  return {
    success: true,
    data: result,
  };
}

/**
 * Create a JSON-RPC error response
 */
export function createErrorResponse(
  id: number | string,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponseError {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

/**
 * Create a JSON-RPC success response
 */
export function createSuccessResponse(
  id: number | string,
  result: unknown,
): JsonRpcResponseSuccess {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

/**
 * Parse a JSON-RPC message from a string
 */
export function parseJsonRpcMessage(
  message: string,
): JsonRpcRequest | JsonRpcResponse | null {
  try {
    const parsed = JSON.parse(message);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      parsed.jsonrpc === "2.0"
    ) {
      return parsed as JsonRpcRequest | JsonRpcResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Stringify a JSON-RPC message
 */
export function stringifyJsonRpcMessage(
  message: JsonRpcRequest | JsonRpcResponse,
): string {
  return JSON.stringify(message);
}
