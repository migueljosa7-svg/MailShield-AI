import { EmailData, ExtractedLink } from '../types';

export interface GmailEmailElement {
  messageContainer: HTMLElement;
  headerContainer: HTMLElement;
  emailData: EmailData;
}

/**
 * Robust extraction of email metadata from Gmail DOM
 */
export function extractEmailFromDOM(messageElement: HTMLElement): EmailData | null {
  try {
    // 1. Sender extraction
    // Gmail uses span.gD with attributes email="..." and name="..."
    const senderSpan = messageElement.querySelector('span.gD, span[email], .zF') as HTMLElement | null;
    let senderEmail = '';
    let senderName = '';

    if (senderSpan) {
      senderEmail = senderSpan.getAttribute('email') || senderSpan.getAttribute('data-hovercard-id') || '';
      senderName = senderSpan.getAttribute('name') || senderSpan.innerText.trim() || '';
    }

    // Fallback: look in table rows or surrounding header
    if (!senderEmail) {
      const emailMatch = messageElement.innerText.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
      if (emailMatch) {
        senderEmail = emailMatch[1];
      }
    }

    if (!senderEmail) {
      return null; // Not an active open email view
    }

    const senderDomain = senderEmail.includes('@') ? senderEmail.split('@')[1].toLowerCase().trim() : '';

    // 2. Subject Line
    // Gmail subject heading is usually h2.hP or at thread top
    let subject = '';
    const subjectEl = document.querySelector('h2.hP, .ha h2') as HTMLElement | null;
    if (subjectEl) {
      subject = subjectEl.innerText.trim();
    } else {
      // Fallback: look for subject in container
      const sub = messageElement.querySelector('.bog, .bqe') as HTMLElement | null;
      if (sub) subject = sub.innerText.trim();
    }

    // 3. Body container
    // Gmail message body is typically inside div.a3s.aiL or .ii.gt
    const bodyEl = messageElement.querySelector('.a3s.aiL, .ii.gt, div[dir="ltr"]') as HTMLElement | null;
    const bodyText = bodyEl ? bodyEl.innerText.slice(0, 3000) : '';

    // 4. Links & CTA Buttons extraction
    const links: ExtractedLink[] = [];
    if (bodyEl) {
      const anchorElements = bodyEl.querySelectorAll('a[href]');
      anchorElements.forEach((anchor) => {
        const href = anchor.getAttribute('href') || '';
        const text = (anchor as HTMLElement).innerText.trim() || anchor.getAttribute('aria-label') || '';
        
        // Check if button-like appearance
        const isButton = anchor.classList.contains('button') || 
                         anchor.getAttribute('role') === 'button' || 
                         anchor.parentElement?.tagName === 'BUTTON' ||
                         anchor.getAttribute('style')?.includes('background') || false;

        if (href && !href.startsWith('mailto:') && !href.startsWith('#')) {
          links.push({
            originalUrl: href,
            anchorText: text || href,
            isButton
          });
        }
      });
    }

    // 5. Reply-To header detection (if expanded headers exist in DOM)
    let replyTo: string | undefined = undefined;
    const replyToEl = messageElement.querySelector('.ajy, [data-tooltip*="Reply-to"], tr.reply-to') as HTMLElement | null;
    if (replyToEl) {
      const m = replyToEl.innerText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (m) replyTo = m[1];
    }

    return {
      senderName: senderName || senderEmail.split('@')[0],
      senderEmail,
      senderDomain,
      replyTo,
      subject: subject || 'No Subject',
      bodySnippet: bodyText,
      links
    };
  } catch (err) {
    console.error('[MailShield] DOM extraction error:', err);
    return null;
  }
}

/**
 * Initializes safe, debounced Gmail DOM observer
 */
export function initGmailObserver(onEmailDetected: (detected: GmailEmailElement) => void) {
  const processedContainers = new WeakSet<HTMLElement>();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function scanForOpenEmails() {
    // Gmail expanded email threads have class .adn.ads or role="listitem"
    const messageContainers = document.querySelectorAll<HTMLElement>('.adn.ads, .gE.iv.gt, div[role="main"] .gs');

    messageContainers.forEach((container) => {
      if (processedContainers.has(container)) {
        return;
      }

      // Check if this container is visible and represents an open email
      const headerArea = container.querySelector('.gE.iv.gt, .ha, .adn') as HTMLElement || container;
      const emailData = extractEmailFromDOM(container);

      if (emailData && emailData.senderEmail) {
        processedContainers.add(container);
        onEmailDetected({
          messageContainer: container,
          headerContainer: headerArea,
          emailData
        });
      }
    });
  }

  // Use MutationObserver for zero-lag SPA reaction
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Use requestIdleCallback if available for optimal browser performance
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
          scanForOpenEmails();
        });
      } else {
        scanForOpenEmails();
      }
    }, 250);
  });

  // Observe Gmail body mutations
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also hook URL / history changes
  window.addEventListener('hashchange', () => setTimeout(scanForOpenEmails, 300));
  window.addEventListener('popstate', () => setTimeout(scanForOpenEmails, 300));

  // Initial trigger
  setTimeout(scanForOpenEmails, 600);

  return () => {
    observer.disconnect();
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}
