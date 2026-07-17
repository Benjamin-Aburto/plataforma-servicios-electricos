const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Microservicio simple y autocontenido: no depende de la base de datos.
// La galería se guarda en memoria; en una versión futura podría tener
// su propia tabla/BD (independiente de contact-service).
const portfolioItems = [
  {
    id: 1,
    title: 'Instalación de tablero residencial',
    description: 'Cambio completo de tablero eléctrico y normalización de circuitos.',
    image: 'img/trabajo-1.jpg',
  },
  {
    id: 2,
    title: 'Cableado en obra comercial',
    description: 'Cableado estructurado para local comercial de 120 m².',
    image: 'img/trabajo-2.jpg',
  },
  {
    id: 3,
    title: 'Mantenimiento industrial',
    description: 'Mantenimiento preventivo de tablero de fuerza en planta industrial.',
    image: 'img/trabajo-3.jpg',
  },
  {
    id: 4,
    title: 'Reparación de cortocircuito',
    description: 'Diagnóstico y solución de cortocircuito en vivienda residencial.',
    image: 'img/trabajo-4.jpg',
  },
];

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'portfolio-service', status: 'up' });
});

app.get('/api/portfolio', (_req, res) => {
  res.json({ ok: true, data: portfolioItems });
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, errors: ['Ruta no encontrada.'] });
});

app.listen(PORT, () => {
  console.log(`🖼️  portfolio-service escuchando en el puerto ${PORT}`);
});
