const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'notification-service', status: 'up' });
});

// POST /api/notify -> "simula" el envío de un correo al equipo/cliente.
// No usa un proveedor de correo real: solo registra en el log del
// contenedor, que es exactamente lo que se necesita para demostrar
// la comunicación entre microservicios en la evaluación.
app.post('/api/notify', (req, res) => {
  const { id, full_name, email, service_type } = req.body || {};

  if (!full_name || !email) {
    return res.status(400).json({
      ok: false,
      errors: ['full_name y email son obligatorios para notificar.'],
    });
  }

  const notificationId = `NTF-${Date.now()}`;

  console.log('📧 [SIMULACIÓN DE CORREO]');
  console.log(`   Para: equipo@electroservicios.cl`);
  console.log(`   Asunto: Nuevo contacto (#${id ?? 'N/A'}) - ${service_type ?? 'otro'}`);
  console.log(`   Cliente: ${full_name} <${email}>`);
  console.log(`   Notificación: ${notificationId}`);

  return res.status(200).json({
    ok: true,
    message: 'Notificación simulada enviada correctamente.',
    notificationId,
  });
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, errors: ['Ruta no encontrada.'] });
});

app.listen(PORT, () => {
  console.log(`🔔 notification-service escuchando en el puerto ${PORT}`);
});
