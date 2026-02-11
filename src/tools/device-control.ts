/**
 * xiaozhi_device_control tool implementation
 * Controls IoT devices connected to the xiaozhi server
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { XiaozhiWebSocketClient } from "../client/websocket.js";

export const xiaozhiDeviceControlTool = (
  client: XiaozhiWebSocketClient,
  api: OpenClawPluginApi,
) => ({
  name: "xiaozhi_device_control",
  description:
    "Control IoT devices connected to the xiaozhi server (turn on/off, toggle, set value)",
  parameters: Type.Object({
    deviceId: Type.String({
      description: "Device identifier (e.g., 'light_01', 'switch_bedroom')",
    }),
    action: Type.Unsafe<"turn_on" | "turn_off" | "toggle" | "set_value">({
      type: "string",
      enum: ["turn_on", "turn_off", "toggle", "set_value"],
    }),
    value: Type.Optional(
      Type.Number({
        description:
          "Value to set (0-100, for use with set_value action). Example: 50 for 50% brightness",
        minimum: 0,
        maximum: 100,
      }),
    ),
  }),
  async execute(_id: string, params: Record<string, unknown>) {
    // Check connection status before executing
    if (!client.isConnected()) {
      return {
        content: [
          {
            type: "text",
            text: "xiaozhi 服务器当前未连接。请检查服务器是否运行，或等待自动重连。",
          },
        ],
        isError: true,
      };
    }

    const deviceId = params.deviceId as string;
    const action = params.action as "turn_on" | "turn_off" | "toggle" | "set_value";
    const value = params.value as number | undefined;

    if (!deviceId) {
      throw new Error("Device ID is required");
    }
    if (!action) {
      throw new Error("Action is required");
    }

    api.logger.info(`xiaozhi_device_control: device=${deviceId}, action=${action}`);

    const args: Record<string, unknown> = {
      deviceId,
      action,
    };
    if (value !== undefined) {
      args.value = value;
    }

    const result = await client.callTool("xiaozhi_device_control", args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      details: result,
    };
  },
});
