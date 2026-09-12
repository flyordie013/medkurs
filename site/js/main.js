(function () {
  "use strict";

  const CONFIG = window.CONFIG || {};
  const CONTENT = window.CONTENT || {};
  const I18N = window.I18N || { ru: {}, kz: {} };
  const page = document.documentElement.dataset.page || "home";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let lang = "ru";
  let activeCategory = "all";
  let quickService = "im";
  let courseQuestion = "start";
  let visits = 1;
  let activeDrawerService = null;
  let drawerReturnFocus = null;

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (error) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (error) { /* no-op */ }
    }
  };

  function text(key) {
    return (I18N[lang] && I18N[lang][key]) || (I18N.ru && I18N.ru[key]) || "";
  }

  function localized(value) {
    if (!value || typeof value !== "object") return value || "";
    return value[lang] != null ? value[lang] : value.ru || "";
  }

  function serviceById(id) {
    return (CONTENT.services || []).find((service) => service.id === id) || null;
  }

  function categoryById(id) {
    return (CONTENT.categories || []).find((category) => category.id === id) || null;
  }

  function phoneDigits() {
    return String(CONFIG.phoneDigits || "").replace(/\D/g, "");
  }

  function telUrl() {
    return `tel:+${phoneDigits()}`;
  }

  function whatsappUrl(message) {
    const base = `https://wa.me/${phoneDigits()}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  function greeting() {
    return lang === "kz"
      ? "Сәлеметсіз бе! MEDBIKESI сайтынан жазып отырмын."
      : "Здравствуйте! Пишу с сайта MEDBIKESI.";
  }

  function messageForKind(kind) {
    const messages = {
      detox: lang === "kz" ? "Түнгі шақырту және мас күйден шығару қызметін нақтылағым келеді." : "Хочу уточнить ночной вызов и услугу вывода из запоя.",
      address: lang === "kz" ? "Мекенжайым бойынша үйге шығуды нақтылағым келеді." : "Хочу уточнить выезд по моему адресу.",
      course: lang === "kz" ? "Медбикелік дағдылар курсына жазылғым келеді." : "Хочу записаться на курс сестринских навыков.",
      "course-price": lang === "kz" ? "Курстың бағасы мен шарттарын білгім келеді." : "Хочу узнать стоимость и условия курса."
    };
    return `${greeting()}${messages[kind] ? ` ${messages[kind]}` : ""}`;
  }

  function messageForService(service, extra = "") {
    const data = service && service[lang] ? service[lang] : service && service.ru;
    const label = data ? data.name : (lang === "kz" ? "Басқа қызмет" : "Другая услуга");
    const prefix = lang === "kz" ? "Қажет қызмет:" : "Нужна услуга:";
    return `${greeting()} ${prefix} ${label}.${extra ? ` ${extra}` : ""}`;
  }

  function money(value) {
    if (value == null || value === "") return "";
    const normalized = String(value).replace(/\s/g, "");
    if (!/^\d+$/.test(normalized)) return String(value);
    return `${Number(normalized).toLocaleString("ru-RU")} ₸`;
  }

  function numericPrice(value) {
    const parsed = parseInt(String(value || "").replace(/\D/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function russianPlural(count, one, few, many) {
    const value = Math.abs(Number(count)) % 100;
    const last = value % 10;
    if (value > 10 && value < 20) return many;
    if (last === 1) return one;
    if (last > 1 && last < 5) return few;
    return many;
  }

  function configValue(path) {
    return path.split(".").reduce((value, key) => (value == null ? value : value[key]), CONFIG);
  }

  function applyDictionary() {
    document.documentElement.lang = lang === "kz" ? "kk" : "ru";

    $$('[data-i18n]').forEach((element) => {
      const value = text(element.dataset.i18n);
      if (value) element.textContent = value;
    });

    $$('[data-i18n-placeholder]').forEach((element) => {
      const value = text(element.dataset.i18nPlaceholder);
      if (value) element.setAttribute("placeholder", value);
    });

    $$('[data-i18n-aria]').forEach((element) => {
      const value = text(element.dataset.i18nAria);
      if (value) element.setAttribute("aria-label", value);
    });

    $$('[data-config]').forEach((element) => {
      let value = configValue(element.dataset.config);
      value = localized(value);
      if (element.dataset.config.endsWith(".price")) value = money(value);
      if (!value && element.dataset.i18nFallback) value = text(element.dataset.i18nFallback);
      if (!value) value = text("tbd");
      element.textContent = value;
    });

    $$('.language button').forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
    });

    const titleKey = page === "course" ? "metaCourseTitle" : page === "policy" ? "metaPolicyTitle" : "metaHomeTitle";
    const descriptionKey = page === "course" ? "metaCourseDescription" : page === "policy" ? "metaPolicyDescription" : "metaHomeDescription";
    document.title = text(titleKey);
    const description = $('meta[name="description"]');
    if (description) description.setAttribute("content", text(descriptionKey));
    const ogTitle = $('meta[property="og:title"]');
    const ogDescription = $('meta[property="og:description"]');
    const ogLocale = $('meta[property="og:locale"]');
    if (ogTitle) ogTitle.setAttribute("content", text(titleKey));
    if (ogDescription) ogDescription.setAttribute("content", text(descriptionKey));
    if (ogLocale) ogLocale.setAttribute("content", lang === "kz" ? "kk_KZ" : "ru_KZ");
  }

  function fillContactLinks() {
    $$('[data-tel]').forEach((link) => {
      link.setAttribute("href", telUrl());
      if (link.hasAttribute("data-phone")) link.textContent = CONFIG.phone || "";
    });

    $$('[data-wa]').forEach((link) => {
      link.setAttribute("href", whatsappUrl(messageForKind(link.dataset.waKind || "")));
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
  }

  function createIcon(id) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${id}`);
    svg.appendChild(use);
    return svg;
  }

  function renderQuickOptions() {
    const host = $("#quickOptions");
    if (!host) return;
    const ids = ["im", "drip", "dressing", "catheter"];
    if (!ids.includes(quickService) && quickService !== "other") quickService = "im";
    host.replaceChildren();

    ids.forEach((id) => {
      const service = serviceById(id);
      if (!service) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-option";
      button.dataset.quickService = id;
      button.setAttribute("aria-pressed", String(quickService === id));
      button.textContent = service[lang].name;
      button.addEventListener("click", () => {
        quickService = id;
        renderQuickOptions();
        updateQuickLink();
        track("select_quick_service", { service: id });
      });
      host.appendChild(button);
    });

    const other = document.createElement("button");
    other.type = "button";
    other.className = "quick-option";
    other.dataset.quickService = "other";
    other.setAttribute("aria-pressed", String(quickService === "other"));
    other.textContent = text("quickOther");
    other.addEventListener("click", () => {
      quickService = "other";
      renderQuickOptions();
      updateQuickLink();
      track("select_quick_service", { service: "other" });
    });
    host.appendChild(other);
  }

  function updateQuickLink() {
    const link = $("#quickWa");
    if (!link) return;
    const service = quickService === "other" ? null : serviceById(quickService);
    const serviceName = service ? service[lang].name : text("quickOther");
    link.href = whatsappUrl(messageForService(service));
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const label = $("span", link);
    if (label) label.textContent = lang === "kz" ? `${serviceName}: нақтылау` : `Уточнить: ${serviceName}`;
  }

  function renderCategories() {
    const host = $("#categoryTabs");
    if (!host) return;
    host.replaceChildren();
    (CONTENT.categories || []).forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-tab";
      button.dataset.category = category.id;
      button.setAttribute("aria-pressed", String(activeCategory === category.id));
      button.textContent = localized(category);
      button.addEventListener("click", () => {
        activeCategory = category.id;
        renderCategories();
        renderServices();
        track("filter_services", { category: category.id });
      });
      host.appendChild(button);
    });
  }

  function renderServices() {
    const host = $("#serviceList");
    if (!host) return;
    const services = (CONTENT.services || []).filter((service) => activeCategory === "all" || service.category === activeCategory);
    host.replaceChildren();

    services.forEach((service) => {
      const data = service[lang];
      const category = categoryById(service.category);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-row";
      button.dataset.serviceId = service.id;
      if (service.sensitive) button.dataset.sensitive = "true";
      button.setAttribute("aria-label", `${text("serviceOpen")}: ${data.name}`);

      const number = document.createElement("span");
      number.className = "service-row__number";
      number.textContent = service.number;

      const content = document.createElement("span");
      content.className = "service-row__content";
      const categoryLabel = document.createElement("span");
      categoryLabel.className = "service-row__category";
      categoryLabel.textContent = category ? localized(category) : "";
      const title = document.createElement("h3");
      title.textContent = data.name;
      const description = document.createElement("p");
      description.textContent = data.short;
      content.append(categoryLabel, title, description);

      const arrow = document.createElement("span");
      arrow.className = "service-row__arrow";
      arrow.appendChild(createIcon("i-arrow"));
      button.append(number, content, arrow);
      button.addEventListener("click", () => openServiceDrawer(service.id));
      host.appendChild(button);
    });
  }

  function trapFocus(container, close) {
    function keydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
        .filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    container.addEventListener("keydown", keydown);
    return () => container.removeEventListener("keydown", keydown);
  }

  function setPageInert(value) {
    [$("#header"), $("main"), $(".footer"), $("#mobileActions")]
      .filter(Boolean)
      .forEach((element) => { element.inert = value; });
  }

  function setOverlayOpen(overlay, open) {
    overlay.inert = !open;
    overlay.setAttribute("aria-hidden", String(!open));
    setPageInert(open);
  }

  let releaseDrawerFocus = null;
  function updateDrawerContent() {
    const service = serviceById(activeDrawerService);
    if (!service) return;
    const data = service[lang];
    const category = categoryById(service.category);
    $("#drawerCategory").textContent = category ? localized(category) : "";
    $("#drawerTitle").textContent = data.name;
    $("#drawerDescription").textContent = data.full;
    $("#drawerPrep").textContent = data.prep;
    const link = $("#drawerWa");
    link.href = whatsappUrl(messageForService(service));
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  function openServiceDrawer(id) {
    const drawer = $("#serviceDrawer");
    if (!drawer) return;
    activeDrawerService = id;
    drawerReturnFocus = document.activeElement;
    updateDrawerContent();
    drawer.dataset.open = "true";
    setOverlayOpen(drawer, true);
    document.body.classList.add("drawer-open");
    releaseDrawerFocus = trapFocus(drawer, closeServiceDrawer);
    $("#drawerClose").focus();
    track("open_service", { service: id });
  }

  function closeServiceDrawer() {
    const drawer = $("#serviceDrawer");
    if (!drawer || drawer.dataset.open !== "true") return;
    drawer.dataset.open = "false";
    setOverlayOpen(drawer, false);
    document.body.classList.remove("drawer-open");
    if (releaseDrawerFocus) releaseDrawerFocus();
    releaseDrawerFocus = null;
    if (drawerReturnFocus && document.contains(drawerReturnFocus)) drawerReturnFocus.focus();
  }

  function renderProcess() {
    const host = $("#processList");
    if (!host) return;
    host.replaceChildren();
    (CONTENT.process || []).forEach((step, index) => {
      const data = step[lang];
      const item = document.createElement("li");
      item.className = "process-step";
      const dot = document.createElement("span");
      dot.className = "process-step__dot";
      dot.setAttribute("aria-hidden", "true");
      dot.textContent = String(index + 1).padStart(2, "0");
      const title = document.createElement("h3");
      title.textContent = data.title;
      const description = document.createElement("p");
      description.textContent = data.text;
      item.append(dot, title, description);
      host.appendChild(item);
    });
  }

  function renderTrust() {
    const host = $("#trustLedger");
    if (!host) return;
    host.replaceChildren();
    (CONTENT.trust || []).forEach((fact) => {
      const item = document.createElement("div");
      const value = document.createElement("dt");
      const label = document.createElement("dd");
      value.textContent = fact.value;
      label.textContent = localized(fact);
      item.append(value, label);
      host.appendChild(item);
    });
  }

  function populateServiceSelect(select) {
    if (!select) return;
    const previous = select.value;
    select.replaceChildren();
    (CONTENT.services || []).forEach((service) => {
      const option = document.createElement("option");
      option.value = service.id;
      option.textContent = service[lang].name;
      select.appendChild(option);
    });
    if (previous && serviceById(previous)) select.value = previous;
  }

  function updatePriceComposer() {
    const select = $("#priceService");
    if (!select) return;
    const service = serviceById(select.value) || serviceById("im");
    const base = numericPrice(CONFIG.prices && CONFIG.prices[service.id]);
    const trip = numericPrice(CONFIG.prices && CONFIG.prices.trip);
    const night = $("#nightVisit") && $("#nightVisit").checked ? numericPrice(CONFIG.prices && CONFIG.prices.night) : 0;
    const total = base ? (base + trip + night) * visits : 0;
    $("#visitsCount").textContent = visits;
    $("#priceAmount").textContent = total ? money(total) : text("priceUnknown");
    $("#priceNote").textContent = total
      ? (lang === "kz" ? "Шамамен есеп. Нақты сома үйге шыққанға дейін расталады." : "Ориентировочный расчёт. Точная сумма подтверждается до выезда.")
      : text("priceNote");

    const visitText = lang === "kz"
      ? `${visits} рет келу`
      : `${visits} ${russianPlural(visits, "визит", "визита", "визитов")}`;
    const nightText = $("#nightVisit") && $("#nightVisit").checked
      ? (lang === "kz" ? "түнгі шығу" : "ночной выезд")
      : "";
    const extra = [visitText, nightText, total ? `${lang === "kz" ? "Сайттағы есеп" : "Расчёт на сайте"}: ${money(total)}` : ""].filter(Boolean).join(", ");
    const link = $("#priceWa");
    link.href = whatsappUrl(messageForService(service, extra));
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  function renderCourseQuick() {
    const host = $("#courseQuickOptions");
    const link = $("#courseQuickWa");
    if (!host || !link) return;
    const options = [
      { id: "start", key: "courseQuickQ1" },
      { id: "price", key: "courseQuickQ2" },
      { id: "fit", key: "courseQuickQ3" }
    ];
    host.replaceChildren();
    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "course-question";
      button.setAttribute("aria-pressed", String(courseQuestion === option.id));
      button.textContent = text(option.key);
      button.addEventListener("click", () => {
        courseQuestion = option.id;
        renderCourseQuick();
        track("select_course_question", { question: option.id });
      });
      host.appendChild(button);
    });
    const selected = options.find((option) => option.id === courseQuestion) || options[0];
    const question = text(selected.key);
    const prefix = lang === "kz" ? "Сұрағым:" : "Мой вопрос:";
    link.href = whatsappUrl(`${messageForKind("course")} ${prefix} ${question}`);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  function renderCourseAudience() {
    const host = $("#courseAudience");
    if (!host) return;
    host.replaceChildren();
    ((CONTENT.course && CONTENT.course.audience) || []).forEach((audience, index) => {
      const data = audience[lang];
      const item = document.createElement("article");
      item.className = "audience-item";
      const number = document.createElement("span");
      number.className = "audience-item__number";
      number.textContent = String(index + 1).padStart(2, "0");
      const title = document.createElement("h3");
      title.textContent = data.title;
      const description = document.createElement("p");
      description.textContent = data.text;
      item.append(number, title, description);
      host.appendChild(item);
    });
  }

  function renderProgram() {
    const host = $("#courseProgram");
    if (!host) return;
    host.replaceChildren();
    ((CONTENT.course && CONTENT.course.modules) || []).forEach((module, index) => {
      const data = module[lang];
      const item = document.createElement("div");
      item.className = "program-module";
      const button = document.createElement("button");
      const buttonId = `program-button-${index}`;
      const panelId = `program-panel-${index}`;
      const initiallyOpen = index === 0;
      button.type = "button";
      button.id = buttonId;
      button.className = "program-module__button";
      button.setAttribute("aria-expanded", String(initiallyOpen));
      button.setAttribute("aria-controls", panelId);

      const number = document.createElement("span");
      number.className = "program-module__number";
      number.textContent = module.number;
      const copy = document.createElement("span");
      const title = document.createElement("span");
      title.className = "program-module__title";
      title.textContent = data.title;
      const hint = document.createElement("span");
      hint.className = "program-module__hint";
      hint.textContent = data.hint;
      copy.append(title, hint);
      const icon = document.createElement("span");
      icon.className = "program-module__icon";
      icon.setAttribute("aria-hidden", "true");
      button.append(number, copy, icon);

      const panel = document.createElement("div");
      panel.id = panelId;
      panel.className = "program-module__panel";
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", buttonId);
      panel.setAttribute("aria-hidden", String(!initiallyOpen));
      const panelInner = document.createElement("div");
      const list = document.createElement("ul");
      data.items.forEach((skill) => {
        const listItem = document.createElement("li");
        listItem.textContent = skill;
        list.appendChild(listItem);
      });
      panelInner.appendChild(list);
      panel.appendChild(panelInner);
      button.addEventListener("click", () => {
        const willOpen = button.getAttribute("aria-expanded") !== "true";
        $$('.program-module__button', host).forEach((other) => {
          const expanded = other === button && willOpen;
          other.setAttribute("aria-expanded", String(expanded));
          const controlledPanel = document.getElementById(other.getAttribute("aria-controls"));
          if (controlledPanel) controlledPanel.setAttribute("aria-hidden", String(!expanded));
        });
        if (willOpen) track("open_course_module", { module: module.number });
      });
      item.append(button, panel);
      host.appendChild(item);
    });
  }

  function renderAccordion(hostSelector, items) {
    const host = $(hostSelector);
    if (!host) return;
    host.replaceChildren();
    (items || []).forEach((item, index) => {
      const data = item[lang];
      const wrapper = document.createElement("div");
      wrapper.className = "accordion__item";
      const button = document.createElement("button");
      const buttonId = `${host.id}-button-${index}`;
      const panelId = `${host.id}-panel-${index}`;
      button.type = "button";
      button.id = buttonId;
      button.className = "accordion__button";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", panelId);
      const label = document.createElement("span");
      label.textContent = data.q;
      const icon = document.createElement("span");
      icon.className = "accordion__icon";
      icon.setAttribute("aria-hidden", "true");
      button.append(label, icon);

      const panel = document.createElement("div");
      panel.id = panelId;
      panel.className = "accordion__panel";
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", buttonId);
      panel.setAttribute("aria-hidden", "true");
      const inner = document.createElement("div");
      const answer = document.createElement("p");
      answer.textContent = data.a;
      inner.appendChild(answer);
      panel.appendChild(inner);

      button.addEventListener("click", () => {
        const willOpen = button.getAttribute("aria-expanded") !== "true";
        $$('.accordion__button', host).forEach((other) => {
          const expanded = other === button && willOpen;
          other.setAttribute("aria-expanded", String(expanded));
          const controlledPanel = document.getElementById(other.getAttribute("aria-controls"));
          if (controlledPanel) controlledPanel.setAttribute("aria-hidden", String(!expanded));
        });
        if (willOpen) track("open_faq", { page, index: index + 1 });
      });
      wrapper.append(button, panel);
      host.appendChild(wrapper);
    });
  }

  function renderTestimonials() {
    const section = $("#testimonials");
    const host = $("#testimonialList");
    if (!section || !host) return;
    const items = CONTENT.testimonials || [];
    section.hidden = !items.length;
    if (!items.length) return;
    host.className = "testimonial-list";
    host.replaceChildren();
    items.forEach((review) => {
      const figure = document.createElement("figure");
      figure.className = "testimonial";
      const quote = document.createElement("blockquote");
      quote.textContent = localized(review);
      const caption = document.createElement("figcaption");
      caption.textContent = [review.name, review.area, review.date].filter(Boolean).join(" · ");
      figure.append(quote, caption);
      host.appendChild(figure);
    });
  }

  function renderDynamicContent() {
    renderQuickOptions();
    updateQuickLink();
    renderCategories();
    renderServices();
    renderProcess();
    renderTrust();
    populateServiceSelect($("#priceService"));
    populateServiceSelect($("#fService"));
    updatePriceComposer();
    renderCourseQuick();
    renderCourseAudience();
    renderProgram();
    renderAccordion("#homeFaq", CONTENT.homeFaq);
    renderAccordion("#courseFaqList", CONTENT.course && CONTENT.course.faq);
    renderTestimonials();
    if (activeDrawerService) updateDrawerContent();
  }

  function applyLanguage(nextLang, preserveScroll = true) {
    const y = window.scrollY;
    lang = nextLang === "kz" ? "kz" : "ru";
    storage.set("medbikesi-language", lang);
    applyDictionary();
    fillContactLinks();
    renderDynamicContent();
    setFormButtonMode();
    if (preserveScroll) {
      requestAnimationFrame(() => {
        const previousBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, y);
        document.documentElement.style.scrollBehavior = previousBehavior;
      });
    }
  }

  function setupLanguage() {
    const saved = storage.get("medbikesi-language");
    const fallback = document.documentElement.dataset.defaultLang || "ru";
    lang = saved === "ru" || saved === "kz" ? saved : fallback;
    $$('.language button').forEach((button) => {
      button.addEventListener("click", () => applyLanguage(button.dataset.lang));
    });
  }

  function setupDrawer() {
    const drawer = $("#serviceDrawer");
    if (!drawer) return;
    $("#drawerClose").addEventListener("click", closeServiceDrawer);
    drawer.addEventListener("click", (event) => {
      if (event.target === drawer) closeServiceDrawer();
    });
  }

  function setupMobileMenu() {
    const menu = $("#mobileMenu");
    const openButton = $("#menuOpen");
    const closeButton = $("#menuClose");
    if (!menu || !openButton || !closeButton) return;
    let returnFocus = null;
    let releaseFocus = null;

    function closeMenu() {
      if (menu.dataset.open !== "true") return;
      menu.dataset.open = "false";
      setOverlayOpen(menu, false);
      openButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      if (releaseFocus) releaseFocus();
      releaseFocus = null;
      if (returnFocus) returnFocus.focus();
    }

    function openMenu() {
      returnFocus = document.activeElement;
      menu.dataset.open = "true";
      setOverlayOpen(menu, true);
      openButton.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
      releaseFocus = trapFocus(menu, closeMenu);
      closeButton.focus();
    }

    openButton.addEventListener("click", openMenu);
    closeButton.addEventListener("click", closeMenu);
    menu.addEventListener("click", (event) => {
      if (event.target === menu) closeMenu();
    });
    $$('a', menu).forEach((link) => link.addEventListener("click", closeMenu));
  }

  function setupPriceComposer() {
    const select = $("#priceService");
    if (!select) return;
    select.addEventListener("change", () => {
      updatePriceComposer();
      track("select_price_service", { service: select.value });
    });
    $("#visitsMinus").addEventListener("click", () => {
      visits = Math.max(1, visits - 1);
      updatePriceComposer();
    });
    $("#visitsPlus").addEventListener("click", () => {
      visits = Math.min(30, visits + 1);
      updatePriceComposer();
    });
    $("#nightVisit").addEventListener("change", updatePriceComposer);
  }

  function maskPhone(input) {
    function format() {
      let digits = input.value.replace(/\D/g, "");
      if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
      if (!digits.startsWith("7")) digits = `7${digits}`;
      digits = digits.slice(0, 11);
      let result = "+7";
      if (digits.length > 1) result += ` (${digits.slice(1, 4)}`;
      if (digits.length >= 4) result += ")";
      if (digits.length > 4) result += ` ${digits.slice(4, 7)}`;
      if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
      if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
      input.value = result;
    }
    input.addEventListener("input", format);
    input.addEventListener("focus", () => { if (!input.value) input.value = "+7 ("; });
    input.addEventListener("blur", () => { if (input.value.replace(/\D/g, "").length < 2) input.value = ""; });
  }

  function setFormButtonMode() {
    const button = $("#formSubmit span");
    if (!button) return;
    button.textContent = CONFIG.formKey ? text("sendForm") : text("continueWa");
  }

  function setupForm() {
    const form = $("#leadForm");
    if (!form) return;
    const phone = $("#fPhone");
    maskPhone(phone);

    function setError(id, message) {
      const field = $(`#${id}`);
      const error = $(`[data-error="${id}"]`);
      if (error) error.textContent = message;
      if (field) field.setAttribute("aria-invalid", "true");
    }

    function clearError(id) {
      const field = $(`#${id}`);
      const error = $(`[data-error="${id}"]`);
      if (error) error.textContent = "";
      if (field) field.removeAttribute("aria-invalid");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = $("#fName");
      const consent = $("#fConsent");
      const message = $("#fMessage");
      const honeypot = $('[name="website"]', form);
      const button = $("#formSubmit");
      const status = $("#formStatus");
      let firstInvalid = null;

      if (!name.value.trim()) {
        setError("fName", text("errName"));
        firstInvalid = firstInvalid || name;
      } else clearError("fName");

      if (phone.value.replace(/\D/g, "").length !== 11) {
        setError("fPhone", text("errPhone"));
        firstInvalid = firstInvalid || phone;
      } else clearError("fPhone");

      if (!consent.checked) {
        setError("fConsent", text("errConsent"));
        firstInvalid = firstInvalid || consent;
      } else clearError("fConsent");

      if (firstInvalid) {
        firstInvalid.focus();
        track("form_validation_error", { page });
        return;
      }
      if (honeypot && honeypot.value) return;

      const selectedService = $("#fService");
      const topic = form.dataset.topic === "course"
        ? (lang === "kz" ? "Медбикелік дағдылар курсы" : "Курс сестринских навыков")
        : (selectedService && selectedService.selectedOptions[0] ? selectedService.selectedOptions[0].textContent : "");
      const lines = [
        greeting(),
        `${lang === "kz" ? "Аты" : "Имя"}: ${name.value.trim()}`,
        `${lang === "kz" ? "Телефон" : "Телефон"}: ${phone.value}`,
        `${lang === "kz" ? "Тақырып" : "Тема"}: ${topic}`
      ];
      if (message.value.trim()) lines.push(`${lang === "kz" ? "Түсініктеме" : "Комментарий"}: ${message.value.trim()}`);
      const preparedMessage = lines.join("\n");

      if (!CONFIG.formKey) {
        window.open(whatsappUrl(preparedMessage), "_blank", "noopener,noreferrer");
        status.textContent = text("formWaOpened");
        track("lead_form_whatsapp", { page, topic });
        return;
      }

      button.disabled = true;
      $("span", button).textContent = text("sending");
      status.textContent = "";
      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: CONFIG.formKey,
            subject: page === "course" ? "MEDBIKESI — заявка на курс" : "MEDBIKESI — заявка на выезд",
            from_name: "MEDBIKESI website",
            name: name.value.trim(),
            phone: phone.value,
            topic,
            message: message.value.trim()
          })
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error("Form submission failed");
        form.hidden = true;
        $("#formSuccess").hidden = false;
        track("lead_form_success", { page, topic });
      } catch (error) {
        status.textContent = text("formError");
        button.disabled = false;
        setFormButtonMode();
        track("lead_form_error", { page });
      }
    });
  }

  function setupReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => { element.dataset.visible = "true"; });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    elements.forEach((element) => observer.observe(element));
  }

  function setupScrollUI() {
    const header = $("#header");
    const progress = $("#scrollProgress");
    const mobileActions = $("#mobileActions");
    const hero = $(".hero");
    const footer = $(".footer");

    function update() {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.dataset.stuck = String(y > 8);
      if (progress) {
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = `${distance > 0 ? Math.min(100, (y / distance) * 100) : 0}%`;
      }
      if (mobileActions && hero) {
        const afterHero = y > hero.offsetTop + hero.offsetHeight * 0.62;
        const beforeFooter = !footer || y + window.innerHeight < footer.offsetTop + 100;
        mobileActions.dataset.visible = String(afterHero && beforeFooter);
      }
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  function setupSectionSpy() {
    if (!("IntersectionObserver" in window)) return;
    const links = $$('.desktop-nav a[href^="#"]');
    if (!links.length) return;
    const map = new Map();
    links.forEach((link) => {
      const target = $(link.getAttribute("href"));
      if (target) map.set(target, link);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.removeAttribute("aria-current"));
        const active = map.get(entry.target);
        if (active) active.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-18% 0px -70% 0px", threshold: 0 });
    map.forEach((link, section) => observer.observe(section));
  }

  function setupAnalytics() {
    const analytics = CONFIG.analytics || {};
    const loaderId = analytics.ga4MeasurementId || analytics.googleAdsId;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!loaderId) return;
    window.gtag("consent", "default", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    if (analytics.ga4MeasurementId) window.gtag("config", analytics.ga4MeasurementId, { anonymize_ip: true });
    if (analytics.googleAdsId) window.gtag("config", analytics.googleAdsId);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(loaderId)}`;
    document.head.appendChild(script);
  }

  function track(name, params = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  }

  function setupClickTracking() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-track]");
      if (!target) return;
      const eventName = target.dataset.track;
      track(eventName, { page });
      const analytics = CONFIG.analytics || {};
      const isWhatsApp = eventName.includes("wa_");
      const isCall = eventName.includes("call_");
      const label = isWhatsApp ? analytics.whatsappConversionLabel : isCall ? analytics.callConversionLabel : "";
      if (analytics.googleAdsId && label && typeof window.gtag === "function") {
        window.gtag("event", "conversion", { send_to: `${analytics.googleAdsId}/${label}` });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupLanguage();
    setupAnalytics();
    setupClickTracking();
    setupMobileMenu();
    setupDrawer();
    setupPriceComposer();
    setupForm();
    applyLanguage(lang, false);
    setupReveal();
    setupScrollUI();
    setupSectionSpy();
  });
})();
