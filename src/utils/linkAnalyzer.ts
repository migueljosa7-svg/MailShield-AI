import { ExtractedLink, LinkAnalysis } from '../types';

export const TRUSTED_DOMAINS = [
  'google.com',
  'classroom.google.com',
  'github.com',
  'zaragoza.es'
];

export const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'cutt.ly',
  'rebrand.ly',
  'tiny.cc',
  'rb.gy',
  'shorturl.at',
  'shorte.st',
  'adf.ly',
  'clck.ru'
]);

export const HIGH_RISK_TLDS = new Set([
  'xyz',
  'top',
  'buzz',
  'work',
  'click',
  'icu',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'rest',
  'country',
  'fit',
  'link',
  'cam',
  'sbs',
  'cfd',
  'loan',
  'racing',
  'download'
]);

export const MAJOR_BRANDS = [
  'paypal',
  'google',
  'apple',
  'microsoft',
  'amazon',
  'netflix',
  'chase',
  'wellsfargo',
  'bankofamerica',
  'citibank',
  'dhl',
  'fedex',
  'ups',
  'docusign',
  'dropbox',
  'facebook',
  'instagram',
  'meta',
  'coinbase',
  'binance',
  'stripe',
  'santander',
  'bbva',
  'correos'
];

/**
 * Checks if a domain or hostname is in the trusted platform whitelist
 */
export function isTrustedDomain(domainOrHost: string): boolean {
  if (!domainOrHost) return false;
  const clean = domainOrHost.toLowerCase().trim();
  const root = extractRootDomain(clean);
  return TRUSTED_DOMAINS.some(trusted => {
    return (
      clean === trusted ||
      clean.endsWith('.' + trusted) ||
      root === trusted ||
      root.endsWith('.' + trusted)
    );
  });
}

/**
 * Extracts normalized hostname from URL string safely
 */
export function extractHostname(rawUrl: string): string {
  try {
    let clean = rawUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Extracts root domain (e.g. "auth.paypal.com" -> "paypal.com")
 */
export function extractRootDomain(hostname: string): string {
  if (!hostname) return '';
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  // Handle co.uk, com.br, etc.
  const secondLast = parts[parts.length - 2];
  if (['co', 'com', 'org', 'net', 'edu', 'gov'].includes(secondLast) && parts.length > 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/**
 * Checks if a string looks like an IP address
 */
export function isIpAddress(hostname: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  return ipv4Regex.test(hostname);
}

/**
 * Checks for punycode or mixed Cyrillic/Greek characters commonly used in homograph attacks
 */
export function isPunycodeOrHomograph(hostname: string): boolean {
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) return true;
  const homographRegex = /[\u0400-\u04FF\u0370-\u03FF]/;
  return homographRegex.test(hostname);
}

/**
 * Checks if anchor text displays a URL that diverges from the actual target href
 * Accounts for trusted domains & official notification redirectors
 */
export function checkAnchorMismatch(anchorText: string, targetHostname: string, senderDomain?: string): boolean {
  const trimmed = anchorText.trim();
  const targetRoot = extractRootDomain(targetHostname);

  // If target hostname is verified trusted platform
  if (isTrustedDomain(targetHostname)) {
    if (senderDomain && isTrustedDomain(senderDomain)) {
      const senderRoot = extractRootDomain(senderDomain);
      // Same trusted family (e.g. classroom.google.com and notifications.google.com)
      if (senderRoot === targetRoot || (targetRoot.includes('google') && senderRoot.includes('google'))) {
        return false;
      }
      // Zaragoza / Red Zac family
      if (senderRoot.includes('zaragoza.es') && targetRoot.includes('zaragoza.es')) {
        return false;
      }
    }
  }

  // Check if anchor looks like a URL or domain
  const urlMatch = trimmed.match(/(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (urlMatch) {
    const displayedHost = urlMatch[2].toLowerCase();
    const displayedRoot = extractRootDomain(displayedHost);
    if (displayedRoot && targetRoot) {
      if (displayedRoot === targetRoot) return false;
      // Allow cross-subdomain for trusted platforms
      if (isTrustedDomain(displayedRoot) && isTrustedDomain(targetRoot)) {
        if (displayedRoot.includes('google') && targetRoot.includes('google')) return false;
        if (displayedRoot.includes('zaragoza.es') && targetRoot.includes('zaragoza.es')) return false;
      }
      return true;
    }
  }

  // Check if anchor mentions a major brand explicitly but target root is not that brand
  for (const brand of MAJOR_BRANDS) {
    if (trimmed.toLowerCase().includes(brand)) {
      if (!targetRoot.includes(brand)) {
        // Exception: If target is trusted platform aligned with brand
        if (isTrustedDomain(targetHostname) && (targetHostname.includes(brand) || targetRoot.includes(brand))) {
          return false;
        }
        return true;
      }
    }
  }

  return false;
}

/**
 * Analyzes an individual link extracted from email DOM
 */
export function analyzeLink(link: ExtractedLink, senderDomain?: string): LinkAnalysis {
  const url = link.originalUrl.trim();
  const anchorText = link.anchorText.trim();
  const hostname = extractHostname(url);
  const rootDomain = extractRootDomain(hostname);
  const reasons: string[] = [];

  const ipBased = isIpAddress(hostname);
  const isShortener = KNOWN_SHORTENERS.has(hostname) || KNOWN_SHORTENERS.has(rootDomain);
  const isLookalike = isPunycodeOrHomograph(hostname);

  // Check TLD
  const tld = hostname.split('.').pop() || '';
  const isHighRiskTld = HIGH_RISK_TLDS.has(tld);

  // Check if link target is a trusted domain
  const targetIsTrusted = isTrustedDomain(hostname);
  const senderIsTrusted = senderDomain ? isTrustedDomain(senderDomain) : false;

  // Anchor text deception (exempts official notification redirectors from trusted platforms)
  const anchorMismatch = checkAnchorMismatch(anchorText, hostname, senderDomain);

  // Brand spoofing in subdomain
  let brandSpoofedInSubdomain = false;
  if (!targetIsTrusted) {
    for (const brand of MAJOR_BRANDS) {
      if (hostname.includes(brand) && !rootDomain.startsWith(brand + '.')) {
        brandSpoofedInSubdomain = true;
        reasons.push(`Falsa marca en subdominio: dice "${brand}" pero está en "${rootDomain}"`);
        break;
      }
    }
  }

  if (ipBased) {
    reasons.push('Enlace numérico sin registrar (IP directa)');
  }

  if (isShortener) {
    reasons.push('Enlace acortador que oculta el destino real');
  }

  if (isLookalike) {
    reasons.push('Dominio con letras trampa o caracteres homógrafos (Punycode)');
  }

  if (isHighRiskTld) {
    reasons.push(`Extensión de dominio sospechosa (.${tld}) usada habitualmente en fraudes`);
  }

  if (anchorMismatch) {
    reasons.push(`El botón dice "${anchorText}", pero navega hacia "${hostname}"`);
  }

  // Check for suspicious password/banking keywords (ONLY flag on untrusted domains)
  const lowerUrl = url.toLowerCase();
  if (
    lowerUrl.includes('login') ||
    lowerUrl.includes('signin') ||
    lowerUrl.includes('verify') ||
    lowerUrl.includes('update-billing') ||
    lowerUrl.includes('secure-account')
  ) {
    if (!targetIsTrusted && (isHighRiskTld || ipBased || isShortener || brandSpoofedInSubdomain)) {
      reasons.push('Petición de claves/datos alojada en infraestructura no verificada');
    }
  }

  // Discount / exempt trusted domains from false positive suspicion
  const isSuspicious =
    !targetIsTrusted &&
    (ipBased ||
      isLookalike ||
      isHighRiskTld ||
      anchorMismatch ||
      brandSpoofedInSubdomain ||
      (isShortener && reasons.length > 1));

  return {
    url,
    anchorText: anchorText || url,
    domain: hostname || 'unknown',
    isSuspicious,
    isShortener,
    isIpAddress: ipBased,
    isLookalikeDomain: isLookalike,
    isHighRiskTld,
    anchorDomainMismatch: anchorMismatch && !targetIsTrusted,
    reasons
  };
}

/**
 * Deduplicate and batch analyze links from email DOM
 */
export function analyzeAllLinks(links: ExtractedLink[], senderDomain?: string): LinkAnalysis[] {
  const seenUrls = new Set<string>();
  const results: LinkAnalysis[] = [];

  for (const link of links) {
    if (!link.originalUrl || link.originalUrl.startsWith('mailto:') || link.originalUrl.startsWith('javascript:')) {
      continue;
    }
    if (seenUrls.has(link.originalUrl)) {
      continue;
    }
    seenUrls.add(link.originalUrl);
    results.push(analyzeLink(link, senderDomain));
  }

  return results;
}
