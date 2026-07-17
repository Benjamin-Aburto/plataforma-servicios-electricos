// Las URLs de los microservicios se inyectan en tiempo de contenedor
// (no en build) a través de env-config.js, generado por el entrypoint
// de Nginx a partir de las variables de entorno CONTACT_API_URL y
// PORTFOLIO_API_URL. Así la misma imagen de frontend sirve para
// distintos entornos sin reconstruirla.
const CONTACT_API_URL =
  (window.__ENV__ && window.__ENV__.CONTACT_API_URL) || 'http://localhost:4000/api';
const PORTFOLIO_API_URL =
  (window.__ENV__ && window.__ENV__.PORTFOLIO_API_URL) || 'http://localhost:4001/api';

document.getElementById('year').textContent = new Date().getFullYear();

// =========================================================
// Galería de trabajos (consume portfolio-service)
// =========================================================
async function loadPortfolio() {
  const grid = document.getElementById('gallery-grid');

  try {
    const response = await fetch(`${PORTFOLIO_API_URL}/portfolio`);
    const data = await response.json();

    if (!response.ok || !data.ok || !Array.isArray(data.data)) {
      throw new Error('Respuesta inválida de portfolio-service');
    }

    grid.innerHTML = data.data
      .map(
        (item) => `
        <figure class="gallery__item">
          <img src="${item.image}" alt="${item.title}" loading="lazy" />
          <figcaption>${item.title}</figcaption>
        </figure>`
      )
      .join('');
  } catch (error) {
    console.error('Error al cargar la galería:', error);
    grid.innerHTML = '<p>No se pudo cargar la galería de trabajos en este momento.</p>';
  }
}

loadPortfolio();

// =========================================================
// Formulario de contacto (consume contact-service)
// =========================================================
const form = document.getElementById('contact-form');
const feedback = document.getElementById('form-feedback');
const submitBtn = document.getElementById('submit-btn');

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `form-feedback form-feedback--${type}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setFeedback('', '');

  const payload = {
    full_name: form.full_name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim() || undefined,
    service_type: form.service_type.value,
    message: form.message.value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    const response = await fetch(`${CONTACT_API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      const errors = (data.errors && data.errors.join(' ')) || 'No se pudo enviar el mensaje.';
      setFeedback(errors, 'error');
      return;
    }

    setFeedback('✅ ¡Gracias! Tu mensaje fue enviado correctamente.', 'success');
    form.reset();
  } catch (error) {
    console.error('Error al enviar el formulario:', error);
    setFeedback('No se pudo conectar con el servidor. Intenta más tarde.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar mensaje';
  }
});
