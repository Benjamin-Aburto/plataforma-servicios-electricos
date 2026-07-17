require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/db');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'contact-service', status: 'up' });
});

app.use('/api/contact', contactRoutes);

app.use((_req, res) => {
  res.status(404).json({ ok: false, errors: ['Ruta no encontrada.'] });
});

app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ ok: false, errors: ['Error interno del servidor.'] });
});

app.listen(PORT, async () => {
  console.log(`📩 contact-service escuchando en el puerto ${PORT}`);
  await testConnection();
});
