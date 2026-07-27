/* Eltis Services — gedeelde interacties */
(function () {
  'use strict';

  /* Header: achtergrond bij scroll */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobiel menu */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('mobile-open');
      var open = document.body.classList.contains('mobile-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Scroll reveal */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Tellers */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = (el.getAttribute('data-dec') || '0') === '1';
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = dec ? val.toFixed(1).replace('.', ',') : Math.round(val).toLocaleString('nl-NL');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        var t = parseFloat(el.getAttribute('data-count'));
        el.textContent = (el.getAttribute('data-dec') === '1') ? t.toFixed(1).replace('.', ',') : t.toLocaleString('nl-NL');
      });
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* Laadmeter (hero) animeren wanneer zichtbaar */
  var gauge = document.querySelector('.gauge-bars');
  if (gauge) {
    var heights = [30, 44, 52, 68, 61, 79, 88, 74, 92];
    if (reduce) {
      gauge.querySelectorAll('span').forEach(function (s, i) { s.style.setProperty('--h', (heights[i] || 40) + '%'); });
    } else {
      var go = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            gauge.querySelectorAll('span').forEach(function (s, i) {
              setTimeout(function () { s.style.setProperty('--h', (heights[i] || 40) + '%'); }, i * 80);
            });
            go.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      go.observe(gauge);
    }
  }

  /* Actief menu-item op basis van pad */
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });

  /* Contactformulier: versturen zonder de pagina te verlaten (AJAX) + bedankbericht */
  var cform = document.getElementById('contact-form');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = cform.querySelector('button[type="submit"]');
      var errBox = document.getElementById('contact-error');
      if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }
      if (btn) { btn.disabled = true; btn.style.opacity = '.7'; btn.innerHTML = 'Versturen…'; }
      fetch(cform.action, {
        method: 'POST',
        body: new FormData(cform),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          var wrap = document.getElementById('contact-form-wrap');
          var thanks = document.getElementById('contact-thanks');
          if (wrap) wrap.style.display = 'none';
          if (thanks) { thanks.style.display = 'block'; thanks.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        } else {
          throw new Error('Verzenden mislukt');
        }
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = 'Verstuur bericht <span class="arrow">&rarr;</span>'; }
        if (errBox) {
          errBox.style.display = 'block';
          errBox.textContent = 'Er ging iets mis bij het verzenden. Probeer het opnieuw of mail ons rechtstreeks.';
        }
      });
    });
  }

  /* Capaciteitscalculator (thuisbatterij): live advies op basis van verbruik + opwek */
  var capc = document.querySelector('[data-capcalc]');
  if (capc) {
    var rVerbruik = capc.querySelector('[data-cap="verbruik"]');
    var rPanelen = capc.querySelector('[data-cap="panelen"]');
    var panelenField = capc.querySelector('[data-cap-panelen]');
    function capState() {
      var zon = capc.querySelector('[data-cap="zon"] .pill.is-on');
      var extra = capc.querySelector('[data-cap="extra"] .pill.is-on');
      return {
        verbruik: parseInt(rVerbruik.value, 10),
        panelen: parseInt(rPanelen.value, 10),
        zon: zon ? zon.getAttribute('data-v') : 'nee',
        extra: extra ? extra.getAttribute('data-v') : 'nee'
      };
    }
    function nl(n, dec) { return n.toLocaleString('nl-NL', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); }
    function setOut(k, v) { var el = capc.querySelector('[data-out="' + k + '"]'); if (el) el.innerHTML = v; }
    function capCompute() {
      var s = capState();
      var dag = s.verbruik / 365;
      var advies, toelichting;
      if (s.zon === 'ja' && s.panelen > 0) {
        // kWp-methode (NL-vuistregel): 1 tot 1,5 kWh opslag per kWp aan zonnepanelen.
        // Modern paneel ~0,42 kWp. Factor stijgt met avond-/nachtverbruik; warmtepomp/EV verhoogt verder.
        var kwp = s.panelen * 0.42;
        var factor = 1.0;
        if (s.verbruik >= 3000) factor = 1.15;
        if (s.verbruik >= 5000) factor = 1.3;
        if (s.verbruik >= 7000) factor = 1.4;
        if (s.extra === 'ja') factor += 0.25;   // warmtepomp of EV: meer avondverbruik
        factor = Math.min(factor, 1.65);
        advies = kwp * factor;
        toelichting = 'Uw panelen: ± ' + nl(kwp, 1) + ' kWp · dagverbruik: ' + nl(dag, 1) + ' kWh';
      } else {
        // Verbruiksmethode: (jaarverbruik / 365) × 0,6 = avond- en nachtverbruik
        advies = dag * 0.6;
        if (s.extra === 'ja') advies = advies * 1.25;
        toelichting = 'Gemiddeld dagverbruik: ' + nl(dag, 1) + ' kWh';
      }
      advies = Math.max(3, Math.min(advies, 30));
      var adviesR = Math.round(advies);
      var onder = Math.max(2, Math.round(advies * 0.8));
      var boven = Math.round(advies * 1.2);
      if (boven <= onder) boven = onder + 1;
      // panelen-veld tonen/verbergen
      if (panelenField) panelenField.style.display = (s.zon === 'ja') ? '' : 'none';
      setOut('verbruik', nl(s.verbruik) + ' kWh');
      setOut('panelen', s.panelen + ' stuks');
      setOut('advies', '± ' + adviesR + ' kWh');
      setOut('range', 'richtwaarde ' + onder + '&ndash;' + boven + ' kWh');
      setOut('dag', toelichting);
    }
    capc.querySelectorAll('input[type="range"]').forEach(function (r) {
      r.addEventListener('input', capCompute);
    });
    capc.querySelectorAll('.capcalc-pills').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('.pill');
        if (!btn) return;
        group.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('is-on'); });
        btn.classList.add('is-on');
        capCompute();
      });
    });
    capCompute();
  }
})();
