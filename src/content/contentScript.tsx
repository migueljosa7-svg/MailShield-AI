import React from 'react';
import ReactDOM from 'react-dom/client';
import { initGmailObserver, GmailEmailElement } from './gmailObserver';
import { SecurityBar } from './components/SecurityBar';
import { EmailRiskResult } from '../types';
import { calculateRiskScore } from '../utils/heuristics';

console.log('[MailShield AI] Content Script injected into Gmail');

// Set to keep track of mounted roots
const mountedInstances = new WeakMap<HTMLElement, ReactDOM.Root>();

/**
 * Handles newly detected open email in Gmail DOM
 */
function handleEmailDetected(detected: GmailEmailElement) {
  const { messageContainer, headerContainer, emailData } = detected;

  // Prevent duplicate injection
  if (messageContainer.querySelector('.mailshield-injected-host')) {
    return;
  }

  // Create isolated container host
  const hostElement = document.createElement('div');
  hostElement.className = 'mailshield-injected-host';

  // Attach Shadow DOM for complete CSS isolation from Gmail's styles
  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // Inject content style sheet into shadow root
  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL('contentStyle.css')
    : '/dist/contentStyle.css';
  shadowRoot.appendChild(linkEl);

  // Fallback inline basic styling in case CSS takes a moment to load
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :host { display: block; width: 100%; margin: 8px 0; z-index: 1000; }
    .loading-pulse { padding: 12px; background: #111827; border-radius: 8px; color: #38bdf8; font-family: sans-serif; font-size: 12px; }
  `;
  shadowRoot.appendChild(styleEl);

  // Mount container
  const mountPoint = document.createElement('div');
  mountPoint.className = 'mailshield-container';
  shadowRoot.appendChild(mountPoint);

  // Insert host right above or at the top of the email view
  if (headerContainer.parentNode) {
    headerContainer.parentNode.insertBefore(hostElement, headerContainer.nextSibling);
  } else {
    messageContainer.prepend(hostElement);
  }

  const reactRoot = ReactDOM.createRoot(mountPoint);
  mountedInstances.set(messageContainer, reactRoot);

  // Show immediate loading indicator
  reactRoot.render(
    <div className="loading-pulse">
      🛡️ MailShield AI: Analyzing email zero-trust signals...
    </div>
  );

  // Perform Analysis
  runEmailAnalysis(emailData, reactRoot, hostElement);
}

/**
 * Dispatches analysis through background service worker (or fallback)
 */
async function runEmailAnalysis(
  emailData: GmailEmailElement['emailData'],
  reactRoot: ReactDOM.Root,
  hostElement: HTMLElement
) {
  try {
    let result: EmailRiskResult;

    // Send to background service worker for caching & cloud verification
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: 'ANALYZE_EMAIL', payload: emailData }, (res) => {
          if (chrome.runtime.lastError || !res || !res.result) {
            resolve(null);
          } else {
            resolve(res);
          }
        });
      });

      if (response && response.result) {
        result = response.result;
      } else {
        // Fallback to local heuristic engine
        result = calculateRiskScore(emailData);
      }
    } else {
      result = calculateRiskScore(emailData);
    }

    renderDashboard(result, emailData, reactRoot, hostElement);
  } catch (err) {
    console.error('[MailShield] Analysis error:', err);
    const fallbackResult = calculateRiskScore(emailData);
    renderDashboard(fallbackResult, emailData, reactRoot, hostElement);
  }
}

function renderDashboard(
  result: EmailRiskResult,
  emailData: GmailEmailElement['emailData'],
  reactRoot: ReactDOM.Root,
  hostElement: HTMLElement
) {
  const handleRescan = () => {
    reactRoot.render(
      <div className="loading-pulse">
        🛡️ MailShield AI: Re-scanning email DOM...
      </div>
    );
    runEmailAnalysis(emailData, reactRoot, hostElement);
  };

  const handleDismiss = () => {
    reactRoot.unmount();
    hostElement.remove();
  };

  const handleReportPhishing = async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'REPORT_PHISHING', payload: { email: emailData, score: result.score } },
          () => resolve()
        );
      });
    }
  };

  const handleResolveUrl = async (url: string): Promise<string | undefined> => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'RESOLVE_URL', payload: { url } }, (res) => {
          resolve(res?.resolvedUrl || url);
        });
      });
    }
    return url;
  };

  reactRoot.render(
    <SecurityBar
      emailData={emailData}
      analysis={result}
      onRescan={handleRescan}
      onDismiss={handleDismiss}
      onReportPhishing={handleReportPhishing}
      onResolveUrl={handleResolveUrl}
    />
  );
}

// Start observing Gmail
initGmailObserver(handleEmailDetected);
