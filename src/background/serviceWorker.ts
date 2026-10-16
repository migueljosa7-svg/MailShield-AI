import { EmailData, EmailRiskResult, ExtensionMessage } from '../types';
import { calculateRiskScore } from '../utils/heuristics';
import { StorageUtil } from '../utils/storage';

console.log('[MailShield AI] Background Service Worker initialized (Manifest V3)');

// Listen for messages from Content Scripts and Popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => {
      console.error('[MailShield Worker] Error processing message:', err);
      sendResponse({ error: err.message || 'Internal extension error' });
    });

  // Return true to indicate asynchronous response
  return true;
});

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'ANALYZE_EMAIL': {
      const email = message.payload;
      const settings = await StorageUtil.getSettings();

      let result: EmailRiskResult;

      // Check cache first for sender domain reputation
      const cached = await StorageUtil.getCachedDomain(email.senderDomain);

      // Attempt cloud analysis if enabled
      if (settings.enableCloudAnalysis) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(`${settings.backendApiUrl}/api/analyze-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email),
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (response.ok) {
            const data = await response.json();
            result = data.result;
          } else {
            // Fallback to local heuristic engine
            result = calculateRiskScore(email);
          }
        } catch (e) {
          console.warn('[MailShield Worker] Backend API unavailable, utilizing local heuristic engine:', e);
          result = calculateRiskScore(email);
        }
      } else {
        // Local zero-trust heuristics
        result = calculateRiskScore(email);
      }

      // Cache domain reputation
      const rep = result.score >= 70 ? 'malicious' : result.score >= 31 ? 'suspicious' : 'safe';
      await StorageUtil.setCachedDomain(email.senderDomain, rep, result.reasons);

      // Record scan stats
      await StorageUtil.recordScan(result.score >= 70, result.score, email.subject);

      // Update badge on active tab if sender.tab is present
      if (sender.tab?.id) {
        updateBadge(sender.tab.id, result.score);
      }

      return { success: true, result };
    }

    case 'RESOLVE_URL': {
      const settings = await StorageUtil.getSettings();
      try {
        const response = await fetch(`${settings.backendApiUrl}/api/expand-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: message.payload.url })
        });
        if (response.ok) {
          const data = await response.json();
          return { success: true, ...data };
        }
      } catch (e) {
        console.warn('[MailShield Worker] Failed to resolve URL via backend:', e);
      }
      return { success: false, originalUrl: message.payload.url, resolvedUrl: message.payload.url };
    }

    case 'GET_STATS': {
      const stats = await StorageUtil.getStats();
      return { success: true, stats };
    }

    case 'GET_SETTINGS': {
      const settings = await StorageUtil.getSettings();
      return { success: true, settings };
    }

    case 'UPDATE_SETTINGS': {
      const updated = await StorageUtil.updateSettings(message.payload);
      return { success: true, settings: updated };
    }

    case 'REPORT_PHISHING': {
      const settings = await StorageUtil.getSettings();
      try {
        const response = await fetch(`${settings.backendApiUrl}/api/report-phishing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderDomain: message.payload.email.senderDomain,
            threatScore: message.payload.score,
            flaggedLinksCount: message.payload.email.links.length
          })
        });
        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        return { success: true, message: 'Report cached locally' };
      }
    }

    default:
      throw new Error('Unknown message type');
  }
}

function updateBadge(tabId: number, score: number) {
  let text = 'OK';
  let color = '#22c55e'; // Green

  if (score >= 70) {
    text = `${score}%`;
    color = '#ef4444'; // Red
  } else if (score >= 31) {
    text = `${score}%`;
    color = '#f59e0b'; // Amber
  } else {
    text = `${score}%`;
    color = '#10b981'; // Green
  }

  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}
