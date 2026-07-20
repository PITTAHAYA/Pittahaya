(() => {
  if (document.querySelector("[data-pitahaya-chat]")) return;

  // ── Language detection ───────────────────────────────────────
  // Use document.lang first, then URL path as fallback ("/en/...")
  const LANG = /^en/i.test(document.documentElement.lang || "")
    || /^\/en\//.test(location.pathname) ? "en" : "es";
  const inEn = LANG === "en";

  // ── Routes ───────────────────────────────────────────────────
  // English pages live in /en/ with renamed files; same-folder relative URLs.
  const routes = inEn ? {
    contacto:      "contact.html",
    planes:        "plans.html",
    servicios:     "services.html",
    automatizacion:"automation.html",
    portafolio:    "portfolio.html",
    faq:           "faq.html",
    landing:       "demo-landing.html",
    corporativa:   "demo-corporativa.html",
    marca:         "demo-marca.html",
    serviciosDemo: "demo-servicios.html",
    startup:       "demo-startup.html",
    lujo:          "demo-highend.html"
  } : {
    contacto:     "contacto.html",
    planes:       "planes.html",
    servicios:    "servicios.html",
    automatizacion:"automatizacion.html",
    portafolio:   "portafolio.html",
    faq:          "faq.html",
    landing:      "demo-landing.html",
    corporativa:  "demo-corporativa.html",
    marca:        "demo-marca.html",
    serviciosDemo:"demo-servicios.html",
    startup:      "demo-startup.html",
    lujo:         "demo-highend.html"
  };

  // ── UI strings (i18n) ────────────────────────────────────────
  const T = inEn ? {
    launcherAria:  "Open Pittahaya assistant",
    launcherText:  "Chat with Pittahaya",
    panelAria:     "Pittahaya virtual assistant",
    rootAria:      "Pittahaya virtual assistant",
    title:         "Pittahaya Assistant",
    status:        "Online · replies instantly",
    closeAria:     "Close chat",
    placeholder:   "Type your question here…",
    inputAria:     "Type your message",
    sendLabel:     "Send",
    privacyNote:   "Local assistant: your messages are not sent to external servers.",
    initialPrompts:["How much does it cost?", "AI automation", "Show demos", "Why Pittahaya?"],
    altPrompts:    ["How long does it take?", "How many revisions?", "Is hosting included?", "Do you work outside Ecuador?"],
    greeting:      "Hi! I'm Pittahaya's assistant. I can answer anything about web design, AI automation (chatbots & agents that work 24/7), pricing, plans, timelines, demos or the process — whatever you need to take the first step. How can I help?",
    greetingActions: [
      { label: "How much does it cost?", prompt: "How much does it cost?" },
      { label: "AI automation",          prompt: "AI automation" },
      { label: "View demos",             prompt: "Show demos" }
    ],
    emptyPrompt:   "Tell me what kind of project you have and I'll point you to the best option.",
    emptyPromptNamed: (n) => `Tell me what project you have in mind, ${n}, and I'll guide you.`,
    pureGreetingNamed: (n) => `Hi again, ${n}! How can I help now? I can give details on pricing, timelines, demos or the next step.`,
    fallbackBase:  "Good question. For something more specific to your project, the free diagnostic is the most direct path. We also have FAQs for common questions.",
    fallbackKnown: "If you want a precise detail, the most useful thing is the free diagnostic: you describe your case and get a tailored answer.",
    fallbackNamed: (n, suggest) => `I get what you're asking, ${n}. ${suggest}`,
    fallbackPrefix:(suggest)    => `Good question. ${suggest}`,
    fallbackActions: [
      { label: "Request diagnostic", href: routes.contacto },
      { label: "View FAQ",           href: routes.faq },
      { label: "View demos",         href: routes.portafolio }
    ],
    partialPrefix: (topic, body) => `If I understand correctly, you're asking about ${topic}. ${body}\n\nIf that wasn't it, rephrase or I can take you to the diagnostic for a more exact answer.`,
    partialAction: { label: "Free diagnostic", href: routes.contacto },
    topicLabels: {
      pricing:"pricing", timeline:"delivery timelines", demos:"demos",
      process:"the process", seo:"SEO", security:"security",
      hosting:"domain & hosting", "first-step":"getting started",
      revisions:"revisions", "objection-price":"budget"
    },
    nextRevisions: "\n\nWant me to show which demo fits your business best?",
    nextDemos:     "\n\nOnce you pick a direction, I can share pricing references.",
    nextIndustry:  "\n\nIf you want to move forward, the free diagnostic is the most direct path — describe your case and you'll get a specific recommendation.",
    actLabels: {
      comparePlans:"Compare plans", requestDiag:"Request diagnostic",
      goContact:"Go to Contact", viewPlans:"View plans",
      viewServices:"View services", quoteNow:"Quote now",
      viewAllDemos:"View all demos", talkAssistant:"Talk to assistant",
      viewDemos:"View demos", contact:"Contact",
      viewFaq:"View FAQ", contactDirect:"Direct contact",
      whatsapp:"Message on WhatsApp", contactForm:"Contact form",
      seeReal:"See real demos", viewAI:"AI automation", quoteAI:"Get AI quote"
    }
  } : {
    launcherAria:  "Abrir asistente Pittahaya",
    launcherText:  "Habla con Pittahaya",
    panelAria:     "Asistente virtual Pittahaya",
    rootAria:      "Asistente virtual Pittahaya",
    title:         "Asistente Pittahaya",
    status:        "En línea · responde al instante",
    closeAria:     "Cerrar chat",
    placeholder:   "Escribe tu pregunta aquí...",
    inputAria:     "Escribe tu mensaje",
    sendLabel:     "Enviar",
    privacyNote:   "Asistente local: tus mensajes no se envían a servidores externos.",
    initialPrompts:["¿Cuánto cuesta?", "Automatización con IA", "Ver demos", "¿Por qué Pittahaya?"],
    altPrompts:    ["¿Cuánto tiempo toma?", "¿Cuántas revisiones incluye?", "¿Incluye hosting?", "¿Trabajas fuera de Ecuador?"],
    greeting:      "¡Hola! Soy el asistente de Pittahaya. Puedo responder lo que necesites sobre diseño web, automatización con IA (chatbots y agentes que trabajan 24/7), precios, planes, tiempos, demos o el proceso. ¿En qué te ayudo?",
    greetingActions: [
      { label: "¿Cuánto cuesta?",       prompt: "¿Cuánto cuesta?" },
      { label: "Automatización con IA", prompt: "Automatización con IA" },
      { label: "Ver demos",             prompt: "Ver demos" }
    ],
    emptyPrompt:   "Cuéntame qué tipo de proyecto tienes y te ayudo a ubicar la mejor opción.",
    emptyPromptNamed: (n) => `Cuéntame qué proyecto tienes en mente, ${n}, y te oriento.`,
    pureGreetingNamed: (n) => `¡Hola otra vez, ${n}! ¿En qué te ayudo ahora? Puedo darte detalles de precios, tiempos, demos o el siguiente paso.`,
    fallbackBase:  "Para algo más específico de tu proyecto, el diagnóstico gratis es el camino más directo. También tenemos preguntas frecuentes para dudas comunes.",
    fallbackKnown: "Si quieres un detalle preciso, lo más útil es el diagnóstico gratis: describes tu caso y recibes una respuesta ajustada.",
    fallbackNamed: (n, suggest) => `Entiendo lo que preguntas, ${n}. ${suggest}`,
    fallbackPrefix:(suggest)    => `Buena pregunta. ${suggest}`,
    fallbackActions: [
      { label: "Solicitar diagnóstico", href: routes.contacto },
      { label: "Ver FAQ",               href: routes.faq },
      { label: "Ver demos",             href: routes.portafolio }
    ],
    partialPrefix: (topic, body) => `Si entiendo bien, hablas sobre ${topic}. ${body}\n\nSi no era eso, escríbelo de otra forma o te llevo al diagnóstico para una respuesta más exacta.`,
    partialAction: { label: "Diagnóstico gratis", href: routes.contacto },
    topicLabels: {
      pricing:"los precios", timeline:"los tiempos de entrega", demos:"los demos",
      process:"el proceso", seo:"SEO", security:"la seguridad",
      hosting:"dominio y hosting", "first-step":"cómo empezar",
      revisions:"las revisiones", "objection-price":"el presupuesto"
    },
    nextRevisions: "\n\n¿Quieres que también te muestre cuál demo encaja mejor con tu negocio?",
    nextDemos:     "\n\nCuando elijas dirección, te puedo dar referencia de precios.",
    nextIndustry:  "\n\nSi quieres avanzar, el diagnóstico gratis es el camino más directo: describes tu caso y recibes una recomendación específica.",
    actLabels: {
      comparePlans:"Comparar planes", requestDiag:"Solicitar diagnóstico",
      goContact:"Ir a Contacto", viewPlans:"Ver planes",
      viewServices:"Ver servicios", quoteNow:"Cotizar ahora",
      viewAllDemos:"Ver todos los demos", talkAssistant:"Hablar con asistente",
      viewDemos:"Ver demos", contact:"Contacto",
      viewFaq:"Ver preguntas frecuentes", contactDirect:"Contacto directo",
      whatsapp:"Escribir por WhatsApp", contactForm:"Formulario de contacto",
      seeReal:"Ver demos reales", viewAI:"Ver automatización IA", quoteAI:"Cotizar IA"
    }
  };

  // ── Utilities ────────────────────────────────────────────────
  const normalize = (v) => String(v).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[.,;:!?¿¡()"'\[\]{}\-/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls)  el.className = cls;
    if (text) el.textContent = text;
    return el;
  };

  // ── Conversation state ───────────────────────────────────────
  const state = {
    name: null,
    industry: null,
    msgCount: 0,
    recentTopics: [],          // last 5 matched topic ids
    askedAbout:  new Set(),    // every topic id ever matched
    lastIntent:  null,         // the last matched id (or "fallback")
    pendingFollowUp: null      // a follow-up offer the bot wants to honor next turn
  };

  // Common Spanish stopwords (ignored for fuzzy matching)
  const STOPWORDS = new Set([
    "el","la","los","las","un","una","unos","unas","de","del","al","a","y","o","u","e",
    "que","como","cuando","donde","cual","cuales","quien","quienes",
    "es","son","esta","estan","estoy","esto","eso","ese","esa","esos","esas",
    "yo","tu","el","ella","nosotros","vosotros","ellos","ellas","mi","mis","tu","tus",
    "su","sus","con","sin","por","para","pero","si","no","ni","mas","menos",
    "muy","mucho","poco","tanto","todo","todos","toda","todas","algo","alguien","nada","nadie",
    "ya","aun","hay","ser","estar","tengo","tener","tenia","tienes","tiene","quiero","necesito",
    "ahora","antes","despues","tambien","solo","puede","puedo","podria","hacer","hago"
  ]);

  // Levenshtein-lite: how similar are two short tokens?
  const tokenSimilar = (a, b) => {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    if (la < 4 || lb < 4) return false;

    // Allow 1 edit for ≤8 chars, 2 edits only for long words. Tight on
    // purpose: loose fuzzy matching caused false hits (e.g. "going"→"ongoing")
    // that hijacked the wrong topic.
    const maxEdits = Math.max(la, lb) <= 8 ? 1 : 2;

    // Dynamic programming Levenshtein
    const dp = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
    for (let i = 0; i <= la; i++) dp[i][0] = i;
    for (let j = 0; j <= lb; j++) dp[0][j] = j;
    for (let i = 1; i <= la; i++) {
      for (let j = 1; j <= lb; j++) {
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        if (dp[i][j] > maxEdits && j === i) {
          // early-out heuristic: if diagonal already exceeds budget, bail
        }
      }
    }
    return dp[la][lb] <= maxEdits;
  };

  // Returns whether `keyword` appears in `text` (exact OR fuzzy on tokens)
  const fuzzyContains = (text, keyword) => {
    if (text.includes(keyword)) return true;
    if (!/^[a-z]+$/.test(keyword) || keyword.length < 5) return false;
    return text.split(/\s+/).some(tok => tokenSimilar(tok, keyword));
  };

  // Detect if a keyword appears with negation immediately before it
  const isNegated = (text, keyword) => {
    const idx = text.indexOf(keyword);
    if (idx === -1) return false;
    const before = text.slice(Math.max(0, idx - 28), idx);
    return /\b(no|ni|nunca|tampoco|sin|ya\s+tengo|ya\s+hice|no\s+quiero|no\s+necesito)\b\s*$/.test(before);
  };

  // Extract first name from "soy X", "me llamo X", "mi nombre es X"
  const COMMON_PROFESSIONS = new Set([
    "medico","abogado","doctor","ingeniero","arquitecto","dentista","psicologo","nutricionista",
    "terapeuta","consultor","coach","fotografo","contador","emprendedor","dueño","fundador",
    "ceo","gerente","artista","disenador","diseñador","chef","barbero","estilista","entrenador"
  ]);

  const extractName = (text) => {
    const patterns = [
      /(?:^|\s)me\s+llamo\s+([a-zñáéíóú]{3,18})/i,
      /(?:^|\s)mi\s+nombre\s+es\s+([a-zñáéíóú]{3,18})/i,
      /(?:^|\s)soy\s+([a-zñáéíóú]{3,18})(?:\b)/i
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m && m[1]) {
        const candidate = m[1].toLowerCase();
        if (STOPWORDS.has(candidate)) continue;
        if (COMMON_PROFESSIONS.has(candidate)) continue;
        if (candidate.length < 3) continue;
        return candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }
    return null;
  };

  let msgCount   = 0;
  let lastTopics = [];

  // ── DOM ──────────────────────────────────────────────────────
  const root = make("section", "pitahaya-chat");
  root.setAttribute("data-pitahaya-chat", "");
  root.setAttribute("aria-label", T.rootAria);

  const launcher = make("button", "pitahaya-chat__launcher");
  launcher.type = "button";
  launcher.setAttribute("aria-label", T.launcherAria);
  launcher.setAttribute("aria-expanded", "false");
  const launcherSpark = make("span", "pitahaya-chat__spark");
  launcherSpark.setAttribute("aria-hidden", "true");
  const launcherText = make("span", "", T.launcherText);
  launcher.append(launcherSpark, launcherText);

  const panel = make("div", "pitahaya-chat__panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", T.panelAria);

  const header = make("div", "pitahaya-chat__header");
  const identity = make("div", "pitahaya-chat__identity");
  const avatar = make("img", "pitahaya-chat__avatar");
  // Reuse whatever path the page itself uses for its favicon, so
  // the logo loads correctly from both / (Spanish) and /en/ (English).
  const faviconLink = document.querySelector('link[rel="icon"]')
    || document.querySelector('link[rel="apple-touch-icon"]');
  avatar.src = faviconLink ? faviconLink.href : "assets/pitahaya-logo.png";
  avatar.alt = "Pittahaya";
  const identityText = make("div", "");
  const titleEl  = make("span", "pitahaya-chat__title", T.title);
  const statusEl = make("span", "pitahaya-chat__status", T.status);
  const closeBtn = make("button", "pitahaya-chat__close", "×");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", T.closeAria);
  identityText.append(titleEl, statusEl);
  identity.append(avatar, identityText);
  header.append(identity, closeBtn);

  const messages = make("div", "pitahaya-chat__messages");
  messages.setAttribute("role", "log");
  messages.setAttribute("aria-live", "polite");

  const quick = make("div", "pitahaya-chat__quick");

  const form = make("form", "pitahaya-chat__composer");
  const input = make("input", "pitahaya-chat__input");
  input.type = "text";
  input.placeholder = T.placeholder;
  input.setAttribute("aria-label", T.inputAria);
  input.autocomplete = "off";
  const send = make("button", "pitahaya-chat__send", T.sendLabel);
  send.type = "submit";
  form.append(input, send);

  const privacy = make("div", "pitahaya-chat__privacy", T.privacyNote);

  panel.append(header, messages, quick, form, privacy);
  root.append(launcher, panel);
  document.body.append(root);

  // ── Quick prompts ────────────────────────────────────────────
  const renderQuickPrompts = (prompts) => {
    quick.innerHTML = "";
    prompts.forEach(p => {
      const btn = make("button", "", p);
      btn.type = "button";
      btn.addEventListener("click", () => handleUserMessage(p));
      quick.append(btn);
    });
  };

  renderQuickPrompts(T.initialPrompts);

  // ── Actions helpers (localized button labels) ─────────────────
  const L = T.actLabels;
  const act = {
    quote:    [{ label: L.comparePlans, href: routes.planes }, { label: L.requestDiag, href: routes.contacto }],
    contact:  [{ label: L.goContact,    href: routes.contacto }, { label: L.viewPlans, href: routes.planes }],
    services: [{ label: L.viewServices, href: routes.servicios }, { label: L.quoteNow, href: routes.contacto }],
    demos:    [{ label: L.viewAllDemos, href: routes.portafolio }, { label: L.talkAssistant, prompt: inEn ? "Which demo fits my business?" : "¿Qué demo necesito según mi negocio?" }],
    start:    [{ label: L.viewDemos, href: routes.portafolio }, { label: L.viewPlans, href: routes.planes }, { label: L.contact, href: routes.contacto }],
    faq:      [{ label: L.viewFaq, href: routes.faq }, { label: L.contactDirect, href: routes.contacto }],
    ai:       [{ label: L.viewAI, href: routes.automatizacion }, { label: L.quoteAI, href: routes.contacto }]
  };

  const demosActs = [
    { label: inEn ? "Landing"   : "Landing",       href: routes.landing },
    { label: inEn ? "Corporate" : "Corporativa",   href: routes.corporativa },
    { label: inEn ? "Brand"     : "Marca",         href: routes.marca },
    { label: inEn ? "Services"  : "Servicios",     href: routes.serviciosDemo },
    { label: inEn ? "Startup"   : "Startup",       href: routes.startup },
    { label: inEn ? "Luxury"    : "Lujo",          href: routes.lujo }
  ];

  // ── Answer bank ──────────────────────────────────────────────
  // Each entry: { id, phrases[], keywords[], text, actions[], followUp? }
  // phrases (multi-word): score = words × 4
  // keywords (single word): score = 1 (2 if len > 7)
  const bank = [

    // ── Greeting ───────────────────────────
    {
      id: "greeting",
      phrases: ["buen dia", "buenos dias", "buena tarde", "buenas tardes", "buena noche", "buenas noches", "como estan", "como estas", "como esta", "como va", "como andas", "que tal", "que mas", "que onda", "que hubo", "hay alguien", "mucho gusto", "good morning", "good afternoon", "good evening", "good day", "how are you", "how is it going", "how's it going", "hey there", "hi there", "what's up", "whats up", "nice to meet you", "anyone there", "is anyone"],
      keywords: ["hola", "holaa", "holi", "buenas", "buenos", "hello", "hey", "hi", "heey", "saludos", "epale", "wassup", "howdy", "greetings", "atencion", "asesor", "ayuda", "disponible", "alguien", "recepcion", "help", "anyone", "available", "support"],
      text: "¡Hola! Bienvenido a Pittahaya. Estoy aquí para ayudarte con cualquier pregunta sobre tu web o tu automatización con IA: precios, planes, demos, tiempos, proceso o lo que necesites para dar el primer paso. ¿Por dónde empezamos?",
      en: { text: "Hi! Welcome to Pittahaya. I'm here to answer any question about your website or AI automation: pricing, plans, demos, timelines, process — anything you need to take the first step. Where shall we start?" },
      actions: act.start
    },

    // ── Why Pittahaya / differentiator ─────
    {
      id: "why",
      phrases: ["por que pittahaya", "por que ustedes", "porque ustedes", "por que tu", "por que contigo", "por que con ustedes", "por que trabajar con ustedes", "por que te elegiria", "por que deberia elegirte", "por que te contrataria", "por que me conviene", "por que son mejores", "por que me ayudarian", "porque me ayudarian", "que diferencia", "que los hace diferentes", "que te hace diferente", "por que elegirlos", "vale la pena", "en que se diferencian", "mejor opcion", "que ventaja", "que me ofrecen de diferente", "why pittahaya", "why you", "why choose you", "why should i choose you", "why work with you", "why would i pick you", "why hire you", "why are you better", "what makes you different", "what sets you apart", "what is the advantage", "what is special", "how can you help me grow"],
      keywords: ["diferenci", "ventaja", "mejor", "especial", "unico", "elegir", "elegiria", "escoger", "preferir", "convence", "confiar", "ustedes", "different", "difference", "unique", "special", "advantage", "better", "why", "choose", "trust", "apart"],
      text: "Pittahaya no rellena una plantilla con tu nombre: diseña desde cero pensando en tu oferta, tu cliente ideal y la percepción que quieres provocar. Y vamos más allá del diseño: sumamos automatización con IA (chatbots y agentes) para que tu negocio atienda y venda 24/7. El resultado es un sistema que trabaja por ti, no solo 'una web'. El proceso es claro, personal y orientado a resultados.",
      en: { text: "Pittahaya doesn't fill a template with your name: every site is designed from scratch around your offer, your ideal client, and the perception you want to create. And we go beyond design — we add AI automation (chatbots and agents) so your business serves and sells 24/7. The result is a system that works for you, not just 'a website'. The process is clear, personal and results-oriented." },
      actions: [{ label: inEn ? "See real demos" : "Ver demos reales", href: routes.portafolio }, { label: inEn ? "Request diagnostic" : "Solicitar diagnóstico", href: routes.contacto }]
    },

    // ── AI automation (overview) ───────────
    {
      id: "ai-automation",
      phrases: ["automatizacion con ia", "automatizar mi negocio", "inteligencia artificial", "automatizar procesos", "que es la automatizacion", "trabajan con ia", "hacen automatizacion", "automatizar tareas", "ai automation", "automate my business", "artificial intelligence", "automate processes", "what is ai automation", "do you work with ai", "automate tasks"],
      keywords: ["ia", "automatizacion", "automatizar", "automatizado", "automatiza", "inteligencia", "artificial", "ai", "automation", "automate", "automated", "automating"],
      text: "Sí, automatizamos tu negocio con inteligencia artificial. Conectamos chatbots y agentes de IA que atienden a tus clientes, responden preguntas, califican prospectos, agendan citas, dan seguimiento y operan tareas repetitivas las 24 horas — sin que tengas que estar pendiente. Funciona junto a tu web como un sistema completo: la web atrae y la IA atiende, convierte y opera. Cuéntame qué parte de tu negocio te quita más tiempo y te digo qué se puede automatizar.",
      en: { text: "Yes — we automate your business with artificial intelligence. We connect AI chatbots and agents that serve your customers, answer questions, qualify leads, book appointments, follow up and run repetitive tasks 24/7 — without you having to watch over it. It works alongside your website as one complete system: the site attracts, the AI serves, converts and operates. Tell me which part of your business eats the most time and I'll tell you what can be automated." },
      actions: act.ai
    },

    // ── AI chatbot ─────────────────────────
    {
      id: "ai-chatbot",
      phrases: ["chatbot con ia", "asistente virtual", "bot para mi web", "quiero un chatbot", "chatbot para atencion", "chatbot 24 horas", "atencion automatica", "ai chatbot", "chatbot for my site", "virtual assistant", "i want a chatbot", "chatbot for support", "automated support"],
      keywords: ["chatbot", "chatbots", "bot", "bots", "asistente", "virtual", "assistant"],
      text: "El chatbot con IA atiende a tus clientes al instante, las 24 horas: responde preguntas frecuentes, guía hacia tus productos o servicios, captura datos de contacto y deriva los casos importantes a ti. Aprende de tu negocio para responder con tu tono. Está incluido en el Plan Premium de diseño web, y también se puede contratar por separado como Plan Chatbot Inteligente. Deja de perder mensajes fuera de horario.",
      en: { text: "The AI chatbot serves your customers instantly, 24/7: it answers FAQs, guides them to your products or services, captures contact details and hands the important cases to you. It learns from your business so it replies in your tone. It's included in the Premium web design plan, and can also be purchased separately as the Smart Chatbot plan. Stop losing messages after hours." },
      actions: act.ai
    },

    // ── AI agents ──────────────────────────
    {
      id: "ai-agents",
      phrases: ["agente de ventas", "agente de ia", "agentes inteligentes", "empleado virtual", "agente autonomo", "ai agent", "ai agents", "sales agent", "ai employee", "autonomous agent"],
      keywords: ["agente", "agentes", "agent", "agents"],
      text: "Un agente de IA va más allá de un chatbot: trabaja de forma autónoma como un miembro más de tu equipo. Puede calificar prospectos, dar seguimiento a clientes, responder en varios canales, organizar reservas o pedidos y conectarse con tus herramientas — operando 24/7 sin descanso. Ideal para negocios que quieren escalar la atención y las ventas sin contratar más personal. Lo armamos a la medida de tus procesos.",
      en: { text: "An AI agent goes beyond a chatbot: it works autonomously like another member of your team. It can qualify leads, follow up with customers, reply across channels, organize bookings or orders, and connect to your tools — operating 24/7 without rest. Ideal for businesses that want to scale support and sales without hiring more people. We build it tailored to your processes." },
      actions: act.ai
    },

    // ── AI plans / pricing ─────────────────
    {
      id: "ai-plans",
      phrases: ["planes de ia", "cuanto cuesta la automatizacion", "precio del chatbot", "cuanto cuesta un chatbot", "precio de la ia", "planes de automatizacion", "cuanto cuesta un agente", "ai plans", "ai pricing", "how much is the chatbot", "cost of automation", "price of ai", "automation plans", "how much is an agent"],
      keywords: ["plan ia", "planes ia"],
      text: "Tenemos 3 planes de automatización con IA: 1) Chatbot Inteligente — un chatbot que atiende 24/7. 2) Asistente de Ventas (el más elegido) — chatbot + agente que responde y da seguimiento. 3) Sistema Completo — varios agentes que automatizan procesos de extremo a extremo. Como cada negocio es distinto, la IA se cotiza según tu caso: nos cuentas qué quieres automatizar y te damos una propuesta clara, sin compromiso.",
      en: { text: "We have 3 AI automation plans: 1) Smart Chatbot — a chatbot that serves 24/7. 2) Sales Assistant (most popular) — chatbot + agent that replies and follows up. 3) Full System — multiple agents that automate processes end to end. Since every business is different, AI is quoted per case: tell us what you want to automate and we give you a clear proposal, no commitment." },
      actions: act.ai
    },

    // ── Pricing / plans (web) ──────────────
    {
      id: "pricing",
      phrases: ["cuanto cuesta", "cual es el precio", "cuanto vale", "que precio tiene", "cuanto cobran", "tienen precios", "precio de una web", "precio de la web", "cuanto es", "cuanto me costaria", "precio aproximado", "how much", "how much does it cost", "what does it cost", "what is the price", "what are your rates", "do you have pricing"],
      keywords: ["precio", "precios", "plan", "planes", "costo", "costos", "cuanto", "cotiz", "presupuesto", "valor", "cobran", "tarifa", "tarifas", "price", "prices", "cost", "costs", "pricing", "rate", "rates", "fee", "fees", "package", "packages", "budget", "quote", "estimate"],
      text: "Tenemos dos líneas de planes. En diseño web: Plan Básico (presencia profesional inicial), Plan Negocio (para vender con claridad, el más elegido) y Plan Premium (experiencia de alta gama que además incluye un chatbot con IA). En automatización con IA: Chatbot Inteligente, Asistente de Ventas y Sistema Completo. El precio exacto depende del alcance y nivel de detalle; la forma más directa de saberlo es el diagnóstico gratis, sin compromiso.",
      en: { text: "We have two plan lines. Web design: Basic (initial professional presence), Business (to sell with clarity — most popular) and Premium (high-end experience that also includes an AI chatbot). AI automation: Smart Chatbot, Sales Assistant and Full System. The exact price depends on scope and level of detail; the most direct way to know is the free diagnostic, no commitment." },
      actions: [{ label: L.comparePlans, href: routes.planes }, { label: inEn ? "AI automation" : "Automatización con IA", href: routes.automatizacion }, { label: L.requestDiag, href: routes.contacto }]
    },

    // ── Installments / payment ─────────────
    {
      id: "payment",
      phrases: ["pagar en cuotas", "pago en partes", "formas de pago", "metodos de pago", "pago anticipado", "mitad y mitad", "transferencia", "tarjeta de credito", "pay in installments", "payment methods", "how do i pay", "payment options", "do you take cards"],
      keywords: ["cuotas", "pago", "pagos", "anticipo", "deposito", "efectivo", "transferencia", "tarjeta", "financiamiento", "payment", "installments", "deposit", "transfer", "card", "pay"],
      text: "Las condiciones de pago se definen con cada proyecto según el alcance. Generalmente se trabaja con un anticipo al confirmar el inicio y el saldo al entregar. Los detalles exactos se acuerdan durante el diagnóstico para que todo quede claro desde el primer día.",
      en: { text: "Payment terms are defined per project based on scope. Generally we work with a deposit when the project is confirmed and the balance on delivery. The exact details are agreed during the diagnostic so everything is clear from day one." },
      actions: act.contact
    },

    // ── ROI / is it worth it ────────────────
    {
      id: "roi",
      phrases: ["vale la pena invertir", "retorno de inversion", "me va a generar clientes", "cuanto voy a ganar", "como saber si vale", "es rentable tener una web", "beneficio de tener web", "is it worth it", "return on investment", "will it get me clients", "is it profitable", "what is the benefit"],
      keywords: ["rentable", "retorno", "inversion", "roi", "beneficio", "ganancias", "resultados", "worth", "return", "investment", "profitable", "benefit", "results"],
      text: "Una web premium con IA no es un gasto: es una herramienta de ventas activa 24/7. El retorno depende de tu oferta y mercado, pero en general una web que genera confianza desde el primer segundo convierte más visitas en conversaciones, y la IA responde al instante para no perder ningún cliente. Lo más caro suele ser seguir con una presencia que no transmite el valor real de tu negocio.",
      en: { text: "A premium website with AI isn't an expense: it's an active 24/7 sales tool. The return depends on your offer and market, but in general a site that builds trust from the first second turns more visits into conversations, and the AI replies instantly so you never lose a customer. The most expensive thing is usually staying with a presence that doesn't convey your business's real value." },
      actions: [{ label: inEn ? "See how it works" : "Ver cómo funciona", href: routes.servicios }, { label: inEn ? "Request diagnostic" : "Solicitar diagnóstico", href: routes.contacto }]
    },

    // ── Timeline / delivery ────────────────
    {
      id: "timeline",
      phrases: ["cuanto tiempo toma", "cuanto demora", "en cuanto tiempo", "dias tarda", "semanas tarda", "fecha de entrega", "cuando estaria lista", "es rapido el proceso", "how long", "how long does it take", "delivery time", "turnaround time", "when can you", "when will it be ready"],
      keywords: ["tiempo", "demora", "entrega", "dias", "semanas", "cuando", "rapido", "fecha", "deadline", "urgente", "pronto", "plazo", "time", "long", "days", "weeks", "delivery", "turnaround", "fast", "quick", "ready", "when", "urgent"],
      text: "Depende del alcance y la velocidad de revisiones. Una landing de alto impacto puede estar lista en pocos días; una web completa con múltiples páginas suele tomar de una a tres semanas. Una automatización con IA, según su complejidad, puede tomar de una a varias semanas. Lo importante es definir los tiempos reales desde el inicio para que no haya sorpresas. En el diagnóstico se acuerda el plazo concreto.",
      en: { text: "It depends on scope and how fast the revisions go. A high-impact landing can be ready in a few days; a complete multi-page site usually takes one to three weeks. An AI automation can take from one to several weeks depending on complexity. What matters is locking real timelines from day one so there are no surprises. The exact delivery date is agreed during the diagnostic." },
      actions: act.contact
    },

    // ── Process / how it works ─────────────
    {
      id: "process",
      phrases: ["como funciona el proceso", "como trabajan", "cuales son los pasos", "como es el flujo", "que incluye el proceso", "como empezamos", "how does it work", "how do you work", "what are the steps", "what is the process", "how do we start"],
      keywords: ["proceso", "pasos", "metodo", "revision", "revisiones", "cambios", "brief", "diagnostico", "flujo", "etapas", "process", "steps", "method", "workflow", "stages", "phases", "approach"],
      text: "El proceso tiene 4 etapas: 1) Diagnóstico: definimos objetivo, cliente ideal, oferta y tono visual. 2) Diseño: construimos la propuesta visual completa alineada con tu negocio (y, si aplica, la automatización con IA). 3) Revisión: ajustamos textos, secciones y detalles hasta que todo se sienta correcto. 4) Publicación: queda listo para compartir y vender. Todo por escrito y sin improvisar.",
      en: { text: "The process has 4 stages: 1) Diagnostic — we define goal, ideal client, offer, and visual tone. 2) Design — we build the full visual proposal aligned with your business (and, if applicable, the AI automation). 3) Review — we adjust copy, sections, and details until everything feels right. 4) Launch — it's ready to share and sell. Everything in writing, nothing improvised." },
      actions: act.services
    },

    // ── Number of revisions ────────────────
    {
      id: "revisions",
      phrases: ["cuantas revisiones", "puedo pedir cambios", "que pasa si no me gusta", "que pasa si quiero cambiar algo", "how many revisions", "can i request changes", "what if i don't like it", "what if i want changes"],
      keywords: ["revisiones", "cambios", "ajustes", "iteraciones", "rondas", "modificaciones", "revisions", "changes", "edits", "iterations", "rounds", "tweaks"],
      text: "Cada plan incluye rondas de revisión para ajustar textos, estructura y detalles visuales hasta que el resultado represente tu marca con precisión (el Plan Básico incluye 1 ronda, Negocio 2 y Premium 3). La meta es que la entrega se sienta convincente. Si algo no convence, se trabaja hasta llegar a eso: no se abandona a mitad del proceso.",
      en: { text: "Each plan includes revision rounds to adjust copy, structure and visual details until the result represents your brand precisely (Basic includes 1 round, Business 2, Premium 3). The goal is delivery that feels convincing. If something isn't right, we keep working until it is — we never leave it half done." },
      actions: act.contact
    },

    // ── Guarantee ──────────────────────────
    {
      id: "guarantee",
      phrases: ["hay garantia", "que pasa si no me convence", "garantia de satisfaccion", "y si no me gusta el resultado", "devolucion de dinero", "reembolso", "is there a guarantee", "satisfaction guarantee", "what if i'm not happy", "money back", "refund"],
      keywords: ["garantia", "garantizan", "reembolso", "devolucion", "satisfaccion", "guarantee", "guaranteed", "refund", "satisfaction"],
      text: "El proceso está diseñado para que el resultado final sea lo que acordamos: hay diagnóstico, revisiones y ajustes antes de la entrega definitiva. Trabajamos juntos hasta llegar a algo que te convenza, no se entrega algo a medias. Los detalles de la política de revisiones se definen al inicio del proyecto.",
      en: { text: "The process is designed so the final result is what we agreed: there's a diagnostic, revisions and adjustments before final delivery. We work together until we reach something that convinces you — nothing is delivered half-finished. The revision policy details are defined at the start of the project." },
      actions: act.contact
    },

    // ── Communication / collaboration ──────
    {
      id: "communication",
      phrases: ["como nos comunicamos", "por donde me contactan", "hay reunion", "videollamada", "por whatsapp", "correo electronico", "how do we communicate", "how do we keep in touch", "will there be a meeting", "video call"],
      keywords: ["comunicacion", "contacto", "reunion", "videollamada", "chat", "mensaje", "respuesta", "horario", "communication", "meeting", "call", "message", "reply"],
      text: "La comunicación es totalmente remota: WhatsApp para actualizaciones rápidas, correo para envío de archivos y feedback estructurado, y videollamada cuando hay que revisar algo juntos. El diagnóstico inicial puede hacerse por WhatsApp o formulario. La respuesta suele ser rápida.",
      en: { text: "Communication is fully remote: WhatsApp for quick updates, email for files and structured feedback, and a video call when we need to review something together. The initial diagnostic can be done via WhatsApp or the form. Replies are usually fast." },
      actions: [{ label: L.whatsapp, href: routes.contacto }, { label: L.contactForm, href: routes.contacto }]
    },

    // ── What the client needs to provide ───
    {
      id: "content",
      phrases: ["que necesito tener listo", "que me piden para empezar", "necesito textos previos", "necesito fotos propias", "que debo preparar", "do I need text", "do I need to provide", "what do I need", "do I need photos", "do I need content"],
      keywords: ["textos", "copy", "contenido", "fotos", "imagenes", "videos", "redaccion", "mensaje", "copywriting", "proveer", "preparar", "text", "texts", "content", "photos", "images", "pictures", "video", "videos", "provide", "prepare"],
      text: "No es obligatorio tener todo listo. Si no tienes textos, te orientamos para construir el mensaje: propuesta de valor, beneficios y llamadas a la acción. Las imágenes pueden combinarse con librerías licenciadas de alta calidad. Lo más importante al inicio es tener claro qué vendes y para quién es.",
      en: { text: "You don't need to have everything ready. If you don't have copy, we guide you to build the message: value proposition, benefits and calls to action. Images can be combined with high-quality licensed libraries. What matters most at the start is having clarity about what you sell and who it's for." },
      actions: act.contact
    },

    // ── Can I edit after delivery ───────────
    {
      id: "editable",
      phrases: ["puedo editar despues", "puedo modificar yo", "me van a enseñar", "como hago cambios", "yo mismo puedo actualizar", "can i edit later", "can i update it myself", "how do i make changes", "will you teach me"],
      keywords: ["editar", "modificar", "actualizar", "autonomia", "independiente", "cms", "wordpress", "edit", "modify", "update", "myself", "autonomy"],
      text: "Sí, puedes editar el contenido básico. La entrega incluye instrucciones claras para hacer cambios simples. Si necesitas actualizaciones más frecuentes o complejas, se puede definir un plan de mantenimiento desde el inicio para que no dependas de nadie para lo esencial.",
      en: { text: "Yes, you can edit the basic content. Delivery includes clear instructions for simple changes. If you need more frequent or complex updates, we can define a maintenance plan from the start so you don't depend on anyone for the essentials." },
      actions: act.contact
    },

    // ── Post-launch / maintenance ───────────
    {
      id: "maintenance",
      phrases: ["mantenimiento de la web", "que pasa despues de publicar", "soporte post entrega", "seguimiento despues", "actualizaciones periodicas", "do you offer maintenance", "what happens after launch", "post launch support", "ongoing updates"],
      keywords: ["mantenimiento", "soporte", "actualizacion", "actualizaciones", "despues", "post", "publicacion", "seguimiento", "maintenance", "support", "updates", "ongoing"],
      text: "Después de la publicación se puede definir un plan de soporte para cambios, actualizaciones de contenido o ajustes de rendimiento. Cada plan incluye además un periodo de soporte (de 15 a 60 días según el plan). Lo aclaramos desde el diagnóstico para que sepas exactamente qué cubre el proyecto y qué es adicional.",
      en: { text: "After launch we can define a support plan for changes, content updates or performance tweaks. Each plan also includes a support window (15 to 60 days depending on the plan). We clarify it during the diagnostic so you know exactly what the project covers and what is extra." },
      actions: act.contact
    },

    // ── Domain / hosting / email ────────────
    {
      id: "hosting",
      phrases: ["incluye dominio", "incluye hosting", "como funciona el hosting", "donde se publica", "email corporativo", "correo empresarial", "is hosting included", "is domain included", "do you host", "where is it hosted", "how do I publish"],
      keywords: ["dominio", "hosting", "host", "publicar", "subir", "deploy", "correo", "email", "servidor", "nube", "vercel", "domain", "publish", "upload", "server", "cloud", "mail"],
      text: "Depende del plan. En la mayoría de casos te acompañamos en la configuración del dominio y hosting, o conectamos la web a lo que ya tengas. El correo corporativo se puede configurar por separado. Todo queda acordado desde el diagnóstico para que no haya costos sorpresa.",
      en: { text: "Depends on the plan. In most cases we guide you through domain and hosting setup, or connect the site to what you already have. Corporate email can be configured separately. Everything is agreed during the diagnostic so there are no surprise costs." },
      actions: act.contact
    },

    // ── Analytics / tracking ────────────────
    {
      id: "analytics",
      phrases: ["analytics incluido", "puedo ver visitas", "estadisticas de la web", "google analytics", "como medir resultados", "can i see visits", "website statistics", "how do i measure results", "is analytics included"],
      keywords: ["analytics", "estadisticas", "metricas", "visitas", "trafico", "datos", "seguimiento", "tracking", "pixel", "statistics", "metrics", "visits", "traffic", "data"],
      text: "Se puede integrar Google Analytics u otras herramientas de medición para que puedas ver visitas, comportamiento y conversiones. Esto se define durante el proceso según tus necesidades. Medir es clave para saber si la web está cumpliendo su objetivo.",
      en: { text: "We can integrate Google Analytics or other measurement tools so you can see visits, behavior and conversions. This is defined during the process based on your needs. Measuring is key to know whether the site is meeting its goal." },
      actions: act.contact
    },

    // ── SEO ────────────────────────────────
    {
      id: "seo",
      phrases: ["seo incluido", "aparece en google", "como me posiciono", "palabras clave", "ranking en google", "is seo included", "will i appear on google", "how do i rank", "search engine"],
      keywords: ["seo", "google", "busqueda", "buscador", "posicionar", "ranking", "meta", "indexar", "buscar", "search", "keywords", "rank", "indexing"],
      text: "Toda web incluye SEO base: estructura semántica correcta, títulos, meta descripciones, jerarquía de contenido y rendimiento cuidado. Para SEO avanzado con estrategia de palabras clave, contenido y posicionamiento competitivo, se puede definir como un servicio adicional.",
      en: { text: "Every site includes foundational SEO: correct semantic structure, titles, meta descriptions, content hierarchy and careful performance. For advanced SEO with keyword strategy, content and competitive positioning, that can be defined as an additional service." },
      actions: act.services
    },

    // ── Mobile responsive ──────────────────
    {
      id: "mobile",
      phrases: ["se ve bien en celular", "version movil", "funciona en telefono", "diseño para celular", "does it work on mobile", "mobile version", "is it responsive", "phone design"],
      keywords: ["celular", "movil", "mobile", "responsive", "tablet", "telefono", "adaptable", "pantalla", "phone", "screen"],
      text: "Sí, la web es completamente responsive: se ve y funciona bien en celular, tablet y escritorio. Esto es crítico hoy porque la mayoría de decisiones de compra se hacen desde el teléfono. El diseño mobile-first no es opcional, es la base.",
      en: { text: "Yes, the site is fully responsive: it looks and works great on phone, tablet and desktop. This is critical today because most buying decisions happen on the phone. Mobile-first design isn't optional — it's the foundation." },
      actions: act.services
    },

    // ── Speed / performance ────────────────
    {
      id: "speed",
      phrases: ["carga rapido", "web lenta", "velocidad de carga", "como optimizan", "is it fast", "slow website", "loading speed", "how do you optimize"],
      keywords: ["velocidad", "rapida", "rapido", "performance", "carga", "pesada", "optimizar", "lento", "ligera", "speed", "fast", "loading", "optimize", "slow", "lightweight"],
      text: "La velocidad es parte de la experiencia premium. Se cuidan las imágenes, el código limpio, los scripts locales y la estructura del hosting para que la página cargue sin sentirse pesada. Una web lenta aleja clientes antes de que lean una sola palabra.",
      en: { text: "Speed is part of the premium experience. We optimize images, keep clean code, use local scripts and a solid hosting setup so the page loads without feeling heavy. A slow site pushes customers away before they read a single word." },
      actions: act.services
    },

    // ── WhatsApp integration ────────────────
    {
      id: "whatsapp-integration",
      phrases: ["boton de whatsapp", "integrar whatsapp", "chat de whatsapp", "link a whatsapp", "whatsapp en la web", "whatsapp button", "integrate whatsapp", "whatsapp on the site"],
      keywords: ["whatsapp", "wa"],
      text: "Sí, se integra WhatsApp en la web para que los visitantes puedan contactarte con un clic: botón flotante, links directos con mensaje predefinido o sección de contacto con WhatsApp como primera opción. Es uno de los CTA con mejor conversión en mercados latinoamericanos. Y si quieres ir más allá, un chatbot con IA puede atender por ti antes de que el mensaje te llegue.",
      en: { text: "Yes, we integrate WhatsApp into the site so visitors can reach you in one click: floating button, direct links with a pre-filled message, or a contact section with WhatsApp as the first option. It's one of the highest-converting CTAs in Latin American markets. And if you want to go further, an AI chatbot can handle the conversation for you before the message even reaches you." },
      actions: act.contact
    },

    // ── Security ───────────────────────────
    {
      id: "security",
      phrases: ["es segura la web", "seguridad del sitio", "proteccion de datos", "mi web sera segura", "es segura", "is the site secure", "is it secure", "is my site secure", "is my website secure", "will it be secure", "website security", "data protection", "is it safe", "is my data safe"],
      keywords: ["seguridad", "seguro", "segura", "privacidad", "csp", "cookies", "datos", "protegida", "https", "ssl", "certificado", "security", "secure", "privacy", "data", "protected", "certificate"],
      text: "La web se construye con seguridad desde la base: HTTPS, cabeceras de seguridad (CSP, X-Frame-Options, HSTS), política de referrer y scripts locales que no envían datos a terceros. El formulario de contacto tiene protección antispam y control de origen, y los datos del cliente se tratan con responsabilidad.",
      en: { text: "The site is built secure from the ground up: HTTPS, security headers (CSP, X-Frame-Options, HSTS), referrer policy and local scripts that don't send data to third parties. The contact form has anti-spam protection and origin control, and client data is handled responsibly." },
      actions: [{ label: L.viewServices, href: routes.servicios }, { label: L.contact, href: routes.contacto }]
    },

    // ── E-commerce / store / booking ────────
    {
      id: "ecommerce",
      phrases: ["necesito tienda online", "quiero vender productos", "carrito de compra", "sistema de reservas", "agenda online", "citas en linea", "i need an online store", "i want to sell products", "shopping cart", "booking system", "online appointments"],
      keywords: ["tienda", "ecommerce", "carrito", "productos", "reservas", "citas", "agenda", "booking", "catalogo", "store", "cart", "products", "bookings", "appointments", "catalog", "shop"],
      text: "Sí, se puede construir catálogo, tienda, sistema de reservas o agenda online. La arquitectura cambia según si necesitas pagos en línea, inventario o gestión de citas. Además, un agente de IA puede automatizar las reservas o el seguimiento de pedidos. Para cotizarlo bien conviene saber el número de productos, métodos de pago y el flujo de compra: compártelo en el diagnóstico.",
      en: { text: "Yes, we can build a catalog, store, booking system or online scheduler. The architecture changes depending on whether you need online payments, inventory or appointment management. An AI agent can also automate bookings or order follow-up. To quote it well it helps to know the number of products, payment methods and the buying flow — share it in the diagnostic." },
      actions: act.contact
    },

    // ── Multi-language ─────────────────────
    {
      id: "multilanguage",
      phrases: ["en ingles y espanol", "sitio bilingue", "dos idiomas", "version en ingles", "in english and spanish", "bilingual site", "two languages", "english version"],
      keywords: ["idioma", "idiomas", "ingles", "bilingue", "multilanguage", "traduccion", "traducir", "language", "languages", "english", "bilingual", "translation", "translate"],
      text: "Sí, hacemos webs en inglés, en español o en ambos idiomas. De hecho este mismo sitio es bilingüe. Para versiones bilingües se define la estructura desde el diseño para que el cambio de idioma sea fluido y bueno para SEO. Indícalo en el diagnóstico para incluirlo en el alcance.",
      en: { text: "Yes, we build sites in English, Spanish or both. In fact this very site is bilingual. For bilingual versions we plan the structure from the design stage so language switching is smooth and SEO-friendly. Mention it in the diagnostic so we include it in scope." },
      actions: act.contact
    },

    // ── Geography ──────────────────────────
    {
      id: "geography",
      phrases: ["trabajan fuera de ecuador", "solo en quito", "estan en guayaquil", "donde estan ubicados", "donde estan", "donde quedan", "cual es su ubicacion", "de donde son", "pueden atender a mexico", "latinoamerica", "do you work outside ecuador", "are you only in quito", "where are you located", "where are you based", "what is your location", "can you work with other countries", "do you work internationally"],
      keywords: ["ecuador", "quito", "guayaquil", "cuenca", "internacional", "latinoamerica", "mexico", "colombia", "peru", "chile", "españa", "international", "country", "abroad", "usa", "spain"],
      text: "Pittahaya tiene raíz ecuatoriana pero trabaja con clientes en toda Latinoamérica y más allá. El proceso es 100% remoto: diagnóstico, diseño, revisiones y entrega se hacen por medios digitales sin importar tu ubicación.",
      en: { text: "Pittahaya has Ecuadorian roots but works with clients across Latin America and beyond. The process is 100% remote: diagnostic, design, revisions and delivery all happen digitally, no matter where you are." },
      actions: act.contact
    },

    // ── Demo selection / portfolio ──────────
    {
      id: "demos",
      phrases: ["que demo necesito", "que demo me recomiendas", "cual demo es mejor para mi", "ver ejemplos", "ver portafolio", "ver trabajos", "tienen ejemplos", "which demo", "show me demos", "show demos", "view demos", "view portfolio", "do you have examples", "show examples"],
      keywords: ["demo", "demos", "portafolio", "ejemplo", "ejemplos", "muestra", "trabajos", "recomienda", "ver", "examples", "samples", "portfolio", "showcase", "show"],
      text: "Tenemos 6 demos según el tipo de negocio: Landing para captar leads o vender rápido, Corporativa para confianza y autoridad B2B, Marca & Diseño para identidad memorable, Servicios para explicar tu oferta paso a paso, Startup para producto digital o SaaS, y Lujo para alta gama exclusiva. Cada uno tiene su fondo animado y micro-interacciones. ¿Cuál describe mejor tu negocio?",
      en: { text: "We have 6 demos depending on your business type: Landing to capture leads or sell quickly, Corporate for B2B trust and authority, Brand & Design for memorable identity, Services to explain your offer step by step, Startup for digital products or SaaS, and Luxury for exclusive high-end. Each has its own animated background and micro-interactions. Which one best describes your business?" },
      actions: demosActs
    },

    // ── Landing page / conversion ───────────
    {
      id: "landing",
      phrases: ["pagina de ventas", "landing page", "pagina para vender", "captar clientes", "quiero mas leads", "sales page", "page to sell", "get more leads", "capture clients"],
      keywords: ["venta", "ventas", "landing", "campana", "lead", "leads", "conversion", "convertir", "anuncios", "publicidad", "clientes", "campaign", "ads", "advertising", "convert"],
      text: "Para captar leads o vender con una oferta concreta, lo ideal es una Landing de alto impacto: mensaje directo, sección de beneficios, prueba social, dudas resueltas y CTA fuerte hacia WhatsApp o formulario. Sin distracciones, todo el tráfico va hacia una sola acción. Puedes sumar un chatbot con IA para responder al instante a cada visita.",
      en: { text: "To capture leads or sell a specific offer, a high-impact Landing is ideal: direct message, benefits section, social proof, objections handled, and a strong CTA to WhatsApp or a form. No distractions — all traffic flows to a single action. You can add an AI chatbot to reply to every visitor instantly." },
      actions: [{ label: inEn ? "View Landing demo" : "Ver demo Landing", href: routes.landing }, { label: inEn ? "Create my landing" : "Crear mi landing", href: routes.contacto }]
    },

    // ── Corporate web ──────────────────────
    {
      id: "corporate",
      phrases: ["pagina empresarial", "web corporativa", "necesito una web para mi empresa", "web profesional para empresa", "para negocio establecido", "company website", "corporate site", "website for my company", "professional business website"],
      keywords: ["empresa", "corporativa", "corporativo", "confianza", "b2b", "seria", "autoridad", "institucional", "negocio", "establecido", "company", "corporate", "business", "authority", "established"],
      text: "Para una empresa que necesita verse sólida y confiable, la Web Corporativa muestra estructura clara, autoridad, servicios, equipo, prueba de confianza y una ruta directa para cotizar. Ideal para negocios que venden a otras empresas o a clientes de decisión pausada.",
      en: { text: "For a company that needs to look solid and trustworthy, the Corporate site shows clear structure, authority, services, team, trust proof and a direct path to request a quote. Ideal for businesses selling to other companies or to slower-deciding clients." },
      actions: [{ label: inEn ? "View Corporate demo" : "Ver demo Corporativa", href: routes.corporativa }, { label: inEn ? "Quote corporate" : "Cotizar corporativa", href: routes.contacto }]
    },

    // ── Brand / identity ───────────────────
    {
      id: "brand",
      phrases: ["identidad de marca", "diseño de marca", "quiero una marca memorable", "web con identidad propia", "diseño original", "brand identity", "brand design", "i want a memorable brand", "original design"],
      keywords: ["marca", "branding", "identidad", "diseño", "logo", "visual", "colores", "estilo", "memorable", "personalidad", "brand", "identity", "design", "colors", "style", "personality"],
      text: "Si quieres que la marca se recuerde, la ruta es Marca & Diseño: identidad visual propia, tono premium, secciones con personalidad y una experiencia que se siente diferente al primer scroll. No es una plantilla, es una dirección visual pensada para tu negocio.",
      en: { text: "If you want your brand to be remembered, the route is Brand & Design: a distinct visual identity, premium tone, sections with personality and an experience that feels different from the first scroll. It's not a template — it's a visual direction built for your business." },
      actions: [{ label: inEn ? "View Brand demo" : "Ver demo Marca", href: routes.marca }, { label: inEn ? "Create my identity" : "Crear mi identidad", href: routes.contacto }]
    },

    // ── Services web ───────────────────────
    {
      id: "services-web",
      phrases: ["web para mis servicios", "quiero mostrar mis servicios", "explicar lo que ofrezco", "web para consultor", "web para profesional", "website for my services", "show my services", "explain what i offer", "site for a consultant"],
      keywords: ["servicio", "servicios", "paquete", "paquetes", "consultoria", "explicar", "oferta", "beneficios", "propuesta", "profesional", "service", "services", "package", "consulting", "explain", "offer", "benefits"],
      text: "Si vendes servicios, la web debe ordenar tu oferta: qué haces exactamente, para quién es ideal, qué beneficios concretos tiene, cómo es el proceso y cuál es el siguiente paso. Eso reduce objeciones antes de hablar de precio y prepara al cliente para decir que sí más rápido.",
      en: { text: "If you sell services, the site must organize your offer: what you do exactly, who it's ideal for, what concrete benefits it has, how the process works and what the next step is. That reduces objections before price comes up and prepares the client to say yes faster." },
      actions: [{ label: inEn ? "View Services demo" : "Ver demo Servicios", href: routes.serviciosDemo }, { label: inEn ? "Organize my offer" : "Ordenar mi oferta", href: routes.contacto }]
    },

    // ── Startup / SaaS / app ───────────────
    {
      id: "startup",
      phrases: ["tengo una app", "tengo un saas", "producto digital", "lista de espera", "waitlist", "web para startup", "i have an app", "i have a saas", "digital product", "website for a startup"],
      keywords: ["startup", "saas", "app", "software", "tech", "producto", "aplicacion", "plataforma", "waitlist", "tecnologia", "product", "platform", "technology"],
      text: "Para una app, SaaS o startup, la web debe explicar rápido el problema, el producto, los beneficios clave, métricas de confianza y CTA para demo o lista de espera. El demo Startup muestra exactamente esa estructura, con estética técnica y de producto en producción.",
      en: { text: "For an app, SaaS or startup, the site must quickly explain the problem, the product, the key benefits, trust metrics and a CTA for a demo or waitlist. The Startup demo shows exactly that structure, with a technical, production-grade product aesthetic." },
      actions: [{ label: inEn ? "View Startup demo" : "Ver demo Startup", href: routes.startup }, { label: inEn ? "Design my product site" : "Diseñar mi producto web", href: routes.contacto }]
    },

    // ── Luxury / high-end ─────────────────
    {
      id: "luxury",
      phrases: ["alta gama", "web de lujo", "experiencia exclusiva", "para clientes premium", "publico de alto poder adquisitivo", "high end", "luxury website", "exclusive experience", "for premium clients"],
      keywords: ["lujo", "premium", "boutique", "exclusivo", "exclusiva", "elegante", "lujoso", "sofisticado", "highend", "high-end", "luxury", "exclusive", "elegant", "sophisticated"],
      text: "Para alta gama, la web debe sentirse cara sin gritar: menos elementos, más intención, fotografía fuerte, ritmo editorial lento y CTA elegante. El demo Lujo (High-End) es la mejor referencia para ese nivel de experiencia.",
      en: { text: "For high-end, the site must feel expensive without shouting: fewer elements, more intention, strong photography, a slow editorial rhythm and an elegant CTA. The Luxury (High-End) demo is the best reference for that level of experience." },
      actions: [{ label: inEn ? "View Luxury demo" : "Ver demo Lujo", href: routes.lujo }, { label: inEn ? "Create luxury site" : "Crear web de lujo", href: routes.contacto }]
    },

    // ── Specific industry: health ───────────
    {
      id: "industry-health",
      phrases: ["tengo una clinica", "soy medico", "tengo consultorio", "soy psicologo", "soy nutricionista", "soy dentista", "soy terapeuta", "i have a clinic", "i am a doctor", "i am a dentist", "i am a therapist", "i am a psychologist"],
      keywords: ["clinica", "medico", "consultorio", "psicologo", "nutricionista", "dentista", "terapeuta", "salud", "doctor", "odontologia", "clinic", "dentist", "therapist", "health", "medical"],
      text: "Para salud y bienestar lo más importante es generar confianza inmediata: credenciales claras, foto profesional, especialidades, proceso de atención y un botón para agendar cita. Un chatbot con IA puede responder dudas frecuentes y agendar citas las 24 horas. El cliente decide con quién confiar su salud en los primeros 7 segundos.",
      en: { text: "For health and wellness, the most important thing is building immediate trust: clear credentials, a professional photo, specialties, the care process and a button to book an appointment. An AI chatbot can answer common questions and book appointments 24/7. Patients decide who to trust with their health in the first 7 seconds." },
      actions: [{ label: inEn ? "View Services demo" : "Ver demo Servicios", href: routes.serviciosDemo }, { label: inEn ? "Quote for my clinic" : "Cotizar para mi clínica", href: routes.contacto }]
    },

    // ── Specific industry: food/restaurant ──
    {
      id: "industry-food",
      phrases: ["tengo un restaurante", "tengo una cafeteria", "tengo un bar", "negocio de comida", "i have a restaurant", "i have a cafe", "i have a bar", "food business"],
      keywords: ["restaurante", "cafeteria", "bar", "comida", "menu", "gastronomia", "delivery", "chef", "restaurant", "cafe", "food", "menu"],
      text: "Para restaurante o cafetería la web debe mostrar el concepto, el menú con fotos apetitosas, la ubicación, el horario y un link directo para reservas o pedidos. Un chatbot con IA puede tomar reservas y responder por ti. La fotografía lo es todo: la comida entra por los ojos antes de entrar al local.",
      en: { text: "For a restaurant or cafe, the site must show the concept, the menu with appetizing photos, location, hours and a direct link for reservations or orders. An AI chatbot can take bookings and reply for you. Photography is everything: food enters through the eyes before it enters the venue." },
      actions: [{ label: inEn ? "View Brand demo" : "Ver demo Marca", href: routes.marca }, { label: inEn ? "Quote my restaurant" : "Cotizar mi restaurante", href: routes.contacto }]
    },

    // ── Specific industry: legal/coach ──────
    {
      id: "industry-professional",
      phrases: ["soy abogado", "soy coach", "soy consultor", "soy arquitecto", "soy contador", "soy fotografo", "servicios profesionales", "i am a lawyer", "i am a coach", "i am a consultant", "i am an architect", "i am a photographer"],
      keywords: ["abogado", "coach", "consultor", "arquitecto", "contador", "fotografo", "fotografia", "lawyer", "consultant", "architect", "accountant", "photographer"],
      text: "Para profesionales independientes la web es la primera impresión antes de una llamada o reunión. Debe mostrar quién eres, en qué te especializas, tu propuesta de valor única y prueba social (casos, resultados, testimonios). Eso convierte visitas en consultas agendadas.",
      en: { text: "For independent professionals, the site is the first impression before a call or meeting. It must show who you are, what you specialize in, your unique value proposition and social proof (cases, results, testimonials). That turns visits into booked consultations." },
      actions: [{ label: inEn ? "View Corporate demo" : "Ver demo Corporativa", href: routes.corporativa }, { label: inEn ? "Talk about my project" : "Hablar de mi proyecto", href: routes.contacto }]
    },

    // ── Objection: too expensive ───────────
    {
      id: "objection-price",
      phrases: ["es muy caro", "no tengo presupuesto", "no puedo pagar tanto", "es costoso", "fuera de mi presupuesto", "tengo poco dinero", "it's too expensive", "i don't have budget", "i can't pay that much", "out of my budget"],
      keywords: ["caro", "costoso", "barato", "economico", "accesible", "expensive", "cheap", "affordable", "pricey"],
      text: "Es válido. El Plan Básico existe justamente para quien quiere empezar con autoridad sin un presupuesto grande. Lo más caro suele ser seguir sin una presencia que genere confianza: perder clientes que se van a la competencia por no verte serio. ¿Quieres que te muestre el plan de menor inversión?",
      en: { text: "That's fair. The Basic plan exists exactly for those who want to start with authority without a big budget. The most expensive thing is usually staying without a presence that builds trust — losing clients to competitors because you don't look serious. Want me to show you the lowest-investment plan?" },
      actions: [{ label: inEn ? "View Basic plan" : "Ver Plan Básico", href: routes.planes }, { label: inEn ? "Request diagnostic" : "Solicitar diagnóstico", href: routes.contacto }]
    },

    // ── Objection: do it myself ────────────
    {
      id: "objection-diy",
      phrases: ["lo puedo hacer yo mismo", "voy a hacerlo yo", "aprender a hacer mi web", "puedo aprender wordpress", "lo hago solo", "i can do it myself", "i'll do it myself", "learn to build my site", "i can learn wordpress"],
      keywords: ["yo mismo", "yo solo", "hacerlo yo", "aprendo", "myself", "diy", "learn"],
      text: "Claro que puedes. La pregunta es: mientras aprendes y construyes, ¿qué costo tiene el tiempo que no estás dedicando a tu negocio? Y cuando termines, ¿la web transmitirá la confianza que necesitas para cobrar lo que vale tu trabajo? Una web premium no es solo código: es estrategia, copy y dirección visual combinados.",
      en: { text: "Of course you can. The question is: while you learn and build, what does the time you're not spending on your business cost you? And when you finish, will the site convey the trust you need to charge what your work is worth? A premium site isn't just code: it's strategy, copy and visual direction combined." },
      actions: [{ label: inEn ? "Compare with demos" : "Ver demos para comparar", href: routes.portafolio }, { label: inEn ? "Request free diagnostic" : "Solicitar diagnóstico gratis", href: routes.contacto }]
    },

    // ── Objection: already have a web ──────
    {
      id: "objection-existing",
      phrases: ["ya tengo web", "ya tengo una pagina", "quiero mejorar mi web actual", "tengo web pero no funciona", "mi web esta desactualizada", "i already have a website", "i want to improve my current site", "my site doesn't work", "my website is outdated"],
      keywords: ["rediseño", "mejorar", "actualizar", "renovar", "antigua", "desactualizada", "redesign", "improve", "update", "outdated", "old"],
      text: "Perfecto punto de partida. Si tu web existe pero no genera confianza, no convierte o simplemente no refleja el nivel de tu negocio, un rediseño puede ser la inversión más directa que hagas este año. El diagnóstico gratis sirve exactamente para eso: analizar qué falla y qué se puede mejorar.",
      en: { text: "Perfect starting point. If your site exists but doesn't build trust, doesn't convert or simply doesn't reflect your business's level, a redesign can be the most direct investment you make this year. The free diagnostic is exactly for that: analyzing what's failing and what can be improved." },
      actions: [{ label: inEn ? "Diagnose my site" : "Solicitar diagnóstico de mi web", href: routes.contacto }, { label: inEn ? "Redesign service" : "Ver servicio de rediseño", href: routes.servicios }]
    },

    // ── vs Wix / WordPress / builders ──────
    {
      id: "vs-builders",
      phrases: ["por que no usar wix", "vs wordpress", "wix vs pittahaya", "squarespace vs pittahaya", "no es lo mismo que wix", "que diferencia con wordpress", "why not use wix", "difference with wordpress", "why not a builder"],
      keywords: ["wix", "wordpress", "squarespace", "webflow", "shopify", "plantilla", "constructor", "builder", "template"],
      text: "Wix, WordPress y similares dan herramientas para que tú construyas. Pittahaya diseña la estrategia visual, el copy de conversión, la experiencia de usuario y la arquitectura desde cero para tu negocio específico — y puede sumar IA encima. La diferencia se nota: una plantilla rellenada versus una web pensada para vender tu oferta en particular.",
      en: { text: "Wix, WordPress and similar tools give you tools to build it yourself. Pittahaya designs the visual strategy, conversion copy, user experience and architecture from scratch for your specific business — and can layer AI on top. The difference shows: a filled-in template versus a site built to sell your particular offer." },
      actions: [{ label: inEn ? "See our own demos" : "Ver demos propios", href: routes.portafolio }, { label: inEn ? "Request diagnostic" : "Solicitar diagnóstico", href: routes.contacto }]
    },

    // ── First step / how to start ───────────
    {
      id: "first-step",
      phrases: ["por donde empiezo", "como empezar", "cual es el primer paso", "quiero empezar", "quiero contratar", "quiero una cotizacion", "where do I start", "how do I start", "first step", "I want to start", "I want to hire", "I want a quote", "ready to start"],
      keywords: ["empezar", "comenzar", "inicio", "primer paso", "contratar", "cotizar", "avanzar", "siguiente paso", "start", "begin", "hire", "schedule", "book", "ready", "next"],
      text: "El primer paso es el diagnóstico gratis: un formulario corto donde describes tu negocio, tu cliente ideal y qué tipo de web o automatización necesitas. Con esa información preparamos una recomendación clara y una propuesta ajustada a tu caso, sin compromiso.",
      en: { text: "The first step is the free diagnostic: a short form where you describe your business, your ideal client and what kind of site or automation you need. With that we prepare a clear recommendation and a proposal tailored to your case, with no commitment." },
      actions: [{ label: inEn ? "Go to free diagnostic" : "Ir al diagnóstico gratis", href: routes.contacto }, { label: inEn ? "See plans first" : "Ver planes antes", href: routes.planes }]
    },

    // ── Social proof / references ───────────
    {
      id: "testimonials",
      phrases: ["tienen referencias", "clientes satisfechos", "caso de exito", "quiero ver resultados", "pueden mostrar clientes", "do you have references", "happy clients", "success stories", "can you show clients"],
      keywords: ["referencia", "referencias", "testimonio", "testimonios", "caso", "exito", "resultado", "opinion", "reference", "references", "testimonial", "testimonials", "case", "success", "review", "reviews"],
      text: "En el portafolio puedes ver los demos con distintos estilos y niveles de acabado. Clientes reales han reportado mayor confianza transmitida, más consultas recibidas y precios percibidos como más altos después del rediseño. En el diagnóstico puedo compartir casos más específicos según tu industria.",
      en: { text: "In the portfolio you can see the demos with different styles and finish levels. Real clients have reported more trust conveyed, more inquiries received and prices perceived as higher after the redesign. In the diagnostic I can share more specific cases for your industry." },
      actions: [{ label: L.viewAllDemos, href: routes.portafolio }, { label: inEn ? "Talk about the project" : "Hablar del proyecto", href: routes.contacto }]
    },

    // ── Technical skill required ────────────
    {
      id: "technical",
      phrases: ["no se de tecnologia", "no soy tecnico", "soy principiante", "no entiendo de webs", "i'm not technical", "i don't know technology", "i'm a beginner", "i don't understand websites"],
      keywords: ["tecnico", "tecnologia", "programar", "codigo", "html", "css", "principiante", "novato", "technical", "technology", "code", "beginner", "newbie"],
      text: "No necesitas saber nada técnico. El proceso está diseñado para que tú te concentres en tu negocio mientras nosotros manejamos todo lo técnico: diseño, código, hosting, dominio, IA y publicación. La entrega es algo listo para usar, no un archivo que tienes que subir tú.",
      en: { text: "You don't need to know anything technical. The process is designed so you focus on your business while we handle everything technical: design, code, hosting, domain, AI and launch. What you receive is ready to use — not a file you have to upload yourself." },
      actions: act.contact
    },

    // ── FAQ page ───────────────────────────
    {
      id: "faq-link",
      phrases: ["mas preguntas frecuentes", "donde veo las preguntas", "tienen faq", "pagina de preguntas", "do you have an faq", "where are the questions", "frequently asked questions"],
      keywords: ["faq", "frecuentes", "dudas", "preguntas", "questions"],
      text: "Tenemos una página de Preguntas Frecuentes con respuestas sobre precios, tiempos, textos, hosting, IA y más. ¿Quieres verla?",
      en: { text: "We have a Frequently Asked Questions page with answers about pricing, timelines, copy, hosting, AI and more. Want to see it?" },
      actions: act.faq
    },

    // ── Contact / human ────────────────────
    {
      id: "contact",
      phrases: ["quiero hablar con una persona", "quiero hablar con alguien", "quiero que me llamen", "necesito hablar con ustedes", "i want to talk to a person", "i want to talk to someone", "can someone call me", "i need to talk to you"],
      keywords: ["humano", "persona", "llamar", "contacto", "hablar", "human", "person", "call", "talk", "speak"],
      text: "Para hablar directamente, lo más rápido es WhatsApp o el formulario de contacto. Puedes describir tu proyecto, qué vendes y qué estilo quieres lograr. La respuesta es rápida y sin formalidades innecesarias.",
      en: { text: "To talk directly, the fastest is WhatsApp or the contact form. You can describe your project, what you sell and what style you want to achieve. The reply is fast and without unnecessary formalities." },
      actions: act.contact
    },

    // ── What we do / services overview ─────
    {
      id: "what-we-do",
      phrases: ["que hacen", "que hacen ustedes", "que hacen exactamente", "que es lo que hacen", "que haces", "a que se dedican", "a que se dedican ustedes", "a que te dedicas", "de que se trata", "de que va esto", "en que consisten", "que ofrecen", "que servicios tienen", "que servicios ofrecen", "que tipo de servicios", "que es pittahaya", "que pueden hacer por mi", "en que me pueden ayudar", "cuentame que hacen", "what do you do", "what do you guys do", "what exactly do you do", "what is it that you do", "what do you offer", "what services do you have", "what services do you offer", "what kind of services", "what is pittahaya", "what can you do for me", "tell me what you do", "how can you help me"],
      keywords: ["hacen", "ofrecen", "dedican", "servicios", "ofrecer", "consisten", "trata", "do", "offer", "services", "provide", "help"],
      text: "Pittahaya hace dos cosas que se potencian entre sí: 1) Diseño web premium — sitios a medida (landing, corporativa, marca, servicios, startup, tiendas) que generan confianza y venden. 2) Automatización con IA — chatbots y agentes que atienden, califican y dan seguimiento 24/7. Puedes contratar una sola línea o combinarlas en un sistema completo: la web atrae y la IA opera.",
      en: { text: "Pittahaya does two things that amplify each other: 1) Premium web design — custom sites (landing, corporate, brand, services, startup, stores) that build trust and sell. 2) AI automation — chatbots and agents that serve, qualify and follow up 24/7. You can hire one line or combine them into a complete system: the site attracts and the AI operates." },
      actions: act.start
    },

    // ── Ownership ──────────────────────────
    {
      id: "ownership",
      phrases: ["la web es mia", "soy dueño de la web", "quien es dueño", "me pertenece la web", "es de mi propiedad", "do i own the website", "is the site mine", "who owns the website", "is it my property"],
      keywords: ["dueño", "propiedad", "propietario", "pertenece", "mio", "mia", "own", "owner", "ownership", "property", "belongs"],
      text: "La web es 100% tuya. Al entregar y completar el pago, el sitio, el contenido y los accesos quedan a tu nombre: dominio, hosting y código. No quedas atado a Pittahaya para usarla, moverla o seguir creciéndola. Lo dejamos claro por escrito desde el inicio.",
      en: { text: "The website is 100% yours. On delivery and full payment, the site, content and access are in your name: domain, hosting and code. You're never locked to Pittahaya to use it, move it or keep growing it. We put this in writing from the start." },
      actions: act.contact
    },

    // ── Contract / agreement ───────────────
    {
      id: "contract",
      phrases: ["firmamos contrato", "hay contrato", "acuerdo por escrito", "todo por escrito", "hay un documento", "do we sign a contract", "is there a contract", "written agreement", "is everything in writing"],
      keywords: ["contrato", "acuerdo", "escrito", "documento", "terminos", "clausula", "contract", "agreement", "writing", "document", "terms"],
      text: "Sí. Todo se acuerda por escrito: alcance, entregables, número de revisiones, tiempos y condiciones de pago. Así ambos sabemos exactamente qué incluye el proyecto y no hay sorpresas. La claridad desde el inicio es parte del servicio.",
      en: { text: "Yes. Everything is agreed in writing: scope, deliverables, number of revisions, timelines and payment terms. That way we both know exactly what the project includes and there are no surprises. Clarity from the start is part of the service." },
      actions: act.contact
    },

    // ── Number of pages ────────────────────
    {
      id: "pages-count",
      phrases: ["cuantas paginas incluye", "cuantas secciones", "puedo agregar paginas", "numero de paginas", "how many pages", "how many sections", "can i add pages", "number of pages"],
      keywords: ["paginas", "secciones", "subpaginas", "pages", "sections", "subpages"],
      text: "Depende del plan: el Plan Básico es de una página, el Plan Negocio incluye varias páginas (inicio, servicios, sobre ti, contacto, etc.) y el Plan Premium permite una estructura más amplia y a medida. Siempre se pueden agregar páginas; lo definimos según lo que tu negocio necesita comunicar.",
      en: { text: "It depends on the plan: Basic is a single page, Business includes several pages (home, services, about, contact, etc.) and Premium allows a broader, fully custom structure. You can always add pages; we define it based on what your business needs to communicate." },
      actions: [{ label: L.comparePlans, href: routes.planes }, { label: L.requestDiag, href: routes.contacto }]
    },

    // ── Logo / branding design ─────────────
    {
      id: "logo-branding",
      phrases: ["hacen logos", "diseñan logo", "necesito un logo", "diseño de logo", "logo y marca", "do you make logos", "do you design logos", "i need a logo", "logo design"],
      keywords: ["logo", "logotipo", "logos", "isotipo", "imagotipo", "logotype"],
      text: "Sí, podemos diseñar o refinar tu logo e identidad visual (colores, tipografía y estilo) para que la web y tu marca se sientan coherentes. Si ya tienes logo, lo integramos; si no, lo desarrollamos como parte del proyecto de marca. Cuéntame qué tienes hoy y qué imagen quieres proyectar.",
      en: { text: "Yes, we can design or refine your logo and visual identity (colors, typography and style) so your site and brand feel coherent. If you already have a logo, we integrate it; if not, we develop one as part of the brand project. Tell me what you have today and the image you want to project." },
      actions: [{ label: inEn ? "View Brand demo" : "Ver demo Marca", href: routes.marca }, { label: L.requestDiag, href: routes.contacto }]
    },

    // ── Copywriting ────────────────────────
    {
      id: "copywriting",
      phrases: ["escriben los textos", "quien escribe el contenido", "ayudan con los textos", "redaccion de textos", "no se que poner", "do you write the copy", "who writes the text", "do you help with the content", "i don't know what to write"],
      keywords: ["redaccion", "redactar", "copywriting", "escribir", "textos", "copy", "wording", "write", "writing"],
      text: "Sí. Si no tienes los textos, te ayudamos a construir el mensaje: propuesta de valor, beneficios, secciones y llamadas a la acción pensadas para convertir. No se trata de 'rellenar', sino de decir lo correcto en el orden correcto para que el cliente avance. Tú aportas la información de tu negocio y nosotros le damos forma.",
      en: { text: "Yes. If you don't have the copy, we help you build the message: value proposition, benefits, sections and calls to action designed to convert. It's not about 'filling space' — it's saying the right thing in the right order so the client moves forward. You provide the business info and we shape it." },
      actions: act.contact
    },

    // ── Social media management ────────────
    {
      id: "social-media",
      phrases: ["manejan redes sociales", "gestion de redes", "llevan instagram", "manejan facebook", "contenido para redes", "do you manage social media", "do you handle instagram", "social media content", "do you do facebook"],
      keywords: ["redes", "instagram", "facebook", "tiktok", "social", "community", "posteos", "publicaciones"],
      text: "El foco de Pittahaya es la web y la automatización con IA, que son la base sobre la que todo lo demás convierte. La gestión diaria de redes no es el servicio principal, pero sí conectamos tus redes con la web y podemos automatizar respuestas y captación de leads desde ellas con IA. Cuéntame qué necesitas y te oriento.",
      en: { text: "Pittahaya's focus is web and AI automation — the foundation everything else converts on. Day-to-day social media management isn't the core service, but we do connect your social profiles to the site and can automate replies and lead capture from them with AI. Tell me what you need and I'll point you the right way." },
      actions: act.contact
    },

    // ── Ads / digital marketing ────────────
    {
      id: "ads-marketing",
      phrases: ["hacen publicidad", "corren anuncios", "google ads", "meta ads", "facebook ads", "marketing digital", "campañas de pauta", "do you run ads", "do you do marketing", "paid ads", "digital marketing"],
      keywords: ["pauta", "publicidad", "ads", "adwords", "marketing", "campañas", "trafico pagado", "advertising", "promotion"],
      text: "No corremos campañas de pauta directamente, pero diseñamos la web y la landing para que el tráfico de tus anuncios convierta de verdad — que no pierdas dinero enviando clics a una página que no vende. Si trabajas con alguien de pauta, dejamos todo listo (eventos, formularios, velocidad) para que su trabajo rinda. La IA puede dar seguimiento a esos leads 24/7.",
      en: { text: "We don't run paid ad campaigns directly, but we design the site and landing so your ad traffic actually converts — so you don't waste money sending clicks to a page that doesn't sell. If you work with an ads specialist, we leave everything ready (events, forms, speed) so their work pays off. AI can follow up with those leads 24/7." },
      actions: [{ label: inEn ? "View Landing demo" : "Ver demo Landing", href: routes.landing }, { label: L.requestDiag, href: routes.contacto }]
    },

    // ── Migration from existing site ───────
    {
      id: "migration",
      phrases: ["migrar mi web actual", "pasar mi sitio", "mover mi pagina", "cambiar de plataforma", "trasladar mi web", "migrate my current site", "move my website", "switch platforms", "transfer my site"],
      keywords: ["migrar", "migracion", "trasladar", "mover", "mudar", "migrate", "migration", "transfer", "move"],
      text: "Sí, podemos migrar o rehacer tu sitio actual a una versión más rápida, segura y enfocada en vender, conservando lo que funciona (contenido, posicionamiento, dominio). En el diagnóstico revisamos qué se puede aprovechar y qué conviene rediseñar. La idea es mejorar sin perder lo que ya ganaste.",
      en: { text: "Yes, we can migrate or rebuild your current site into a faster, more secure, sales-focused version, keeping what works (content, ranking, domain). In the diagnostic we review what's worth reusing and what's better redesigned. The goal is to improve without losing what you've already earned." },
      actions: act.contact
    },

    // ── Blog / news section ────────────────
    {
      id: "blog",
      phrases: ["puedo tener un blog", "seccion de blog", "publicar articulos", "seccion de noticias", "can i have a blog", "blog section", "publish articles", "news section"],
      keywords: ["blog", "articulos", "noticias", "posts", "articles", "news"],
      text: "Sí, se puede incluir un blog o sección de noticias para publicar artículos, novedades o contenido que ayude a tu SEO y a posicionarte como referente. Definimos si lo quieres autogestionable (para publicar tú) o estático. Lo incluimos en el alcance según tu plan.",
      en: { text: "Yes, we can include a blog or news section to publish articles, updates or content that helps your SEO and positions you as a reference. We define whether you want it self-manageable (so you publish yourself) or static. We include it in scope based on your plan." },
      actions: act.contact
    },

    // ── Integrations / tools ───────────────
    {
      id: "integrations",
      phrases: ["se conecta con mi calendario", "integrar con mi crm", "pasarela de pago", "conectar con mis herramientas", "integrar calendly", "connect to my calendar", "integrate with my crm", "payment gateway", "connect my tools"],
      keywords: ["integracion", "integrar", "conectar", "api", "crm", "calendario", "calendly", "pasarela", "stripe", "paypal", "integration", "integrate", "connect", "gateway", "calendar"],
      text: "Sí, la web puede integrarse con las herramientas que ya usas: calendario para agendar citas, pasarelas de pago, CRM, email marketing, WhatsApp y más. Y con IA podemos automatizar el flujo entre ellas (por ejemplo: el chatbot agenda en tu calendario y guarda el lead en tu CRM). Cuéntame qué usas hoy y vemos qué conectar.",
      en: { text: "Yes, the site can integrate with the tools you already use: a calendar for booking, payment gateways, CRM, email marketing, WhatsApp and more. And with AI we can automate the flow between them (e.g. the chatbot books in your calendar and saves the lead in your CRM). Tell me what you use today and we'll see what to connect." },
      actions: act.ai
    },

    // ── About / team / experience ──────────
    {
      id: "about-team",
      phrases: ["quien esta detras", "son una empresa", "son una persona", "quienes son", "tienen experiencia", "cuanto llevan", "quien hace el trabajo", "who is behind this", "are you a company", "are you one person", "who are you", "do you have experience", "how long have you been doing this"],
      keywords: ["experiencia", "equipo", "empresa", "quien", "quienes", "agencia", "trayectoria", "experience", "team", "company", "agency", "who"],
      text: "Pittahaya es un estudio de diseño con raíz ecuatoriana, enfocado en webs premium y automatización con IA. Trabajamos de forma cercana y personal: hablas directamente con quien diseña tu proyecto, sin pasar por intermediarios ni call centers. En 'Sobre nosotros' cuentas con más contexto, y en el portafolio ves el nivel de trabajo.",
      en: { text: "Pittahaya is a design studio with Ecuadorian roots, focused on premium websites and AI automation. We work closely and personally: you talk directly with the person designing your project — no middlemen or call centers. The 'About' page gives you more context, and the portfolio shows the level of work." },
      actions: [{ label: inEn ? "About us" : "Sobre nosotros", href: routes.servicios }, { label: L.viewAllDemos, href: routes.portafolio }]
    },

    // ── Availability / when can you start ──
    {
      id: "availability",
      phrases: ["estan disponibles", "aceptan clientes", "cuando pueden empezar", "tienen cupo", "pueden tomar mi proyecto", "are you available", "are you taking clients", "when can you start", "do you have availability"],
      keywords: ["disponible", "disponibilidad", "cupo", "cupos", "agenda", "empezar ya", "available", "availability", "slots", "capacity"],
      text: "Sí, estamos tomando nuevos proyectos. La fecha de inicio depende de la cola actual y del alcance de tu caso, pero el primer paso (el diagnóstico gratis) lo puedes hacer hoy mismo. Con eso reservamos tu lugar y definimos cuándo empezar. Mientras antes lo agendes, antes entras al calendario.",
      en: { text: "Yes, we're taking on new projects. The start date depends on the current queue and your project's scope, but the first step (the free diagnostic) you can do today. With that we hold your spot and define when to start. The sooner you book it, the sooner you enter the calendar." },
      actions: [{ label: L.requestDiag, href: routes.contacto }, { label: L.viewPlans, href: routes.planes }]
    },

    // ── Sample / mockup before paying ──────
    {
      id: "sample-mockup",
      phrases: ["puedo ver un ejemplo antes de pagar", "hacen una muestra gratis", "un boceto previo", "mockup antes de pagar", "prueba antes de contratar", "can i see a sample before paying", "do you do a free mockup", "a preview before paying", "trial before hiring"],
      keywords: ["muestra", "boceto", "mockup", "previo", "prueba gratis", "sample", "mockup", "preview", "draft"],
      text: "Los demos del portafolio son exactamente esa muestra: te dejan ver el nivel de diseño, las animaciones y la calidad antes de decidir. Un diseño a medida para tu negocio se desarrolla dentro del proyecto (con su anticipo), pero el diagnóstico gratis ya te da una recomendación clara y la dirección visual sugerida, sin costo.",
      en: { text: "The portfolio demos are exactly that sample: they let you see the design level, the animations and the quality before deciding. A custom design for your business is developed within the project (with its deposit), but the free diagnostic already gives you a clear recommendation and the suggested visual direction, at no cost." },
      actions: [{ label: L.viewAllDemos, href: routes.portafolio }, { label: L.requestDiag, href: routes.contacto }]
    },

    // ── Invoice / currency / billing ───────
    {
      id: "billing",
      phrases: ["dan factura", "emiten factura", "aceptan dolares", "en que moneda cobran", "puedo pagar en dolares", "do you give an invoice", "do you issue invoices", "do you accept dollars", "what currency"],
      keywords: ["factura", "facturacion", "recibo", "dolares", "moneda", "iva", "invoice", "receipt", "dollars", "currency", "billing"],
      text: "Sí, se emite el comprobante correspondiente por el servicio. Ecuador trabaja en dólares estadounidenses (USD), que es la moneda de referencia para las cotizaciones; para clientes de otros países se acuerda la forma más cómoda. Los detalles de facturación se definen al confirmar el proyecto.",
      en: { text: "Yes, the corresponding receipt/invoice is issued for the service. Ecuador works in US dollars (USD), which is the reference currency for quotes; for clients in other countries we agree on the most convenient method. Billing details are defined when the project is confirmed." },
      actions: act.contact
    },

    // ── Rush / urgent delivery ─────────────
    {
      id: "rush",
      phrases: ["lo necesito urgente", "lo necesito para ya", "entrega express", "es para esta semana", "puede ser mas rapido", "i need it urgently", "i need it asap", "express delivery", "can it be faster", "i need it this week"],
      keywords: ["urgente", "express", "rapido ya", "para ayer", "prisa", "urgent", "asap", "rush", "fast track", "hurry"],
      text: "Según la disponibilidad, se puede priorizar una entrega más rápida — sobre todo en landings o proyectos acotados. Para acelerar ayuda muchísimo tener clara la información de tu negocio y responder revisiones rápido. Cuéntame tu fecha límite en el diagnóstico y vemos si es viable un plan express.",
      en: { text: "Depending on availability, a faster delivery can be prioritized — especially for landings or tightly-scoped projects. To speed things up it helps a lot to have your business info clear and to approve revisions quickly. Tell me your deadline in the diagnostic and we'll see if an express plan is feasible." },
      actions: act.contact
    },

    // ── Accessibility ──────────────────────
    {
      id: "accessibility",
      phrases: ["es accesible", "accesibilidad web", "para personas con discapacidad", "lectores de pantalla", "is it accessible", "web accessibility", "for people with disabilities", "screen readers"],
      keywords: ["accesible", "accesibilidad", "discapacidad", "wcag", "lector de pantalla", "contraste", "accessible", "accessibility", "disability", "screen reader"],
      text: "Sí, cuidamos la accesibilidad: estructura semántica correcta, buen contraste, navegación por teclado, etiquetas para lectores de pantalla y respeto a quien prefiere menos animación. Una web accesible no solo es más justa, también llega a más personas y ayuda al SEO.",
      en: { text: "Yes, we care about accessibility: correct semantic structure, good contrast, keyboard navigation, labels for screen readers and respect for users who prefer reduced motion. An accessible site isn't just fairer — it reaches more people and helps SEO." },
      actions: act.services
    },

    // ── Legal pages / privacy / cookies ────
    {
      id: "legal-pages",
      phrases: ["politica de privacidad", "terminos y condiciones", "aviso legal", "banner de cookies", "paginas legales", "privacy policy", "terms and conditions", "cookie banner", "legal pages"],
      keywords: ["privacidad", "terminos", "condiciones", "legal", "cookies", "gdpr", "rgpd", "aviso", "privacy", "terms", "consent"],
      text: "Sí, podemos incluir las páginas legales que tu negocio necesite: política de privacidad, términos y condiciones, aviso legal y banner de cookies cuando aplica. Es importante para generar confianza y cumplir con buenas prácticas de protección de datos. Lo definimos en el alcance del proyecto.",
      en: { text: "Yes, we can include the legal pages your business needs: privacy policy, terms and conditions, legal notice and a cookie banner where applicable. It matters for building trust and following good data-protection practices. We define it in the project scope." },
      actions: act.contact
    },

    // ── Animations / interactivity ─────────
    {
      id: "animations",
      phrases: ["pueden hacer animaciones", "efectos como los demos", "web interactiva", "movimiento en la web", "animaciones como estas", "can you do animations", "effects like the demos", "interactive website", "motion like this"],
      keywords: ["animacion", "animaciones", "efectos", "interactiva", "interactivo", "movimiento", "transiciones", "parallax", "animation", "effects", "interactive", "motion"],
      text: "Sí — y es una de las cosas que más nos distingue. Los demos que ves (fondos animados, contadores, transiciones suaves, micro-interacciones) son exactamente el tipo de movimiento que aplicamos, siempre con buen gusto y sin sacrificar velocidad ni accesibilidad. La animación bien usada guía la atención y hace que la web se sienta viva y premium.",
      en: { text: "Yes — and it's one of the things that sets us apart. The demos you see (animated backgrounds, counters, smooth transitions, micro-interactions) are exactly the kind of motion we apply, always tasteful and without sacrificing speed or accessibility. Animation done well guides attention and makes the site feel alive and premium." },
      actions: [{ label: L.viewAllDemos, href: routes.portafolio }, { label: L.requestDiag, href: routes.contacto }]
    },

    // ── Mobile app development ─────────────
    {
      id: "app-development",
      phrases: ["pueden hacer una app", "desarrollo de aplicacion movil", "app para android", "app para iphone", "necesito una app", "can you build an app", "mobile app development", "android app", "ios app", "i need an app"],
      keywords: ["app", "aplicacion", "movil app", "android", "ios", "iphone", "nativa", "application"],
      text: "Nuestro foco es la web (que hoy funciona perfecto en cualquier teléfono) y la automatización con IA. Si lo que buscas es presencia y ventas, muchas veces una web rápida tipo app (PWA) resuelve sin el costo de una app nativa. Si realmente necesitas una app nativa, cuéntame el caso en el diagnóstico y te orientamos sobre el mejor camino.",
      en: { text: "Our focus is the web (which today works perfectly on any phone) and AI automation. If what you want is presence and sales, often a fast app-like website (PWA) solves it without the cost of a native app. If you truly need a native app, tell me the case in the diagnostic and we'll advise on the best path." },
      actions: act.contact
    },

    // ── Discounts / offers ─────────────────
    {
      id: "discounts",
      phrases: ["tienen descuento", "hay promocion", "ofertas disponibles", "codigo de descuento", "rebaja", "do you have a discount", "is there a promo", "any offers", "discount code"],
      keywords: ["descuento", "promocion", "oferta", "rebaja", "promo", "cupon", "discount", "offer", "deal", "coupon"],
      text: "De vez en cuando hay condiciones especiales según la temporada o el alcance del proyecto. La mejor forma de saber qué aplica para tu caso es el diagnóstico gratis: ahí revisamos tu necesidad y, si hay alguna condición vigente, te la comentamos. El objetivo siempre es que la inversión tenga sentido para ti.",
      en: { text: "From time to time there are special conditions depending on the season or project scope. The best way to know what applies to your case is the free diagnostic: there we review your need and, if there's any current condition, we'll let you know. The goal is always that the investment makes sense for you." },
      actions: [{ label: L.requestDiag, href: routes.contacto }, { label: L.viewPlans, href: routes.planes }]
    },

    // ── Is it built by AI / templates ──────
    {
      id: "custom-not-template",
      phrases: ["la hace una ia", "es una plantilla", "usan plantillas", "esta hecha con ia", "es generica", "is it made by ai", "is it a template", "do you use templates", "is it generic"],
      keywords: ["plantilla", "plantillas", "generica", "generico", "prefabricada", "template", "templates", "generic", "prebuilt"],
      text: "No usamos plantillas genéricas ni dejamos que una IA escupa la web por ti. Cada sitio se diseña a mano, desde cero, pensando en tu negocio, tu cliente y tu objetivo. Sí usamos IA donde aporta valor real (la automatización que ofrecemos como servicio), pero el diseño y la estrategia son trabajo humano y a medida. Por eso no se siente como 'una más'.",
      en: { text: "We don't use generic templates, nor do we let an AI spit out your site for you. Every site is designed by hand, from scratch, around your business, your client and your goal. We do use AI where it adds real value (the automation we offer as a service), but the design and strategy are human, tailored work. That's why it doesn't feel like 'just another site'." },
      actions: [{ label: L.viewAllDemos, href: routes.portafolio }, { label: L.requestDiag, href: routes.contacto }]
    },

    // ── Email marketing / newsletter ───────
    {
      id: "email-marketing",
      phrases: ["email marketing", "newsletter", "boletin de correo", "capturar correos", "lista de suscriptores", "email campaigns", "newsletter signup", "capture emails", "subscriber list"],
      keywords: ["newsletter", "boletin", "suscriptores", "mailchimp", "correos", "subscribers", "mailing"],
      text: "Sí, podemos integrar captación de correos (formularios de suscripción) y conectarla con tu herramienta de email marketing para que construyas una lista de clientes potenciales. Y con IA, el seguimiento de esos contactos puede ser automático. Definimos qué herramienta usas o cuál te conviene en el diagnóstico.",
      en: { text: "Yes, we can integrate email capture (signup forms) and connect it to your email marketing tool so you build a list of potential customers. And with AI, following up with those contacts can be automatic. We define which tool you use or which suits you best in the diagnostic." },
      actions: act.ai
    },

    // ── Scalability / growth ───────────────
    {
      id: "scalability",
      phrases: ["puede crecer la web", "y si mi negocio crece", "se puede escalar", "agregar funciones despues", "can the site grow", "what if my business grows", "can it scale", "add features later"],
      keywords: ["crecer", "escalar", "escalable", "ampliar", "expandir", "scale", "scalable", "grow", "expand"],
      text: "Sí. La web se construye con una base ordenada para que puedas agregar páginas, secciones, una tienda o nuevas funciones a medida que tu negocio crece — sin tener que empezar de cero. Y la automatización con IA escala contigo: puedes empezar con un chatbot y luego sumar agentes. Pensamos en hoy y en tu próximo nivel.",
      en: { text: "Yes. The site is built on an organized foundation so you can add pages, sections, a store or new features as your business grows — without starting from scratch. And AI automation scales with you: you can start with a chatbot and later add agents. We think about today and your next level." },
      actions: act.contact
    },

    // ── Are you a bot / real person ────────
    {
      id: "is-bot",
      phrases: ["eres un bot", "esto es un bot", "hablo con una maquina", "eres real", "eres una persona", "eres una persona real", "hablo con una persona", "esto es automatico", "eres humano", "are you a bot", "is this a bot", "am i talking to a robot", "are you real", "are you a real person", "is this a real person", "are you human", "is this automated", "am i talking to a person"],
      keywords: ["robot", "maquina", "automatico", "humano"],
      text: "Soy el asistente virtual de Pittahaya (sí, con IA 🙂). Puedo resolver al instante la mayoría de tus dudas sobre webs, automatización, precios y proceso. Y cuando quieras hablar con una persona del equipo, te conecto al WhatsApp o al formulario — del otro lado hay gente real que diseña tu proyecto.",
      en: { text: "I'm Pittahaya's virtual assistant (yes, AI-powered 🙂). I can instantly resolve most of your questions about websites, automation, pricing and process. And whenever you want to talk to a real person on the team, I'll connect you to WhatsApp or the form — there are real people on the other side who design your project." },
      actions: act.contact
    },

    // ── Small talk: what can you do (bot) ──
    {
      id: "bot-capabilities",
      phrases: ["en que me puedes ayudar", "que puedes hacer", "que me puedes decir", "para que sirves", "que sabes", "what can you help with", "what can you do for me", "what can you tell me", "how can you help"],
      keywords: ["puedes ayudar", "puedes hacer", "para que sirves"],
      text: "Puedo ayudarte con casi todo lo de Pittahaya: explicarte qué hacemos (webs premium + automatización con IA), recomendarte un plan o un demo según tu negocio, darte referencias de precios y tiempos, contarte el proceso, resolver dudas sobre dominio, hosting, SEO, seguridad y más — y guiarte al primer paso. ¿Qué te gustaría saber?",
      en: { text: "I can help with almost anything about Pittahaya: explain what we do (premium websites + AI automation), recommend a plan or a demo based on your business, give you pricing and timeline references, walk you through the process, answer questions about domain, hosting, SEO, security and more — and guide you to the first step. What would you like to know?" },
      actions: act.start
    },

    // ── Farewell / thanks ──────────────────
    {
      id: "farewell",
      phrases: ["muchas gracias", "hasta luego", "que tengas buen dia", "con eso es todo", "era todo lo que queria saber", "thank you", "thanks a lot", "see you later", "that's all", "that was all i needed"],
      keywords: ["gracias", "perfecto", "listo", "genial", "super", "excelente", "entendi", "entendido", "thanks", "thank", "perfect", "great", "awesome", "understood"],
      text: "Con gusto. Si decides avanzar, el diagnóstico gratis es el primer paso: describes tu proyecto y recibes una propuesta clara, sin compromiso. Cuando quieras estamos aquí.",
      en: { text: "My pleasure. If you decide to move forward, the free diagnostic is the first step: you describe your project and receive a clear proposal, no commitment. We're here whenever you need." },
      actions: [{ label: inEn ? "Request diagnostic" : "Solicitar diagnóstico", href: routes.contacto }, { label: L.viewDemos, href: routes.portafolio }]
    },

    // ── Compliment ─────────────────────────
    {
      id: "compliment",
      phrases: ["me gusta su web", "me gusta pittahaya", "su web es muy bonita", "quiero algo asi", "i like your website", "i like pittahaya", "your site is beautiful", "i want something like this"],
      keywords: ["bonito", "bonita", "precioso", "hermoso", "impresionante", "beautiful", "nice", "amazing", "love it", "impressive"],
      text: "¡Gracias! Eso mismo es lo que hacemos para tu negocio: una web que provoca exactamente esa reacción en tus clientes. ¿Quieres que hablemos de cómo trasladar esa experiencia a tu marca?",
      en: { text: "Thank you! That's exactly what we do for your business: a site that triggers exactly that reaction in your customers. Want to talk about how to bring that experience to your brand?" },
      actions: [{ label: inEn ? "Request free diagnostic" : "Solicitar diagnóstico gratis", href: routes.contacto }, { label: L.viewDemos, href: routes.portafolio }]
    }

  ];

  // ── Scoring ──────────────────────────────────────────────────
  const scoreEntry = (entry, text) => {
    let score = 0;
    let hit   = false;

    // Phrase matches score high (token count × 4)
    (entry.phrases || []).forEach(phrase => {
      const norm = normalize(phrase);
      if (text.includes(norm)) {
        score += norm.split(/\s+/).length * 4;
        hit = true;
      }
    });

    // Keyword matches: exact (worth more) or fuzzy (worth less)
    (entry.keywords || []).forEach(kw => {
      const k = normalize(kw);
      if (text.includes(k)) {
        if (isNegated(text, k)) { score -= 2; return; }
        score += k.length > 7 ? 2 : 1;
        hit = true;
      } else if (fuzzyContains(text, k)) {
        score += 1.2;   // typo-tolerant partial credit
        hit = true;
      }
    });

    // Compound bonus: when ≥2 distinct keywords match, the topic is very likely the intent
    let distinctMatches = 0;
    (entry.keywords || []).forEach(kw => {
      if (text.includes(normalize(kw))) distinctMatches++;
    });
    if (distinctMatches >= 2) score += 2;

    return { score, hit };
  };

  // Build a friendly "personalization prefix" if we know the name and it's the first time
  const personalize = (responseText) => {
    if (state.name && state.msgCount === 1) {
      return inEn
        ? `${responseText}\n\n— By the way, nice to meet you, ${state.name}.`
        : `${responseText}\n\n— Por cierto, mucho gusto ${state.name}.`;
    }
    return responseText;
  };

  // When the user asks something we partially understood, surface the next-best topic
  const partialFallback = (scored) => {
    // Find an entry that *almost* matched (score 1–2)
    const near = scored.find(s => s.score >= 1 && s.score < 3 && s.e.id !== state.lastIntent);
    if (near) {
      const friendly = T.topicLabels[near.e.id] || (inEn ? "that topic" : "ese tema");
      // Pick localized topic text if the entry has an `en` override
      const body = inEn && near.e.en?.text ? near.e.en.text : near.e.text;
      return {
        text: T.partialPrefix(friendly, body),
        actions: [...(near.e.actions || []).slice(0, 2), T.partialAction]
      };
    }
    return null;
  };

  const replyFor = (rawText) => {
    const text = normalize(rawText);

    if (!text) {
      return {
        text: state.name ? T.emptyPromptNamed(state.name) : T.emptyPrompt,
        actions: act.start
      };
    }

    // Pure greeting / small talk → answer warmly and directly (never the
    // partial-fallback preamble). A bare "hey", "hola", "que tal", "good
    // morning", "how are you" etc. should feel welcomed. We only treat it as
    // a pure greeting when the message is short AND doesn't also carry a real
    // topic (so "hola cuanto cuesta?" still goes to pricing).
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const startsWithGreeting = /^(hola+|holi|ola|buenas|buenos|buen dia|buenos dias|buenas tardes|buenas noches|hey+|hi+|hello|holla|saludos|epale|que tal|que onda|que mas|que hubo|good morning|good afternoon|good evening|good day|hi there|hey there|howdy|wassup|whats up|how are you|hows it going|como estas|como estan|como andas|como va|mucho gusto|nice to meet)\b/.test(text);
    const hasTopicSignal = /\b(precio|precios|costo|cuesta|cuanto|plan|planes|web|pagina|sitio|demo|ia|chatbot|agente|servicio|servicios|hacen|haces|ofrecen|dedican|tiempo|dominio|hosting|seo|tienda|logo|price|cost|how much|website|page|service|services|do you|what do|domain|store|automat)\b/.test(text);
    const isPureGreeting = wordCount <= 5 && startsWithGreeting && !hasTopicSignal;
    if (isPureGreeting) {
      state.lastIntent = "greeting";
      return {
        text: state.name ? T.pureGreetingNamed(state.name) : T.greeting,
        actions: T.greetingActions
      };
    }

    // Score every entry
    const scored = bank
      .map(e => ({ e, ...scoreEntry(e, text) }))
      .sort((a, b) => b.score - a.score);

    const best   = scored[0];
    const second = scored[1];

    // Strong primary match
    if (best && best.score >= 3) {
      const combineable = second
        && second.score >= 3
        && second.e.id !== best.e.id
        && !best.e.id.startsWith("industry-")
        && !second.e.id.startsWith("industry-");

      // Pick localized topic text if available
      const textOf = (e) => (inEn && e.en?.text) ? e.en.text : e.text;
      let responseText = textOf(best.e);
      let actions = best.e.actions;

      if (combineable) {
        responseText += "\n\n" + textOf(second.e);
        const seen = new Set();
        actions = [...best.e.actions, ...second.e.actions].filter(a => {
          const key = a.href || a.prompt || a.label;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 4);
        state.recentTopics = [best.e.id, second.e.id, ...state.recentTopics].slice(0, 5);
      } else {
        state.recentTopics = [best.e.id, ...state.recentTopics].slice(0, 5);
      }

      state.askedAbout.add(best.e.id);
      state.lastIntent = best.e.id;

      // Context-aware follow-ups (localized)
      if (best.e.id === "pricing" && !state.askedAbout.has("demos"))   responseText += T.nextRevisions;
      if (best.e.id === "demos"   && !state.askedAbout.has("pricing")) responseText += T.nextDemos;
      if (best.e.id.startsWith("industry-") && !state.askedAbout.has("first-step")) responseText += T.nextIndustry;

      return { text: personalize(responseText), actions };
    }

    // Weak primary match → try partial fallback
    const partial = partialFallback(scored);
    if (partial) {
      state.lastIntent = "partial";
      return partial;
    }

    // True fallback: contextual suggestions
    state.lastIntent = "fallback";
    const haveAsked = [...state.askedAbout];
    const suggest = haveAsked.length ? T.fallbackKnown : T.fallbackBase;

    return {
      text: state.name ? T.fallbackNamed(state.name, suggest) : T.fallbackPrefix(suggest),
      actions: T.fallbackActions
    };
  };

  // ── Message handling ─────────────────────────────────────────
  const scrollMessages = () => { messages.scrollTop = messages.scrollHeight; };

  const addMessage = (role, text, actions = []) => {
    const item = make("div", `pitahaya-chat__message pitahaya-chat__message--${role}`);
    const bubble = make("div", "pitahaya-chat__bubble", text);
    item.append(bubble);

    if (actions.length) {
      const wrap = make("div", "pitahaya-chat__actions");
      actions.forEach(a => {
        if (a.href) {
          const link = make("a", "pitahaya-chat__action", a.label);
          link.href = a.href;
          wrap.append(link);
        } else {
          const btn = make("button", "pitahaya-chat__action", a.label);
          btn.type = "button";
          btn.addEventListener("click", () => handleUserMessage(a.prompt || a.label));
          wrap.append(btn);
        }
      });
      item.append(wrap);
    }

    messages.append(item);
    scrollMessages();
  };

  const showBotReply = (rawText) => {
    // Typing indicator with 3 dots
    const typingMsg = make("div", "pitahaya-chat__message pitahaya-chat__message--bot");
    const typingBubble = make("div", "pitahaya-chat__bubble pitahaya-chat__typing-bubble");
    typingBubble.innerHTML = "<span></span><span></span><span></span>";
    typingMsg.append(typingBubble);
    messages.append(typingMsg);
    scrollMessages();

    const response = replyFor(rawText);
    const delay = Math.min(500 + response.text.length * 5, 1400);

    window.setTimeout(() => {
      typingMsg.remove();
      addMessage("bot", response.text, response.actions);

      // After a few messages, suggest alternative quick prompts
      if (msgCount === 3) {
        renderQuickPrompts(T.altPrompts);
      }
    }, delay);
  };

  function handleUserMessage(value) {
    const text = String(value || "").trim();
    if (!text) return;

    // Try to learn the user's name on the way in
    if (!state.name) {
      const found = extractName(text);
      if (found) state.name = found;
    }

    msgCount++;
    state.msgCount = msgCount;
    addMessage("user", text);
    showBotReply(text);
    input.value = "";
  }

  // ── Viewport & keyboard ──────────────────────────────────────
  const isMobile = () => window.matchMedia("(max-width:620px)").matches;

  const updateViewport = () => {
    const vp = window.visualViewport;
    const vh = Math.round(vp?.height || window.innerHeight);
    const kbOffset = vp ? Math.max(0, Math.round(window.innerHeight - vp.height - vp.offsetTop)) : 0;
    const kbOpen = isMobile() && document.activeElement === input && kbOffset > 90;
    const base = isMobile() ? "max(14px,env(safe-area-inset-bottom))" : "max(18px,env(safe-area-inset-bottom))";

    root.style.setProperty("--pitahaya-chat-vh", `${vh}px`);
    root.style.setProperty("--pitahaya-chat-bottom", base);
    root.classList.toggle("is-keyboard", kbOpen);

    if (kbOpen) {
      window.requestAnimationFrame(() => {
        const vBottom = vp ? vp.height + vp.offsetTop : window.innerHeight;
        const pBottom = panel.getBoundingClientRect().bottom;
        const overflow = Math.max(0, Math.ceil(pBottom - vBottom + 10));
        if (overflow) root.style.setProperty("--pitahaya-chat-bottom", `${overflow + 14}px`);
        window.setTimeout(scrollMessages, 60);
      });
    }
  };

  const setOpen = (open) => {
    root.classList.toggle("is-open", open);
    launcher.setAttribute("aria-expanded", String(open));
    updateViewport();
    if (!open) { root.classList.remove("is-keyboard"); return; }
    scrollMessages();
    if (!isMobile()) input.focus();
  };

  // ── Event listeners ──────────────────────────────────────────
  launcher.addEventListener("click", () => setOpen(true));
  closeBtn.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", (e) => { e.preventDefault(); handleUserMessage(input.value); });
  input.addEventListener("focus", () => { updateViewport(); window.setTimeout(updateViewport, 220); window.setTimeout(scrollMessages, 260); });
  input.addEventListener("blur", () => window.setTimeout(updateViewport, 120));
  window.addEventListener("resize", updateViewport);
  window.visualViewport?.addEventListener("resize", updateViewport);
  window.visualViewport?.addEventListener("scroll", updateViewport);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("is-open")) setOpen(false); });

  // ── Initial greeting ─────────────────────────────────────────
  addMessage("bot", T.greeting, T.greetingActions);
})();
