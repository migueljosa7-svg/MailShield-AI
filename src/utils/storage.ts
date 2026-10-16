import { CachedDomain, ExtensionStats, MailShieldSettings } from '../types';

const DEFAULT_SETTINGS: MailShieldSettings = {
  strictMode: false,
  enableCloudAnalysis: true,
  backendApiUrl: 'http://localhost:3001',
  autoScan: true,
  darkTheme: true,
};

const DOMAIN_CACHE_PREFIX = 'ms_domain_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Universal storage wrapper (supports Chrome Extension Storage & web fallback)
const isExtensionEnv = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

export const StorageUtil = {
  async getSettings(): Promise<MailShieldSettings> {
    try {
      if (isExtensionEnv) {
        const res = await chrome.storage.local.get('mailshield_settings');
        return { ...DEFAULT_SETTINGS, ...(res.mailshield_settings || {}) };
      }
      const local = localStorage.getItem('mailshield_settings');
      return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(settings: Partial<MailShieldSettings>): Promise<MailShieldSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    if (isExtensionEnv) {
      await chrome.storage.local.set({ mailshield_settings: updated });
    } else {
      localStorage.setItem('mailshield_settings', JSON.stringify(updated));
    }
    return updated;
  },

  async getStats(): Promise<ExtensionStats> {
    const fallback: ExtensionStats = { scannedCount: 0, threatsBlocked: 0 };
    try {
      if (isExtensionEnv) {
        const res = await chrome.storage.local.get('mailshield_stats');
        return res.mailshield_stats || fallback;
      }
      const local = localStorage.getItem('mailshield_stats');
      return local ? JSON.parse(local) : fallback;
    } catch {
      return fallback;
    }
  },

  async recordScan(isThreat: boolean, score: number, subject: string): Promise<ExtensionStats> {
    const stats = await this.getStats();
    stats.scannedCount += 1;
    if (isThreat || score >= 70) {
      stats.threatsBlocked += 1;
    }
    stats.lastRiskScore = score;
    stats.lastScannedSubject = subject;

    if (isExtensionEnv) {
      await chrome.storage.local.set({ mailshield_stats: stats });
    } else {
      localStorage.setItem('mailshield_stats', JSON.stringify(stats));
    }
    return stats;
  },

  async getCachedDomain(domain: string): Promise<CachedDomain | null> {
    const key = `${DOMAIN_CACHE_PREFIX}${domain.toLowerCase()}`;
    try {
      let raw: CachedDomain | null = null;
      if (isExtensionEnv) {
        const res = await chrome.storage.local.get(key);
        raw = res[key] || null;
      } else {
        const item = localStorage.getItem(key);
        raw = item ? JSON.parse(item) : null;
      }

      if (!raw) return null;
      // Check TTL (24 Hours)
      if (Date.now() - raw.timestamp > CACHE_TTL_MS) {
        await this.removeCachedDomain(domain);
        return null;
      }
      return raw;
    } catch {
      return null;
    }
  },

  async setCachedDomain(domain: string, reputation: CachedDomain['reputation'], reasons: string[]): Promise<void> {
    const key = `${DOMAIN_CACHE_PREFIX}${domain.toLowerCase()}`;
    const data: CachedDomain = {
      domain: domain.toLowerCase(),
      reputation,
      reasons,
      timestamp: Date.now()
    };
    if (isExtensionEnv) {
      await chrome.storage.local.set({ [key]: data });
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  },

  async removeCachedDomain(domain: string): Promise<void> {
    const key = `${DOMAIN_CACHE_PREFIX}${domain.toLowerCase()}`;
    if (isExtensionEnv) {
      await chrome.storage.local.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  }
};
