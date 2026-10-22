# 🛡️ Norma Inmutable: Centinela Perpetuo de Rendimiento y Escalabilidad Heredada

Esta directriz establece el protocolo obligatorio, perpetuo y no negociable para el monitoreo de rendimiento y la detección proactiva de escalabilidad en el proyecto **Biblioteca Médica Especializada de Cirugía Ortopédica y Traumatología**.

---

## 📌 Principio de Escalabilidad y Herencia Obligatoria

Cualquier iteración futura, refactorización, cambio de lenguaje o migración de infraestructura (Google Apps Script, Cloudflare Workers, Cloudflare D1/R2, Supabase, PostgreSQL, Fastify, Docker, Kubernetes o VPS) **DEBE heredar e implementar de forma obligatoria el módulo del Centinela Perpetuo**.

Ninguna plataforma puede desplegarse en producción sin este centinela activo.

---

## ⚙️ Especificación de los Umbrales Operativos del Centinela

El centinela debe medir la latencia total de extremo a extremo de cada transacción (WhatsApp Webhook o Solicitud Web HTTP) y mantener una ventana deslizante de las últimas **50 operaciones**:

| Nivel de Operación | Umbral Estadístico Combinado (Media + Mediana) | Estado del Sistema | Acción Obligatoria del Centinela |
| :--- | :--- | :--- | :--- |
| **🟢 VERDE (Nominal)** | Mediana $\le 2.5\text{s}$ (incluso con Media elevada si obedece a un pico aislado / *cold-start* asimilado) | Saludable / Fluido | Operación silenciosa. Cero sobrecarga de cómputo. Registro pasivo de métricas. |
| **🟡 AMARILLO (Congestión)** | Media $> 3.5\text{s}$ **Y** Mediana $> 2.5\text{s}$ (o $P_{90} > 5.0\text{s}$ con Mediana $> 2.0\text{s}$) | Demanda Creciente Confirmada | **Alerta Proactiva Discreta:** Notificación privada a la Dirección (Gestor de Contenido) recordando la directriz de evaluar mejoras de estructura o Edge Caching. Throttle: máx 1 alerta cada 30 min. |
| **🔴 ROJO (Saturación)** | Media $> 6.0\text{s}$ **Y** Mediana $> 4.0\text{s}$ (o $P_{90} > 8.0\text{s}$ con Mediana $> 3.5\text{s}$) | Saturación Sistémica Crítica | **Propuesta de Escalabilidad Inmediata:** Despacho ejecutivo proponiendo la ruta de migración más óptima en caliente (ej. Cloudflare D1 + R2 o Supabase) con cero interrupción de servicio. Throttle: máx 1 alerta cada 30 min. |

---

## 🔒 Preservación Absoluta de Anonimato Cardinal

1. **Cero Fuga de Identidad:** La telemetría recopilada únicamente registra timestamps, tipo de operación (GET/POST) y duración en milisegundos.
2. **Sin PII en Telemetría:** Los identificadores de usuario son ofuscados (`+57300****`) o reemplazados por hashes SHA256 anónimos.
3. **Canal Exclusivo con la Dirección:** Las alertas de rendimiento solo se transmiten a la figura institucional del **Gestor de Contenido** mediante el canal privilegiado y seguro.

---

## 💻 Comandos Obligatorios de Auditoría On-Demand

Todo backend del proyecto debe exponer a la Dirección los siguientes comandos interactivos:
- `RENDIMIENTO` / `CENTINELA` / `METRICAS`: Devuelve en tiempo real la latencia media, percentil P90, rango mín/máx, estado del semáforo y dictamen de escalabilidad.
- `ESTADO`: Debe incluir en su resumen general el estado de salud del Centinela.
