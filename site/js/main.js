/* ==========================================================================
   Медсестра на дом · Астана — интерактив
   Без зависимостей. Прогрессивное улучшение: без JS страница читается.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.CONFIG || {};
  var D = window.CONTENT || {};
  var KZ = window.KZ || {};
  var RU = {};
  var lang = 'ru';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* --- Каталог услуг: единый источник для сетки, селектов и калькулятора --- */
  var SERVICES = [
    { id:'im',        price:'im',        cat:'injection' },
    { id:'iv',        price:'iv',        cat:'injection' },
    { id:'sc',        price:'sc',        cat:'injection' },
    { id:'drip',      price:'drip',      cat:'drip' },
    { id:'butterfly', price:'butterfly', cat:'drip' },
    { id:'dressing',  price:'dressing',  cat:'wound' },
    { id:'catheter',  price:'catheter',  cat:'wound' },
    { id:'enema',     price:'enema',     cat:'wound' },
    { id:'detox',     price:'detox',     cat:'urgent' },
    { id:'detoxFull', price:'detoxFull', cat:'urgent' }
  ];

  /* ---------------------------------------------------------------- i18n -- */
  function t(key) {
    if (lang === 'kz' && KZ[key] != null) return KZ[key];
    return RU[key] != null ? RU[key] : '';
  }
  function collectRU() {
    /* Тексты, которых нет в разметке (подробности услуг для drawer),
       берём из словаря; остальное собираем прямо со страницы. */
    var extra = window.RU_EXTRA || {};
    Object.keys(extra).forEach(function (k) { RU[k] = extra[k]; });
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
    var y = window.scrollY;                       /* язык не должен ронять скролл */
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
    fillConfig(); buildMetrics(); buildCreds(); buildReviews(); buildAreaTags();
    buildServiceSelects(); updateCalc();
    window.scrollTo(0, y);
  }

  /* --------------------------------------------------------------- тема -- */
  function applyTheme(mode) {
    if (mode) document.documentElement.setAttribute('data-theme', mode);
    else document.documentElement.removeAttribute('data-theme');
  }

  /* ------------------------------------------------------------ контакты -- */
  function digits() { return String(C.phoneDigits || '').replace(/\D/g, ''); }
  function waLink(msg) {
    var base = 'https://wa.me/' + digits();
    return msg ? base + '?text=' + encodeURIComponent(msg) : base;
  }
  function waPreset(kind) {
    var hi = lang === 'kz' ? 'Сәлеметсіз бе! Сайттан жазып отырмын.' : 'Здравствуйте! Пишу с сайта.';
    if (kind === 'detox')  return hi + ' ' + (lang === 'kz' ? 'Мас күйден шығару қажет.' : 'Нужен вывод из запоя.');
    if (kind === 'course') return hi + ' ' + (lang === 'kz' ? 'Медбике курсына жазылғым келеді.' : 'Хочу записаться на курсы медсестры.');
    return hi;
  }
  function money(v) {
    if (v == null || v === '') return '';
    var n = String(v).replace(/\s/g, '');
    if (/^\d+$/.test(n)) return Number(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₸';
    return String(v);
  }
  function fillConfig() {
    var tel = 'tel:+' + digits();
    $$('[data-phone]').forEach(function (el) { el.textContent = C.phone || ''; });
    $$('[data-tel]').forEach(function (el) { el.setAttribute('href', tel); });
    $$('[data-wa]').forEach(function (el) {
      el.setAttribute('href', waLink(waPreset(el.getAttribute('data-wa-msg'))));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
    $$('[data-price]').forEach(function (el) {
      var v = money((C.prices || {})[el.getAttribute('data-price')]);
      if (v) { el.textContent = v; el.classList.remove('service__price--ask'); }
      else   { el.textContent = t('priceOnRequest') || 'Цена по запросу'; el.classList.add('service__price--ask'); }
    });
    $$('[data-cfg]').forEach(function (el) {
      var path = el.getAttribute('data-cfg').split('.'), v = C, i;
      for (i = 0; i < path.length && v != null; i++) v = v[path[i]];
      if (v && typeof v === 'object') v = v[lang] != null ? v[lang] : v.ru;
      if (el.hasAttribute('data-cfg-money')) v = money(v);
      el.textContent = v ? v : (t('tbd') || 'уточняется');
    });
  }

  /* ------------------------------------------- показатели / квалификация -- */
  function buildMetrics() {
    var host = $('#metricsList');
    if (!host) return;
    host.innerHTML = '';
    (D.metrics || []).filter(function (m) { return m.verified; }).forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'metric';
      li.innerHTML = '<p class="metric__value"></p><p class="metric__label"></p>';
      li.querySelector('.metric__value').textContent = m.value;
      li.querySelector('.metric__label').textContent = m[lang] || m.ru;
      host.appendChild(li);
    });
  }
  function buildCreds() {
    var host = $('#credsList');
    if (!host) return;
    host.innerHTML = '';
    (D.credentials || []).filter(function (c) { return c.verified; }).forEach(function (c) {
      var li = document.createElement('li');
      li.innerHTML = '<svg aria-hidden="true"><use href="#ic-check"/></svg><span></span>';
      li.querySelector('span').textContent = c[lang] || c.ru;
      host.appendChild(li);
    });
  }

  /* --- Отзывы: реальных нет — показываем честное состояние, не выдумки --- */
  function buildReviews() {
    var host = $('#reviewsHost');
    if (!host) return;
    var list = D.testimonials || [];
    if (!list.length) {
      host.innerHTML =
        '<div class="empty-state">' +
          '<svg aria-hidden="true"><use href="#ic-chat"/></svg>' +
          '<p class="empty-state__title">' + (t('reviewsEmptyTitle') || 'Отзывы скоро появятся') + '</p>' +
          '<p class="empty-state__text">' + (t('reviewsEmptyText') || 'Здесь будут реальные отзывы пациентов. Придумывать их мы не стали.') + '</p>' +
          '<a class="btn btn--outline" href="' + waLink(waPreset()) + '" target="_blank" rel="noopener">' +
            (t('reviewsEmptyCta') || 'Задать вопрос в WhatsApp') + '</a>' +
        '</div>';
      return;
    }
    host.className = 'reviews reveal' + (host.getAttribute('data-in') === 'true' ? '' : '');
    host.innerHTML = list.map(function (r) {
      var text = (r[lang] || r.ru || '').replace(/</g, '&lt;');
      var name = (r.name || '').replace(/</g, '&lt;');
      return '<figure class="review" style="margin:0">' +
        '<blockquote class="review__text" style="margin:0">' + text + '</blockquote>' +
        '<figcaption class="review__foot">' +
          '<span class="review__avatar" aria-hidden="true">' + (name.charAt(0) || '·') + '</span>' +
          '<span><span class="review__name">' + name + '</span>' +
          '<span class="review__area">' + [(r.area || ''), (r.date || '')].filter(Boolean).join(' · ') + '</span></span>' +
        '</figcaption></figure>';
    }).join('');
  }
  function buildAreaTags() {
    var host = $('#areaTags');
    if (!host) return;
    var list = (D.districts && D.districts.length) ? D.districts : (C.districts || []);
    host.innerHTML = '';
    list.forEach(function (d) {
      var li = document.createElement('li');
      li.className = 'area__tag';
      li.textContent = d;
      host.appendChild(li);
    });
    host.hidden = !list.length;
  }

  /* ------------------------------------------------------------ селекты -- */
  function serviceName(id) {
    var el = document.querySelector('[data-service="' + id + '"] .service__name');
    if (el) return el.textContent.trim();
    return t('s_' + id + '_name') || id;
  }
  function buildServiceSelects() {
    $$('select[data-services]').forEach(function (sel) {
      var keep = sel.value;
      sel.innerHTML = '';
      SERVICES.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s.id;
        o.textContent = serviceName(s.id);
        sel.appendChild(o);
      });
      if (keep) sel.value = keep;
    });
  }

  /* -------------------------------------------------------- калькулятор -- */
  var days = 1;
  function num(v) { var n = parseInt(String(v || '').replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; }

  function updateCalc() {
    var sel = $('#calcService'), out = $('#calcAmount'), note = $('#calcNote'), send = $('#calcSend');
    if (!sel || !out) return;
    var id    = sel.value || SERVICES[0].id;
    var base  = num((C.prices || {})[id]);
    var trip  = num((C.prices || {}).trip);
    var night = $('#calcNight') && $('#calcNight').checked ? num((C.prices || {}).night) : 0;
    var label = serviceName(id);

    if (!base) {
      /* Пустое состояние: честно, без имитации расчёта */
      out.textContent = t('calcUnknown') || 'По запросу';
      if (note) note.textContent = t('calcNoteEmpty') ||
        'Цены пока уточняются. Напишите в WhatsApp — назову стоимость сразу.';
    } else {
      out.textContent = money(String((base + trip + night) * days));
      if (note) note.textContent = (t('calcNoteReady') ||
        'Ориентировочно. Точную сумму подтвержу до выезда.');
    }
    if (send) {
      var msg = (lang === 'kz' ? 'Сәлеметсіз бе! Сайттан сұрап отырмын: ' : 'Здравствуйте! Уточняю с сайта: ')
        + label + ', ' + days + (lang === 'kz' ? ' күн' : ' дн.')
        + ($('#calcNight') && $('#calcNight').checked ? (lang === 'kz' ? ', түнгі шығу' : ', ночной выезд') : '')
        + (base ? '. ' + (lang === 'kz' ? 'Шамамен: ' : 'Примерно: ') + out.textContent : '.');
      send.setAttribute('href', waLink(msg));
      send.setAttribute('target', '_blank');
      send.setAttribute('rel', 'noopener');
    }
  }

  /* ----------------------------------------------------- маска телефона -- */
  function maskPhone(el) {
    function fmt() {
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
    }
    el.addEventListener('input', fmt);
    el.addEventListener('focus', function () { if (!el.value) el.value = '+7 ('; });
    el.addEventListener('blur', function () { if (el.value.replace(/\D/g, '').length < 2) el.value = ''; });
  }

  /* --------------------------------------------------- модалки: фокус ---- */
  function trapFocus(container, onEscape) {
    function onKey(e) {
      if (e.key === 'Escape') { onEscape(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', container)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    return function () { container.removeEventListener('keydown', onKey); };
  }

  /* =============================================================== INIT == */
  document.addEventListener('DOMContentLoaded', function () {

    collectRU();

    /* тема */
    var savedTheme = store.get('theme');
    if (savedTheme) applyTheme(savedTheme);
    var themeBtn = $('#themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var isDark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      var next = isDark ? 'light' : 'dark';
      applyTheme(next); store.set('theme', next);
    });

    /* язык */
    var savedLang = store.get('lang');
    if (!savedLang) {
      var forced = document.documentElement.getAttribute('data-default-lang');
      savedLang = forced ? forced : ((navigator.language || '').toLowerCase().indexOf('kk') === 0 ? 'kz' : 'ru');
    }
    $$('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
    });

    /* мобильное меню */
    var sheet = $('#mobileMenu'), burger = $('#burger'), release = null, lastFocus = null;
    function openSheet() {
      if (!sheet) return;
      lastFocus = document.activeElement;
      sheet.setAttribute('data-open', 'true');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      release = trapFocus(sheet, closeSheet);
      var c = $('#menuClose'); if (c) c.focus();
    }
    function closeSheet() {
      if (!sheet) return;
      sheet.setAttribute('data-open', 'false');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (release) { release(); release = null; }
      if (lastFocus) lastFocus.focus();
    }
    if (burger && sheet) {
      burger.addEventListener('click', openSheet);
      var mc = $('#menuClose'); if (mc) mc.addEventListener('click', closeSheet);
      $$('.sheet__link', sheet).forEach(function (a) { a.addEventListener('click', closeSheet); });
      $$('.sheet__cta a', sheet).forEach(function (a) { a.addEventListener('click', closeSheet); });
    }

    /* FAQ */
    $$('.faq__q').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true';
        $$('.faq__q').forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
        b.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });

    /* Модули курса */
    $$('.module__head').forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      });
    });

    /* Фильтры услуг */
    $$('.filter').forEach(function (f) {
      f.addEventListener('click', function () {
        var cat = f.getAttribute('data-filter');
        $$('.filter').forEach(function (o) { o.setAttribute('aria-pressed', String(o === f)); });
        $$('.service').forEach(function (card) {
          card.hidden = !(cat === 'all' || card.getAttribute('data-cat') === cat);
        });
      });
    });

    /* Drawer с подробностями услуги */
    var drawer = $('#drawer'), dRelease = null, dLast = null;
    function openDrawer(id) {
      if (!drawer) return;
      dLast = document.activeElement;
      var name = serviceName(id);
      $('#drawerTitle').textContent = name;
      var body = $('#drawerBody');
      var full = t('s_' + id + '_full') || t('s_' + id + '_short') || '';
      var prep = t('s_' + id + '_prep') || '';
      body.innerHTML = '<p>' + full + '</p>' + (prep ? '<p>' + prep + '</p>' : '');
      var wa = $('#drawerWa');
      wa.setAttribute('href', waLink(waPreset() + ' ' + (lang === 'kz' ? 'Қызмет: ' : 'Услуга: ') + name));
      wa.setAttribute('target', '_blank'); wa.setAttribute('rel', 'noopener');
      drawer.setAttribute('data-open', 'true');
      document.body.style.overflow = 'hidden';
      dRelease = trapFocus(drawer, closeDrawer);
      $('#drawerClose').focus();
    }
    function closeDrawer() {
      if (!drawer) return;
      drawer.setAttribute('data-open', 'false');
      document.body.style.overflow = '';
      if (dRelease) { dRelease(); dRelease = null; }
      if (dLast) dLast.focus();
    }
    $$('.service').forEach(function (card) {
      card.addEventListener('click', function () { openDrawer(card.getAttribute('data-service')); });
    });
    if (drawer) {
      $('#drawerClose').addEventListener('click', closeDrawer);
      drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
    }

    /* Шапка, прогресс, нижняя панель */
    var header = $('#header'), prog = $('#progress'), bar = $('#actionBar');
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (header) header.setAttribute('data-stuck', String(y > 8));
      if (prog) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      }
      if (bar) bar.setAttribute('data-visible', String(y > window.innerHeight * 0.6));
      var hidden = document.querySelectorAll('.reveal:not([data-in="true"])');
      for (var i = 0; i < hidden.length; i++) {
        if (hidden[i].getBoundingClientRect().top < window.innerHeight) hidden[i].setAttribute('data-in', 'true');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Подсветка активного пункта меню */
    var navLinks = $$('.nav__link[href^="#"]');
    if (navLinks.length && 'IntersectionObserver' in window) {
      var map = {};
      navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && map[e.target.id]) {
            navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
            map[e.target.id].setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    }

    /* Появление секций */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es, o) {
        es.forEach(function (e) {
          if (e.isIntersecting || e.boundingClientRect.top < window.innerHeight) {
            e.target.setAttribute('data-in', 'true');
            o.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
      $$('.reveal').forEach(function (el) { io.observe(el); });
    } else {
      $$('.reveal').forEach(function (el) { el.setAttribute('data-in', 'true'); });
    }

    /* Калькулятор */
    var cs = $('#calcService'); if (cs) cs.setAttribute('data-services', '');
    var fs = $('#fService');    if (fs) fs.setAttribute('data-services', '');
    var out = $('#calcDays');
    function setDays(v) { days = Math.max(1, Math.min(30, v)); if (out) out.textContent = days; updateCalc(); }
    var mi = $('#calcMinus'), pl = $('#calcPlus'), ni = $('#calcNight');
    if (mi) mi.addEventListener('click', function () { setDays(days - 1); });
    if (pl) pl.addEventListener('click', function () { setDays(days + 1); });
    if (ni) ni.addEventListener('change', updateCalc);
    if (cs) cs.addEventListener('change', updateCalc);

    /* Форма */
    var form = $('#leadForm');
    if (form) {
      var ph = $('#fPhone'); if (ph) maskPhone(ph);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        function bad(id, key) {
          var f = $('#' + id), m = $('[data-err="' + id + '"]');
          if (m) m.textContent = t(key) || '';
          if (f) f.setAttribute('aria-invalid', 'true');
          if (ok && f) f.focus();
          ok = false;
        }
        function good(id) {
          var f = $('#' + id), m = $('[data-err="' + id + '"]');
          if (m) m.textContent = '';
          if (f) f.removeAttribute('aria-invalid');
        }
        var nm = $('#fName'), agree = $('#fConsent');
        if (!nm.value.trim()) bad('fName', 'errName'); else good('fName');
        if (ph.value.replace(/\D/g, '').length < 11) bad('fPhone', 'errPhone'); else good('fPhone');
        if (!agree.checked) bad('fConsent', 'errConsent'); else good('fConsent');
        if (!ok) return;
        if (form.querySelector('[name="website"]').value) return;    /* ловушка ботов */

        var srvSel = $('#fService');
        var srvLabel = srvSel && srvSel.selectedIndex >= 0
          ? srvSel.options[srvSel.selectedIndex].textContent
          : (form.getAttribute('data-topic') || '');
        var msgEl = $('#fMessage'), msgVal = msgEl ? msgEl.value : '';
        var btn = $('#formSubmit'), old = btn.textContent;
        btn.textContent = t('formSending') || 'Отправляю…';
        btn.disabled = true;

        function finish() {
          form.setAttribute('data-visible', 'false');
          var s = $('#formSuccess');
          if (s) { s.setAttribute('data-visible', 'true'); s.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        }
        function fallbackWa() {
          window.open(waLink((lang === 'kz' ? 'Сайттан өтінім. ' : 'Заявка с сайта. ')
            + nm.value + ', ' + ph.value + '. ' + srvLabel + (msgVal ? '. ' + msgVal : '')), '_blank');
        }

        if (C.formKey) {
          fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              access_key: C.formKey,
              subject: form.getAttribute('data-subject') || 'Заявка с сайта',
              name: nm.value, phone: ph.value, service: srvLabel, message: msgVal
            })
          }).then(finish).catch(function () { fallbackWa(); finish(); })
            .then(function () { btn.textContent = old; btn.disabled = false; });
        } else {
          fallbackWa(); btn.textContent = old; btn.disabled = false; finish();
        }
      });
    }

    applyLang(savedLang);
    setDays(1);
    onScroll();
  });
})();
