/* Sistemas Pittahaya — experiencia */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.sis-r').forEach(function (el) { io.observe(el); });

  var nodos = document.querySelectorAll('.sis-nodo');
  if (nodos.length && !reduce) {
    var i = 0;
    setInterval(function () {
      nodos.forEach(function (n) { n.classList.remove('on'); });
      nodos[i++ % nodos.length].classList.add('on');
    }, 1400);
  }

  document.querySelectorAll('.sis-card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ===== demo con 3 negocios ===== */
  var IC = {
    doc: '<path d="M6 2h9l5 5v15H6z"/><path d="M9 12h7M9 16h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    wa: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z"/>',
    fac: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    reloj: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    caja: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'
  };
  var ESC = {
    pasteleria: {
      av: 'P', nom: 'Pastelería Dulce Quito', canal: '● LLAMADA · 9:42 P. M.', fin: '1:48',
      chat: [
        ['c', 'Quería una torta para el sábado, para 20 personas.'],
        ['ia', '¡Con gusto! ¿Tres leches o chocolate con frutilla?'],
        ['c', 'Tres leches, a las 10 de la mañana.'],
        ['ia', 'Listo 🎂 Te llega la confirmación por WhatsApp.']
      ],
      ev: [['doc', 'Pedido creado', 'Tres leches · 20 · sáb 10:00'], ['user', 'Cliente en tu CRM', 'Con su historial'],
           ['wa', 'WhatsApp enviado', 'Con link de pago'], ['fac', 'Factura lista', 'Al confirmar el pago'], ['reloj', 'Aviso a cocina', 'El viernes']]
    },
    clinica: {
      av: 'S', nom: 'Clínica Sonríe', canal: '● LLAMADA · 7:15 A. M.', fin: '1:12',
      chat: [
        ['c', 'Me duele una muela, ¿tienen cita hoy?'],
        ['ia', 'Sí, hay espacio a las 4:30 p. m. con la Dra. Vega. ¿Se la reservo?'],
        ['c', 'Sí, por favor.'],
        ['ia', 'Reservada ✓ Le avisamos una hora antes.']
      ],
      ev: [['cal', 'Cita agendada', 'Hoy 4:30 p. m. · Dra. Vega'], ['user', 'Paciente en tu CRM', 'Con motivo de consulta'],
           ['wa', 'Confirmación enviada', 'Con ubicación'], ['reloj', 'Recordatorio programado', '3:30 p. m.'], ['doc', 'Ficha lista', 'Para la doctora']]
    },
    ropa: {
      av: 'L', nom: 'Luna Boutique', canal: '● WHATSAPP · 11:08 P. M.', fin: '0:54',
      chat: [
        ['c', '¿Tienen el vestido negro en talla M?'],
        ['ia', '¡Sí, queda uno! $45 con envío a todo Ecuador. ¿Te lo separo?'],
        ['c', 'Sí, a Cuenca.'],
        ['ia', 'Separado 💕 Aquí tu link de pago.']
      ],
      ev: [['caja', 'Prenda separada', 'Vestido negro · M'], ['user', 'Clienta en tu CRM', 'Le gusta el negro'],
           ['fac', 'Pago recibido', '$45 · tarjeta'], ['doc', 'Guía de envío', 'Cuenca · 24–48 h'], ['wa', 'Seguimiento', 'Aviso al entregar']]
    }
  };

  var EN = document.documentElement.lang === 'en';
  if (EN) ESC = {
    pasteleria: {
      av: 'S', nom: 'Sweet Crumb Bakery', canal: '● CALL · 9:42 PM', fin: '1:48',
      chat: [
        ['c', 'Hi, I need a cake for Saturday, for about 20 people.'],
        ['ia', 'Happy to help! Vanilla bean or chocolate raspberry?'],
        ['c', 'Vanilla, ready by 10 a.m.'],
        ['ia', 'Done 🎂 Your confirmation is on its way by text.']
      ],
      ev: [['doc', 'Order created', 'Vanilla · serves 20 · Sat 10:00'], ['user', 'Customer saved in CRM', 'With full history'],
           ['wa', 'Text sent', 'With payment link'], ['fac', 'Invoice ready', 'Once payment clears'], ['reloj', 'Kitchen reminder', 'Friday']]
    },
    clinica: {
      av: 'B', nom: 'Bright Smile Dental', canal: '● CALL · 7:15 AM', fin: '1:12',
      chat: [
        ['c', 'I have a toothache. Any openings today?'],
        ['ia', 'Yes, 4:30 p.m. with Dr. Vega. Shall I book it?'],
        ['c', 'Yes, please.'],
        ['ia', 'Booked ✓ We’ll remind you an hour before.']
      ],
      ev: [['cal', 'Appointment booked', 'Today 4:30 PM · Dr. Vega'], ['user', 'Patient saved in CRM', 'With reason for visit'],
           ['wa', 'Confirmation sent', 'With directions'], ['reloj', 'Reminder scheduled', '3:30 PM'], ['doc', 'Chart ready', 'For the dentist']]
    },
    ropa: {
      av: 'L', nom: 'Luna Boutique', canal: '● WHATSAPP · 11:08 PM', fin: '0:54',
      chat: [
        ['c', 'Do you have the black dress in a medium?'],
        ['ia', 'Yes, one left! $45 with free shipping. Want me to hold it?'],
        ['c', 'Yes, ship to Toronto.'],
        ['ia', 'Holding it 💕 Here’s your payment link.']
      ],
      ev: [['caja', 'Item on hold', 'Black dress · M'], ['user', 'Client saved in CRM', 'Loves black'],
           ['fac', 'Payment received', '$45 · card'], ['doc', 'Shipping label', 'Toronto · 2–3 days'], ['wa', 'Follow-up', 'Notified on delivery']]
    }
  };
  var LBL = EN ? ['CUSTOMER', 'PITTAHAYA AI'] : ['CLIENTE', 'IA PITTAHAYA'];

  var demo = document.querySelector('.sis-demo');
  if (!demo) return;
  var $ = function (s) { return demo.querySelector(s); };
  var chat = $('[data-chat]'), evs = $('[data-evs]'), reloj = $('[data-reloj]');
  var tabs = demo.querySelectorAll('[data-esc]');
  var actual = 'pasteleria', timers = [];

  function svg(k) { return '<svg viewBox="0 0 24 24">' + IC[k] + '</svg>'; }
  function pintar(k) {
    var d = ESC[k];
    $('[data-av]').textContent = d.av; $('[data-nom]').textContent = d.nom; $('[data-canal]').textContent = d.canal;
    chat.innerHTML = d.chat.map(function (m) {
      return '<div class="sis-m sis-m--' + m[0] + '">' + m[1] + '<small>' + (m[0] === 'c' ? LBL[0] : LBL[1]) + '</small></div>';
    }).join('');
    evs.innerHTML = d.ev.map(function (e) {
      return '<div class="sis-ev"><span class="ic">' + svg(e[0]) + '</span><div><b>' + e[1] + '</b><span>' + e[2] + '</span></div><em class="ok">✓</em></div>';
    }).join('');
  }
  function correr() {
    timers.forEach(clearTimeout); timers = [];
    pintar(actual);
    var d = ESC[actual], items = [].slice.call(chat.children).concat([].slice.call(evs.children));
    reloj.textContent = '0:00';
    demo.classList.add('vivo');
    if (reduce) { items.forEach(function (x) { x.classList.add('on'); }); reloj.textContent = d.fin; return; }
    items.forEach(function (x, n) {
      timers.push(setTimeout(function () {
        x.classList.add('on');
        if (n === items.length - 1) { reloj.textContent = d.fin; demo.classList.remove('vivo'); }
        else {
          var p = d.fin.split(':'), tot = (+p[0]) * 60 + (+p[1]), s = Math.round(tot * (n + 1) / items.length);
          reloj.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
        }
      }, 300 + n * (n < 4 ? 1300 : 900)));
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) { o.setAttribute('aria-selected', o === t ? 'true' : 'false'); });
      actual = t.dataset.esc; correr();
    });
  });
  $('.sis-repetir').addEventListener('click', correr);
  pintar(actual);
  var arrancado = false;
  var vista = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !arrancado) { arrancado = true; correr(); vista.disconnect(); }
    });
  }, { rootMargin: '0px 0px -25% 0px' });
  vista.observe(demo.querySelector('.sis-esc'));
})();
