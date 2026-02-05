/**
 * Tool registration for xiaozhi-openclaw plugin
 */

import type { XiaozhiWebSocketClient } from "../client/websocket.js";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { xiaozhiSendMessageTool } from "./send-message.js";
import { xiaozhiDeviceControlTool } from "./device-control.js";
import { xiaozhiAgentTaskTool } from "./agent-task.js";

/**
 * Register all xiaozhi tools with the plugin API
 */
export function registerXiaozhiTools(
  client: XiaozhiWebSocketClient,
  api: OpenClawPluginApi,
): void {
  api.registerTool(xiaozhiSendMessageTool(client, api));
  api.registerTool(xiaozhiDeviceControlTool(client, api));
  api.registerTool(xiaozhiAgentTaskTool(client, api));
}

export { xiaozhiSendMessageTool, xiaozhiDeviceControlTool, xiaozhiAgentTaskTool };
