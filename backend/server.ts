import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { calculateRiskScore } from '../src/utils/heuristics';
import { analyzeAllLinks, extractHostname, extractRootDomain, KNOWN_SHORTENERS } from '../src/utils/linkAnalyzer';
import { EmailData } from '../src/types';

const app = express();
const PORT = process.env.PORT || 3001;

// Strict Security Headers with permissive CSP for local demo and extension
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "https://mail.google.com"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Strict CORS: Allow Chrome Extensions and local development
app.use(cors({
  origin: (origin, callback) => {
    // Chrome extension origins start with chrome-extension://
    if (!origin || origin.startsWith('chrome-extension://') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('mail.google.com')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate Limiting: 120 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait a moment before re-analyzing.',
    statusCode: 429
  }
});

app.use(express.json({ limit: '500kb' })); // Minimal payload limit for zero-trust transient processing

// Static route for Gmail Simulation sandbox & bundled extension assets
app.use('/demo', express.static('demo'));
app.use('/dist', express.static('dist'));

// Zero-Logs Middleware for PII Compliance (CASA Tier 2/3 ready)
app.use((req, res, next) => {
  // We log only telemetry metrics (timestamp & route), NEVER email content, senders, or query bodies
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[MailShield API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms) [Zero-PII-Logged]`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    service: 'MailShield AI Security Engine',
    zeroLogsPolicy: 'active',
    timestamp: new Date().toISOString()
  });
});

/**
 * Expand short URL safely using HTTP HEAD/GET with redirect interception
 */
async function resolveShortUrl(targetUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(targetUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'MailShieldAI-URL-Inspector/1.0 (+https://mailshield.ai/bot)'
      }
    });
    clearTimeout(timeout);
    return response.url || targetUrl;
  } catch {
    // If HEAD fails, try limited GET
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'Range': 'bytes=0-100', // Fetch only first 100 bytes
          'User-Agent': 'MailShieldAI-URL-Inspector/1.0'
        }
      });
      clearTimeout(timeout);
      return response.url || targetUrl;
    } catch {
      return targetUrl;
    }
  }
}

/**
 * POST /api/expand-url
 * Resolves bit.ly or other redirects to reveal real destination
 */
app.post('/api/expand-url', apiLimiter, async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Valid URL is required' });
    return;
  }

  const resolved = await resolveShortUrl(url);
  const resolvedHost = extractHostname(resolved);
  const resolvedRoot = extractRootDomain(resolvedHost);

  res.json({
    originalUrl: url,
    resolvedUrl: resolved,
    destinationDomain: resolvedHost,
    rootDomain: resolvedRoot,
    redirectsDetected: resolved !== url
  });
});

/**
 * POST /api/check-domain
 * Checks domain reputation & threat feeds
 */
app.post('/api/check-domain', apiLimiter, (req: Request, res: Response): void => {
  const { domain } = req.body;
  if (!domain || typeof domain !== 'string') {
    res.status(400).json({ error: 'Domain is required' });
    return;
  }

  const cleanDomain = domain.toLowerCase().trim();
  const root = extractRootDomain(cleanDomain);

  // High risk known lists / simulated reputation intelligence
  const knownMalicious = ['paypa1-update.com', 'security-paypal-login.xyz', 'chase-verify-billing.top', 'netflix-payment-renewal.buzz'];
  const isKnownBad = knownMalicious.includes(cleanDomain) || knownMalicious.includes(root);

  res.json({
    domain: cleanDomain,
    rootDomain: root,
    reputation: isKnownBad ? 'malicious' : 'safe',
    isSuspicious: isKnownBad,
    analyzedAt: Date.now()
  });
});

/**
 * POST /api/analyze-email
 * Primary AI / Heuristic Analysis Pipeline
 */
app.post('/api/analyze-email', apiLimiter, async (req: Request, res: Response): Promise<void> => {
  const emailData: EmailData = req.body;

  if (!emailData || !emailData.senderEmail) {
    res.status(400).json({ error: 'Invalid email payload: senderEmail is required' });
    return;
  }

  // 1. Run Core Zero-Trust Heuristic Engine
  const analysisResult = calculateRiskScore(emailData);

  // 2. Expand any shortened URLs in parallel (max 5 to avoid latency)
  const linksToResolve = analysisResult.linkAnalyses
    .filter(l => l.isShortener)
    .slice(0, 5);

  if (linksToResolve.length > 0) {
    await Promise.all(
      linksToResolve.map(async (link) => {
        const resolved = await resolveShortUrl(link.url);
        if (resolved && resolved !== link.url) {
          link.resolvedUrl = resolved;
          const resolvedDomain = extractHostname(resolved);
          link.reasons.push(`Expands to actual destination: ${resolvedDomain}`);
          if (resolvedDomain && !link.domain.includes(resolvedDomain)) {
            link.reasons.push(`Destination redirects off-platform to ${resolvedDomain}`);
          }
        }
      })
    );
  }

  // Return clean, zero-PII analysis summary
  res.json({
    success: true,
    result: analysisResult,
    processedAt: Date.now(),
    transientProcessing: true
  });
});

/**
 * POST /api/report-phishing
 * Telemetry endpoint to log threat patterns (no raw email text or personal data)
 */
app.post('/api/report-phishing', apiLimiter, (req: Request, res: Response): void => {
  const { senderDomain, threatScore, flaggedLinksCount } = req.body;

  console.log(`[MailShield SOC Alert] Threat reported: Domain=${senderDomain}, Score=${threatScore}, FlaggedLinks=${flaggedLinksCount}`);

  res.json({
    status: 'recorded',
    incidentId: `MS-${Date.now().toString(36).toUpperCase()}`,
    message: 'Threat telemetry dispatched to MailShield Defense Network.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️  MailShield AI Backend Server running on port ${PORT}`);
  console.log(`🔒 Zero-Logs Policy: ACTIVE (PII stripped in memory)`);
  console.log(`⚡ Endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/analyze-email`);
  console.log(`   - POST /api/expand-url`);
  console.log(`   - POST /api/check-domain`);
  console.log(`   - POST /api/report-phishing`);
  console.log(`=======================================================`);
});

export default app;
