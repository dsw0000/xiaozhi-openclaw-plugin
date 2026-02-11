/**
 * Shared types for xiaozhi-openclaw plugin
 */

// Forward declare to avoid circular import
export interface XiaozhiWebSocketClientLike {
  isConnected(): boolean;
}

// JSON-RPC 2.0 Request
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: unknown;
}

// JSON-RPC 2.0 Response (success)
export interface JsonRpcResponseSuccess {
  jsonrpc: "2.0";
  id: number | string;
  result: unknown;
}

// JSON-RPC 2.0 Response (error)
export interface JsonRpcResponseError {
  jsonrpc: "2.0";
  id: number | string;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse = JsonRpcResponseSuccess | JsonRpcResponseError;

// Tool call request params
export interface ToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

// Tool call result
export interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// WebSocket client state
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

// WebSocket client events
export interface ClientEvents {
  connect: () => void;
  disconnect: (code: number, reason: string) => void;
  error: (error: Error) => void;
  message: (message: JsonRpcRequest | JsonRpcResponse) => void;
  reconnect: (attempt: number) => void;
  reconnectFailed: () => void;
}

// Plugin configuration (for tool plugin mode)
export interface XiaozhiPluginConfig {
  serverUrl: string;
  authToken?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

// Channel configuration (for channel plugin mode)
export interface XiaozhiConfig {
  serverUrl: string;
  authToken?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
  enabled?: boolean;
  dm?: {
    policy?: string;
    allowFrom?: string[];
  };
}

// Resolved xiaozhi account (for channel plugin)
export interface ResolvedXiaozhiAccount {
  accountId: string;
  name?: string;
  enabled?: boolean;
  configured: boolean;
  serverUrl: string;
  authToken?: string;
  config: XiaozhiConfig;
}

// Xiaozhi runtime state (for channel plugin)
export interface XiaozhiRuntimeState {
  accountId: string;
  running: boolean;
  lastStartAt: number | null;
  lastStopAt: number | null;
  lastError: string | null;
  client?: XiaozhiWebSocketClientLike | null;
}
