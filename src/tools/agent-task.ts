/**
 * xiaozhi_agent_task tool implementation
 * Execute or query agent tasks on the xiaozhi server
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { XiaozhiWebSocketClient } from "../client/websocket.js";

export const xiaozhiAgentTaskTool = (
  client: XiaozhiWebSocketClient,
  api: OpenClawPluginApi,
) => ({
  name: "xiaozhi_agent_task",
  description:
    "Execute or query agent tasks on the xiaozhi server (execute a task, check status, or cancel a task)",
  parameters: Type.Object({
    action: Type.Unsafe<"execute" | "status" | "cancel">({
      type: "string",
      enum: ["execute", "status", "cancel"],
    }),
    taskId: Type.Optional(
      Type.String({
        description:
          "Task ID (required for status and cancel actions). Example: 'task_123abc'",
      }),
    ),
    prompt: Type.Optional(
      Type.String({
        description:
          "Task prompt/instruction (required for execute action). Example: 'Summarize the latest chat history'",
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

    const action = params.action as "execute" | "status" | "cancel";
    const taskId = params.taskId as string | undefined;
    const prompt = params.prompt as string | undefined;

    if (!action) {
      throw new Error("Action is required");
    }

    if (action === "status" || action === "cancel") {
      if (!taskId) {
        throw new Error(`Task ID is required for ${action} action`);
      }
    }

    if (action === "execute" && !prompt) {
      throw new Error("Prompt is required for execute action");
    }

    api.logger.info(`xiaozhi_agent_task: action=${action}, taskId=${taskId ?? "N/A"}`);

    const args: Record<string, unknown> = {
      action,
    };
    if (taskId) {
      args.taskId = taskId;
    }
    if (prompt) {
      args.prompt = prompt;
    }

    const result = await client.callTool("xiaozhi_agent_task", args);

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
