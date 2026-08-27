# Arquitectura — Landing Membryx

## Qué es

Landing de conversión estática, sin build ni framework, para promocionar el producto
**Membryx** (implementado por la consultora **Membrix**). Vive en `marketing/` para poder
desplegarse por separado del backend (`src/`) — no depende de Prisma, Express ni de
ninguna variable de entorno del MVP.

## Estructura

```
marketing/
  index.html            todas las secciones, HTML semántico
  assets/css/main.css   design tokens + componentes + responsive
  assets/js/main.js     mejoras progresivas (ver abajo)
```

## Progressive enhancement

- `<html class="js">` se añade por un script inline en `<head>` (mismo patrón que
  `YeyeTrainer/index.html`). El CSS solo oculta `[data-reveal]` bajo `.js [data-reveal]`,
  así que **sin JavaScript el contenido es visible por defecto** — nunca depende del
  script para mostrarse.
- El reveal-on-scroll usa `IntersectionObserver` y tiene un **timeout de seguridad
  (2.5s)** que fuerza la revelación de cualquier elemento no observado todavía, para que
  un fallo o retraso del observer nunca deje contenido invisible de forma permanente.
- `prefers-reduced-motion: reduce` desactiva las animaciones de aparición.

## Simulador de WhatsApp

La función `expiryReminder()` en `assets/js/main.js` es una copia literal de la lógica en
[`src/integrations/whatsapp/message-templates.ts`](../src/integrations/whatsapp/message-templates.ts).
Si el copy de esos mensajes cambia en el producto real, debe actualizarse aquí también
para que el simulador no muestre texto desactualizado.

## Formulario de contacto

No hay backend. El submit arma un `mailto:` con los datos del formulario dirigido al
contacto de Membrix. Es una decisión deliberada (ver DECISIONS.md) mientras no exista
un flujo de leads real conectado a un CRM.

## Despliegue

Al ser 100% estático, puede servirse desde cualquier hosting estático (Vercel, Netlify,
GitHub Pages, o como carpeta `public/` de este mismo servidor Express más adelante) sin
tocar el resto del repositorio.
