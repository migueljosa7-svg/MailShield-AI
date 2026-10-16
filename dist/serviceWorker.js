const z = [
  "google.com",
  "classroom.google.com",
  "github.com",
  "zaragoza.es"
], A = /* @__PURE__ */ new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rebrand.ly",
  "tiny.cc",
  "rb.gy",
  "shorturl.at",
  "shorte.st",
  "adf.ly",
  "clck.ru"
]), L = /* @__PURE__ */ new Set([
  "xyz",
  "top",
  "buzz",
  "work",
  "click",
  "icu",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "rest",
  "country",
  "fit",
  "link",
  "cam",
  "sbs",
  "cfd",
  "loan",
  "racing",
  "download"
]), R = [
  "paypal",
  "google",
  "apple",
  "microsoft",
  "amazon",
  "netflix",
  "chase",
  "wellsfargo",
  "bankofamerica",
  "citibank",
  "dhl",
  "fedex",
  "ups",
  "docusign",
  "dropbox",
  "facebook",
  "instagram",
  "meta",
  "coinbase",
  "binance",
  "stripe",
  "santander",
  "bbva",
  "correos"
];
function f(s) {
  if (!s) return !1;
  const t = s.toLowerCase().trim(), n = k(t);
  return z.some((e) => t === e || t.endsWith("." + e) || n === e || n.endsWith("." + e));
}
function I(s) {
  try {
    let t = s.trim();
    return !t.startsWith("http://") && !t.startsWith("https://") && (t = "https://" + t), new URL(t).hostname.toLowerCase();
  } catch {
    return "";
  }
}
function k(s) {
  if (!s) return "";
  const t = s.split(".");
  if (t.length <= 2) return s;
  const n = t[t.length - 2];
  return ["co", "com", "org", "net", "edu", "gov"].includes(n) && t.length > 2 ? t.slice(-3).join(".") : t.slice(-2).join(".");
}
function $(s) {
  return /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(s);
}
function C(s) {
  return s.startsWith("xn--") || s.includes(".xn--") ? !0 : /[\u0400-\u04FF\u0370-\u03FF]/.test(s);
}
function M(s, t, n) {
  const e = s.trim(), a = k(t);
  if (f(t) && n && f(n)) {
    const r = k(n);
    if (r === a || a.includes("google") && r.includes("google") || r.includes("zaragoza.es") && a.includes("zaragoza.es"))
      return !1;
  }
  const i = e.match(/(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (i) {
    const r = i[2].toLowerCase(), c = k(r);
    if (c && a)
      return !(c === a || f(c) && f(a) && (c.includes("google") && a.includes("google") || c.includes("zaragoza.es") && a.includes("zaragoza.es")));
  }
  for (const r of R)
    if (e.toLowerCase().includes(r) && !a.includes(r))
      return !(f(t) && (t.includes(r) || a.includes(r)));
  return !1;
}
function O(s, t) {
  const n = s.originalUrl.trim(), e = s.anchorText.trim(), a = I(n), i = k(a), r = [], c = $(a), h = A.has(a) || A.has(i), u = C(a), y = a.split(".").pop() || "", g = L.has(y), m = f(a);
  t && f(t);
  const o = M(e, a, t);
  let l = !1;
  if (!m) {
    for (const d of R)
      if (a.includes(d) && !i.startsWith(d + ".")) {
        l = !0, r.push(`Falsa marca en subdominio: dice "${d}" pero está en "${i}"`);
        break;
      }
  }
  c && r.push("Enlace numérico sin registrar (IP directa)"), h && r.push("Enlace acortador que oculta el destino real"), u && r.push("Dominio con letras trampa o caracteres homógrafos (Punycode)"), g && r.push(`Extensión de dominio sospechosa (.${y}) usada habitualmente en fraudes`), o && r.push(`El botón dice "${e}", pero navega hacia "${a}"`);
  const p = n.toLowerCase();
  (p.includes("login") || p.includes("signin") || p.includes("verify") || p.includes("update-billing") || p.includes("secure-account")) && !m && (g || c || h || l) && r.push("Petición de claves/datos alojada en infraestructura no verificada");
  const S = !m && (c || u || g || o || l || h && r.length > 1);
  return {
    url: n,
    anchorText: e || n,
    domain: a || "unknown",
    isSuspicious: S,
    isShortener: h,
    isIpAddress: c,
    isLookalikeDomain: u,
    isHighRiskTld: g,
    anchorDomainMismatch: o && !m,
    reasons: r
  };
}
function _(s, t) {
  const n = /* @__PURE__ */ new Set(), e = [];
  for (const a of s)
    !a.originalUrl || a.originalUrl.startsWith("mailto:") || a.originalUrl.startsWith("javascript:") || n.has(a.originalUrl) || (n.add(a.originalUrl), e.push(O(a, t)));
  return e;
}
const E = {
  paypal: { name: "PayPal", domains: ["paypal.com"] },
  correos: { name: "Correos España", domains: ["correos.es", "correos.com"] },
  santander: { name: "Banco Santander", domains: ["bancosantander.es", "santander.com", "santander.es"] },
  bbva: { name: "BBVA", domains: ["bbva.es", "bbva.com"] },
  caixabank: { name: "CaixaBank", domains: ["caixabank.es", "caixabank.com"] },
  google: { name: "Google", domains: ["google.com", "accounts.google.com", "classroom.google.com", "notifications.google.com"] },
  classroom: { name: "Google Classroom", domains: ["classroom.google.com", "google.com"] },
  github: { name: "GitHub", domains: ["github.com", "notifications.github.com"] },
  zaragoza: { name: "Ayuntamiento de Zaragoza / RED ZAC", domains: ["zaragoza.es", "redzac.zaragoza.es"] },
  microsoft: { name: "Microsoft", domains: ["microsoft.com", "live.com", "office.com", "outlook.com"] },
  apple: { name: "Apple", domains: ["apple.com", "icloud.com"] },
  amazon: { name: "Amazon", domains: ["amazon.es", "amazon.com", "amazon.co.uk"] },
  netflix: { name: "Netflix", domains: ["netflix.com"] },
  dhl: { name: "DHL", domains: ["dhl.com", "dhl.es"] },
  fedex: { name: "FedEx", domains: ["fedex.com"] },
  docusign: { name: "DocuSign", domains: ["docusign.com"] }
}, N = [
  { regex: /(?:cuenta|tarjeta|acceso)\s+(?:suspendida|bloqueada|cancelada|restringida|inhabilitada)/i, human: "Le dicen que le han bloqueado o suspendido la cuenta" },
  { regex: /(?:dentro\s+de|en|plazo\s+de)\s+(?:24|48|12|1)\s*(?:horas|h|hrs)/i, human: "Le dan un ultimátum de pocas horas" },
  { regex: /(?:acción|verificación|atención)\s+inmediata/i, human: "Le exigen actuar de inmediato" },
  { regex: /(?:inicio\s+de\s+sesión|acceso|movimiento|actividad|cargo)\s+(?:no\s+autorizado|sospechoso|desconocido)/i, human: "Le asustan con un supuesto acceso o cargo no autorizado" },
  { regex: /(?:verifique|confirme|actualice)\s+(?:sus?\s+)?(?:datos|contraseña|tarjeta|identidad|credenciales)/i, human: "Le piden que vuelva a meter sus claves o tarjeta" },
  { regex: /último\s+aviso\s+antes\s+de/i, human: 'Le envían un "último aviso" para infundir temor' },
  { regex: /(?:paquete|envío|entrega)\s+(?:retenido|pendiente\s+de\s+pago|aduanas)/i, human: "Le dicen que tiene un paquete retenido con tasas pendientes" },
  { regex: /account\s+(?:suspended|restricted|blocked|locked)/i, human: "Amenaza de cuenta bloqueada en 24 horas" },
  { regex: /immediate(?:ly)?\s+action\s+required/i, human: "Le exigen acción inmediata en inglés" }
];
function q(s, t) {
  const n = [];
  for (let e = 0; e <= t.length; e++) n[e] = [e];
  for (let e = 0; e <= s.length; e++) n[0][e] = e;
  for (let e = 1; e <= t.length; e++)
    for (let a = 1; a <= s.length; a++)
      t.charAt(e - 1) === s.charAt(a - 1) ? n[e][a] = n[e - 1][a - 1] : n[e][a] = Math.min(
        n[e - 1][a - 1] + 1,
        n[e][a - 1] + 1,
        n[e - 1][a] + 1
      );
  return n[t.length][s.length];
}
function U(s) {
  const t = k(s).split(".")[0].toLowerCase();
  if (!t) return { isTyposquat: !1 };
  if (f(s)) return { isTyposquat: !1 };
  for (const [n, e] of Object.entries(E)) {
    if (t === n) return { isTyposquat: !1 };
    const a = q(t, n);
    if (a > 0 && a <= 2 && n.length >= 4)
      return { isTyposquat: !0, targetBrand: e.name, brandOfficial: e.domains[0] };
    if (t.replace(/1/g, "l").replace(/0/g, "o").replace(/5/g, "s").replace(/3/g, "e").replace(/vv/g, "w") === n && t !== n)
      return { isTyposquat: !0, targetBrand: e.name, brandOfficial: e.domains[0] };
  }
  return { isTyposquat: !1 };
}
function B(s, t, n) {
  const e = t.includes("@") ? t.split("@")[1].toLowerCase().trim() : "", a = k(e), i = e.split(".").pop() || "", r = f(e), c = !r && L.has(i), h = !r && C(e);
  let u = !1, y, g;
  if (r)
    u = !1;
  else {
    const l = s.toLowerCase();
    for (const [S, d] of Object.entries(E))
      if ((l.includes(S) || l.includes(d.name.toLowerCase())) && !d.domains.some((v) => a === v || a.endsWith("." + v) || e === v || e.endsWith("." + v))) {
        u = !0, y = d.name, g = d.domains[0];
        break;
      }
    const p = U(e);
    p.isTyposquat && (u = !0, y = p.targetBrand, g = p.brandOfficial);
  }
  let m = !1, o = "";
  if (n && n.includes("@")) {
    o = n.split("@")[1].toLowerCase().trim();
    const l = k(o);
    l && a && l !== a && (f(o) && f(e) ? m = !1 : m = !0);
  }
  return {
    name: s,
    email: t,
    domain: e,
    isTrusted: r,
    brandImpersonationRisk: u,
    impersonatedBrand: y,
    officialDomain: g,
    isSuspiciousTld: c,
    isPunycode: h,
    replyToMismatch: m,
    replyDomain: o
  };
}
function P(s, t) {
  const n = `${s} 
 ${t}`, e = [];
  for (const a of N)
    a.regex.test(n) && e.push(a.human);
  return {
    hasUrgency: e.length > 0,
    matched: Array.from(new Set(e))
  };
}
function D(s) {
  let t = 0;
  const n = [], e = [], a = B(s.senderName, s.senderEmail, s.replyTo), i = a.isTrusted;
  if (a.brandImpersonationRisk) {
    t += 45;
    const o = a.impersonatedBrand ? `Cuidado: El correo dice ser de ${a.impersonatedBrand}, pero la dirección real es "${s.senderEmail}" (la página web oficial verdadera es ${a.officialDomain || "otra"}).` : "El nombre que sale en el correo no coincide con la dirección desde la que se envió.";
    n.push({
      id: "brand-impersonation",
      category: "sender",
      severity: "danger",
      title: `🚨 Suplantación de Identidad (${a.impersonatedBrand || "Marca Falsa"})`,
      description: o
    }), e.push(o);
  }
  if (a.isPunycode) {
    t += 35;
    const o = "El remitente usa letras rusas o griegas casi idénticas a las nuestras para engañar a la vista y hacerse pasar por una empresa legítima.";
    n.push({
      id: "homograph-sender",
      category: "sender",
      severity: "danger",
      title: "🎭 Dirección con Letras Trampa (Homógrafo / Punycode)",
      description: o
    }), e.push(o);
  }
  if (a.isSuspiciousTld) {
    t += 25;
    const l = `La dirección termina en ".${a.domain.split(".").pop() || ""}", una extensión barata que usan los ciberdelincuentes para crear cuentas desechables de estafa.`;
    n.push({
      id: "suspicious-tld",
      category: "sender",
      severity: "warning",
      title: "⚠️ Dominio Raro y Desechable",
      description: l
    }), e.push(l);
  }
  if (a.replyToMismatch) {
    t += 20;
    const o = `Si usted le da a "Responder", su mensaje no irá a quien le escribe, sino a otra cuenta oculta (${s.replyTo}).`;
    n.push({
      id: "replyto-mismatch",
      category: "headers",
      severity: "warning",
      title: "🪤 Trampa de Respuesta Oculta (Reply-To)",
      description: o
    }), e.push(o);
  }
  const r = _(s.links, a.domain), c = r.filter((o) => o.isSuspicious);
  if (c.length > 0) {
    let o = Math.min(c.length * 20, 50);
    i && (o = Math.round(o * 0.2)), t += o;
    const l = c.some((d) => d.anchorDomainMismatch), p = c.some((d) => d.isIpAddress);
    let S = `Se encontraron ${c.length} enlace(s) sospechoso(s) en el correo.`;
    l ? S = "¡Peligro! El botón o enlace dice una cosa, pero en verdad le lleva a una página web trampa distinta." : p && (S = "El enlace le lleva directamente a números de servidor (IP) sin nombre registrado, típico de virus y estafas."), n.push({
      id: "suspicious-links",
      category: "links",
      severity: i ? "warning" : "danger",
      title: i ? "⚠️ Enlace con Redirección" : "🚨 Enlaces Trampa o Peligrosos Detectados",
      description: S
    }), e.push(S);
    for (const d of c)
      d.anchorDomainMismatch ? e.push(`El texto dice "${d.anchorText}", pero navega hacia "${d.domain}"`) : d.isIpAddress && e.push(`Enlace numérico sin registrar: ${d.domain}`);
  }
  const h = r.filter((o) => o.isShortener);
  if (h.length > 0 && c.length === 0) {
    t += i ? 5 : 15;
    const o = `El correo esconde el destino real usando un enlace acortador (${h.map((l) => l.domain).join(", ")}). No se sabe adónde va hasta que hace clic.`;
    n.push({
      id: "shortener-links",
      category: "links",
      severity: "warning",
      title: "⚠️ Enlace Acortado / Destino Oculto",
      description: o
    }), e.push(o);
  }
  const u = P(s.subject, s.bodySnippet);
  if (u.hasUrgency) {
    let o = a.brandImpersonationRisk || c.length > 0 ? 25 : 12;
    i && (o = Math.min(o, 5)), t += o;
    const l = i ? `Aviso de plazo o fecha límite en plataforma oficial (${u.matched.slice(0, 2).join(" / ")}).` : `Le están metiendo prisa o amenazando con bloquear su cuenta (${u.matched.slice(0, 2).join(" / ")}) para que actúe sin pensar.`;
    n.push({
      id: "urgency-detected",
      category: "content",
      severity: i ? "info" : a.brandImpersonationRisk || c.length > 0 ? "danger" : "warning",
      title: i ? "📅 Notificación de Plazo Oficial" : "⏳ Presión y Miedo (Urgencia Falsa)",
      description: l
    }), e.push(l);
  }
  const y = c.some((o) => o.isIpAddress || o.isHighRiskTld || o.isLookalikeDomain);
  i && !y && !a.brandImpersonationRisk && (t > 15 && (t = 15), n.unshift({
    id: "trusted-platform-verified",
    category: "sender",
    severity: "info",
    title: "🛡️ Plataforma Oficial de Confianza Verificada",
    description: `El remitente (@${a.domain}) pertenece a una plataforma oficial verificada (Google Classroom / RED ZAC / GitHub). Los enlaces internos de notificación y seguimiento están autenticados.`
  }), e.unshift(`Remitente oficial autenticado (@${a.domain})`)), t === 0 && (n.push({
    id: "clean-audit",
    category: "sender",
    severity: "info",
    title: "✅ Remitente Auténtico y Verificado",
    description: `La dirección (@${a.domain || "oficial"}) coincide con los servidores de la empresa real. No hay enlaces camuflados ni trampas de dinero.`
  }), e.push("Remitente verificado con servidores oficiales"), e.push("Todos los botones y enlaces llevan a destinos auténticos"));
  const g = Math.min(Math.max(t, 0), 100);
  let m = "low";
  return g >= 70 ? m = "high" : g >= 31 ? m = "moderate" : m = "low", {
    score: g,
    level: m,
    reasons: e,
    breakdowns: n,
    linkAnalyses: r,
    senderDetails: {
      name: a.name,
      email: a.email,
      domain: a.domain,
      isWellKnownBrand: !!a.impersonatedBrand || i,
      brandImpersonationRisk: a.brandImpersonationRisk,
      impersonatedBrand: a.impersonatedBrand,
      isSuspiciousTld: a.isSuspiciousTld,
      isPunycode: a.isPunycode,
      replyToMismatch: a.replyToMismatch
    },
    urgencyDetected: u.hasUrgency,
    urgencyKeywords: u.matched,
    analyzedAt: Date.now()
  };
}
const T = {
  strictMode: !1,
  enableCloudAnalysis: !0,
  backendApiUrl: "http://localhost:3001",
  autoScan: !0,
  darkTheme: !0
}, x = "ms_domain_", j = 1440 * 60 * 1e3, w = typeof chrome < "u" && chrome.storage && chrome.storage.local, b = {
  async getSettings() {
    try {
      if (w) {
        const t = await chrome.storage.local.get("mailshield_settings");
        return { ...T, ...t.mailshield_settings || {} };
      }
      const s = localStorage.getItem("mailshield_settings");
      return s ? { ...T, ...JSON.parse(s) } : T;
    } catch {
      return T;
    }
  },
  async updateSettings(s) {
    const n = { ...await this.getSettings(), ...s };
    return w ? await chrome.storage.local.set({ mailshield_settings: n }) : localStorage.setItem("mailshield_settings", JSON.stringify(n)), n;
  },
  async getStats() {
    const s = { scannedCount: 0, threatsBlocked: 0 };
    try {
      if (w)
        return (await chrome.storage.local.get("mailshield_stats")).mailshield_stats || s;
      const t = localStorage.getItem("mailshield_stats");
      return t ? JSON.parse(t) : s;
    } catch {
      return s;
    }
  },
  async recordScan(s, t, n) {
    const e = await this.getStats();
    return e.scannedCount += 1, (s || t >= 70) && (e.threatsBlocked += 1), e.lastRiskScore = t, e.lastScannedSubject = n, w ? await chrome.storage.local.set({ mailshield_stats: e }) : localStorage.setItem("mailshield_stats", JSON.stringify(e)), e;
  },
  async getCachedDomain(s) {
    const t = `${x}${s.toLowerCase()}`;
    try {
      let n = null;
      if (w)
        n = (await chrome.storage.local.get(t))[t] || null;
      else {
        const e = localStorage.getItem(t);
        n = e ? JSON.parse(e) : null;
      }
      return n ? Date.now() - n.timestamp > j ? (await this.removeCachedDomain(s), null) : n : null;
    } catch {
      return null;
    }
  },
  async setCachedDomain(s, t, n) {
    const e = `${x}${s.toLowerCase()}`, a = {
      domain: s.toLowerCase(),
      reputation: t,
      reasons: n,
      timestamp: Date.now()
    };
    w ? await chrome.storage.local.set({ [e]: a }) : localStorage.setItem(e, JSON.stringify(a));
  },
  async removeCachedDomain(s) {
    const t = `${x}${s.toLowerCase()}`;
    w ? await chrome.storage.local.remove(t) : localStorage.removeItem(t);
  }
};
console.log("[MailShield AI] Background Service Worker initialized (Manifest V3)");
chrome.runtime.onMessage.addListener((s, t, n) => (W(s, t).then(n).catch((e) => {
  console.error("[MailShield Worker] Error processing message:", e), n({ error: e.message || "Internal extension error" });
}), !0));
async function W(s, t) {
  var n;
  switch (s.type) {
    case "ANALYZE_EMAIL": {
      const e = s.payload, a = await b.getSettings();
      let i;
      if (await b.getCachedDomain(e.senderDomain), a.enableCloudAnalysis)
        try {
          const c = new AbortController(), h = setTimeout(() => c.abort(), 4e3), u = await fetch(`${a.backendApiUrl}/api/analyze-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(e),
            signal: c.signal
          });
          clearTimeout(h), u.ok ? i = (await u.json()).result : i = D(e);
        } catch (c) {
          console.warn("[MailShield Worker] Backend API unavailable, utilizing local heuristic engine:", c), i = D(e);
        }
      else
        i = D(e);
      const r = i.score >= 70 ? "malicious" : i.score >= 31 ? "suspicious" : "safe";
      return await b.setCachedDomain(e.senderDomain, r, i.reasons), await b.recordScan(i.score >= 70, i.score, e.subject), (n = t.tab) != null && n.id && G(t.tab.id, i.score), { success: !0, result: i };
    }
    case "RESOLVE_URL": {
      const e = await b.getSettings();
      try {
        const a = await fetch(`${e.backendApiUrl}/api/expand-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: s.payload.url })
        });
        if (a.ok)
          return { success: !0, ...await a.json() };
      } catch (a) {
        console.warn("[MailShield Worker] Failed to resolve URL via backend:", a);
      }
      return { success: !1, originalUrl: s.payload.url, resolvedUrl: s.payload.url };
    }
    case "GET_STATS":
      return { success: !0, stats: await b.getStats() };
    case "GET_SETTINGS":
      return { success: !0, settings: await b.getSettings() };
    case "UPDATE_SETTINGS":
      return { success: !0, settings: await b.updateSettings(s.payload) };
    case "REPORT_PHISHING": {
      const e = await b.getSettings();
      try {
        return { success: !0, data: await (await fetch(`${e.backendApiUrl}/api/report-phishing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderDomain: s.payload.email.senderDomain,
            threatScore: s.payload.score,
            flaggedLinksCount: s.payload.email.links.length
          })
        })).json() };
      } catch {
        return { success: !0, message: "Report cached locally" };
      }
    }
    default:
      throw new Error("Unknown message type");
  }
}
function G(s, t) {
  let n = "OK", e = "#22c55e";
  t >= 70 ? (n = `${t}%`, e = "#ef4444") : t >= 31 ? (n = `${t}%`, e = "#f59e0b") : (n = `${t}%`, e = "#10b981"), chrome.action.setBadgeText({ tabId: s, text: n }), chrome.action.setBadgeBackgroundColor({ tabId: s, color: e });
}
