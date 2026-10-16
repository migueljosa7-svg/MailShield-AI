# 🛡️ MailShield AI — Semáforo de Seguridad Anti-Estafas para Gmail

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![React 18](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Express Security API](https://img.shields.io/badge/Backend-Express%20%2B%20Helmet-green.svg)](https://expressjs.com/)
[![Zero-Logs Policy](https://img.shields.io/badge/Privacy-CASA%20Tier%202%2F3%20Zero--Logs-emerald.svg)](https://appdefensealliance.dev/casa)
[![UI/UX Senior-Friendly](https://img.shields.io/badge/UX-Apto%20para%20Abuelos%20y%20Jóvenes-ff0055.svg)](#)

**MailShield AI** es una extensión Manifest V3 para Google Chrome y Gmail (`mail.google.com`) con una misión clara: **convertir análisis técnicos complejos de ciberseguridad en un "Semáforo de Seguridad" hipervisual, moderno y apto para todos los públicos** (desde adolescentes hasta personas mayores de 70 años).

Elimina por completo la jerga informática incomprensible y avisa de forma instantánea y contundente cuando un correo intenta robar dinero, contraseñas o datos personales.

---

## 🚦 El Semáforo de Riesgo Hipervisual

| Nivel de Riesgo | Estilo Visual | Título y Subtítulo para el Usuario |
| :--- | :--- | :--- |
| **🚨 Tarjeta Roja (70% - 100%)** | Borde neón rojo parpadeante (`animate-pulse`), fondo de cristal brillante, icono `ShieldAlert` gigante | **`🚨 ¡CUIDADO ABUELO/A! ESTO ES UNA ESTAFA`**<br>*"No toque ningún botón ni enlace de este correo. Quieren robarle sus datos o dinero."* |
| **⚠️ Tarjeta Amarilla (31% - 69%)** | Fondo ámbar cálido de alto contraste, icono `AlertTriangle` | **`⚠️ TEN CUIDADO - ALGO NO HUELE BIEN`**<br>*"Este correo tiene cosas raras. Revíselo bien antes de hacer clic en nada."* |
| **🟢 Tarjeta Verde (0% - 30%)** | Fondo verde esmeralda relajante, icono `ShieldCheck` | **`✅ CORREO SEGURO Y VERIFICADO`**<br>*"Este correo es de fiar. Viene de la empresa o persona real."* |

---

## 🗣️ Traducción de Lenguaje Técnico a Lenguaje Humano

MailShield AI sustituye las alertas confusas por advertencias que cualquier persona entiende al instante:

- En lugar de *"Typosquatting detectado en el dominio del remitente"*:  
  ➡️ **"Cuidado: El correo dice ser de Banco Santander/Correos, pero la dirección real es 'correoos-falso.xyz' (la página oficial de verdad es correos.es)."**
- En lugar de *"Heurística de urgencia coercitiva activada"*:  
  ➡️ **"Le están metiendo prisa o amenazando con bloquear su cuenta en 24 horas para que actúe sin pensar."**
- En lugar de *"Divergencia entre Anchor Text y Target URL"*:  
  ➡️ **"¡Peligro! El botón pone 'Entrar a Mi Cuenta', pero en verdad le lleva a una página web trampa."**
- En lugar de *"URL target IP-based host"*:  
  ➡️ **"El enlace le lleva directamente a números de servidor (IP) sin nombre registrado, típico de virus y estafas."**

---

## 🔍 Inspección Visual de Enlaces (`LinkInspector.tsx`)

- **Tabla Comparativa Limpia**:
  - **`👀 Texto que lee en el correo`**: Muestra lo que el atacante escribió en el botón (ej. *"Desbloquear Mi Dinero Ahora"*).
  - **`🌐 Página real adónde le lleva`**: Revela la dirección web real (ej. `http://192.168.1.100/...` o `trampa-estafas.xyz`).
- **Resaltado en Rojo Chillón**: Alertas visuales inmediatas para enlaces engañosos e IPs no verificadas.
- **Botones Grandes Táctiles (Mínimo 44px de alto)**: Accesibles para personas mayores con problemas de precisión motora:
  - `📋 Copiar enlace seguro` (con confirmación visual instantánea).
  - `Descubrir destino real oculto` (desenmascara acortadores `bit.ly`, `tinyurl`).
  - `🚨 Avisar de Estafa / Reportar` (alerta para proteger a la comunidad).

---

## 🏗️ Arquitectura Técnica

- **Manifest V3**: Permisos mínimos requeridos (`storage`, `activeTab`), con Service Worker de fondo.
- **Inyección Aislada (Shadow DOM)**: `contentScript.tsx` utiliza `attachShadow({ mode: 'open' })` para que los estilos de Tailwind CSS no rompan el diseño de Gmail ni Gmail altere los del semáforo.
- **Backend Express (`server.ts`)**: Servidor Node.js con Helmet, CORS estricto, Rate-Limiting, y **Política Zero-Logs** (los correos se procesan de forma efímera en memoria; no se guarda ningún contenido ni dato privado).
- **Simulador Local de Gmail (`demo/gmail-mock.html`)**: Banco de pruebas interactivo que simula la estructura DOM exacta de Gmail (`.adn.ads`, `span.gD`, `h2.hP`, `.a3s.aiL`).

---

## 📁 Estructura del Proyecto

```text
MailShield AI/
├── manifest.json              # Configuración Manifest V3 Chrome Extension
├── package.json               # Dependencias y scripts
├── vite.config.ts             # Configuración de compilación Vite
├── tailwind.config.js         # Tokens de diseño y colores del semáforo
├── postcss.config.js          # Configuración PostCSS
├── backend/
│   └── server.ts              # Servidor Express API (Helmet, Zero-logs, expand-url)
├── demo/
│   └── gmail-mock.html        # Simulador DOM de Gmail con las 3 Pruebas de Fuego
├── scripts/
│   ├── build.js               # Empaquetador multi-objetivo (IIFE, ES worker, popup)
│   ├── generate-icons.js      # Generador de iconos PNG (icon16, icon48, icon128)
│   └── test-api.js            # Suite de Pruebas de Fuego automatizadas
├── src/
│   ├── assets/                # Iconos de la extensión (icon16.png, icon48.png, icon128.png)
│   ├── types/index.ts         # Tipos TypeScript
│   ├── background/
│   │   └── serviceWorker.ts   # Service Worker (Caché 24h, badge, mensajería)
│   ├── content/
│   │   ├── contentScript.tsx  # Inyector en Shadow DOM y montaje React
│   │   ├── gmailObserver.ts   # Observador no bloqueante del DOM de Gmail
│   │   ├── contentStyle.css   # Estilos CSS scoped para Gmail
│   │   └── components/
│   │       ├── SecurityBar.tsx   # Semáforo de seguridad con explicaciones didácticas
│   │       ├── RiskBadge.tsx     # Medidor circular SVG grande (0-100%)
│   │       └── LinkInspector.tsx # Tabla comparativa "Texto que lee" vs "Página real"
│   ├── utils/
│   │   ├── heuristics.ts      # Motor de riesgo y explicaciones en lenguaje humano
│   │   ├── linkAnalyzer.ts    # Analizador de acortadores, IPs y dominios
│   │   └── storage.ts         # Almacenamiento local con TTL de 24 horas
│   └── popup/
│       ├── index.html         # Ventana popup de la barra de herramientas
│       ├── main.tsx           # Entrada React del popup
│       └── Popup.tsx          # Panel familiar con estadísticas y 3 pruebas rápidas
└── dist/                      # Carpeta empaquetada lista para cargar en Chrome
```

---

## 🚀 Guía de Ejecución y "Pruebas de Fuego" Paso a Paso

### 1. Compilar la Extensión
```bash
npm run build
```
Genera la carpeta `dist/` con el `contentScript.js` encapsulado (IIFE), `serviceWorker.js`, `manifest.json`, iconos y estilos.

### 2. Arrancar el Servidor Backend
```bash
npm run server
```
Inicia la API en `http://localhost:3001` con los endpoints:
- `GET  /api/health`
- `POST /api/analyze-email`
- `POST /api/expand-url`
- `POST /api/check-domain`
- `POST /api/report-phishing`

### 3. Ejecutar las Pruebas de Fuego Automáticas por Consola
En otra terminal, ejecuta el script de pruebas automáticas:
```bash
node scripts/test-api.js
```
Validará que el Caso 1 active la Tarjeta Roja (70%-100%), el Caso 2 active la Advertencia y el Caso 3 active la Tarjeta Verde (0%-30%).

### 4. Abrir la Prueba de Fuego Visual en el Navegador
Abre en tu navegador:
👉 **[http://localhost:3001/demo/gmail-mock.html](http://localhost:3001/demo/gmail-mock.html)**

Podrás alternar con un solo clic entre las 3 Pruebas de Fuego:
1. **Caso 1: Phishing Banco Santander** ➡️ Verás el banner gigante: **`🚨 ¡CUIDADO ABUELO/A! ESTO ES UNA ESTAFA`**, el medidor al 100%, la advertencia contra la urgencia de 24h y la tabla comparativa con la IP `192.168.1.100`.
2. **Caso 2: Engaño de Botón Correos** ➡️ Verás la alerta de suplantación y el enlace tramposo hacia dominio `.xyz`.
3. **Caso 3: Correo Legítimo Google** ➡️ Verás la tarjeta verde esmeralda: **`✅ CORREO SEGURO Y VERIFICADO`**.

### 5. Instalar en Google Chrome (Gmail Real)
1. Abre Chrome y entra en `chrome://extensions/`.
2. Activa el interruptor **"Modo de desarrollador"** (arriba a la derecha).
3. Haz clic en **"Cargar descomprimida"**.
4. Selecciona la carpeta `dist`:
   ```text
   c:\Users\migue\Desktop\MailShield AI\dist
   ```
5. ¡Listo! Abre cualquier correo en [mail.google.com](https://mail.google.com) y el Semáforo de Seguridad se inyectará automáticamente sobre el mensaje.

---

## 🔒 Privacidad y Cumplimiento
- **Política Zero-Logs**: No se almacena ninguna dirección, asunto ni cuerpo de correo. Los análisis se realizan de manera transitoria en memoria y se descartan inmediatamente.
- **Sin `eval()` ni código inseguro**: Totalmente conforme con los estándares de seguridad de Google Chrome Web Store y CASA Tier 2/3.
