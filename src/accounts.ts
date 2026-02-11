/**
 * Account management for xiaozhi channel plugin
 * Handles account listing, resolution, and configuration
 */

import type { OpenClawConfig } from "openclaw/plugin-sdk";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "openclaw/plugin-sdk";
import type { ResolvedXiaozhiAccount, XiaozhiConfig } from "./types.js";

/**
 * List all configured xiaozhi account IDs
 */
export function listXiaozhiAccountIds(cfg: OpenClawConfig): string[] {
  const accounts = cfg.channels?.xiaozhi?.accounts;
  if (!accounts || Object.keys(accounts).length === 0) {
    // Check if top-level config exists (legacy single-account config)
    if (cfg.channels?.xiaozhi?.serverUrl) {
      return [DEFAULT_ACCOUNT_ID];
    }
    return [];
  }
  return Object.keys(accounts);
}

/**
 * Resolve xiaozhi account configuration
 * Merges base config with account-specific config
 */
export function resolveXiaozhiAccount(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
}): ResolvedXiaozhiAccount {
  const { cfg, accountId: inputAccountId } = params;
  const accountId = normalizeAccountId(inputAccountId);

  const base = cfg.channels?.xiaozhi ?? {};
  const accountEntry = base.accounts?.[accountId];

  // Merge base config with account-specific config
  const serverUrl = accountEntry?.serverUrl ?? base.serverUrl ?? "";
  const authToken = accountEntry?.authToken ?? base.authToken;
  const enabled = accountEntry?.enabled ?? base.enabled ?? false;
  const name = accountEntry?.name ?? base.name;

  // Build merged config
  const config: XiaozhiConfig = {
    serverUrl,
    authToken,
    reconnectInterval: accountEntry?.reconnectInterval ?? base.reconnectInterval ?? 5000,
    maxReconnectAttempts: accountEntry?.maxReconnectAttempts ?? base.maxReconnectAttempts ?? 10,
    heartbeatInterval: accountEntry?.heartbeatInterval ?? base.heartbeatInterval ?? 30000,
    connectionTimeout: accountEntry?.connectionTimeout ?? base.connectionTimeout ?? 10000,
    enabled,
    dm: accountEntry?.dm ?? base.dm,
  };

  return {
    accountId,
    name,
    enabled,
    configured: Boolean(serverUrl?.trim()),
    serverUrl,
    authToken,
    config,
  };
}

/**
 * Get default xiaozhi account ID from config
 */
export function resolveDefaultXiaozhiAccountId(cfg: OpenClawConfig): string {
  const accountIds = listXiaozhiAccountIds(cfg);
  if (accountIds.length === 0) {
    return DEFAULT_ACCOUNT_ID;
  }
  if (accountIds.length === 1) {
    return accountIds[0];
  }
  // Find first enabled account
  for (const accountId of accountIds) {
    const account = resolveXiaozhiAccount({ cfg, accountId });
    if (account.enabled) {
      return accountId;
    }
  }
  return DEFAULT_ACCOUNT_ID;
}
