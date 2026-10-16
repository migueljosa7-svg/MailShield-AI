import React, { useState } from 'react';
import { LinkAnalysis } from '../../types';
import { ExternalLink, Copy, Check, ShieldAlert, ShieldCheck, AlertCircle, ArrowRight, Loader2, Link2 } from 'lucide-react';

interface LinkInspectorProps {
  links: LinkAnalysis[];
  onResolveUrl?: (url: string) => Promise<string | undefined>;
}

export const LinkInspector: React.FC<LinkInspectorProps> = ({ links, onResolveUrl }) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [resolvingUrl, setResolvingUrl] = useState<string | null>(null);
  const [resolvedMap, setResolvedMap] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'suspicious'>('all');

  const filteredLinks = filter === 'suspicious' ? links.filter(l => l.isSuspicious || l.isShortener) : links;

  const handleCopySafe = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      setCopiedUrl(null);
    }
  };

  const handleInspectRedirect = async (url: string) => {
    if (!onResolveUrl || resolvingUrl) return;
    setResolvingUrl(url);
    try {
      const destination = await onResolveUrl(url);
      if (destination) {
        setResolvedMap(prev => ({ ...prev, [url]: destination }));
      }
    } finally {
      setResolvingUrl(null);
    }
  };

  if (links.length === 0) {
    return (
      <div className="p-4 text-center text-sm font-medium text-gray-300 bg-gray-900/60 rounded-xl border border-gray-800">
        ✨ Este correo no contiene botones ni enlaces externos hacia páginas web.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Cabecera y Selector de Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-sm text-gray-100">
            Enlaces y Botones Encontrados ({links.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setFilter('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Todos ({links.length})
          </button>
          <button
            onClick={() => setFilter('suspicious')}
            className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              filter === 'suspicious'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ⚠️ Solo Peligrosos ({links.filter(l => l.isSuspicious || l.isShortener).length})
          </button>
        </div>
      </div>

      {/* Lista / Tabla Comparativa: "Texto que lee" vs "Página real a la que le lleva" */}
      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {filteredLinks.map((link, idx) => {
          const finalUrl = resolvedMap[link.url] || link.resolvedUrl;
          const isCopied = copiedUrl === (finalUrl || link.url);

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border-2 transition-all ${
                link.isSuspicious
                  ? 'bg-rose-950/40 border-rose-600/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : link.isShortener
                  ? 'bg-amber-950/40 border-amber-500/70'
                  : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Veredicto Claro y Destacado */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-800/80">
                <div className="flex items-center gap-2">
                  {link.isSuspicious ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white font-black text-xs uppercase tracking-wide animate-pulse">
                      <ShieldAlert className="w-4 h-4" />
                      ¡Enlace Peligroso!
                    </span>
                  ) : link.isShortener ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wide">
                      <AlertCircle className="w-4 h-4" />
                      Enlace Acortado (Oculto)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4" />
                      Enlace Seguro
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-950 text-gray-300 border border-gray-800 font-bold">
                  {link.domain}
                </span>
              </div>

              {/* Tabla Comparativa Didáctica: Texto vs Destino Real */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {/* Lo que lee en el correo */}
                <div className="p-2.5 rounded-lg bg-gray-950/70 border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                    👀 Texto que lee en el correo:
                  </span>
                  <div className="font-bold text-gray-100 text-sm truncate" title={link.anchorText}>
                    "{link.anchorText || 'Sin texto (solo enlace)'}"
                  </div>
                </div>

                {/* Página real a la que le lleva */}
                <div className={`p-2.5 rounded-lg border ${
                  link.isSuspicious
                    ? 'bg-rose-950/60 border-rose-700 text-rose-100'
                    : 'bg-gray-950/70 border-gray-800 text-cyan-300'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                    🌐 Página real adónde le lleva:
                  </span>
                  <div className="font-mono text-xs break-all font-semibold" title={link.url}>
                    {link.url}
                  </div>
                </div>
              </div>

              {/* Destino expandido si es acortador */}
              {finalUrl && (
                <div className="mt-2.5 p-2 rounded-lg bg-cyan-950/50 border border-cyan-800 text-xs font-mono text-cyan-200 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Destino real desenmascarado:</span>
                    <span className="font-bold text-cyan-300 break-all">{finalUrl}</span>
                  </div>
                </div>
              )}

              {/* Motivos en lenguaje humano */}
              {link.reasons.length > 0 && (
                <div className="mt-2.5 space-y-1">
                  {link.reasons.map((r, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-1.5 text-xs font-semibold text-rose-300">
                      <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Botones de Acción Grandes (Mínimo 44px de área de toque) */}
              <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  {link.isShortener && !finalUrl && onResolveUrl && (
                    <button
                      onClick={() => handleInspectRedirect(link.url)}
                      disabled={resolvingUrl === link.url}
                      className="min-h-[44px] px-3 py-2 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {resolvingUrl === link.url ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Desenmascarando destino...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>Descubrir destino real oculto</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleCopySafe(finalUrl || link.url)}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-600 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                  title="Copiar enlace seguro al portapapeles"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">¡Enlace Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>📋 Copiar enlace seguro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
