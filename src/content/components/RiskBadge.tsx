import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  score: number;
  level: 'low' | 'moderate' | 'high';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  level,
  size = 'md',
  showLabel = true
}) => {
  const radius = size === 'sm' ? 20 : size === 'lg' ? 44 : 30;
  const stroke = size === 'sm' ? 4 : size === 'lg' ? 7 : 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorStyles = {
    low: {
      text: 'text-emerald-400',
      stroke: '#10b981',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
      label: 'CORREO SEGURO',
      subtitle: 'Este correo es de fiar. Viene de la empresa o persona real.',
      Icon: ShieldCheck,
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
    },
    moderate: {
      text: 'text-amber-400',
      stroke: '#f59e0b',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      label: 'TEN CUIDADO',
      subtitle: 'Este correo tiene cosas raras. Revíselo bien antes de hacer clic.',
      Icon: AlertTriangle,
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
    },
    high: {
      text: 'text-rose-400',
      stroke: '#f43f5e',
      badgeBg: 'bg-rose-950/90 text-rose-200 border-rose-500/80 animate-pulse',
      label: '¡PELIGRO! ESTAFA DETECTADA',
      subtitle: 'No toque ningún botón ni enlace. Quieren robarle sus datos o dinero.',
      Icon: ShieldAlert,
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.5)]'
    }
  }[level];

  const { Icon } = colorStyles;
  const svgSize = radius * 2;

  return (
    <div className="flex items-center gap-3">
      {/* Medidor Circular de Gran Tamaño */}
      <div className={`relative flex items-center justify-center rounded-full p-1 bg-gray-950/80 border border-gray-800 ${colorStyles.glow}`}>
        <svg
          height={svgSize}
          width={svgSize}
          className="transform -rotate-90 transition-all duration-700 ease-out"
        >
          <circle
            stroke="rgba(255, 255, 255, 0.12)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={colorStyles.stroke}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Número Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-black tracking-tight leading-none ${colorStyles.text} ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-base'}`}>
            {score}%
          </span>
          {size !== 'sm' && (
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mt-0.5">
              Riesgo
            </span>
          )}
        </div>
      </div>

      {/* Etiqueta y Explicación en Tamaño Senior-Friendly */}
      {showLabel && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorStyles.badgeBg}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {colorStyles.label}
            </span>
          </div>
          <span className="text-xs text-gray-300 font-medium mt-1 leading-snug max-w-sm">
            {colorStyles.subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
