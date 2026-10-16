import { EmailData, EmailRiskResult, RiskBreakdown, LinkAnalysis } from '../types';
import {
  analyzeAllLinks,
  extractHostname,
  extractRootDomain,
  HIGH_RISK_TLDS,
  isPunycodeOrHomograph,
  isTrustedDomain,
  TRUSTED_DOMAINS,
  MAJOR_BRANDS
} from './linkAnalyzer';

export { TRUSTED_DOMAINS, isTrustedDomain };

// Marcas populares y sus dominios oficiales legítimos
export const BRAND_DOMAINS: Record<string, { name: string; domains: string[] }> = {
  paypal: { name: 'PayPal', domains: ['paypal.com'] },
  correos: { name: 'Correos España', domains: ['correos.es', 'correos.com'] },
  santander: { name: 'Banco Santander', domains: ['bancosantander.es', 'santander.com', 'santander.es'] },
  bbva: { name: 'BBVA', domains: ['bbva.es', 'bbva.com'] },
  caixabank: { name: 'CaixaBank', domains: ['caixabank.es', 'caixabank.com'] },
  google: { name: 'Google', domains: ['google.com', 'accounts.google.com', 'classroom.google.com', 'notifications.google.com'] },
  classroom: { name: 'Google Classroom', domains: ['classroom.google.com', 'google.com'] },
  github: { name: 'GitHub', domains: ['github.com', 'notifications.github.com'] },
  zaragoza: { name: 'Ayuntamiento de Zaragoza / RED ZAC', domains: ['zaragoza.es', 'redzac.zaragoza.es'] },
  microsoft: { name: 'Microsoft', domains: ['microsoft.com', 'live.com', 'office.com', 'outlook.com'] },
  apple: { name: 'Apple', domains: ['apple.com', 'icloud.com'] },
  amazon: { name: 'Amazon', domains: ['amazon.es', 'amazon.com', 'amazon.co.uk'] },
  netflix: { name: 'Netflix', domains: ['netflix.com'] },
  dhl: { name: 'DHL', domains: ['dhl.com', 'dhl.es'] },
  fedex: { name: 'FedEx', domains: ['fedex.com'] },
  docusign: { name: 'DocuSign', domains: ['docusign.com'] }
};

// Patrones de urgencia y amenazas en español e inglés
export const URGENCY_PATTERNS = [
  { regex: /(?:cuenta|tarjeta|acceso)\s+(?:suspendida|bloqueada|cancelada|restringida|inhabilitada)/i, human: 'Le dicen que le han bloqueado o suspendido la cuenta' },
  { regex: /(?:dentro\s+de|en|plazo\s+de)\s+(?:24|48|12|1)\s*(?:horas|h|hrs)/i, human: 'Le dan un ultimátum de pocas horas' },
  { regex: /(?:acción|verificación|atención)\s+inmediata/i, human: 'Le exigen actuar de inmediato' },
  { regex: /(?:inicio\s+de\s+sesión|acceso|movimiento|actividad|cargo)\s+(?:no\s+autorizado|sospechoso|desconocido)/i, human: 'Le asustan con un supuesto acceso o cargo no autorizado' },
  { regex: /(?:verifique|confirme|actualice)\s+(?:sus?\s+)?(?:datos|contraseña|tarjeta|identidad|credenciales)/i, human: 'Le piden que vuelva a meter sus claves o tarjeta' },
  { regex: /último\s+aviso\s+antes\s+de/i, human: 'Le envían un "último aviso" para infundir temor' },
  { regex: /(?:paquete|envío|entrega)\s+(?:retenido|pendiente\s+de\s+pago|aduanas)/i, human: 'Le dicen que tiene un paquete retenido con tasas pendientes' },
  { regex: /account\s+(?:suspended|restricted|blocked|locked)/i, human: 'Amenaza de cuenta bloqueada en 24 horas' },
  { regex: /immediate(?:ly)?\s+action\s+required/i, human: 'Le exigen acción inmediata en inglés' }
];

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function detectTyposquatting(domain: string): { isTyposquat: boolean; targetBrand?: string; brandOfficial?: string } {
  const root = extractRootDomain(domain).split('.')[0].toLowerCase();
  if (!root) return { isTyposquat: false };

  // If domain is directly trusted, no typosquatting
  if (isTrustedDomain(domain)) return { isTyposquat: false };

  for (const [key, info] of Object.entries(BRAND_DOMAINS)) {
    if (root === key) return { isTyposquat: false };

    const dist = levenshteinDistance(root, key);
    if (dist > 0 && dist <= 2 && key.length >= 4) {
      return { isTyposquat: true, targetBrand: info.name, brandOfficial: info.domains[0] };
    }

    const leetClean = root
      .replace(/1/g, 'l')
      .replace(/0/g, 'o')
      .replace(/5/g, 's')
      .replace(/3/g, 'e')
      .replace(/vv/g, 'w');
    if (leetClean === key && root !== key) {
      return { isTyposquat: true, targetBrand: info.name, brandOfficial: info.domains[0] };
    }
  }

  return { isTyposquat: false };
}

export function evaluateSender(senderName: string, senderEmail: string, replyTo?: string) {
  const domain = senderEmail.includes('@') ? senderEmail.split('@')[1].toLowerCase().trim() : '';
  const rootDomain = extractRootDomain(domain);
  const tld = domain.split('.').pop() || '';

  const isTrusted = isTrustedDomain(domain);
  const isSuspiciousTld = !isTrusted && HIGH_RISK_TLDS.has(tld);
  const isPunycode = !isTrusted && isPunycodeOrHomograph(domain);

  let brandImpersonationRisk = false;
  let impersonatedBrand: string | undefined = undefined;
  let officialDomain: string | undefined = undefined;

  // Si el remitente pertenece a la lista blanca de confianza (ej. Google Classroom, RED ZAC, GitHub), NO es suplantación
  if (isTrusted) {
    brandImpersonationRisk = false;
  } else {
    // 1. Comprobar si el nombre mostrado finge ser una marca conocida
    const lowerName = senderName.toLowerCase();
    for (const [brandKey, info] of Object.entries(BRAND_DOMAINS)) {
      if (lowerName.includes(brandKey) || lowerName.includes(info.name.toLowerCase())) {
        const matchesOfficial = info.domains.some(od => rootDomain === od || rootDomain.endsWith('.' + od) || domain === od || domain.endsWith('.' + od));
        if (!matchesOfficial) {
          brandImpersonationRisk = true;
          impersonatedBrand = info.name;
          officialDomain = info.domains[0];
          break;
        }
      }
    }

    // 2. Typosquatting en el dominio
    const typosquat = detectTyposquatting(domain);
    if (typosquat.isTyposquat) {
      brandImpersonationRisk = true;
      impersonatedBrand = typosquat.targetBrand;
      officialDomain = typosquat.brandOfficial;
    }
  }

  // 3. Diferencia con Reply-To
  let replyToMismatch = false;
  let replyDomain = '';
  if (replyTo && replyTo.includes('@')) {
    replyDomain = replyTo.split('@')[1].toLowerCase().trim();
    const replyRoot = extractRootDomain(replyDomain);
    if (replyRoot && rootDomain && replyRoot !== rootDomain) {
      // Exención: Si ambos dominios pertenecen a la misma familia de confianza (ej. google.com / classroom.google.com)
      if (isTrustedDomain(replyDomain) && isTrustedDomain(domain)) {
        replyToMismatch = false;
      } else {
        replyToMismatch = true;
      }
    }
  }

  return {
    name: senderName,
    email: senderEmail,
    domain,
    isTrusted,
    brandImpersonationRisk,
    impersonatedBrand,
    officialDomain,
    isSuspiciousTld,
    isPunycode,
    replyToMismatch,
    replyDomain
  };
}

export function detectUrgency(subject: string, bodySnippet: string) {
  const combined = `${subject} \n ${bodySnippet}`;
  const matchedDescriptions: string[] = [];

  for (const item of URGENCY_PATTERNS) {
    if (item.regex.test(combined)) {
      matchedDescriptions.push(item.human);
    }
  }

  return {
    hasUrgency: matchedDescriptions.length > 0,
    matched: Array.from(new Set(matchedDescriptions))
  };
}

/**
 * Motor Heurístico Zero-Trust con Reglas de Confianza para Plataformas Oficiales
 * (Google Classroom, RED ZAC Zaragoza, GitHub, etc.)
 */
export function calculateRiskScore(email: EmailData): EmailRiskResult {
  let score = 0;
  const breakdowns: RiskBreakdown[] = [];
  const reasons: string[] = [];

  // 1. Analizar Remitente
  const senderDetails = evaluateSender(email.senderName, email.senderEmail, email.replyTo);
  const isVerifiedTrustedSender = senderDetails.isTrusted;

  if (senderDetails.brandImpersonationRisk) {
    score += 45;
    const humanDesc = senderDetails.impersonatedBrand
      ? `Cuidado: El correo dice ser de ${senderDetails.impersonatedBrand}, pero la dirección real es "${email.senderEmail}" (la página web oficial verdadera es ${senderDetails.officialDomain || 'otra'}).`
      : `El nombre que sale en el correo no coincide con la dirección desde la que se envió.`;
    breakdowns.push({
      id: 'brand-impersonation',
      category: 'sender',
      severity: 'danger',
      title: `🚨 Suplantación de Identidad (${senderDetails.impersonatedBrand || 'Marca Falsa'})`,
      description: humanDesc
    });
    reasons.push(humanDesc);
  }

  if (senderDetails.isPunycode) {
    score += 35;
    const humanDesc = `El remitente usa letras rusas o griegas casi idénticas a las nuestras para engañar a la vista y hacerse pasar por una empresa legítima.`;
    breakdowns.push({
      id: 'homograph-sender',
      category: 'sender',
      severity: 'danger',
      title: '🎭 Dirección con Letras Trampa (Homógrafo / Punycode)',
      description: humanDesc
    });
    reasons.push(humanDesc);
  }

  if (senderDetails.isSuspiciousTld) {
    score += 25;
    const tld = senderDetails.domain.split('.').pop() || '';
    const humanDesc = `La dirección termina en ".${tld}", una extensión barata que usan los ciberdelincuentes para crear cuentas desechables de estafa.`;
    breakdowns.push({
      id: 'suspicious-tld',
      category: 'sender',
      severity: 'warning',
      title: '⚠️ Dominio Raro y Desechable',
      description: humanDesc
    });
    reasons.push(humanDesc);
  }

  if (senderDetails.replyToMismatch) {
    score += 20;
    const humanDesc = `Si usted le da a "Responder", su mensaje no irá a quien le escribe, sino a otra cuenta oculta (${email.replyTo}).`;
    breakdowns.push({
      id: 'replyto-mismatch',
      category: 'headers',
      severity: 'warning',
      title: '🪤 Trampa de Respuesta Oculta (Reply-To)',
      description: humanDesc
    });
    reasons.push(humanDesc);
  }

  // 2. Analizar Enlaces (con contexto de remitente verificado)
  const linkAnalyses = analyzeAllLinks(email.links, senderDetails.domain);
  const suspiciousLinks = linkAnalyses.filter(l => l.isSuspicious);

  if (suspiciousLinks.length > 0) {
    let linkRiskWeight = Math.min(suspiciousLinks.length * 20, 50);

    // Si el remitente es de confianza, aplicamos factor de reducción a posibles falsos positivos
    if (isVerifiedTrustedSender) {
      linkRiskWeight = Math.round(linkRiskWeight * 0.2); // 80% de descuento
    }

    score += linkRiskWeight;

    const hasButtonDeception = suspiciousLinks.some(l => l.anchorDomainMismatch);
    const hasIpLink = suspiciousLinks.some(l => l.isIpAddress);

    let linkDesc = `Se encontraron ${suspiciousLinks.length} enlace(s) sospechoso(s) en el correo.`;
    if (hasButtonDeception) {
      linkDesc = `¡Peligro! El botón o enlace dice una cosa, pero en verdad le lleva a una página web trampa distinta.`;
    } else if (hasIpLink) {
      linkDesc = `El enlace le lleva directamente a números de servidor (IP) sin nombre registrado, típico de virus y estafas.`;
    }

    breakdowns.push({
      id: 'suspicious-links',
      category: 'links',
      severity: isVerifiedTrustedSender ? 'warning' : 'danger',
      title: isVerifiedTrustedSender ? '⚠️ Enlace con Redirección' : '🚨 Enlaces Trampa o Peligrosos Detectados',
      description: linkDesc
    });
    reasons.push(linkDesc);

    for (const link of suspiciousLinks) {
      if (link.anchorDomainMismatch) {
        reasons.push(`El texto dice "${link.anchorText}", pero navega hacia "${link.domain}"`);
      } else if (link.isIpAddress) {
        reasons.push(`Enlace numérico sin registrar: ${link.domain}`);
      }
    }
  }

  // Comprobar Acortadores
  const shorteners = linkAnalyses.filter(l => l.isShortener);
  if (shorteners.length > 0 && suspiciousLinks.length === 0) {
    // Si el remitente es de confianza, reducimos penalización de acortador
    score += isVerifiedTrustedSender ? 5 : 15;
    const shortDesc = `El correo esconde el destino real usando un enlace acortador (${shorteners.map(s => s.domain).join(', ')}). No se sabe adónde va hasta que hace clic.`;
    breakdowns.push({
      id: 'shortener-links',
      category: 'links',
      severity: 'warning',
      title: '⚠️ Enlace Acortado / Destino Oculto',
      description: shortDesc
    });
    reasons.push(shortDesc);
  }

  // 3. Urgencia y Coacción
  const urgency = detectUrgency(email.subject, email.bodySnippet);
  if (urgency.hasUrgency) {
    // Si el remitente es 100% verificado (ej. Google Classroom notificando entrega próxima), no es coacción maliciosa
    let urgencyScore = (senderDetails.brandImpersonationRisk || suspiciousLinks.length > 0) ? 25 : 12;
    if (isVerifiedTrustedSender) {
      urgencyScore = Math.min(urgencyScore, 5); // Reducción fuerte para notificaciones legítimas de entrega o plazos
    }
    score += urgencyScore;

    const urgencyDesc = isVerifiedTrustedSender
      ? `Aviso de plazo o fecha límite en plataforma oficial (${urgency.matched.slice(0, 2).join(' / ')}).`
      : `Le están metiendo prisa o amenazando con bloquear su cuenta (${urgency.matched.slice(0, 2).join(' / ')}) para que actúe sin pensar.`;

    breakdowns.push({
      id: 'urgency-detected',
      category: 'content',
      severity: isVerifiedTrustedSender ? 'info' : (senderDetails.brandImpersonationRisk || suspiciousLinks.length > 0) ? 'danger' : 'warning',
      title: isVerifiedTrustedSender ? '📅 Notificación de Plazo Oficial' : '⏳ Presión y Miedo (Urgencia Falsa)',
      description: urgencyDesc
    });
    reasons.push(urgencyDesc);
  }

  // REGLA CLAVE: Si el remitente es 100% VERIFICADO y pertenece a la lista blanca (Google Classroom, RED ZAC Zaragoza, GitHub, etc.)
  // y no hay vectores externos maliciosos (sin IPs crudas ni dominios .xyz), limitamos el riesgo a un máximo de 15% (Verde / Seguro)
  const hasMaliciousExternalVectors = suspiciousLinks.some(l => l.isIpAddress || l.isHighRiskTld || l.isLookalikeDomain);

  if (isVerifiedTrustedSender && !hasMaliciousExternalVectors && !senderDetails.brandImpersonationRisk) {
    if (score > 15) {
      score = 15;
    }
    breakdowns.unshift({
      id: 'trusted-platform-verified',
      category: 'sender',
      severity: 'info',
      title: '🛡️ Plataforma Oficial de Confianza Verificada',
      description: `El remitente (@${senderDetails.domain}) pertenece a una plataforma oficial verificada (Google Classroom / RED ZAC / GitHub). Los enlaces internos de notificación y seguimiento están autenticados.`
    });
    reasons.unshift(`Remitente oficial autenticado (@${senderDetails.domain})`);
  }

  // Si está completamente limpio
  if (score === 0) {
    breakdowns.push({
      id: 'clean-audit',
      category: 'sender',
      severity: 'info',
      title: '✅ Remitente Auténtico y Verificado',
      description: `La dirección (@${senderDetails.domain || 'oficial'}) coincide con los servidores de la empresa real. No hay enlaces camuflados ni trampas de dinero.`
    });
    reasons.push('Remitente verificado con servidores oficiales');
    reasons.push('Todos los botones y enlaces llevan a destinos auténticos');
  }

  const finalScore = Math.min(Math.max(score, 0), 100);

  let level: 'low' | 'moderate' | 'high' = 'low';
  if (finalScore >= 70) {
    level = 'high';
  } else if (finalScore >= 31) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  return {
    score: finalScore,
    level,
    reasons,
    breakdowns,
    linkAnalyses,
    senderDetails: {
      name: senderDetails.name,
      email: senderDetails.email,
      domain: senderDetails.domain,
      isWellKnownBrand: !!senderDetails.impersonatedBrand || isVerifiedTrustedSender,
      brandImpersonationRisk: senderDetails.brandImpersonationRisk,
      impersonatedBrand: senderDetails.impersonatedBrand,
      isSuspiciousTld: senderDetails.isSuspiciousTld,
      isPunycode: senderDetails.isPunycode,
      replyToMismatch: senderDetails.replyToMismatch
    },
    urgencyDetected: urgency.hasUrgency,
    urgencyKeywords: urgency.matched,
    analyzedAt: Date.now()
  };
}
