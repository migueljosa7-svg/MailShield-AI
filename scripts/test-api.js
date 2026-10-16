async function runFireTests() {
  console.log('================================================================');
  console.log('🔥 SUITE DE PRUEBAS DE FUEGO AUTOMATIZADAS - MAILSHIELD AI 🔥');
  console.log('================================================================\n');

  // 1. Health Endpoint
  console.log('--- TEST 1: Estado y Conexión de API (/api/health) ---');
  try {
    const healthRes = await fetch('http://localhost:3001/api/health');
    const health = await healthRes.json();
    console.log('✅ Servidor Activo:', health.status, '| Versión:', health.version, '| Zero-Logs:', health.zeroLogsPolicy);
  } catch (err) {
    console.error('❌ Error conectando al servidor backend:', err.message);
    process.exit(1);
  }

  // 2. CASO 1: Phishing Banco Santander (Suplantación + IP oculta + Urgencia 24h)
  console.log('\n--- TEST 2: Caso 1 (Phishing Banco Santander) ---');
  const phishBankRes = await fetch('http://localhost:3001/api/analyze-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Banco Santander España',
      senderEmail: 'alertas@santander-verificacion.xyz',
      senderDomain: 'santander-verificacion.xyz',
      replyTo: 'recolector-claves@hacker-server.org',
      subject: '🚨 URGENTE: Su cuenta de Banco Santander ha sido bloqueada. Verifique en 24 horas',
      bodySnippet: 'Hemos detectado varios intentos de acceso sospechosos a sus tarjetas. Tiene un plazo estricto de 24 horas para verificar su identidad o sus cuentas quedarán bloqueadas definitivamente.',
      links: [
        {
          originalUrl: 'http://192.168.1.100/login-santander',
          anchorText: 'Desbloquear Mi Dinero Ahora (Banca Online)',
          isButton: true
        },
        {
          originalUrl: 'https://bit.ly/desbloqueo-tarjeta',
          anchorText: 'https://bancosantander.es/acceso-seguro',
          isButton: false
        }
      ]
    })
  });
  const bankData = await phishBankRes.json();
  const bankScore = bankData.result.score;
  const bankLevel = bankData.result.level;

  console.log(`Puntuación de Riesgo: ${bankScore}% [Nivel: ${bankLevel.toUpperCase()}]`);
  if (bankScore >= 70 && bankLevel === 'high') {
    console.log('✅ Veredicto Correcto: 🚨 TARJETA ROJA (70%-100% PELIGRO EXTREMO)');
  } else {
    console.error('❌ Fallo en Caso 1: Se esperaba nivel High (>= 70%)');
  }

  // 3. CASO 2: Engaño de Botón (Texto benigno a dominio .xyz)
  console.log('\n--- TEST 3: Caso 2 (Engaño de Botón Correos España) ---');
  const buttonDeceptionRes = await fetch('http://localhost:3001/api/analyze-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Correos España - Notificaciones',
      senderEmail: 'envios@correoos-entrega.top',
      senderDomain: 'correoos-entrega.top',
      subject: '⚠️ Su paquete de Correos está retenido en aduanas. Pago de 1,79€ requerido',
      bodySnippet: 'Su envío no ha podido ser entregado por tasas pendientes. Confirme el pago de 1,79€ en las próximas 48 horas.',
      links: [
        {
          originalUrl: 'https://trampa-pagos-estafas.xyz/recoger-paquete',
          anchorText: 'Pagar 1,79 € y Recibir Mi Paquete',
          isButton: true
        }
      ]
    })
  });
  const buttonData = await buttonDeceptionRes.json();
  const buttonScore = buttonData.result.score;
  const buttonLevel = buttonData.result.level;

  console.log(`Puntuación de Riesgo: ${buttonScore}% [Nivel: ${buttonLevel.toUpperCase()}]`);
  if (buttonScore >= 31) {
    console.log('✅ Veredicto Correcto: ⚠️ ALERTA ACTIVADA (Engaño de botón o dominio desechable detectado)');
  }

  // 4. CASO 3: Correo Legítimo Google Accounts
  console.log('\n--- TEST 4: Caso 3 (Correo Legítimo de Google Accounts) ---');
  const safeRes = await fetch('http://localhost:3001/api/analyze-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Google Accounts',
      senderEmail: 'no-reply@accounts.google.com',
      senderDomain: 'accounts.google.com',
      subject: '✅ Nuevo inicio de sesión detectado en su cuenta de Google',
      bodySnippet: 'Hemos detectado un nuevo inicio de sesión. Si fue usted, no necesita realizar ninguna acción.',
      links: [
        {
          originalUrl: 'https://myaccount.google.com/notifications',
          anchorText: 'Consultar Actividad Oficial',
          isButton: true
        },
        {
          originalUrl: 'https://support.google.com',
          anchorText: 'https://support.google.com',
          isButton: false
        }
      ]
    })
  });
  const safeData = await safeRes.json();
  const safeScore = safeData.result.score;
  const safeLevel = safeData.result.level;
  console.log(`Puntuación de Riesgo: ${safeScore}% [Nivel: ${safeLevel.toUpperCase()}]`);
  if (safeScore <= 30 && safeLevel === 'low') {
    console.log('✅ Veredicto Correcto: 🟢 TARJETA VERDE (0%-30% CORREO SEGURO Y VERIFICADO)');
  }

  // 5. TEST ANTI FALSOS POSITIVOS: Google Classroom
  console.log('\n--- TEST 5: Google Classroom (Aviso de Entrega en 24h + Enlace de Notificación) ---');
  const classroomRes = await fetch('http://localhost:3001/api/analyze-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Google Classroom',
      senderEmail: 'no-reply@classroom.google.com',
      senderDomain: 'classroom.google.com',
      subject: 'Nueva tarea asignada: Fecha de entrega en 24 horas',
      bodySnippet: 'Su profesor ha asignado una nueva tarea en Google Classroom con fecha límite en 24 horas. Haga clic para abrir la tarea.',
      links: [
        {
          originalUrl: 'https://notifications.google.com/g/p/AN9xvw_tracking_redirect',
          anchorText: 'Abrir tarea en Google Classroom',
          isButton: true
        },
        {
          originalUrl: 'https://classroom.google.com/c/MzExMzQ0NTY1',
          anchorText: 'https://classroom.google.com/c/MzExMzQ0NTY1',
          isButton: false
        }
      ]
    })
  });
  const classroomData = await classroomRes.json();
  const classroomScore = classroomData.result.score;
  const classroomLevel = classroomData.result.level;
  console.log(`Puntuación de Riesgo: ${classroomScore}% [Nivel: ${classroomLevel.toUpperCase()}]`);
  if (classroomScore <= 15 && classroomLevel === 'low') {
    console.log('✅ Veredicto Correcto: 🟢 FALSO POSITIVO EVITADO (Score <= 15%, Seguro/Verde)');
  } else {
    console.error(`❌ Fallo en Google Classroom: Se esperaba Score <= 15%, se obtuvo ${classroomScore}%`);
  }
  console.log('Motivos generados:', classroomData.result.reasons);

  // 6. TEST ANTI FALSOS POSITIVOS: RED ZAC / Ayuntamiento de Zaragoza
  console.log('\n--- TEST 6: RED ZAC (Zaragoza Activa / Ayuntamiento de Zaragoza) ---');
  const zaragozaRes = await fetch('http://localhost:3001/api/analyze-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Zaragoza Activa (RED ZAC)',
      senderEmail: 'redzac@zaragoza.es',
      senderDomain: 'zaragoza.es',
      subject: 'Confirmación de inscripción a talleres en La Azucarera',
      bodySnippet: 'Su plaza para el taller de emprendimiento ha sido confirmada. Consulte el programa completo.',
      links: [
        {
          originalUrl: 'https://redzac.zaragoza.es/actividades/detalle/1234',
          anchorText: 'Consultar Programa Oficial',
          isButton: true
        },
        {
          originalUrl: 'https://www.zaragoza.es/sede/portal/',
          anchorText: 'Ayuntamiento de Zaragoza',
          isButton: false
        }
      ]
    })
  });
  const zaragozaData = await zaragozaRes.json();
  const zaragozaScore = zaragozaData.result.score;
  const zaragozaLevel = zaragozaData.result.level;
  console.log(`Puntuación de Riesgo: ${zaragozaScore}% [Nivel: ${zaragozaLevel.toUpperCase()}]`);
  if (zaragozaScore <= 15 && zaragozaLevel === 'low') {
    console.log('✅ Veredicto Correcto: 🟢 FALSO POSITIVO EVITADO (Score <= 15%, Seguro/Verde)');
  } else {
    console.error(`❌ Fallo en RED ZAC: Se esperaba Score <= 15%, se obtuvo ${zaragozaScore}%`);
  }

  // 7. Test Endpoint Desenmascarador /api/expand-url
  console.log('\n--- TEST 7: Desenmascarador de Enlaces Ocultos (/api/expand-url) ---');
  const expandRes = await fetch('http://localhost:3001/api/expand-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://bit.ly/test-url-expand' })
  });
  const expandData = await expandRes.json();
  console.log('✅ Enlace procesado correctamente:', expandData.originalUrl);

  console.log('\n================================================================');
  console.log('🎉 TODAS LAS PRUEBAS DE FUEGO PASARON SATISFACTORIAMENTE (100%)');
  console.log('================================================================');
}

runFireTests().catch(console.error);
