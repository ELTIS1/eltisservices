/* =====================================================================
   Eltis Services — Offertecalculator
   Rendert een stapsgewijze funnel in elk element met .calc-mount
   Stappen: 1) locatie  2) dienst  3) situatie (conditioneel)  4) contact
   ---------------------------------------------------------------------
   VERSTUREN: vul hieronder je Formspree-endpoint in (zie README).
   Zonder endpoint valt het formulier terug op een e-mail (mailto) +
   bevestigingsscherm, zodat de site ook zonder backend werkt.
   ===================================================================== */
(function () {
  'use strict';

  // >>> CONFIGUREER HIER <<<
  var FORMSPREE_ENDPOINT = ''; // bv. 'https://formspree.io/f/mwvgbbyy'
  var CONTACT_EMAIL = 'info@eltisservices.nl';

  var mounts = document.querySelectorAll('.calc-mount');
  if (!mounts.length) return;

  // ---- iconen ----
  var IC = {
    battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 10v4"/><path d="M6 10l3 2-3 0 3 2" stroke-width="1.6"/></svg>',
    charger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="11" height="18" rx="2"/><path d="M15 8h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-2-2"/><path d="M9 7l-2 3h3l-2 3" stroke-width="1.6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6a6 6 0 1 0 0 12"/><path d="M4 10h9"/><path d="M4 14h7"/></svg>'
  };

  // ---- funnel-definitie ----
  var services = {
    thuisbatterij: { label: 'Thuisbatterij', icon: IC.battery, sub: 'Sla je stroom op en word onafhankelijker' },
    laadpaal: { label: 'Laadpaal', icon: IC.charger, sub: 'Thuis laden — veilig en op eigen tempo' }
  };

  // gedeelde vraag: type woning
  var Q_WONING = { key: 'woning', label: 'Wat voor woning heb je?', type: 'pills', required: true,
    options: ['Vrijstaande woning', 'Eengezinswoning', 'Appartement', 'Bedrijfspand'] };

  var branch = {
    thuisbatterij: [
      Q_WONING,
      { key: 'zon', label: 'Heb je zonnepanelen?', type: 'pills', required: true, options: ['Ja', 'Nee', 'In aanvraag'] },
      { key: 'wp', label: 'Hoeveel wattpiek (Wp) aan panelen?', hint: 'optioneel', type: 'input', placeholder: 'bv. 4200', inputType: 'number', showIf: function (s) { return s.zon === 'Ja'; } },
      { key: 'verbruik', label: 'Wat is je jaarverbruik?', type: 'select', required: true,
        options: ['Minder dan 2.500 kWh', '2.500 – 3.500 kWh', '3.500 – 5.000 kWh', '5.000 – 8.000 kWh', 'Meer dan 8.000 kWh', 'Weet ik niet'] },
      { key: 'aansluiting', label: 'Wat voor aansluiting heb je?', hint: 'staat op je meterkast', type: 'pills', required: true, options: ['1-fase', '3-fase', 'Weet ik niet'] },
      { key: 'contract', label: 'Heb je een dynamisch energiecontract?', type: 'pills', required: true, options: ['Ja', 'Nee', 'Interesse in'] },
      { key: 'capaciteit', label: 'Gewenste capaciteit', hint: 'geen idee? kies "Adviseer mij"', type: 'pills', required: true, options: ['Adviseer mij', '± 5 kWh', '± 10 kWh', '± 15 kWh', '20+ kWh'] }
    ],
    laadpaal: [
      Q_WONING,
      { key: 'aansluiting', label: 'Wat voor aansluiting heb je?', hint: 'staat op je meterkast', type: 'pills', required: true, options: ['1-fase', '3-fase', 'Weet ik niet'] },
      { key: 'kruipruimte', label: 'Heb je een kruipruimte?', hint: 'handig voor het wegwerken van de kabel', type: 'pills', required: true, options: ['Ja', 'Nee', 'Weet ik niet'] },
      { key: 'montage', label: 'Waar komt de laadpaal?', type: 'pills', required: true, options: ['Aan de muur', 'Op een paal'] },
      { key: 'afstand', label: 'Afstand meterkast tot laadpunt', type: 'select', required: true,
        options: ['Minder dan 5 meter', '5 – 10 meter', '10 – 20 meter', 'Meer dan 20 meter', 'Weet ik niet'] },
      { key: 'balancing', label: 'Load balancing gewenst?', hint: 'voorkomt overbelasting bij zware verbruikers', type: 'pills', required: true, options: ['Ja', 'Nee', 'Adviseer mij'] },
      { key: 'slimmemeter', label: 'Heb je een slimme meter?', type: 'pills', required: true, options: ['Ja', 'Nee', 'Weet ik niet'] }
    ]
  };

  var labels = {
    woning: 'Woning', zon: 'Zonnepanelen', wp: 'Wattpiek', verbruik: 'Jaarverbruik', aansluiting: 'Aansluiting',
    contract: 'Dynamisch contract', capaciteit: 'Capaciteit', kruipruimte: 'Kruipruimte', montage: 'Montage',
    afstand: 'Afstand', balancing: 'Load balancing', slimmemeter: 'Slimme meter'
  };

  mounts.forEach(function (mount) { buildCalc(mount); });

  function buildCalc(mount) {
    var forced = mount.getAttribute('data-variant'); // optioneel: 'thuisbatterij' of 'laadpaal'
    var state = { postcode: '', huisnr: '', dienst: forced || '' };
    var stepIndex = 0; // 0=locatie 1=dienst 2=situatie 3=contact  (dienst-stap overgeslagen bij forced)
    var TOTAL = 4;
    var VISIBLE = forced ? [0, 2, 3] : [0, 1, 2, 3]; // zichtbare stappen; dienst-stap vervalt bij vaste variant
    var N = VISIBLE.length;

    var root = document.createElement('div');
    root.className = 'calc';
    var stepperHtml = '';
    for (var si = 0; si < N; si++) {
      if (si > 0) stepperHtml += '<span class="cbar"></span>';
      stepperHtml += '<div class="cstep"><span class="dot">' + (si + 1) + '</span></div>';
    }
    root.innerHTML =
      '<div class="calc-head">' +
        '<div class="calc-eyebrow"><span class="tag">Gratis offerte op maat</span><span class="stepc"></span></div>' +
        '<div class="calc-steps" aria-hidden="true">' + stepperHtml + '</div>' +
      '</div>' +
      '<div class="calc-body"></div>';
    mount.innerHTML = '';
    mount.appendChild(root);

    var body = root.querySelector('.calc-body');
    var stepper = root.querySelector('.calc-steps');
    var stepNodes = stepper.querySelectorAll('.cstep');
    var stepBars = stepper.querySelectorAll('.cbar');
    var stepc = root.querySelector('.stepc');

    render();

    function setProgress(done) {
      var pos = VISIBLE.indexOf(stepIndex);
      if (pos < 0) pos = done ? N - 1 : 0;
      for (var i = 0; i < stepNodes.length; i++) {
        var node = stepNodes[i];
        var dot = node.querySelector('.dot');
        var isDone = done ? true : i < pos;
        node.classList.toggle('done', isDone);
        node.classList.toggle('current', !done && i === pos);
        dot.innerHTML = isDone ? IC.check : String(i + 1);
      }
      for (var j = 0; j < stepBars.length; j++) {
        stepBars[j].classList.toggle('fill', done ? true : j < pos);
      }
      stepc.textContent = done ? 'Klaar' : 'Stap ' + (pos + 1) + ' / ' + N;
    }

    function render() {
      setProgress(false);
      if (stepIndex === 0) return renderLocatie();
      if (stepIndex === 1) {
        if (forced) { stepIndex = 2; return render(); }
        return renderDienst();
      }
      if (stepIndex === 2) return renderSituatie();
      if (stepIndex === 3) return renderContact();
    }

    function wrap(inner) {
      body.innerHTML = '<div class="calc-step active">' + inner + '</div>';
      return body.querySelector('.calc-step');
    }

    function navHtml(backVisible, nextLabel) {
      return '<div class="calc-nav">' +
        '<button type="button" class="btn-back"' + (backVisible ? '' : ' hidden') + '>&larr; Terug</button>' +
        '<button type="button" class="btn calc-next">' + nextLabel + ' <span class="arrow">&rarr;</span></button>' +
        '</div><p class="err-msg" role="alert"></p>';
    }

    function bindNav(onNext) {
      var back = body.querySelector('.btn-back');
      var next = body.querySelector('.calc-next');
      if (back) back.addEventListener('click', function () { stepIndex = Math.max(0, stepIndex - 1); if (forced && stepIndex === 1) stepIndex = 0; render(); });
      if (next) next.addEventListener('click', onNext);
    }
    function err(msg) { var e = body.querySelector('.err-msg'); if (e) e.textContent = msg || ''; }

    /* ---- Stap 1: locatie ---- */
    function renderLocatie() {
      wrap(
        '<h3>Waar mogen we langskomen?</h3>' +
        '<p class="sub">We starten met je adres, zodat we meteen weten of je binnen ons werkgebied valt.</p>' +
        '<div class="row-2">' +
          '<div class="field"><label for="pc">Postcode</label>' +
          '<input class="input" id="pc" inputmode="text" autocomplete="postal-code" placeholder="1234 AB" value="' + esc(state.postcode) + '"></div>' +
          '<div class="field"><label for="hn">Huisnummer</label>' +
          '<input class="input" id="hn" inputmode="numeric" placeholder="12" value="' + esc(state.huisnr) + '"></div>' +
        '</div>' +
        navHtml(false, 'Volgende')
      );
      bindNav(function () {
        var pc = body.querySelector('#pc').value.trim().toUpperCase();
        var hn = body.querySelector('#hn').value.trim();
        if (!/^\d{4}\s?[A-Z]{2}$/.test(pc)) return err('Vul een geldige postcode in, bijvoorbeeld 1234 AB.');
        if (!hn) return err('Vul je huisnummer in.');
        state.postcode = pc.replace(/^(\d{4})\s?([A-Z]{2})$/, '$1 $2');
        state.huisnr = hn;
        stepIndex = 1; render();
      });
    }

    /* ---- Stap 2: dienst ---- */
    function renderDienst() {
      var tiles = Object.keys(services).map(function (k) {
        var s = services[k];
        return '<button type="button" class="choice' + (state.dienst === k ? ' sel' : '') + '" data-k="' + k + '">' +
          '<span class="cic">' + s.icon + '</span>' +
          '<span class="ct"><b>' + s.label + '</b><span>' + s.sub + '</span></span></button>';
      }).join('');
      wrap(
        '<h3>Waarvoor wil je een offerte?</h3>' +
        '<p class="sub">Kies je hoofddienst. De volgende vragen passen we hierop aan.</p>' +
        '<div class="choices c-2">' + tiles + '</div>' +
        navHtml(true, 'Volgende')
      );
      body.querySelectorAll('.choice').forEach(function (btn) {
        btn.addEventListener('click', function () {
          body.querySelectorAll('.choice').forEach(function (b) { b.classList.remove('sel'); });
          btn.classList.add('sel'); state.dienst = btn.getAttribute('data-k'); err('');
        });
      });
      bindNav(function () {
        if (!state.dienst) return err('Kies eerst thuisbatterij of laadpaal.');
        stepIndex = 2; render();
      });
    }

    /* ---- Stap 3: situatie (conditioneel) ---- */
    function renderSituatie() {
      var qs = branch[state.dienst] || [];
      var html = '<h3>Vertel iets over je situatie</h3>' +
        '<p class="sub">Hoe completer je antwoord, hoe scherper we je offerte maken.</p>';
      qs.forEach(function (q) {
        if (q.showIf && !q.showIf(state)) return;
        html += '<div class="field" data-fkey="' + q.key + '">';
        html += '<label>' + q.label + (q.hint ? ' <span class="hint">(' + q.hint + ')</span>' : '') + '</label>';
        if (q.type === 'pills') {
          html += '<div class="pills">' + q.options.map(function (o) {
            return '<button type="button" class="pill' + (state[q.key] === o ? ' sel' : '') + '" data-q="' + q.key + '" data-v="' + esc(o) + '">' + o + '</button>';
          }).join('') + '</div>';
        } else if (q.type === 'select') {
          html += '<select class="select" data-q="' + q.key + '"><option value="">Kies…</option>' +
            q.options.map(function (o) { return '<option' + (state[q.key] === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
        } else {
          html += '<input class="input" type="' + (q.inputType || 'text') + '" data-q="' + q.key + '" placeholder="' + (q.placeholder || '') + '" value="' + esc(state[q.key] || '') + '">';
        }
        html += '</div>';
      });
      html += navHtml(true, 'Naar gegevens');
      wrap(html);

      // pills
      body.querySelectorAll('.pill').forEach(function (p) {
        p.addEventListener('click', function () {
          var key = p.getAttribute('data-q');
          body.querySelectorAll('.pill[data-q="' + key + '"]').forEach(function (x) { x.classList.remove('sel'); });
          p.classList.add('sel'); state[key] = p.getAttribute('data-v'); err('');
          // conditionele velden opnieuw tekenen (bv. Wp bij zonnepanelen)
          if (key === 'zon') renderSituatie();
        });
      });
      body.querySelectorAll('.select, .input[data-q]').forEach(function (el) {
        el.addEventListener('change', function () { state[el.getAttribute('data-q')] = el.value; err(''); });
      });

      bindNav(function () {
        var missing = qs.filter(function (q) {
          if (q.showIf && !q.showIf(state)) return false;
          return q.required && !state[q.key];
        });
        if (missing.length) {
          var first = body.querySelector('[data-fkey="' + missing[0].key + '"]');
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return err('Beantwoord nog even: ' + missing[0].label.replace(/\?$/, '') + '.');
        }
        stepIndex = 3; render();
      });
    }

    /* ---- Stap 4: contact ---- */
    function renderContact() {
      wrap(
        '<h3>Waar sturen we je offerte naartoe?</h3>' +
        '<p class="sub">Je ontvangt binnen 1 werkdag een reactie. Geen verplichtingen.</p>' +
        '<div class="field"><label for="naam">Naam</label><input class="input" id="naam" autocomplete="name" placeholder="Voor- en achternaam" value="' + esc(state.naam || '') + '"></div>' +
        '<div class="row-2">' +
          '<div class="field"><label for="email">E-mailadres</label><input class="input" id="email" type="email" autocomplete="email" placeholder="jij@voorbeeld.nl" value="' + esc(state.email || '') + '"></div>' +
          '<div class="field"><label for="tel">Telefoon</label><input class="input" id="tel" type="tel" autocomplete="tel" placeholder="06 12 34 56 78" value="' + esc(state.tel || '') + '"></div>' +
        '</div>' +
        '<div class="field"><label for="opm">Opmerkingen <span class="hint">(optioneel)</span></label><textarea class="input" id="opm" rows="3" placeholder="Bijzonderheden over je situatie of planning">' + esc(state.opm || '') + '</textarea></div>' +
        '<label style="display:flex;gap:10px;align-items:flex-start;font-size:.9rem;color:var(--text-2);cursor:pointer">' +
          '<input type="checkbox" id="akkoord" style="margin-top:4px;width:18px;height:18px;flex:none;accent-color:var(--amber-deep)">' +
          '<span>Ik ga akkoord dat Eltis Services contact met mij opneemt over deze aanvraag. Zie de <a href="privacy.html" style="color:var(--amber-deep);text-decoration:underline">privacyverklaring</a>.</span></label>' +
        navHtml(true, 'Verstuur aanvraag') +
        '<div class="calc-reassure">' +
          '<span class="r">' + IC.check + ' Reactie binnen 1 werkdag</span>' +
          '<span class="r">' + IC.check + ' Vrijblijvend</span>' +
          '<span class="r">' + IC.check + ' NEN 1010 &amp; NEN 3140</span>' +
        '</div>'
      );
      var nextBtn = body.querySelector('.calc-next');
      bindNav(function () {
        state.naam = body.querySelector('#naam').value.trim();
        state.email = body.querySelector('#email').value.trim();
        state.tel = body.querySelector('#tel').value.trim();
        state.opm = body.querySelector('#opm').value.trim();
        var akkoord = body.querySelector('#akkoord').checked;
        if (!state.naam) return err('Vul je naam in.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) return err('Vul een geldig e-mailadres in.');
        if (!state.tel || state.tel.replace(/\D/g, '').length < 8) return err('Vul een geldig telefoonnummer in.');
        if (!akkoord) return err('Ga akkoord om je aanvraag te versturen.');
        submit(nextBtn);
      });
    }

    /* ---- Versturen ---- */
    function submit(btn) {
      if (btn) { btn.disabled = true; btn.innerHTML = 'Versturen…'; }
      var payload = buildPayload();
      if (FORMSPREE_ENDPOINT) {
        fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) { done(); }).catch(function () { done(); });
      } else {
        // geen backend: toon bevestiging en bied mailto-fallback
        setTimeout(done, 500);
      }
    }

    function buildPayload() {
      var p = { dienst: services[state.dienst] ? services[state.dienst].label : state.dienst,
        postcode: state.postcode, huisnummer: state.huisnr,
        naam: state.naam, email: state.email, telefoon: state.tel, opmerkingen: state.opm };
      (branch[state.dienst] || []).forEach(function (q) {
        if (state[q.key]) p[labels[q.key] || q.key] = state[q.key];
      });
      return p;
    }

    function done() {
      setProgress(true);
      var p = buildPayload();
      var rows = '';
      var order = ['dienst', 'postcode', 'huisnummer'];
      rows += sumRow('Dienst', p.dienst);
      rows += sumRow('Locatie', p.postcode + ' ' + p.huisnummer);
      (branch[state.dienst] || []).forEach(function (q) {
        if (state[q.key]) rows += sumRow(labels[q.key] || q.key, state[q.key]);
      });

      var mailBody = encodeURIComponent(
        'Offerteaanvraag via de website\n\n' +
        Object.keys(p).map(function (k) { return k + ': ' + p[k]; }).join('\n')
      );
      var mailSubject = encodeURIComponent('Offerteaanvraag ' + p.dienst + ' — ' + state.naam);
      var mailto = 'mailto:' + CONTACT_EMAIL + '?subject=' + mailSubject + '&body=' + mailBody;

      body.innerHTML =
        '<div class="calc-done">' +
          '<div class="check">' + IC.check + '</div>' +
          '<h3>Bedankt, ' + esc(state.naam.split(' ')[0]) + '!</h3>' +
          '<p class="sub" style="margin-bottom:0">Je aanvraag staat klaar. We nemen binnen 1 werkdag contact met je op met een offerte op maat.</p>' +
          '<div class="calc-summary">' + rows + '</div>' +
          (FORMSPREE_ENDPOINT ? '' :
            '<p class="sub" style="font-size:.9rem">Nog niet gekoppeld aan een mailbox? ' +
            '<a class="link-arrow" style="display:inline-flex" href="' + mailto + '">Verstuur per e-mail</a></p>') +
        '</div>';
    }

    function sumRow(k, v) { return '<div class="sr"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span></div>'; }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})();
