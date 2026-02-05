/**
 * WebSocket client for xiaozhi-openclaw plugin
 * Handles connection, reconnection, and JSON-RPC 2.0 communication
 */

import { WebSocket } from "ws";
import type {
  ConnectionState,
  JsonRpcRequest,
  JsonRpcResponse,
  ToolCallParams,
  ToolCallResult,
  ClientEvents,
  XiaozhiPluginConfig,
} from "../types.js";
import {
  createToolCallRequest,
  createHeartbeatRequest,
  extractToolResult,
  isErrorResponse,
  parseJsonRpcMessage,
  stringifyJsonRpcMessage,
} from "./protocol.js";

// Pending request tracking
interface PendingRequest {
  resolve: (result: ToolCallResult) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class XiaozhiWebSocketClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = "disconnected";
  private pendingRequests = new Map<number | string, PendingRequest>();
  private requestId = 0;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimer: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Partial<ClientEvents> = {};
  private isManualClose = false;

  constructor(private config: XiaozhiPluginConfig) {}

  /**
   * Register event handlers
   */
  on<K extends keyof ClientEvents>(
    event: K,
    handler: ClientEvents[K],
  ): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === "connected" && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to the xiaozhi WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve();
        return;
      }

      this.isManualClose = false;
      this.setState("connecting");

      try {
        const headers: Record<string, string> = {};
        if (this.config.authToken) {
          headers["Authorization"] = `Bearer ${this.config.authToken}`;
        }

        this.ws = new WebSocket(this.config.serverUrl, { headers });

        // Set connection timeout
        const timeoutMs = this.config.connectionTimeout ?? 10000;
        this.connectionTimer = setTimeout(() => {
          if (this.state === "connecting") {
            this.cleanup();
            const error = new Error(
              `Connection timeout after ${timeoutMs}ms`,
            );
            this.setState("error");
            this.emit("error", error);
            reject(error);
          }
        }, timeoutMs);

        this.ws.on("open", () => {
          this.clearConnectionTimer();
          this.setState("connected");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit("connect");
          resolve();
        });

        this.ws.on("message", (data: Buffer) => {
          this.handleMessage(data.toString("utf8"));
        });

        this.ws.on("error", (error: Error) => {
          this.clearConnectionTimer();
          this.setState("error");
          this.emit("error", error);
          reject(error);
        });

        this.ws.on("close", (code: number, reason: Buffer) => {
          this.clearConnectionTimer();
          const reasonStr = reason.toString("utf8");
          this.handleDisconnect(code, reasonStr);
        });
      } catch (error) {
        this.clearConnectionTimer();
        this.setState("error");
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.stopReconnect();
    this.cleanup();
    this.setState("disconnected");
  }

  /**
   * Call a tool on the xiaozhi server
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    if (!this.isConnected()) {
      return {
        success: false,
        error: "Not connected to xiaozhi server",
      };
    }

    const id = this.nextRequestId();

    return new Promise((resolve, reject) => {
      // Set up timeout for request
      const timeoutMs = 30000; // 30 second default timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Tool call timeout: ${toolName}`));
      }, timeoutMs);

      // Store pending request
      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
        timestamp: Date.now(),
      });

      // Send request
      const request = createToolCallRequest(id, toolName, args);
      this.send(request);
    });
  }

  /**
   * Get next request ID
   */
  private nextRequestId(): number {
    return ++this.requestId;
  }

  /**
   * Send a JSON-RPC request
   */
  private send(request: JsonRpcRequest): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.ws.send(stringifyJsonRpcMessage(request));
    } catch (error) {
      this.emit("error", error as Error);
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: string): void {
    const parsed = parseJsonRpcMessage(message);
    if (!parsed) {
      return;
    }

    // Handle response to a pending request
    if ("id" in parsed && "result" in parsed) {
      const response = parsed as JsonRpcResponse;
      this.handleResponse(response);
    } else if ("id" in parsed && "error" in parsed) {
      const response = parsed as JsonRpcResponse;
      this.handleResponse(response);
    } else {
      // Handle unsolicited server messages
      this.emit("message", parsed as JsonRpcResponse);
    }
  }

  /**
   * Handle JSON-RPC response
   */
  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      return;
    }

    this.pendingRequests.delete(response.id);
    const result = extractToolResult(response);
    pending.resolve(result);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(code: number, reason: string): void {
    this.stopHeartbeat();
    this.cleanup();

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error(`Connection closed: ${reason}`));
    }
    this.pendingRequests.clear();

    this.emit("disconnect", code, reason);

    // Attempt reconnection if not manual close
    if (!this.isManualClose) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts ?? 10;
    if (this.reconnectAttempts >= maxAttempts) {
      this.setState("error");
      this.emit("reconnectFailed");
      return;
    }

    this.reconnectAttempts++;
    this.setState("reconnecting");
    this.emit("reconnect", this.reconnectAttempts);

    const interval = this.config.reconnectInterval ?? 5000;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.emit("error", error);
      });
    }, interval);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    const interval = this.config.heartbeatInterval ?? 30000;
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const request = createHeartbeatRequest(this.nextRequestId());
        this.send(request);
      }
    }, interval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clear connection timer
   */
  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  /**
   * Set connection state
   */
  private setState(state: ConnectionState): void {
    this.state = state;
  }

  /**
   * Emit event
   */
  private emit<K extends keyof ClientEvents>(
    event: K,
    ...args: Parameters<ClientEvents[K]>
  ): void {
    const handler = this.eventHandlers[event];
    if (handler) {
      (handler as (...args: unknown[]) => void)(...args);
    }
  }
}
