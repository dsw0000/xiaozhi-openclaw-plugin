/**
 * Xiaozhi Channel Plugin Definition
 * Implements the ChannelPlugin interface for xiaozhi (小智) ESP32 devices
 */

import {
  applyAccountNameToChannelSection,
  buildChannelConfigSchema,
  DEFAULT_ACCOUNT_ID,
  deleteAccountFromConfigSection,
  formatPairingApproveHint,
  normalizeAccountId,
  setAccountEnabledInConfigSection,
  type ChannelPlugin,
} from "openclaw/plugin-sdk";
import type { ResolvedXiaozhiAccount, XiaozhiConfig } from "./types.js";
import {
  listXiaozhiAccountIds,
  resolveDefaultXiaozhiAccountId,
  resolveXiaozhiAccount,
} from "./accounts.js";

// Zod schema for config validation
const XiaozhiConfigSchema = {
  type: "object" as const,
  properties: {
    serverUrl: { type: "string" },
    authToken: { type: "string" },
    reconnectInterval: { type: "number", default: 5000 },
    maxReconnectAttempts: { type: "number", default: 10 },
    heartbeatInterval: { type: "number", default: 30000 },
  },
};

// Channel metadata
const meta = {
  id: "xiaozhi",
  label: "Xiaozhi",
  selectionLabel: "Xiaozhi (小智)",
  docsPath: "/channels/xiaozhi",
  blurb: "Xiaozhi ESP32 devices with voice, messaging, and IoT control",
  order: 80,
};

export const xiaozhiPlugin: ChannelPlugin<ResolvedXiaozhiAccount> = {
  id: "xiaozhi",
  meta,

  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    reactions: false,
    polls: false,
    edit: false,
    unsend: false,
    reply: false,
  },

  reload: { configPrefixes: ["channels.xiaozhi"] },

  configSchema: buildChannelConfigSchema(XiaozhiConfigSchema),

  // Account management
  config: {
    listAccountIds: (cfg) => listXiaozhiAccountIds(cfg),
    resolveAccount: (cfg, accountId) => resolveXiaozhiAccount({ cfg, accountId }),
    defaultAccountId: (cfg) => resolveDefaultXiaozhiAccountId(cfg),
    setAccountEnabled: ({ cfg, accountId, enabled }) =>
      setAccountEnabledInConfigSection({
        cfg,
        sectionKey: "xiaozhi",
        accountId,
        enabled,
        allowTopLevel: true,
      }),
    deleteAccount: ({ cfg, accountId }) =>
      deleteAccountFromConfigSection({
        cfg,
        sectionKey: "xiaozhi",
        accountId,
        clearBaseFields: ["name", "serverUrl", "authToken"],
      }),
    isConfigured: (account) => account.configured,
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: account.configured,
      baseUrl: account.serverUrl,
    }),
    resolveAllowFrom: ({ cfg, accountId }) =>
      resolveXiaozhiAccount({ cfg, accountId }).config.dm?.allowFrom ?? [],
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom.map((entry) => String(entry).trim().toLowerCase()),
  },

  // Security / DM policy
  security: {
    resolveDmPolicy: ({ account }) => ({
      policy: account.config.dm?.policy ?? "pairing",
      allowFrom: account.config.dm?.allowFrom ?? [],
      allowFromPath: "channels.xiaozhi.dm.allowFrom",
      approveHint: formatPairingApproveHint("xiaozhi"),
      normalizeEntry: (raw) => raw.replace(/^xiaozhi:/i, ""),
    }),
    collectWarnings: () => [],
  },

  // Group settings
  groups: {
    resolveRequireMention: ({ cfg }) => cfg.channels?.xiaozhi?.groupRequireMention ?? false,
    resolveToolPolicy: ({ cfg }) => cfg.channels?.xiaozhi?.groupToolPolicy ?? undefined,
  },

  // Messaging
  messaging: {
    normalizeTarget: (raw) => {
      const normalized = raw.trim().replace(/^xiaozhi:/i, "");
      return normalized || undefined;
    },
    targetResolver: {
      looksLikeId: (raw) => raw.length > 0 && raw !== "*",
      hint: "<deviceId>",
    },
  },

  // Directory (for allowlist resolution)
  directory: {
    self: async () => null,
    listPeers: async () => [],
    listGroups: async () => [],
  },

  // Allowlist resolver
  resolver: {
    resolveTargets: async ({ inputs }) => {
      return inputs.map((input) => ({
        input,
        resolved: true,
        id: input,
        name: input,
      }));
    },
  },

  // Setup / onboarding
  setup: {
    resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg,
        channelKey: "xiaozhi",
        accountId,
        name,
      }),
    validateInput: ({ input }) => {
      if (!input.serverUrl?.trim()) {
        return "Xiaozhi requires --server-url";
      }
      return null;
    },
    applyAccountConfig: ({ cfg, accountId, input }) => {
      const namedConfig = applyAccountNameToChannelSection({
        cfg,
        channelKey: "xiaozhi",
        accountId,
        name: input.name,
      });
      return {
        ...namedConfig,
        channels: {
          ...namedConfig.channels,
          xiaozhi: {
            ...namedConfig.channels?.xiaozhi,
            enabled: true,
            ...(input.serverUrl ? { serverUrl: input.serverUrl } : {}),
            ...(input.authToken ? { authToken: input.authToken } : {}),
          },
        },
      };
    },
  },

  // Outbound messaging
  outbound: {
    deliveryMode: "gateway",
    textChunkLimit: 2000,
    sendText: async () => {
      // Will be implemented in monitor.ts using the WebSocket client
      return { channel: "xiaozhi", timestamp: Date.now() };
    },
    sendMedia: async () => {
      return { channel: "xiaozhi", timestamp: Date.now() };
    },
  },

  // Status / probe
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    buildChannelSummary: ({ snapshot }) => ({
      configured: snapshot.configured ?? false,
      running: snapshot.running ?? false,
      lastError: snapshot.lastError ?? null,
    }),
    probeAccount: async () => {
      // Try to connect to the xiaozhi server
      return { ok: true };
    },
    buildAccountSnapshot: ({ account, runtime }) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: account.configured,
      running: runtime?.running ?? false,
      lastError: runtime?.lastError ?? null,
    }),
  },

  // Gateway lifecycle
  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account;
      ctx.log?.info(`[${account.accountId}] starting xiaozhi channel`);

      const { monitorXiaozhiChannel } = await import("./monitor.js");
      return monitorXiaozhiChannel({
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
        accountId: account.accountId,
        accountConfig: account.config,
      });
    },
  },
};
