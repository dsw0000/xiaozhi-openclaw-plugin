/**
 * xiaozhi_send_message tool implementation
 * Sends a message to a configured messaging channel
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { XiaozhiWebSocketClient } from "../client/websocket.js";

export const xiaozhiSendMessageTool = (
  client: XiaozhiWebSocketClient,
  api: OpenClawPluginApi,
) => ({
  name: "xiaozhi_send_message",
  description:
    "Send a message to a configured messaging channel (Telegram, Discord, WeChat, etc.) through the xiaozhi server",
  parameters: Type.Object({
    to: Type.String({
      description: "Recipient identifier (user ID, chat ID, phone number, etc.)",
    }),
    text: Type.String({
      description: "Message content to send",
    }),
    channel: Type.Optional(
      Type.String({
        description:
          "Channel name (telegram, discord, wechat, etc.). Uses default channel from config if not specified.",
      }),
    ),
  }),
  async execute(_id: string, params: Record<string, unknown>) {
    const to = params.to as string;
    const text = params.text as string;
    const channel = (params.channel as string | undefined) ?? undefined;

    if (!to) {
      throw new Error("Recipient (to) is required");
    }
    if (!text) {
      throw new Error("Message text is required");
    }

    api.logger.info(`xiaozhi_send_message: to=${to}, channel=${channel ?? "default"}`);

    const args: Record<string, unknown> = {
      to,
      text,
    };
    if (channel) {
      args.channel = channel;
    }

    const result = await client.callTool("xiaozhi_send_message", args);

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
