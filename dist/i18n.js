/* Shared translations for static copy and stateful interactions. */
(() => {
  'use strict';
  const languages = ['it', 'es', 'fr', 'de', 'en'];
  let language = 'it';
  const requested = new URL(location.href).searchParams.get('lang');
  try { language = localStorage.getItem('claxon-language') || 'it'; } catch {}
  if (languages.includes(requested)) language = requested;
  if (!languages.includes(language)) language = 'it';
  const missing = new Set();
  function t(source, values = {}) {
    const entry = window.CLAXON_TRANSLATIONS[source];
    if (!entry && /[a-zA-ZÀ-ž]/.test(source)) missing.add(source);
    const result = language === 'it' ? source : entry?.[languages.indexOf(language) - 1] ?? source;
    return result.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  }
  function localise(object) {
    const fields = ['name','eyebrow','description','label','kicker','title','cta','word','alt','caption','copy'];
    for (const [key, source] of Object.entries(object)) {
      if (typeof source === 'string' && fields.includes(key)) {
        Object.defineProperty(object, key, {enumerable:true, configurable:true, get:() => t(source)});
      } else if (Array.isArray(source) && ['tags','tips'].includes(key)) {
        Object.defineProperty(object, key, {enumerable:true, configurable:true, get:() => source.map(value => t(value))});
      } else if (source && typeof source === 'object') localise(source);
    }
    return object;
  }
  window.ClaxonI18n = {t, localise, get language() { return language; }, languages, missing};

  // Capture source copy once. Dynamic renderers call t() and keep their own state.
  const rich = [...document.querySelectorAll('[data-i18n-html]')].map(node => ({node, source:node.innerHTML}));
  const texts = [], attributes = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement || node.parentElement.closest('script, style, [data-no-i18n], [data-i18n-html]')) continue;
    const source = node.textContent.trim();
    if (/[a-zA-ZÀ-ž]/.test(source)) texts.push({node, source, before:node.textContent.match(/^\s*/)[0], after:node.textContent.match(/\s*$/)[0]});
  }
  document.querySelectorAll('[aria-label], [alt], [placeholder], [title], meta[name="description"]').forEach(node => {
    if (node.closest('[data-no-i18n]')) return;
    for (const name of ['aria-label', 'alt', 'placeholder', 'title', 'content']) {
      if (name === 'content' && node.tagName !== 'META') continue;
      const source = node.getAttribute(name);
      if (source && /[a-zA-ZÀ-ž]/.test(source)) attributes.push({node, name, source});
    }
  });
  const picker = document.querySelector('.language-picker');
  const trigger = picker.querySelector('.language-trigger');
  const menu = picker.querySelector('.language-menu');
  function closePicker() { trigger.setAttribute('aria-expanded', 'false'); menu.hidden = true; }
  function paint() {
    document.documentElement.lang = language;
    rich.forEach(({node, source}) => { node.innerHTML = t(source); });
    texts.forEach(({node, source, before, after}) => { if (node.isConnected) node.textContent = before + t(source) + after; });
    attributes.forEach(({node, name, source}) => { if (node.isConnected) node.setAttribute(name, t(source)); });
    document.querySelector('.google-rating>strong').firstChild.textContent=new Intl.NumberFormat(language,{maximumFractionDigits:1}).format(4.5);
    trigger.querySelector('.language-code').textContent = language.toUpperCase();
    trigger.setAttribute('aria-label', `${t('Scegli lingua')}: ${picker.querySelector(`[data-language="${language}"] .language-name`).textContent}`);
    menu.setAttribute('aria-label', t('Scegli lingua'));
    picker.querySelectorAll('[data-language]').forEach(button => {
      const selected = button.dataset.language === language;
      button.setAttribute('aria-checked', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }
  function setLanguage(next) {
    if (!languages.includes(next)) return;
    language = next;
    try { localStorage.setItem('claxon-language', language); } catch {}
    const url = new URL(location.href); url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
    closePicker(); paint();
    document.dispatchEvent(new CustomEvent('claxon:languagechange', {detail:{language}}));
  }
  window.ClaxonI18n.setLanguage = setLanguage;
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(open)); menu.hidden = !open;
    if (open) menu.querySelector('[aria-checked="true"]').focus();
  });
  picker.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => { setLanguage(button.dataset.language); trigger.focus(); }));
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closePicker(); trigger.focus(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); menu.hidden = false; trigger.setAttribute('aria-expanded', 'true');
    const options = [...menu.querySelectorAll('[data-language]')];
    const current = options.indexOf(document.activeElement);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (event.key === 'ArrowUp' ? options.length - 1 : 1)) % options.length;
    options[index].focus();
  });
  document.addEventListener('click', event => { if (!picker.contains(event.target)) closePicker(); });
  picker.addEventListener('focusout', event => { if (!picker.contains(event.relatedTarget)) closePicker(); });
  paint();
})();
