# Decisiones — Landing Membryx

## Alcance y marca

- **Producto, no consultora genérica.** Se decidió (con el usuario) que la landing
  promociona **Membryx** como producto concreto — cobro, renovación y recordatorios
  automáticos de membresías — y no un mensaje genérico de "consultora tecnológica".
  Membrix aparece como la consultora que lo implementa, no como protagonista del hero.
- **CTA de diagnóstico, no de autoservicio.** No existe registro público ni checkout en
  la landing: Membryx se implementa a la medida de cada negocio, así que el CTA lleva a
  un formulario de contacto, coherente con el modelo de entrega de Membrix ("analizamos
  primero el problema, después elegimos la tecnología").

## Evidencia usada (y lo que se evitó fabricar)

- El flujo de "Cómo funciona" y las etiquetas de seguridad ("verificación de firma",
  "sin doble cobro") describen mecanismos **reales y documentados** en `ARCHITECTURE.md`
  y `prisma/schema.prisma` del proyecto — no se inventó ningún paso.
- El simulador de WhatsApp usa **el texto literal** de `message-templates.ts`, no copy
  inventado para la ocasión.
- El panel de control se muestra como maqueta ilustrativa con valores en `—`, en vez de
  reutilizar los números del seed de demo (255 activos, 44 por vencer, 102 vencidos).
  Esos números son datos sintéticos de prueba; presentarlos como si fueran resultados de
  un cliente real habría violado la regla de no fabricar métricas.
- **Yeye Trainer Gimnasio** se nombra como primer socio piloto **en curso**, no como caso
  de éxito cerrado — no hay resultados medibles todavía y así se comunica explícitamente
  en la sección "Caso piloto".
- No se mencionan precios ni plazos de implementación fijos: no hay un dato validado
  para ninguno de los dos, así que ambos quedan como "lo definimos en el diagnóstico" en
  vez de inventar una cifra.

## Hipótesis pendientes de validar

- **Audiencia inferida, no confirmada por investigación directa.** Se asume que el ICP
  son dueños de gimnasios/negocios de membresías en Colombia, inferido del stack (Wompi,
  Twilio WhatsApp, zona horaria `America/Bogota`) — no de entrevistas de usuario. Falta
  validar dolor real, lenguaje y objeciones con el propio dueño de Yeye Trainer y, si es
  posible, con otro dueño de gimnasio fuera del piloto.
- **Nombre de marca.** El repo usa "Membryx"; el spec del usuario decía "Membrix". Se
  usó "Membryx" como nombre del producto en toda la landing por ser el nombre real del
  código; falta confirmar si esa es también la grafía final de marca deseada.

## Presupuesto de interacción

Se eligió un nivel **dinámico** (moderado), no experiencial/gamificado:

- Reveal-on-scroll, stepper del mecanismo, simulador de WhatsApp y acordeón de FAQ —
  todos justificados por comprensión, demostración o reducción de fricción.
- Sin mini-juegos ni storytelling inmersivo: la audiencia (dueños de negocio evaluando
  si confiar en un sistema de cobro) necesita claridad y evidencia, no entretenimiento.

## Identidad visual

Se reutilizó el lenguaje tipográfico (Archivo + IBM Plex Mono) y el fondo oscuro editorial
del sitio hermano `YeyeTrainer/index.html` — también construido por Membrix — para que el
propio sitio de la consultora se sienta consistente con su portafolio, no para copiarlo
sin razón.

## Pendiente / mejoras futuras

- Validar con el dueño de Yeye Trainer si el copy del caso piloto puede publicarse tal
  cual, o si prefiere ajustar el nivel de detalle expuesto.
- Definir una identidad visual/logo real de Membrix (hoy es un wordmark tipográfico).
- Reemplazar el `mailto:` por un formulario conectado a un CRM o buzón real si el
  volumen de leads lo justifica.
- Instrumentar los eventos de analítica (ver lista abajo) — hoy están definidos pero
  **no conectados** a ninguna herramienta real, porque no se proveyeron credenciales.
- Confirmar si Membryx tendrá planes/precios públicos antes de agregarlos a la landing.
- SEO más allá de lo básico (contenido adicional, datos estructurados) si se busca
  posicionamiento orgánico, no solo tráfico dirigido.

## Eventos de analítica definidos (pendientes de instrumentar)

```
page_view
hero_cta_click
mechanism_step_view
whatsapp_sim_interact
faq_open
contact_form_start
contact_form_submit
```
