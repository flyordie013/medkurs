/* Медсестра на дом — интерактив. Без зависимостей. */
(function () {
  'use strict';

  var C = window.CONFIG || {};
  var KZ = window.KZ || {};
  var RU = {};                       // соберём из HTML при загрузке
  var lang = 'ru';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- язык ---------------- */
  function t(key) {
    if (lang === 'kz' && KZ[key] != null) return KZ[key];
    return RU[key] != null ? RU[key] : '';
  }

  function collectRU() {
    $$('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (RU[k] == null) RU[k] = el.innerHTML;
    });
    $$('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      if (RU[k] == null) RU[k] = el.getAttribute('placeholder') || '';
    });
  }

  function applyLang(next) {
    lang = next === 'kz' ? 'kz' : 'ru';
    document.documentElement.setAttribute('lang', lang === 'kz' ? 'kk' : 'ru');
    $$('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v) el.innerHTML = v;
    });
    $$('[data-i18n-ph]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-ph'));
      if (v) el.setAttribute('placeholder', v);
    });
    $$('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    store.set('lang', lang);
    fillConfig();
    buildServiceSelects();
    buildZones();
    updateCalc();
  }

  /* ---------------- тема ---------------- */
  function applyTheme(mode) {
    var root = document.documentElement;
    if (mode) root.setAttribute('data-theme', mode); else root.removeAttribute('data-theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#0A4B4A');
  }

  /* ---------------- подстановка данных ---------------- */
  function waLink(msg) {
    var num = (C.phoneDigits || '').replace(/\D/g, '');
    var base = 'https://wa.me/' + num;
    return msg ? base + '?text=' + encodeURIComponent(msg) : base;
  }

  function waPreset(kind) {
    var greet = lang === 'kz' ? 'Сәлеметсіз бе! Сайттан жазып отырмын.' : 'Здравствуйте! Пишу с сайта.';
    if (kind === 'detox') {
      return greet + ' ' + (lang === 'kz' ? 'Мас күйден шығару қажет.' : 'Нужен вывод из запоя.');
    }
    if (kind === 'course') {
      return greet + ' ' + (lang === 'kz' ? 'Медбике курсына жазылғым келеді.' : 'Хочу записаться на курсы медсестры.');
    }
    return greet + ' ' + (lang === 'kz' ? 'Қызмет қажет:' : 'Нужна услуга:');
  }

  function money(v) {
    if (v == null || v === '') return '';
    var n = String(v).replace(/\s/g, '');
    if (/^\d+$/.test(n)) return Number(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₸';
    return String(v);
  }

  function fillConfig() {
    var tel = 'tel:+' + (C.phoneDigits || '').replace(/\D/g, '');
    $$('[data-phone]').forEach(function (el) {
      if (el.tagName === 'A' || el.tagName === 'SPAN' || el.tagName === 'B') el.textContent = C.phone || '';
    });
    $$('[data-tel]').forEach(function (el) { el.setAttribute('href', tel); });
    $$('[data-wa]').forEach(function (el) {
      el.setAttribute('href', waLink(waPreset(el.getAttribute('data-wa-msg'))));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
    $$('[data-price]').forEach(function (el) {
      var v = money((C.prices || {})[el.getAttribute('data-price')]);
      if (v) { el.textContent = v; }
      else if (el.classList.contains('v')) {
        el.innerHTML = '<em>' + (lang === 'kz' ? 'сұрау бойынша' : 'по запросу') + '</em>';
      } else { el.textContent = ''; }
    });
    $$('[data-cfg]').forEach(function (el) {
      var path = el.getAttribute('data-cfg').split('.');
      var v = C;
      for (var i = 0; i < path.length && v != null; i++) v = v[path[i]];
      if (v && typeof v === 'object') v = v[lang] != null ? v[lang] : v.ru;
      if (el.getAttribute('data-cfg-money') !== null) v = money(v);
      el.textContent = v ? v : t('tbd') || (lang === 'kz' ? 'нақтыланады' : 'уточняется');
    });
  }

  function buildZones() {
    var box = $('#zones');
    if (!box) return;
    box.innerHTML = '';
    (C.districts || []).forEach(function (d) {
      var s = document.createElement('span');
      s.className = 'zone';
      s.innerHTML = '<svg><use href="#i-pin"/></svg>' + d;
      box.appendChild(s);
    });
  }

  /* ---------------- список услуг для селектов ---------------- */
  var SERVICES = [
    { p: 'im', k: 's1t' }, { p: 'iv', k: 's2t' }, { p: 'sc', k: 's3t' },
    { p: 'drip', k: 's4t' }, { p: 'detox', k: 's5t' }, { p: 'detoxFull', k: 's6t' },
    { p: 'dressing', k: 's7t' }, { p: 'catheter', k: 's8t' }, { p: 'enema', k: 's9t' }
  ];

  function buildServiceSelects() {
    $$('select[data-services]').forEach(function (sel) {
      var keep = sel.value;
      sel.innerHTML = '';
      SERVICES.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s.p;
        o.textContent = (t(s.k) || s.k).replace(/<[^>]+>/g, '');
        sel.appendChild(o);
      });
      if (keep) sel.value = keep;
    });
  }

  /* ---------------- калькулятор ---------------- */
  var days = 1;

  function updateCalc() {
    var sel = $('#cSrv'), out = $('#cSum'), note = $('#cNote'), send = $('#cSend');
    if (!sel || !out) return;
    var key = sel.value;
    var base = parseInt(String((C.prices || {})[key] || '').replace(/\D/g, ''), 10);
    var nightOn = $('#cNight') && $('#cNight').checked;
    var nightAdd = parseInt(String((C.prices || {}).night || '').replace(/\D/g, ''), 10) || 0;
    var trip = parseInt(String((C.prices || {}).trip || '').replace(/\D/g, ''), 10) || 0;
    var label = (t(SERVICES.filter(function (s) { return s.p === key; })[0].k) || '').replace(/<[^>]+>/g, '');

    if (!base) {
      out.textContent = lang === 'kz' ? 'сұрау бойынша' : 'по запросу';
      if (note) note.textContent = lang === 'kz'
        ? 'Бұл қызметтің бағасы сайтта әлі көрсетілмеген. WhatsApp-қа жазыңыз — бірден айтамын.'
        : 'Цена этой услуги пока не указана на сайте. Напишите в WhatsApp — назову сразу.';
    } else {
      var total = (base + trip + (nightOn ? nightAdd : 0)) * days;
      out.textContent = money(String(total));
      if (note) note.textContent = lang === 'kz'
        ? label + ' · ' + days + ' күн' + (nightOn ? ' · түнгі шығу' : '') + '. Нақты соманы қоңырау кезінде растаймын.'
        : label + ' · ' + days + ' дн.' + (nightOn ? ' · ночной выезд' : '') + '. Точную сумму подтвержу при звонке.';
    }
    if (send) {
      var msg = (lang === 'kz'
        ? 'Сәлеметсіз бе! Сайттағы есеп: '
        : 'Здравствуйте! Расчёт с сайта: ')
        + label + ' — ' + days + (lang === 'kz' ? ' күн' : ' дн.')
        + (nightOn ? (lang === 'kz' ? ', түнгі шығу' : ', ночной выезд') : '')
        + '. ' + (out.textContent && base ? (lang === 'kz' ? 'Шамамен: ' : 'Примерно: ') + out.textContent : '');
      send.setAttribute('href', waLink(msg));
      send.setAttribute('target', '_blank');
      send.setAttribute('rel', 'noopener');
    }
  }

  /* ---------------- маска телефона ---------------- */
  function maskPhone(el) {
    el.addEventListener('input', function () {
      var d = el.value.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ')';
      if (d.length > 4) out += ' ' + d.slice(4, 7);
      if (d.length > 7) out += '-' + d.slice(7, 9);
      if (d.length > 9) out += '-' + d.slice(9, 11);
      el.value = out;
    });
    el.addEventListener('focus', function () { if (!el.value) el.value = '+7 ('; });
  }

  /* ---------------- инициализация ---------------- */
  document.addEventListener('DOMContentLoaded', function () {

    collectRU();

    /* тема */
    var savedTheme = store.get('theme');
    if (savedTheme) applyTheme(savedTheme);
    var themeBtn = $('#theme');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var isDark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = isDark ? 'light' : 'dark';
      applyTheme(next); store.set('theme', next);
    });

    /* язык: сохранённый → системный → русский */
    var savedLang = store.get('lang');
    if (!savedLang) {
      var forced = document.documentElement.getAttribute('data-default-lang');
      var nav = (navigator.language || '').toLowerCase();
      savedLang = forced ? forced : (nav.indexOf('kk') === 0 ? 'kz' : 'ru');
    }
    $$('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
    });

    /* бургер */
    var sheet = $('#sheet'), burger = $('#burger');
    function closeSheet() {
      if (!sheet) return;
      sheet.setAttribute('data-open', 'false');
      if (burger) burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    if (burger && sheet) {
      burger.addEventListener('click', function () {
        sheet.setAttribute('data-open', 'true');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      });
      var cl = $('#sheetClose');
      if (cl) cl.addEventListener('click', closeSheet);
      $$('.sheet a').forEach(function (a) { a.addEventListener('click', closeSheet); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    }

    /* аккордеоны */
    $$('.row-head').forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      });
    });
    $$('.faq-q').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true';
        $$('.faq-q').forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
        b.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });

    /* шапка, прогресс, док */
    var hdr = $('#hdr'), prog = $('#progress'), dock = $('#dock');
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (hdr) hdr.classList.toggle('stuck', y > 8);
      if (prog) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      }
      if (dock) dock.setAttribute('data-on', String(y > window.innerHeight * 0.55));
      /* страховка: ни один блок не должен остаться невидимым */
      var hidden = document.querySelectorAll('.rise:not(.in)');
      for (var i = 0; i < hidden.length; i++) {
        if (hidden[i].getBoundingClientRect().top < window.innerHeight) hidden[i].classList.add('in');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* подсветка активного пункта меню */
    var navLinks = $$('.nav a[href^="#"]');
    if (navLinks.length && 'IntersectionObserver' in window) {
      var map = {};
      navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && map[e.target.id]) {
            navLinks.forEach(function (a) { a.classList.remove('on'); });
            map[e.target.id].classList.add('on');
          }
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    }

    /* появление секций */
    if ('IntersectionObserver' in window) {
      var rise = new IntersectionObserver(function (es, o) {
        es.forEach(function (e) {
          /* второе условие спасает при быстром скролле и переходах по якорю:
             элемент могли «перепрыгнуть», и он остался бы невидимым навсегда */
          if (e.isIntersecting || e.boundingClientRect.top < window.innerHeight) {
            e.target.classList.add('in');
            o.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
      $$('.rise').forEach(function (el) { rise.observe(el); });

      /* счётчики */
      var cnt = new IntersectionObserver(function (es, o) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          o.unobserve(e.target);
          var el = e.target;
          var end = parseInt(el.getAttribute('data-count'), 10);
          var suf = el.getAttribute('data-suffix') || '';
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = end + suf; return; }
          var t0 = null, dur = 1100;
          function step(ts) {
            if (!t0) t0 = ts;
            var p = Math.min(1, (ts - t0) / dur);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: .6 });
      $$('[data-count]').forEach(function (el) { cnt.observe(el); });
    } else {
      $$('.rise').forEach(function (el) { el.classList.add('in'); });
    }

    /* часы Астаны */
    var clock = $('#clock');
    if (clock) {
      var tick = function () {
        var s;
        try {
          s = new Intl.DateTimeFormat('ru-RU', {
            timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', hour12: false
          }).format(new Date());
        } catch (e) {
          var d = new Date(Date.now() + 5 * 3600e3);
          s = ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
        }
        var city = (C.city && (C.city[lang] || C.city.ru)) || 'Астана';
        clock.textContent = s + ' · ' + city;
      };
      tick(); setInterval(tick, 20000);
    }

    /* лента отзывов */
    var rail = $('#rail');
    if (rail) {
      var step = function () { return rail.firstElementChild ? rail.firstElementChild.offsetWidth + 16 : 320; };
      var p = $('#railPrev'), n = $('#railNext');
      if (p) p.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (n) n.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
    }

    /* калькулятор */
    var sel = $('#cSrv');
    if (sel) sel.setAttribute('data-services', '');
    var fSrv = $('#fSrv');
    if (fSrv) fSrv.setAttribute('data-services', '');
    var out = $('#cDays');
    var minus = $('#cMinus'), plus = $('#cPlus'), night = $('#cNight');
    function setDays(v) { days = Math.max(1, Math.min(30, v)); if (out) out.textContent = days; updateCalc(); }
    if (minus) minus.addEventListener('click', function () { setDays(days - 1); });
    if (plus) plus.addEventListener('click', function () { setDays(days + 1); });
    if (night) night.addEventListener('change', updateCalc);
    if (sel) sel.addEventListener('change', updateCalc);

    /* форма */
    var form = $('#lead');
    if (form) {
      var phone = $('#fPhone');
      if (phone) maskPhone(phone);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        function bad(id, key) {
          var f = $('#' + id), msg = $('[data-err="' + id + '"]');
          if (msg) msg.textContent = t(key) || '';
          if (f) f.setAttribute('aria-invalid', 'true');
          ok = false;
        }
        function good(id) {
          var f = $('#' + id), msg = $('[data-err="' + id + '"]');
          if (msg) msg.textContent = '';
          if (f) f.removeAttribute('aria-invalid');
        }
        var name = $('#fName'), ph = $('#fPhone'), agree = $('#fOk');
        if (!name.value.trim()) bad('fName', 'fErrName'); else good('fName');
        if (ph.value.replace(/\D/g, '').length < 11) bad('fPhone', 'fErrPhone'); else good('fPhone');
        if (!agree.checked) bad('fOk', 'fErrOk'); else good('fOk');
        if (!ok) return;
        if (form.querySelector('[name="website"]').value) return;   // ловушка для ботов

        var srvSel = $('#fSrv');
        var srvLabel = srvSel && srvSel.selectedIndex >= 0
          ? srvSel.options[srvSel.selectedIndex].textContent
          : (form.getAttribute('data-topic') || '');
        var msgEl = $('#fMsg');
        var msgVal = msgEl ? msgEl.value : '';
        var btn = $('#fSubmit');
        var oldLabel = btn.textContent;
        btn.textContent = t('fSending') || 'Отправляю…';
        btn.disabled = true;

        function finish() {
          form.setAttribute('data-on', 'false');
          var done = $('#done');
          if (done) { done.setAttribute('data-on', 'true'); done.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        }

        if (C.formKey) {
          fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              access_key: C.formKey,
              subject: form.getAttribute('data-subject') || 'Заявка с сайта',
              name: name.value, phone: ph.value,
              service: srvLabel, message: msgVal
            })
          }).then(finish).catch(function () {
            window.open(waLink('Заявка с сайта. ' + name.value + ', ' + ph.value + '. ' + srvLabel), '_blank');
            finish();
          }).then(function () { btn.textContent = oldLabel; btn.disabled = false; });
        } else {
          var msg = (lang === 'kz' ? 'Сайттан өтінім. ' : 'Заявка с сайта. ')
            + name.value + ', ' + ph.value + '. ' + srvLabel
            + (msgVal ? '. ' + msgVal : '');
          window.open(waLink(msg), '_blank');
          btn.textContent = oldLabel; btn.disabled = false;
          finish();
        }
      });
    }

    applyLang(savedLang);
    setDays(1);
  });
})();
