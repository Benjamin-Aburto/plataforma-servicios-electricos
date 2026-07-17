const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

const VALID_SERVICE_TYPES = [
  'instalacion_electrica',
  'reparacion',
  'mantenimiento',
  'certificacion',
  'otro',
];

// URL interna del notification-service (nombre del servicio en docker-compose,
// resuelto automáticamente por la red interna de Docker vía DNS).
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4002';

function validateContactPayload(body) {
  const errors = [];
  const { full_name, email, message, phone, service_type } = body;

  if (!full_name || full_name.trim().length < 3) {
    errors.push('El nombre completo es obligatorio (mínimo 3 caracteres).');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('El email no es válido.');
  }
  if (!message || message.trim().length < 10) {
    errors.push('El mensaje debe tener al menos 10 caracteres.');
  }
  if (phone && !/^[0-9+()\s-]{6,20}$/.test(phone)) {
    errors.push('El teléfono no tiene un formato válido.');
  }
  if (service_type && !VALID_SERVICE_TYPES.includes(service_type)) {
    errors.push('El tipo de servicio no es válido.');
  }

  return errors;
}

// Envía la "señal" a notification-service. Es un microservicio
// independiente: si falla, NO debe tumbar la respuesta al usuario
// (el mensaje ya quedó guardado en la base de datos).
async function notifyNewContact(payload) {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('⚠️ notification-service respondió con error:', response.status);
    }
  } catch (error) {
    console.warn('⚠️ No se pudo contactar a notification-service:', error.message);
  }
}

// POST /api/contact -> guarda un nuevo mensaje y dispara la notificación
router.post('/', async (req, res) => {
  const errors = validateContactPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  const {
    full_name,
    email,
    phone = null,
    service_type = 'otro',
    message,
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO contact_messages (full_name, email, phone, service_type, message)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name.trim(), email.trim(), phone, service_type, message.trim()]
    );

    // Señal asíncrona hacia notification-service (no bloquea la respuesta
    // al usuario más de lo necesario; se espera pero no revierte el insert).
    await notifyNewContact({
      id: result.insertId,
      full_name: full_name.trim(),
      email: email.trim(),
      service_type,
    });

    return res.status(201).json({
      ok: true,
      message: 'Mensaje recibido correctamente. Nos pondremos en contacto pronto.',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Error al insertar mensaje de contacto:', error.message);
    return res.status(500).json({
      ok: false,
      errors: ['Ocurrió un error en el servidor. Intenta nuevamente más tarde.'],
    });
  }
});

// GET /api/contact -> lista los mensajes (uso interno/administrativo)
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, service_type, message, status, created_at
       FROM contact_messages
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    console.error('Error al listar mensajes de contacto:', error.message);
    return res.status(500).json({ ok: false, errors: ['Error al consultar los mensajes.'] });
  }
});

module.exports = router;
