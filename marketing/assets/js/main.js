(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- progress bar ---------- */
  const progressBar = document.getElementById("progressBar");
  function onScroll() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    if (progressBar && max > 0) progressBar.style.width = `${(scrolled / max) * 100}%`;
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    // Safety net: never let content stay invisible if IO is delayed/blocked
    // (e.g. a backgrounded/occluded tab, where some browsers pause IO callbacks).
    setTimeout(() => {
      document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => el.classList.add("is-in"));
    }, 2500);
  }

  /* ---------- botón flotante: abre/cierra el menú de navegación ---------- */
  const fabWrap = document.getElementById("fabWrap");
  const fabBtn = document.getElementById("fabBtn");
  const fabMenu = document.getElementById("fabMenu");
  if (fabWrap && fabBtn && fabMenu) {
    function closeFab() {
      fabWrap.classList.remove("is-open");
      fabBtn.setAttribute("aria-expanded", "false");
    }
    function openFab() {
      fabWrap.classList.add("is-open");
      fabBtn.setAttribute("aria-expanded", "true");
    }
    fabBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fabWrap.classList.contains("is-open") ? closeFab() : openFab();
    });
    fabMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") closeFab();
    });
    document.addEventListener("click", (e) => {
      if (fabWrap.classList.contains("is-open") && !fabWrap.contains(e.target)) closeFab();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && fabWrap.classList.contains("is-open")) {
        closeFab();
        fabBtn.focus();
      }
    });
  }

  /* ---------- problema: se escanea la planilla, luego aparecen las tarjetas ---------- */
  const problemScene = document.getElementById("problemScene");
  const painGrid = document.getElementById("painGrid");
  if (painGrid) {
    if (reduceMotion || !problemScene || !("IntersectionObserver" in window)) {
      painGrid.classList.add("is-in");
    } else {
      const ioProblem = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              problemScene.classList.add("is-playing");
              setTimeout(() => painGrid.classList.add("is-in"), 2000);
              ioProblem.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      ioProblem.observe(problemScene);

      // Safety net, same reasoning as the general reveal-on-scroll observer above.
      setTimeout(() => painGrid.classList.add("is-in"), 5000);
    }
  }

  /* ---------- mecanismo: stepper ---------- */
  const flowSteps = document.querySelectorAll("#flow .fstep");
  flowSteps.forEach((step) => {
    step.addEventListener("click", () => {
      flowSteps.forEach((s) => s.classList.remove("is-active"));
      step.classList.add("is-active");
    });
  });

  /* ----------------------------------------------------------------
     Simulador de WhatsApp — usa exactamente la lógica de
     src/integrations/whatsapp/message-templates.ts (expiryReminder)
     ---------------------------------------------------------------- */
  function expiryReminder({ customerName, planName, daysUntilExpiration, expirationDateIso }) {
    if (daysUntilExpiration === 0) {
      return (
        `Hola ${customerName}, tu membresía (${planName}) vence HOY ${expirationDateIso}. ` +
        `Renueva hoy para no perder tu acceso.`
      );
    }
    return (
      `Hola ${customerName}, tu membresía (${planName}) vence en ${daysUntilExpiration} día(s), ` +
      `el ${expirationDateIso}. Renueva pronto para no perder tu acceso.`
    );
  }

  const simTabs = document.getElementById("simTabs");
  const simBubble = document.getElementById("simBubble");

  function renderSim(days) {
    if (!simBubble) return;
    const today = new Date();
    const expiry = new Date(today.getTime() + days * 86400000);
    const iso = expiry.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
    const text = expiryReminder({
      customerName: "Juan Pérez",
      planName: "Mensual",
      daysUntilExpiration: days,
      expirationDateIso: iso,
    });
    simBubble.innerHTML = `<div class="bubble">${text}<span class="bubble__meta">Enviado 08:00 a.m.</span></div>`;
  }

  if (simTabs) {
    simTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".sim__tab");
      if (!btn) return;
      simTabs.querySelectorAll(".sim__tab").forEach((b) => b.classList.remove("is-on"));
      btn.classList.add("is-on");
      renderSim(Number(btn.dataset.day));
    });
    renderSim(3);
  }

  /* ---------- FAQ accordion ---------- */
  const faq = document.getElementById("faq");
  if (faq) {
    faq.addEventListener("click", (e) => {
      const q = e.target.closest(".faq__q");
      if (!q) return;
      const item = q.closest(".faq__item");
      const answer = item.querySelector(".faq__a");
      const isOpen = item.classList.contains("is-open");

      faq.querySelectorAll(".faq__item.is-open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq__q").setAttribute("aria-expanded", "false");
          openItem.querySelector(".faq__a").style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove("is-open");
        q.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        q.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  }

  /* ---------- contact form -> mailto ---------- */
  const CONTACT_EMAIL = "cristhian3155@gmail.com";
  const form = document.getElementById("contactForm");
  const formOk = document.getElementById("formOk");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const business = (data.get("business") || "").toString().trim();
      const type = (data.get("type") || "").toString().trim();
      const contact = (data.get("contact") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();

      const subject = `Membryx — diagnóstico para ${business || name}`;
      const bodyLines = [
        `Nombre: ${name}`,
        `Negocio: ${business}`,
        `Tipo de negocio: ${type}`,
        `Contacto: ${contact}`,
        message ? `Qué quiere resolver: ${message}` : null,
      ].filter(Boolean);

      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        bodyLines.join("\n")
      )}`;

      window.location.href = mailto;
      if (formOk) formOk.classList.add("is-on");
    });
  }
})();
