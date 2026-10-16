import React, { useEffect, useState } from 'react';
import { StorageUtil } from '../utils/storage';
import { calculateRiskScore } from '../utils/heuristics';
import { EmailData, EmailRiskResult, ExtensionStats, MailShieldSettings } from '../types';
import { RiskBadge } from '../content/components/RiskBadge';
import { LinkInspector } from '../content/components/LinkInspector';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Sliders,
  Send,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Lock,
  RefreshCw,
  Terminal,
  HeartHandshake
} from 'lucide-react';

export const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sandbox' | 'settings'>('dashboard');
  const [stats, setStats] = useState<ExtensionStats>({ scannedCount: 0, threatsBlocked: 0 });
  const [settings, setSettings] = useState<MailShieldSettings>({
    strictMode: false,
    enableCloudAnalysis: true,
    backendApiUrl: 'http://localhost:3001',
    autoScan: true,
    darkTheme: true
  });
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Estado del Sandbox de prueba
  const [senderName, setSenderName] = useState('Banco Santander');
  const [senderEmail, setSenderEmail] = useState('seguridad@santander-verificacion.xyz');
  const [subject, setSubject] = useState('🚨 URGENTE: Su tarjeta ha sido bloqueada. Verifique en 24 horas');
  const [rawLinks, setRawLinks] = useState('http://192.168.1.100/login-santander\nhttps://bit.ly/desbloqueo-tarjeta');
  const [buttonAnchor, setButtonAnchor] = useState('Acceder a Mi Cuenta Online');
  const [sandboxResult, setSandboxResult] = useState<EmailRiskResult | null>(null);

  useEffect(() => {
    loadData();
    checkServerHealth();
  }, []);

  const loadData = async () => {
    const s = await StorageUtil.getStats();
    const cfg = await StorageUtil.getSettings();
    setStats(s);
    setSettings(cfg);
  };

  const checkServerHealth = async () => {
    try {
      const cfg = await StorageUtil.getSettings();
      const res = await fetch(`${cfg.backendApiUrl}/api/health`, { method: 'GET' });
      setServerOnline(res.ok);
    } catch {
      setServerOnline(false);
    }
  };

  const handleRunSandbox = () => {
    const linksList = rawLinks
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((url, i) => ({
        originalUrl: url,
        anchorText: i === 0 ? buttonAnchor : url,
        isButton: i === 0
      }));

    const email: EmailData = {
      senderName,
      senderEmail,
      senderDomain: senderEmail.includes('@') ? senderEmail.split('@')[1] : '',
      subject,
      bodySnippet: `Estimado cliente, detectamos accesos no autorizados a su banca online. Inicie sesión de inmediato para desbloquear su cuenta o perderá el acceso en 24 horas.`,
      links: linksList
    };

    const res = calculateRiskScore(email);
    setSandboxResult(res);
  };

  const loadPreset = (preset: 'banco' | 'boton' | 'legitimo') => {
    if (preset === 'banco') {
      setSenderName('Banco Santander - Seguridad');
      setSenderEmail('alertas@santander-urgente.xyz');
      setSubject('🚨 URGENTE: Su cuenta bancaria ha sido bloqueada por seguridad');
      setButtonAnchor('Desbloquear Mi Dinero Ahora');
      setRawLinks('http://192.168.1.50/santander-phish\nhttps://bit.ly/verificar-santander');
    } else if (preset === 'boton') {
      setSenderName('Correos España');
      setSenderEmail('envios@correoos-entrega.top');
      setSubject('Su paquete tiene gastos de aduana pendientes de 1,79€');
      setButtonAnchor('Pagar 1,79€ y Recibir Paquete');
      setRawLinks('https://trampa-pagos-estafas.xyz/recoger-paquete');
    } else {
      setSenderName('Google Security');
      setSenderEmail('no-reply@accounts.google.com');
      setSubject('Nuevo inicio de sesión en su cuenta de Google');
      setButtonAnchor('Consultar Actividad Oficial');
      setRawLinks('https://myaccount.google.com/notifications\nhttps://support.google.com');
    }
    setSandboxResult(null);
  };

  const handleSaveSettings = async (updated: Partial<MailShieldSettings>) => {
    const res = await StorageUtil.updateSettings(updated);
    setSettings(res);
  };

  return (
    <div className="w-[430px] bg-gray-950 text-gray-100 min-h-[560px] flex flex-col font-sans select-none">
      {/* Cabecera Principal */}
      <div className="p-4 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">MailShield AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                Semáforo Anti-Estafas
              </span>
            </div>
            <p className="text-xs text-gray-400">Protección visual para toda la familia</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Activo
        </div>
      </div>

      {/* Pestañas Grandes */}
      <div className="flex items-center border-b border-gray-800 bg-gray-900/70 text-xs px-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 font-bold border-b-2 transition-all ${
            activeTab === 'dashboard'
              ? 'text-cyan-400 border-cyan-400 bg-gray-900/90'
              : 'text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Panel Principal</span>
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 font-bold border-b-2 transition-all ${
            activeTab === 'sandbox'
              ? 'text-cyan-400 border-cyan-400 bg-gray-900/90'
              : 'text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Pruebas de Fuego</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 font-bold border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'text-cyan-400 border-cyan-400 bg-gray-900/90'
              : 'text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ajustes</span>
        </button>
      </div>

      {/* CUERPO DEL POPUP */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* PESTAÑA 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Tarjetas de Estadísticas Grandes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-md">
                <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-1">
                  <span>Correos Revisados</span>
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-white font-mono">{stats.scannedCount}</div>
                <span className="text-[11px] text-gray-400 font-medium">Inspecciones en Gmail</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-md">
                <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-1">
                  <span>Estafas Bloqueadas</span>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-3xl font-black text-rose-400 font-mono">{stats.threatsBlocked}</div>
                <span className="text-[11px] text-gray-400 font-medium">Amenazas neutralizadas</span>
              </div>
            </div>

            {/* Estado del Servidor Local Express */}
            <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-gray-200 font-bold text-sm block">Motor Backend Express</span>
                  <p className="text-[11px] text-gray-400 font-mono">{settings.backendApiUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {serverOnline === null ? (
                  <span className="text-gray-400 text-xs font-medium">Comprobando...</span>
                ) : serverOnline ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Conectado
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Modo Local
                  </span>
                )}
                <button
                  onClick={checkServerHealth}
                  title="Refrescar estado"
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Garantía para Personas Mayores y Familias */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-gray-900 border border-emerald-700/50 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>Diseñado para Toda la Familia</span>
              </div>
              <p className="text-gray-300 leading-relaxed font-medium">
                MailShield traduce términos informáticos raros en advertencias claras para que nadie en casa caiga en engaños de bancos, paquetes falsos o suplantaciones.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: PRUEBAS DE FUEGO AUTOMATIZADAS */}
        {activeTab === 'sandbox' && (
          <div className="space-y-3.5 text-xs">
            <span className="text-gray-300 font-bold block">
              Pruebas Rápidas de Fuego:
            </span>

            {/* 3 Botones de Pruebas de Fuego Claras */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => loadPreset('banco')}
                className="min-h-[44px] p-2 rounded-xl bg-rose-950/70 text-rose-200 border-2 border-rose-600 font-bold text-[11px] hover:bg-rose-900 flex flex-col items-center justify-center text-center transition-all"
              >
                <span>Caso 1: Banco</span>
                <span className="text-[9px] text-rose-300 font-normal">Phishing IP / Urgencia</span>
              </button>

              <button
                onClick={() => loadPreset('boton')}
                className="min-h-[44px] p-2 rounded-xl bg-amber-950/70 text-amber-200 border-2 border-amber-600 font-bold text-[11px] hover:bg-amber-900 flex flex-col items-center justify-center text-center transition-all"
              >
                <span>Caso 2: Botón</span>
                <span className="text-[9px] text-amber-300 font-normal">Engaño .xyz</span>
              </button>

              <button
                onClick={() => loadPreset('legitimo')}
                className="min-h-[44px] p-2 rounded-xl bg-emerald-950/70 text-emerald-200 border-2 border-emerald-600 font-bold text-[11px] hover:bg-emerald-900 flex flex-col items-center justify-center text-center transition-all"
              >
                <span>Caso 3: Seguro</span>
                <span className="text-[9px] text-emerald-300 font-normal">Google Oficial</span>
              </button>
            </div>

            {/* Formulario editable */}
            <div className="space-y-2.5 pt-2 border-t border-gray-800">
              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Nombre mostrado del remitente</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 font-medium text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Dirección de correo real</label>
                <input
                  type="text"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Asunto del correo</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Texto que lee en el botón</label>
                <input
                  type="text"
                  value={buttonAnchor}
                  onChange={(e) => setButtonAnchor(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Enlaces del correo</label>
                <textarea
                  rows={2}
                  value={rawLinks}
                  onChange={(e) => setRawLinks(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleRunSandbox}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Analizar con Semáforo de Riesgo</span>
              </button>
            </div>

            {/* Resultado del Sandbox */}
            {sandboxResult && (
              <div className="mt-4 p-4 rounded-2xl bg-gray-900/90 border-2 border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-gray-100">Resultado del Semáforo:</span>
                  <RiskBadge score={sandboxResult.score} level={sandboxResult.level} size="sm" />
                </div>

                <div className="space-y-2">
                  {sandboxResult.breakdowns.map((b) => (
                    <div
                      key={b.id}
                      className={`p-2.5 rounded-xl text-xs font-medium border ${
                        b.severity === 'danger'
                          ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                          : b.severity === 'warning'
                          ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                          : 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                      }`}
                    >
                      <strong className="block font-bold">{b.title}</strong>
                      <span className="mt-0.5 block">{b.description}</span>
                    </div>
                  ))}
                </div>

                {sandboxResult.linkAnalyses.length > 0 && (
                  <LinkInspector links={sandboxResult.linkAnalyses} />
                )}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: AJUSTES */}
        {activeTab === 'settings' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-100 text-sm block">Inteligencia Cloud y Desenmascarador</span>
                <p className="text-gray-400 mt-0.5 font-medium">Rastrea acortadores bit.ly y reputación de dominios</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableCloudAnalysis}
                onChange={(e) => handleSaveSettings({ enableCloudAnalysis: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-100 text-sm block">Escaneo Automático en Gmail</span>
                <p className="text-gray-400 mt-0.5 font-medium">Inyecta el semáforo al abrir cualquier correo</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoScan}
                onChange={(e) => handleSaveSettings({ autoScan: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 uppercase font-bold block mb-1">Dirección del Servidor Backend</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.backendApiUrl}
                  onChange={(e) => setSettings({ ...settings, backendApiUrl: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleSaveSettings({ backendApiUrl: settings.backendApiUrl })}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pie de Página */}
      <div className="p-3 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500 font-mono">
        <span>MailShield AI v1.0</span>
        <span>Google Chrome MV3</span>
      </div>
    </div>
  );
};
