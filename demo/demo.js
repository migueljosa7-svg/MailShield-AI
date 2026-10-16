// Script externo para demo/gmail-mock.html (cumple con CSP estricto sin inline scripts ni inline event handlers)
const cases = {
  caso1: {
    subject: "🚨 URGENTE: Su cuenta de Banco Santander ha sido bloqueada. Verifique en 24 horas",
    senderName: "Banco Santander España",
    senderEmail: "alertas@santander-verificacion.xyz",
    avatar: "S",
    avatarBg: "#ec0000",
    replyTo: "reply-to: recolector-claves@hacker-server.org",
    body: `
      <p>Estimado cliente del Banco Santander,</p>
      <p>Hemos detectado varios <strong>intentos de acceso sospechosos</strong> a sus tarjetas bancarias desde una dirección IP no autorizada. Por motivos de seguridad, hemos <strong>suspendido preventivamente su banca digital</strong>.</p>
      <p style="background: #fff1f2; padding: 12px; border-left: 4px solid #f43f5e; border-radius: 6px; font-weight: 600; color: #9f1239;">
        Tiene un plazo estricto de 24 horas para verificar su identidad o sus cuentas quedarán bloqueadas definitivamente.
      </p>
      <div style="margin: 24px 0;">
        <a href="http://192.168.1.100/login-santander" role="button" class="button" style="display: inline-block; background: #ec0000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 28px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(236,0,0,0.3);">
          Desbloquear Mi Dinero Ahora (Banca Online)
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        Enlace de respaldo seguro alternativo: 
        <a href="https://bit.ly/desbloqueo-tarjeta" style="color: #ec0000; font-weight: 600;">https://bancosantander.es/acceso-seguro</a>
      </p>
    `
  },
  caso2: {
    subject: "⚠️ Su paquete de Correos está retenido en aduanas. Pago de 1,79€ requerido",
    senderName: "Correos España - Notificaciones",
    senderEmail: "envios@correoos-entrega.top",
    avatar: "C",
    avatarBg: "#ffcc00",
    replyTo: "",
    body: `
      <p>Estimado/a destinatario/a,</p>
      <p>Su envío internacional con número de seguimiento <code>ES-992381-Z</code> no ha podido ser entregado debido a <strong>tasas arancelarias de aduana pendientes (1,79 €)</strong>.</p>
      <p>Para desbloquear la entrega a su domicilio, por favor confirme el pago en el botón oficial:</p>
      <div style="margin: 24px 0;">
        <a href="https://trampa-pagos-estafas.xyz/recoger-paquete" role="button" class="button" style="display: inline-block; background: #002e6e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px;">
          Pagar 1,79 € y Recibir Mi Paquete
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        Tiene 48 horas para reclamar su paquete o será destruido en almacén.
      </p>
    `
  },
  caso3: {
    subject: "Nueva tarea asignada en Google Classroom: Entrega en 24 horas",
    senderName: "Google Classroom",
    senderEmail: "no-reply@classroom.google.com",
    avatar: "C",
    avatarBg: "#0f9d58",
    replyTo: "",
    body: `
      <p>Hola,</p>
      <p>El profesor García ha publicado una nueva tarea en la clase <strong>Matemáticas 2º Bachillerato</strong>:</p>
      <p><strong>Tema 4: Integrales y Cálculo</strong> (Fecha de entrega: Mañana a las 23:59h - Plazo de 24 horas).</p>
      <div style="margin: 24px 0;">
        <a href="https://notifications.google.com/g/p/AN9xvw_tracking_redirect" role="button" class="button" style="display: inline-block; background: #0f9d58; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px;">
          Abrir tarea en Google Classroom
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        Acceda a todas sus clases en <a href="https://classroom.google.com/c/MzExMzQ0NTY1" style="color: #0f9d58;">https://classroom.google.com</a>
      </p>
    `
  },
  caso4: {
    subject: "Zaragoza Activa (RED ZAC): Confirmación de inscripción al taller",
    senderName: "Zaragoza Activa - RED ZAC",
    senderEmail: "redzac@zaragoza.es",
    avatar: "Z",
    avatarBg: "#c8102e",
    replyTo: "",
    body: `
      <p>Estimado/a participante,</p>
      <p>Le confirmamos que su plaza para el taller <strong>"Emprendimiento e Innovación en La Azucarera"</strong> ha sido reservada correctamente.</p>
      <div style="margin: 24px 0;">
        <a href="https://redzac.zaragoza.es/actividades/detalle/1234" role="button" class="button" style="display: inline-block; background: #c8102e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px;">
          Consultar Programa y Ubicación
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b;">
            Sede electrónica y avisos oficiales en <a href="https://www.zaragoza.es/sede/portal/" style="color: #c8102e;">https://www.zaragoza.es</a>
      </p>
    `
  },
  caso5: {
    subject: "✅ Nuevo inicio de sesión detectado en su cuenta de Google",
    senderName: "Google Accounts",
    senderEmail: "no-reply@accounts.google.com",
    avatar: "G",
    avatarBg: "#4285f4",
    replyTo: "",
    body: `
      <p>Hola,</p>
      <p>Hemos detectado un nuevo inicio de sesión en su cuenta de Google desde un dispositivo Windows.</p>
      <p>Si fue usted, no necesita realizar ninguna acción. Si no reconoce este dispositivo, puede consultar la actividad de su cuenta:</p>
      <div style="margin: 24px 0;">
        <a href="https://myaccount.google.com/notifications" role="button" class="button" style="display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
          Consultar Actividad Oficial
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        Más información en el centro de asistencia de Google: 
        <a href="https://support.google.com" style="color: #1a73e8;">https://support.google.com</a>
      </p>
    `
  }
};

function loadCase(key) {
  document.querySelectorAll('.test-case-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn-' + key);
  if (activeBtn) activeBtn.classList.add('active');

  const data = cases[key];
  if (!data) return;

  const subjectEl = document.getElementById('email-subject');
  if (subjectEl) subjectEl.innerText = data.subject;

  const senderNameEl = document.getElementById('email-sender-name');
  if (senderNameEl) senderNameEl.innerText = data.senderName;
  
  const emailSpan = document.getElementById('email-sender-email');
  if (emailSpan) {
    emailSpan.setAttribute('email', data.senderEmail);
    emailSpan.innerText = `<${data.senderEmail}>`;
  }
  
  const avatarEl = document.getElementById('sender-avatar');
  if (avatarEl) {
    avatarEl.innerText = data.avatar;
    avatarEl.style.background = data.avatarBg;
  }

  const replyToEl = document.getElementById('email-reply-to');
  if (replyToEl) replyToEl.innerText = data.replyTo;

  const bodyEl = document.getElementById('email-body');
  if (bodyEl) bodyEl.innerHTML = data.body;

  // Retirar panel previo para forzar reinyección con nueva evaluación
  const oldHost = document.querySelector('.mailshield-injected-host');
  if (oldHost) oldHost.remove();

  setTimeout(injectMailShieldNow, 150);
}

function injectMailShieldNow() {
  window.dispatchEvent(new Event('hashchange'));
}

// Attach event listeners to buttons programmatically (no inline onclicks)
document.addEventListener('DOMContentLoaded', () => {
  ['caso1', 'caso2', 'caso3', 'caso4', 'caso5'].forEach(caseKey => {
    const btn = document.getElementById('btn-' + caseKey);
    if (btn) {
      btn.addEventListener('click', () => loadCase(caseKey));
    }
  });

  const reinectBtn = document.getElementById('btn-reinject');
  if (reinectBtn) {
    reinectBtn.addEventListener('click', injectMailShieldNow);
  }

  setTimeout(injectMailShieldNow, 300);
});

// Also trigger on load
window.addEventListener('load', () => {
  setTimeout(injectMailShieldNow, 400);
});
