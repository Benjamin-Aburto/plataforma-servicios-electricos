# ⚡ Servicios Eléctricos — Arquitectura de 5 Microservicios (Proyecto DevOps)

Plataforma web para promocionar servicios eléctricos, rediseñada como **5 microservicios independientes**, cada uno en su propio contenedor Docker, orquestados con **Docker Compose**.

## 1. Los 5 microservicios

| # | Servicio               | Rol                                                              | Puerto interno |
|---|-------------------------|-------------------------------------------------------------------|----------------|
| 1 | `frontend`              | Landing page estática (Nginx) con las secciones Inicio / Trabajos / Contacto | 80 |
| 2 | `portfolio-service`     | API que expone la galería de "Trabajos Realizados"                | 4001 |
| 3 | `contact-service`       | API que recibe el formulario de contacto y lo guarda en MySQL     | 4000 |
| 4 | `notification-service`  | API que recibe una señal de `contact-service` y **simula** el envío de un correo | 4002 |
| 5 | `db`                    | Base de datos MySQL                                                | 3306 |

## 2. Estructura del proyecto

```
electric-services-platform/
├── frontend/
│   ├── src/
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/app.js            # llama a contact-service y portfolio-service
│   ├── Dockerfile                # multietapa (build -> nginx)
│   ├── nginx.conf
│   └── docker-entrypoint.sh      # inyecta CONTACT_API_URL / PORTFOLIO_API_URL en runtime
│
├── portfolio-service/
│   ├── src/server.js             # GET /api/portfolio (datos en memoria, sin BD)
│   ├── package.json
│   └── Dockerfile
│
├── contact-service/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/db.js          # conexión a MySQL
│   │   └── routes/contact.js     # POST/GET /api/contact + llama a notification-service
│   ├── package.json
│   └── Dockerfile
│
├── notification-service/
│   ├── src/server.js             # POST /api/notify (simula envío de correo, solo logs)
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── init.sql                  # tabla contact_messages
│
├── docker-compose.yml            # orquesta los 5 servicios en una misma red
├── .env.example
└── README.md
```

## 3. Flujo de datos entre microservicios

```
[Usuario/Navegador]
      │
      ├──► GET  http://localhost:8080              -> frontend (Nginx)
      │
      ├──► GET  http://localhost:4001/api/portfolio -> portfolio-service (galería)
      │
      └──► POST http://localhost:4000/api/contact   -> contact-service
                                                          │
                                                          ├─► INSERT en MySQL (db)
                                                          │
                                                          └─► POST http://notification-service:4002/api/notify
                                                                    (señal interna, vía red Docker)
                                                                    -> notification-service
                                                                       "simula" el envío del correo (log)
```

Puntos clave de este flujo:

- El **navegador del usuario** solo habla con `frontend`, `contact-service` y `portfolio-service` (expuestos al host).
- `contact-service` es el único que escribe en la base de datos.
- La comunicación `contact-service` → `notification-service` es **interna**: ocurre solo dentro de la red de Docker, usando el nombre del servicio (`http://notification-service:4002`) que Docker resuelve automáticamente por DNS. Este endpoint nunca se expone a internet.
- Si `notification-service` falla, `contact-service` igual responde éxito al usuario (el mensaje ya quedó guardado); solo se registra una advertencia en el log. Esto demuestra **desacoplamiento entre microservicios**: la caída de uno no debe tumbar a los demás.

## 4. Cómo correr el proyecto localmente

1. Copia las variables de entorno de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env` y cambia las contraseñas por unas propias.
3. Levanta los 5 servicios:
   ```bash
   docker compose up --build
   ```
4. Accede a:
   - Frontend: http://localhost:8080
   - contact-service (health): http://localhost:4000/api/health
   - portfolio-service (health): http://localhost:4001/api/health
   - notification-service (health): http://localhost:4002/api/health
   - MySQL: localhost:3306

5. Para ver la simulación de correo en tiempo real:
   ```bash
   docker compose logs -f notification-service
   ```
   y luego envía el formulario de contacto desde el navegador.

6. Para bajar el stack:
   ```bash
   docker compose down          # conserva los datos (volumen persistente)
   docker compose down -v       # borra también los datos de MySQL
   ```

## 5. Notas para la evaluación de DevOps

- **5 contenedores, 5 responsabilidades separadas**: cada microservicio tiene su propio `Dockerfile`, su propio `package.json` y se puede reconstruir/desplegar/escalar de forma independiente.
- **Una sola red interna** (`app-network` en `docker-compose.yml`): los 5 servicios se resuelven entre sí por nombre de servicio (DNS interno de Docker), por ejemplo `http://contact-service:4000` o `db:3306`.
- **`depends_on` + `healthcheck`**: `contact-service` espera a que `db` y `notification-service` estén realmente saludables (no solo "arrancados") antes de iniciar; `frontend` espera a `contact-service` y `portfolio-service`.
- **Dockerfiles minimalistas** para los 3 backends (`node:20-alpine`, `npm ci --omit=dev`, usuario `node` no-root, `HEALTHCHECK` propio).
- **Dockerfile multietapa** para el frontend: etapa `builder` prepara los estáticos, etapa final `nginx:alpine` los sirve sin herramientas de build.
- **Inyección de configuración en runtime, no en build**: el frontend recibe `CONTACT_API_URL` y `PORTFOLIO_API_URL` como variables de entorno de Docker Compose, y un script en `docker-entrypoint.d/` las escribe en `env-config.js` cada vez que arranca el contenedor. Esto permite usar la **misma imagen** en distintos entornos (local, staging, producción) sin reconstruirla.
- **Contraseñas fuera del código**: todas las credenciales viajan por variables de entorno definidas en `.env` (no versionado, ver `.gitignore`), nunca hardcodeadas en el código ni en las imágenes.
- **Aislamiento de la base de datos**: solo `contact-service` tiene credenciales de MySQL; `portfolio-service`, `notification-service` y `frontend` ni siquiera conocen que la base de datos existe.

## 6. Próximos pasos sugeridos (para ampliar la nota)

- Separar `app-network` en dos redes (una "interna" solo para `contact-service` ↔ `db` ↔ `notification-service`, y otra "pública" para `frontend`), marcando la primera como `internal: true`.
- Agregar un API Gateway (Nginx o Traefik) delante de los 3 backends, para exponer una sola URL pública en vez de 3 puertos distintos.
- Integrar un proveedor de correo real (SendGrid, Resend, SMTP) en `notification-service`, reemplazando el `console.log` por el envío real.
- Pipeline de CI/CD (GitHub Actions) que construya y publique las 4 imágenes (frontend + 3 backends) en un registry.
- Desplegar en la nube (Render, Railway, AWS ECS, un VPS con Docker Compose, etc.).
