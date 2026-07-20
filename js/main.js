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
})();
