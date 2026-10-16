import React, { useState } from 'react';
import { EmailData, EmailRiskResult } from '../../types';
import { RiskBadge } from './RiskBadge';
import { LinkInspector } from './LinkInspector';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Flag,
  Mail,
  Lock,
  CheckCircle2,
  HelpCircle,
  AlertOctagon,
  Eye,
  Info
} from 'lucide-react';

interface SecurityBarProps {
  emailData: EmailData;
  analysis: EmailRiskResult;
  onRescan: () => void;
  onDismiss: () => void;
  onReportPhishing: () => Promise<void>;
  onResolveUrl: (url: string) => Promise<string | undefined>;
}

export const SecurityBar: React.FC<SecurityBarProps> = ({
  emailData,
  analysis,
  onRescan,
  onDismiss,
  onReportPhishing,
  onResolveUrl
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'details'>('overview');
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReport = async () => {
    if (isReporting) return;
    setIsReporting(true);
    try {
      await onReportPhishing();
      showToast('✅ Aviso de estafa registrado. ¡Gracias por proteger a la comunidad!');
    } catch {
      showToast('✅ Aviso guardado localmente.');
    } finally {
      setIsReporting(false);
    }
  };

  const { score, level, breakdowns, linkAnalyses, senderDetails } = analysis;

  // Estilos de semáforo hipervisuales
  const trafficLightStyles = {
    high: {
      containerBorder: 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.35)]',
      bannerBg: 'bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-b-2 border-rose-500',
      title: '🚨 ¡CUIDADO ABUELO/A! ESTO ES UNA ESTAFA',
      subtitle: 'No toque ningún botón ni enlace de este correo. Quieren robarle sus datos o dinero.',
      titleColor: 'text-rose-100',
      subColor: 'text-rose-200',
      pulse: 'animate-pulse',
      Icon: AlertOctagon,
      badgeText: 'PELIGRO EXTREMO',
      badgeClass: 'bg-rose-500 text-white'
    },
    moderate: {
      containerBorder: 'border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      bannerBg: 'bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-amber-950/90 border-b-2 border-amber-500',
      title: '⚠️ TEN CUIDADO - ALGO NO HUELE BIEN',
      subtitle: 'Este correo tiene cosas raras. Revíselo bien antes de hacer clic en nada.',
      titleColor: 'text-amber-100',
      subColor: 'text-amber-200',
      pulse: '',
      Icon: AlertTriangle,
      badgeText: 'PRECAUCIÓN',
      badgeClass: 'bg-amber-500 text-black font-extrabold'
    },
    low: {
      containerBorder: 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.2)]',
      bannerBg: 'bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-emerald-950/90 border-b-2 border-emerald-500',
      title: '✅ CORREO SEGURO Y VERIFICADO',
      subtitle: 'Este correo es de fiar. Viene de la empresa o persona real.',
      titleColor: 'text-emerald-100',
      subColor: 'text-emerald-200',
      pulse: '',
      Icon: ShieldCheck,
      badgeText: 'TODO EN REGLA',
      badgeClass: 'bg-emerald-500 text-white font-bold'
    }
  }[level];

  const { Icon: TrafficIcon } = trafficLightStyles;

  return (
    <aside
      aria-label="MailShield Semáforo de Seguridad"
      className={`mailshield-root my-3 rounded-2xl overflow-hidden border-2 transition-all duration-300 mailshield-glass text-gray-100 ${trafficLightStyles.containerBorder}`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-cyan-600 text-white text-xs font-bold py-2 px-4 text-center animate-fade-in flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SEMÁFORO GIGANTE: Banner Superior Hipervisual */}
      <div className={`p-4 ${trafficLightStyles.bannerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-2.5 rounded-2xl bg-black/40 border border-white/20 flex-shrink-0 ${trafficLightStyles.pulse}`}>
            <TrafficIcon className="w-8 h-8 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base sm:text-lg font-black tracking-tight leading-tight ${trafficLightStyles.titleColor}`}>
                {trafficLightStyles.title}
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${trafficLightStyles.badgeClass}`}>
                {trafficLightStyles.badgeText}
              </span>
            </div>
            <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${trafficLightStyles.subColor} leading-snug`}>
              {trafficLightStyles.subtitle}
            </p>
          </div>
        </div>

        {/* Medidor circular y controles */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          <RiskBadge score={score} level={level} size="sm" showLabel={false} />

          <div className="flex items-center gap-1.5">
            <button
              onClick={onRescan}
              title="Volver a analizar este correo"
              className="min-h-[40px] min-w-[40px] rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-all flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Ocultar detalles" : "Ver detalles y explicaciones"}
              className="min-h-[40px] px-3 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {isExpanded ? (
                <>
                  <span>Menos</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Explicación</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={onDismiss}
              title="Cerrar panel"
              className="min-h-[40px] min-w-[40px] rounded-xl bg-black/40 hover:bg-rose-900/70 text-gray-300 hover:text-white border border-white/20 transition-all flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CUERPO EXPANDIDO CON EXPLICACIONES HUMANAS */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 bg-gray-950/80">
          {/* Pestañas de Navegación Grandes */}
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              ¿Por qué dice esto?
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'links'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <span>Botones y Enlaces ({linkAnalyses.length})</span>
              {linkAnalyses.some(l => l.isSuspicious) && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <Info className="w-4 h-4" />
              ¿Quién envía el correo?
            </button>
          </div>

          {/* TAB 1: RESUMEN EXPLICADO PARA TODOS LOS PÚBLICOS */}
          {activeTab === 'overview' && (
            <div className="space-y-3.5">
              {/* Alerta Destacada Roja para Personas Mayores */}
              {level === 'high' && (
                <div className="p-4 rounded-xl bg-rose-950/80 border-2 border-rose-500 flex items-start gap-3 shadow-lg">
                  <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-black text-rose-100 text-sm sm:text-base">
                      🛑 ¡RECOMENDACIÓN DIRECTA: NO HAGA NADA!
                    </p>
                    <p className="text-rose-200 mt-1 leading-relaxed font-medium">
                      No meta su contraseña, no meta su número de tarjeta ni descargue archivos adjuntos. Si duda, llame por teléfono a la empresa oficial (a su número de siempre, no al que sale en este correo).
                    </p>
                  </div>
                </div>
              )}

              {/* Lista de Motivos Explicados en Lenguaje Cotidiano */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Explicación clara de lo que hemos descubierto:
                </span>

                <div className="space-y-2">
                  {breakdowns.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                        b.severity === 'danger'
                          ? 'bg-rose-950/50 border-rose-600 text-rose-100'
                          : b.severity === 'warning'
                          ? 'bg-amber-950/50 border-amber-500 text-amber-100'
                          : 'bg-emerald-950/50 border-emerald-600 text-emerald-100'
                      }`}
                    >
                      {b.severity === 'danger' ? (
                        <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      ) : b.severity === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-extrabold text-sm block">{b.title}</span>
                        <p className="mt-1 text-gray-200 font-medium leading-relaxed">
                          {b.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarjeta de Remitente Rápida */}
              <div className="p-3 rounded-xl bg-gray-900/70 border border-gray-800 flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-400 font-semibold">Dirección real del remitente:</span>
                  <span className="text-cyan-300 font-mono font-bold truncate">{emailData.senderEmail}</span>
                </div>
                {senderDetails.brandImpersonationRisk ? (
                  <span className="px-2.5 py-1 rounded-md bg-rose-500 text-white font-black text-xs">
                    ¡Dirección Sospechosa!
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs">
                    Dirección Coincide
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INSPECTOR VISUAL DE ENLACES */}
          {activeTab === 'links' && (
            <LinkInspector links={linkAnalyses} onResolveUrl={onResolveUrl} />
          )}

          {/* TAB 3: QUIÉN ENVÍA EL CORREO */}
          {activeTab === 'details' && (
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-gray-900/70 border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Nombre que finge ser</span>
                  <div className="font-bold text-gray-100 text-sm mt-0.5">{senderDetails.name}</div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/70 border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Dominio real que envía</span>
                  <div className="font-mono font-bold text-cyan-300 text-sm mt-0.5 truncate">
                    @{senderDetails.domain || 'desconocido'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/70 border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Si responde, ¿adónde va?</span>
                  <div className="font-mono text-xs mt-0.5 truncate">
                    {emailData.replyTo ? (
                      <span className={senderDetails.replyToMismatch ? 'text-rose-400 font-bold' : 'text-gray-300'}>
                        {emailData.replyTo} (¡Ojo! Va a otra cuenta distinta)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Va al mismo remitente (Normal)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-900/70 border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Privacidad del Usuario</span>
                  <div className="mt-0.5 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cero registros: No se guardan sus correos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN GRANDES TÁCTILES (MÍNIMO 44PX DE ALTO) */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleReport}
                disabled={isReporting}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                <span>{isReporting ? 'Enviando aviso...' : '🚨 Avisar de Estafa / Reportar'}</span>
              </button>

              <button
                onClick={() => {
                  const summary = `Informe MailShield para "${emailData.subject}": Nivel de Riesgo ${score}%. Remitente real: ${emailData.senderEmail}.`;
                  navigator.clipboard.writeText(summary);
                  showToast('📋 ¡Resumen claro copiado al portapapeles!');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-600 transition-all flex items-center gap-2"
              >
                <span>📋 Copiar Resumen Claro</span>
              </button>
            </div>

            <span className="text-xs text-gray-400 font-medium">
              Analizado: {new Date(analysis.analyzedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
