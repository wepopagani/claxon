/* A single shared catalogue powers the pizza explorer, menu and saved ideas. */
(() => {
  'use strict';
  const data = window.CLAXON_DATA;
  const one = (selector, root = document) => root.querySelector(selector);
  const many = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const normalise = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const decoded = new Map();
  function prepareImage(url) {
    if (!decoded.has(url)) decoded.set(url, new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img);
      img.onerror = () => { decoded.delete(url); reject(new Error('Image unavailable')); }; img.src = url;
    }));
    return decoded.get(url);
  }

  // The scroll scene also has complete button and range controls.
  const journey = one('.journey'), screen = one('.journey-screen');
  const journeyImages = many('[data-journey-image]'), backdrops = many('.journey-backdrops i');
  const journeyStates = [
    {label:'01 / COLAZIONE', word:'BUONGIORNO.', copy:'Prima il caffè.<br>Il resto può aspettare.', photo:'colazione', caption:'Il buongiorno, quello vero.'},
    {label:'02 / PRANZO', word:'BUON APPETITO.', copy:'La pausa è servita.<br>Falla durare il giusto.', photo:'risotto', caption:'Il gusto della pausa pranzo.'},
    {label:'03 / PIZZA', word:'ANCORA UNA FETTA.', copy:'C’è sempre spazio<br>per un’altra fetta.', photo:'preparazione', caption:'Le mani, prima del primo morso.'},
    {label:'04 / APERITIVO', word:'CIN CIN.', copy:'Resti per un giro?<br>Il bello comincia qui.', photo:'brindisi', caption:'Ai momenti in compagnia.'}
  ];
  ClaxonI18n.localise(journeyStates);
  let journeyProgress = 0, journeyPhase = -1, scrollFrame = 0;
  function paintJourney(progress) {
    journeyProgress = clamp(progress);
    const scaled = journeyProgress * 3, phase = Math.round(scaled);
    journeyImages.forEach((image, index) => {
      const distance = scaled - index, visible = clamp(1 - Math.abs(distance) * 1.2);
      image.style.opacity = visible;
      image.style.transform = reduceMotion.matches ? 'none' : `translate(${-distance * 110}px,${Math.abs(distance) * 32}px) rotate(${-distance * 17}deg) scale(${1 - Math.min(1, Math.abs(distance)) * .16})`;
    });
    backdrops.forEach((layer, index) => { layer.style.opacity = index === 0 ? 1 : clamp(scaled - index + 1); });
    one('.journey-range').value = Math.round(journeyProgress * 1000);
    if (phase !== journeyPhase) {
      journeyPhase = phase; screen.dataset.phase=String(phase); const state = journeyStates[phase];
      one('.journey-word').textContent = state.word;
      one('.journey-label').textContent = state.label;
      one('.journey-caption p').innerHTML = state.copy;
      one('.journey-memory img').src = `assets/photos/${state.photo}.webp`;
      one('.journey-memory img').alt = data.gallery.find(photo => photo.id === state.photo)?.caption || state.caption;
      one('.journey-memory figcaption').textContent = state.caption;
      many('[data-journey-stop]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.journeyStop) === phase)));
    }
  }
  function journeyPosition() {
    const top = journey.getBoundingClientRect().top + window.scrollY;
    const header = one('.header').getBoundingClientRect().height;
    return {start:top - header, travel:Math.max(1, journey.offsetHeight - screen.offsetHeight)};
  }
  function followScroll() {
    scrollFrame = 0;
    if (reduceMotion.matches) return;
    const rect = journey.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const {start, travel} = journeyPosition(); paintJourney((window.scrollY - start) / travel);
  }
  function scrubJourney(progress, smooth = false) {
    const p = clamp(progress); paintJourney(p);
    if (!reduceMotion.matches) {
      const {start, travel} = journeyPosition();
      window.scrollTo({top:start + p * travel, behavior:smooth ? 'smooth' : 'instant'});
    }
  }
  many('[data-journey-stop]').forEach(button => button.addEventListener('click', () => scrubJourney(Number(button.dataset.journeyStop) / 3, true)));
  one('.journey-range').addEventListener('input', event => scrubJourney(Number(event.target.value) / 1000));
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(followScroll); }, {passive:true});
  window.addEventListener('resize', () => { if (!reduceMotion.matches) followScroll(); });
  reduceMotion.addEventListener('change', () => { paintJourney(journeyProgress); if (!reduceMotion.matches) followScroll(); });
  paintJourney(0); followScroll();

  // Recipe state is independent of the slice, ingredient view and rotation.
  const recipes = {
    margherita:{file:'margherita',dish:'pizza-classica',name:'Margherita',description:'Pomodoro, mozzarella e basilico: il piacere delle cose semplici.',ingredients:['pomodoro','mozzarella','basilico']},
    crudo:{file:'pizza',dish:'pizza-crudo',name:'Crudo e pomodorini',description:'Il gusto del crudo, la freschezza dei pomodorini e un tocco di basilico.',ingredients:['crudo','pomodoro','mozzarella','basilico']},
    salame:{file:'salame-funghi',dish:'pizza-salame',name:'Salame e funghi',description:'Il carattere del salame incontra il gusto dei funghi.',ingredients:['salame','funghi','pomodoro','mozzarella']}
  };
  const ingredients = {
    pomodoro:{name:'Pomodoro',description:'Il rosso che mette tutti d’accordo: nella composizione illustrativa accompagna la mozzarella.'},
    basilico:{name:'Basilico',description:'Un tocco verde, fresco e profumato nella composizione illustrativa.'},
    mozzarella:{name:'Mozzarella',description:'La parte morbida e filante della composizione. Chiedi al locale il formaggio utilizzato.'},
    crudo:{name:'Crudo',description:'Fette sottili, pieghe leggere e un gusto deciso nella composizione illustrativa.'},
    salame:{name:'Salame',description:'Il carattere di questa composizione. Chiedi al locale varietà e grado di piccantezza.'},
    funghi:{name:'Funghi',description:'Un abbinamento da esplorare con il salame. Varietà e ricetta da confermare al locale.'}
  };
  ClaxonI18n.localise(recipes); ClaxonI18n.localise(ingredients);
  let activeIngredient = null;
  let activeRecipe = 'crudo', recipeRequest = 0, pizzaRotation = -12;
  const pizzaScene = one('.pizza-lab-scene'), rotation = one('.rotation-control input');
  function rotatePizza(value) { pizzaRotation = clamp(value, -180, 180); rotation.value = pizzaRotation; one('.lab-pizza').style.setProperty('--pizza-turn', `${pizzaRotation}deg`); }
  function focusIngredient(key) {
    activeIngredient = key;
    many('.recipe-ingredients button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.ingredient === key)));
    one('.ingredient-insight').textContent = ingredients[key].description;
    many('.ingredient-orbit img').forEach(image => { image.style.filter = image.dataset.ingredient === key ? 'drop-shadow(0 0 16px #efa47499)' : ''; });
  }
  function paintRecipe() {
    const recipe = recipes[activeRecipe];
    one('.recipe-description h3').textContent = recipe.name; one('.recipe-description>p').textContent = recipe.description;
    many('[data-recipe]').forEach(button => { const selected = button.dataset.recipe === activeRecipe; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
    one('#recipe-panel').setAttribute('aria-labelledby', `recipe-${activeRecipe}`);
    one('.lab-base').alt = t('Pizza illustrativa: {name}',{name:recipe.name});
    const chips = one('.recipe-ingredients'), orbit = one('.ingredient-orbit'); chips.replaceChildren(); orbit.replaceChildren();
    const radiusX = innerWidth <= 760 ? 128 : 200, radiusY = innerWidth <= 760 ? 125 : 185;
    recipe.ingredients.forEach((key, index) => {
      const info = ingredients[key], angle = (index / recipe.ingredients.length) * Math.PI * 2 - Math.PI * .8;
      const button = document.createElement('button'); button.textContent = info.name; button.dataset.ingredient = key; button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => { pizzaScene.classList.add('lab-exploded'); one('.lab-explode').setAttribute('aria-pressed', 'true'); focusIngredient(key); }); chips.append(button);
      const image = document.createElement('img'); image.src = `assets/ingrediente-${key}.webp`; image.alt = ''; image.dataset.ingredient = key; image.width = 360; image.height = 360;
      image.style.setProperty('--ix', `${Math.cos(angle) * radiusX}px`); image.style.setProperty('--iy', `${Math.sin(angle) * radiusY}px`); image.style.setProperty('--ir', `${index % 2 ? 13 : -12}deg`); orbit.append(image);
    });
    one('.ingredient-insight').textContent = t('Tocca un ingrediente per guardarlo da vicino.');
    updateRecipeSave();
  }
  async function changeRecipe(key) {
    if (!recipes[key]) return;
    const request = ++recipeRequest;
    if (key === activeRecipe) { pizzaScene.classList.remove('recipe-changing'); return; }
    try { await prepareImage(`assets/${recipes[key].file}.webp`); } catch { toast(t('Questa immagine non è disponibile. Riprova.')); return; }
    if (request !== recipeRequest) return;
    pizzaScene.classList.add('recipe-changing'); await pause(180); if (request !== recipeRequest) return;
    activeIngredient=null; activeRecipe = key; many('.lab-pizza img').forEach(image => { image.src = `assets/${recipes[key].file}.webp`; });
    paintRecipe(); pizzaScene.classList.remove('recipe-changing');
  }
  many('[data-recipe]').forEach(button => button.addEventListener('click', () => changeRecipe(button.dataset.recipe)));
  tabKeys(one('.recipe-tabs'), changeRecipe, 'recipe');
  one('.lab-explode').addEventListener('click', event => { const expanded = pizzaScene.classList.toggle('lab-exploded'); event.currentTarget.setAttribute('aria-pressed', String(expanded)); });
  one('.lab-take-slice').addEventListener('click', event => { const open = pizzaScene.classList.toggle('lab-open'); event.currentTarget.setAttribute('aria-pressed', String(open)); event.currentTarget.textContent = t(open ? '↙ Rimetti la fetta' : '↗ Prendi una fetta'); });
  rotation.addEventListener('input', () => rotatePizza(Number(rotation.value)));
  let drag = null;
  one('.lab-rotator').addEventListener('pointerdown', event => { if (event.button !== 0) return; drag = {id:event.pointerId, x:event.clientX, rotation:pizzaRotation}; event.currentTarget.setPointerCapture(event.pointerId); });
  one('.lab-rotator').addEventListener('pointermove', event => { if (drag?.id === event.pointerId) rotatePizza(drag.rotation + (event.clientX - drag.x) * .5); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => one('.lab-rotator').addEventListener(name, () => { drag = null; }));
  function updateRecipeSave() { const selected = saved.has(recipes[activeRecipe].dish); one('.recipe-save').setAttribute('aria-pressed', String(selected)); one('.recipe-save').innerHTML = `${t(selected?'Nelle mie idee':'Mi ispira')} <span>${selected?'✓':'+'}</span>`; }
  one('.recipe-save').addEventListener('click', () => { toggleSaved(recipes[activeRecipe].dish); updateRecipeSave(); });
  paintRecipe(); rotatePizza(-12);

  function arrangeOrbit() {
    const images = many('.ingredient-orbit img'), radiusX = innerWidth <= 760 ? 128 : 200, radiusY = innerWidth <= 760 ? 125 : 185;
    images.forEach((image,index) => { const angle=(index/images.length)*Math.PI*2-Math.PI*.8; image.style.setProperty('--ix', `${Math.cos(angle)*radiusX}px`); image.style.setProperty('--iy', `${Math.sin(angle)*radiusY}px`); });
  }
  window.addEventListener('resize', arrangeOrbit);
  one('.wishlist-dismiss').addEventListener('click',()=>{ one('.wishlist-bar').hidden=true; });


  // Search and details use the same items as the saved-ideas dialog.
  let query = '', onlySaved = false, detailDish = null, detailRequest = 0;
  const search = one('.menu-search input');
  function resetSearch() { query = ''; onlySaved = false; search.value = ''; one('.saved-filter').setAttribute('aria-pressed', 'false'); renderMenu(); }
  function updateDetailSave() {
    if (!detailDish) return;
    const selected = saved.has(detailDish.id); one('.dish-save').setAttribute('aria-pressed', String(selected));
    one('.dish-save').innerHTML = `${t(selected?'Salvato':'Mi ispira')} <span>${selected?'✓':'+'}</span>`;
  }
  async function openDish(dish) {
    const request = ++detailRequest;
    try { await prepareImage(dish.photo); } catch { toast(t('La foto non è disponibile. Riprova.')); return; }
    if (request !== detailRequest) return;
    detailDish=dish; paintDish();
    updateDetailSave(); openDialog('#dish-dialog');
  }
  function paintDish() {
    const dish=detailDish, photo = one('.dish-photo'); photo.src = dish.photo; photo.alt = dish.name; photo.classList.toggle('is-illustrative', dish.illustrative);
    one('.dish-image-note').textContent = dish.illustrative ? t('Composizione illustrativa') : t('Fotografia dal profilo Instagram del Claxon');
    one('.dish-category').textContent = dish.eyebrow; one('#dish-title').textContent = dish.name; one('.dish-description').textContent = dish.description;
    const tags = one('.dish-tags'); tags.replaceChildren(); dish.tags.forEach(tag => { const span = document.createElement('span'); span.textContent = tag; tags.append(span); });
    one('.dish-ask').href = whatsapp(t('Ciao Claxon! Mi interessa {name}. Mi dite la proposta disponibile e il prezzo aggiornato? Grazie!',{name:dish.name}));
    one('.dish-allergens').href = whatsapp(t('Ciao Claxon! Vorrei informazioni sugli ingredienti e sugli allergeni di {name}. Potete aiutarmi prima di ordinare? Grazie!',{name:dish.name}));
    updateDetailSave();
  }
  one('#dish-dialog').addEventListener('close',()=>{ detailRequest++; });
  one('.dish-save').addEventListener('click', () => { if (detailDish) { toggleSaved(detailDish.id); updateDetailSave(); } });
  renderMenu = function enhancedMenu() {
    const list = one('.menu-list'); list.replaceChildren();
    one('.menu-art-word').textContent=t({coffee:'BUONGIORNO',lunch:'BUON APPETITO',pizza:'PIZZA!',aperitivo:'CIN CIN!'}[currentCategory]);
    const term = normalise(query.trim());
    const source = term || onlySaved ? allDishes : dishes[currentCategory];
    const results = source.filter(dish => (!onlySaved || saved.has(dish.id)) && (!term || normalise(`${dish.name} ${dish.eyebrow} ${dish.description} ${dish.tags.join(' ')}`).includes(term)));
    one('.clear-search').hidden = !query;
    one('.menu-result-count').textContent = t(results.length===1?'{count} proposta':'{count} proposte',{count:results.length});
    const panel = one('#menu-panel');
    if (term || onlySaved) { panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label', t('Risultati tra le proposte')); }
    else { panel.removeAttribute('aria-label'); panel.setAttribute('aria-labelledby', `filter-${currentCategory}`); }
    if (!results.length) {
      const empty = document.createElement('div'); empty.className = 'empty-menu'; const heading = document.createElement('h3'); heading.textContent = t('Ancora da scegliere.');
      const paragraph = document.createElement('p'); paragraph.textContent = onlySaved ? t('Non hai idee salvate che corrispondono alla ricerca.') : t('Nessuna proposta corrisponde alla ricerca. Prova un altro gusto.');
      const reset = document.createElement('button'); reset.textContent = t('Mostra tutte le proposte'); reset.addEventListener('click', resetSearch); empty.append(heading, paragraph, reset); list.append(empty);
    }
    results.forEach((dish, index) => {
      const row = document.createElement('article'); row.className = 'menu-row'; row.style.animationDelay = `${Math.min(index, 5) * 45}ms`;
      const thumb = document.createElement('button'); thumb.className = `menu-thumb${dish.illustrative ? ' illustrative' : ''}`; thumb.setAttribute('aria-label', t('Dettagli di {name}',{name:dish.name}));
      const image = document.createElement('img'); image.src = dish.photo; image.alt = ''; image.width = 80; image.height = 80; image.loading = 'lazy'; thumb.append(image); thumb.addEventListener('click', () => openDish(dish));
      const content = document.createElement('div'), eyebrow = document.createElement('small'), title = document.createElement('h3'), button = document.createElement('button'), description = document.createElement('p');
      eyebrow.textContent = dish.eyebrow; button.className = 'menu-title-button'; button.textContent = dish.name; button.addEventListener('click', () => openDish(dish)); title.append(button); description.textContent = dish.description; content.append(eyebrow, title, description);
      const save = document.createElement('button'); save.className = 'save-item'; save.dataset.id = dish.id; const selected = saved.has(dish.id); save.setAttribute('aria-pressed', String(selected)); save.setAttribute('aria-label', t(selected?'Rimuovi {name}':'Salva {name}',{name:dish.name})); save.textContent = selected ? '✓' : '+'; save.addEventListener('click', () => toggleSaved(dish.id)); row.append(thumb, content, save); list.append(row);
    });
    const first = results[0];
    if (first) {
      one('.menu-art img').src = first.photo; one('.menu-art img').alt = first.name;
      one('.menu-art').classList.toggle('photo-art', !first.illustrative);
      one('.menu-art-note').textContent = first.illustrative ? t('scegli la tua voglia.') : t('fotografato al Claxon.');
    }
    updateDetailSave(); updateRecipeSave();
  };
  search.addEventListener('input', () => { query = search.value; renderMenu(); });
  one('.clear-search').addEventListener('click', () => { query = ''; search.value = ''; renderMenu(); search.focus(); });
  one('.saved-filter').addEventListener('click', event => { onlySaved = !onlySaved; event.currentTarget.setAttribute('aria-pressed', String(onlySaved)); renderMenu(); });
  one('.copy-wishlist').addEventListener('click', async () => {
    const items = allDishes.filter(dish => saved.has(dish.id));
    if (!items.length) { toast(t('Salva prima le idee che ti ispirano.')); return; }
    const text = `${t('Le mie idee per il Claxon:')}\n${items.map(dish => `• ${dish.name}`).join('\n')}\nVia d’Argine 15, Bedano · 091 945 40 40`;
    try { await navigator.clipboard.writeText(text); toast(t('Lista copiata. Condividila con la compagnia!')); }
    catch { toast(t('Per condividere le idee, usa “Chiedi disponibilità”.')); }
  });
  renderMenu();

  // Real photographs, with native modal focus and pointer/keyboard navigation.
  let galleryFilter = 'Tutte', showAllPhotos = false, visiblePhotos = [], lightboxIndex = 0, photoRequest = 0;
  const preferredPhotoOrder = ['preparazione','locale','cocktail','stuzzichini','colazione','cucina','brindisi','risotto','fondue','pasta','pranzo','aperitivo','dettaglio-locale','espresso','pizza-tavolo','cioccolata'];
  const photos = preferredPhotoOrder.map(id => data.gallery.find(photo => photo.id === id)).filter(Boolean);
  function renderGallery() {
    visiblePhotos = photos.filter(photo => galleryFilter === 'Tutte' || photo.category === galleryFilter);
    const selection = showAllPhotos ? visiblePhotos : visiblePhotos.slice(0, 6); const grid = one('.photo-grid'); grid.replaceChildren();
    selection.forEach((photo, index) => {
      const button = document.createElement('button'); button.className = 'photo-card'; button.setAttribute('aria-label', t('Apri fotografia: {caption}',{caption:photo.caption})); button.style.animationDelay = `${Math.min(index, 5) * 40}ms`;
      const image = document.createElement('img'); image.src = photo.file; image.alt = photo.caption; image.width = photo.width; image.height = photo.height; image.loading = 'lazy'; image.decoding = 'async';
      const caption = document.createElement('span'); caption.append(document.createTextNode(photo.caption)); const arrow = document.createElement('b'); arrow.textContent = '↗'; caption.append(arrow); button.append(image, caption); button.addEventListener('click', () => openPhoto(index)); grid.append(button);
    });
    one('.gallery-count').textContent = t('{shown} di {count} fotografie del locale',{shown:selection.length,count:visiblePhotos.length});
    one('.show-more-photos').hidden = visiblePhotos.length <= 6;
    one('.show-more-photos').innerHTML = `${t(showAllPhotos?'Meno fotografie':'Altri momenti')} <span>${showAllPhotos?'−':'+'}</span>`;
    many('[data-gallery-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.galleryFilter === galleryFilter)));
  }
  async function openPhoto(index) {
    const request = ++photoRequest;
    const nextIndex = (index + visiblePhotos.length) % visiblePhotos.length, photo = visiblePhotos[nextIndex]; if (!photo) return;
    try { await prepareImage(photo.file); } catch { toast(t('Fotografia non disponibile. Riprova.')); return; }
    if (request !== photoRequest) return;
    lightboxIndex = nextIndex; const image = one('.lightbox-picture img'); image.src = photo.file; image.alt = photo.caption; image.width = photo.width; image.height = photo.height;
    one('#photo-caption').textContent = photo.caption; one('.photo-source').href = photo.source; one('.photo-counter').textContent = `${nextIndex + 1} / ${visiblePhotos.length}`;
    pauseFilms(); openDialog('#photo-dialog');
  }
  many('[data-gallery-filter]').forEach(button => button.addEventListener('click', () => { galleryFilter = button.dataset.galleryFilter; showAllPhotos = false; renderGallery(); }));
  one('.show-more-photos').addEventListener('click', () => { showAllPhotos = !showAllPhotos; renderGallery(); });
  one('.photo-prev').addEventListener('click', () => openPhoto(lightboxIndex - 1)); one('.photo-next').addEventListener('click', () => openPhoto(lightboxIndex + 1));
  one('#photo-dialog').addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); openPhoto(lightboxIndex + (event.key === 'ArrowRight' ? 1 : -1)); } });
  one('#photo-dialog').addEventListener('close', () => { photoRequest++; });
  let photoTouch = null;
  one('.lightbox-picture').addEventListener('touchstart', event => { photoTouch = {x:event.touches[0].clientX, y:event.touches[0].clientY}; }, {passive:true});
  one('.lightbox-picture').addEventListener('touchend', event => { if (!photoTouch) return; const x = event.changedTouches[0].clientX - photoTouch.x, y = event.changedTouches[0].clientY - photoTouch.y; photoTouch = null; if (Math.abs(x) > 55 && Math.abs(x) > Math.abs(y) * 1.5) openPhoto(lightboxIndex + (x < 0 ? 1 : -1)); }, {passive:true});
  renderGallery();

  // The two motion clips are animations of real photos, never invented footage.
  function filmButton(video) { return one(`[data-play-film="${video.id}"]`); }
  function paintFilm(video) { const playing = !video.paused && !video.ended; filmButton(video).setAttribute('aria-pressed', String(playing)); filmButton(video).textContent = t(playing ? 'Ⅱ Metti in pausa' : '▶ Dai vita al momento'); }
  function pauseFilms(except) { many('.cinema-card video').forEach(video => { if (video !== except) { video.pause(); paintFilm(video); } }); }
  many('[data-play-film]').forEach(button => button.addEventListener('click', async () => {
    const video = document.getElementById(button.dataset.playFilm);
    if (!video.paused) { video.pause(); paintFilm(video); return; }
    pauseFilms(video);
    try { await video.play(); paintFilm(video); } catch { toast(t('Il clip non è disponibile: puoi comunque esplorare le fotografie.')); }
  }));
  const filmObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) { entry.target.pause(); paintFilm(entry.target); } }), {threshold:.05});
  many('.cinema-card video').forEach(video => { filmObserver.observe(video); video.addEventListener('pause', () => paintFilm(video)); video.addEventListener('play', () => paintFilm(video)); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseFilms(); });

  // Opening state is based on the verified weekly schedule in the local timezone.
  const weekdays = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
  const italianDays = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  function clockLabel(minutes) { return `${String(Math.floor(minutes / 60)).padStart(2,'0')}:${String(minutes % 60).padStart(2,'0')}`; }
  function updateOpening(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:data.hours.timezone, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(now);
    const get = type => parts.find(part => part.type === type)?.value;
    const day = weekdays[get('weekday')], minute = Number(get('hour')) * 60 + Number(get('minute')), schedule = data.hours.schedule[day];
    const open = !!schedule && minute >= schedule[0] && minute < schedule[1];
    one('.opening-status strong').textContent = t(open ? 'Aperto ora' : 'Ci vediamo presto');
    one('.opening-status').classList.toggle('is-open', open); one('.hero-hours').classList.toggle('is-open', open); one('.hero-hours').classList.toggle('is-closed', !open);
    one('.opening-short').textContent = open ? t('Aperto fino alle {time}',{time:clockLabel(schedule[1])}) : t('Scopri quando passare');
    if (open) one('.opening-next').textContent = t('Secondo gli orari pubblicati: oggi fino alle {time}.',{time:clockLabel(schedule[1])});
    else {
      let next = '';
      for (let offset = 0; offset < 8; offset++) { const nextDay = (day + offset) % 7, hours = data.hours.schedule[nextDay]; if (hours && (offset > 0 || minute < hours[0])) { next = t(offset===0?'Secondo gli orari pubblicati: apertura oggi alle {time}.':'Secondo gli orari pubblicati: riapertura {day} alle {time}.',{day:new Intl.DateTimeFormat(document.documentElement.lang,{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,10,8+nextDay))),time:clockLabel(hours[0])}); break; } }
      one('.opening-next').textContent = next;
    }
    many('[data-weekday]').forEach(row => row.classList.toggle('is-today', Number(row.dataset.weekday) === day));
  }
  updateOpening(); setInterval(updateOpening, 30000);
  one('.load-map').addEventListener('click', () => {
    const card = one('.map-card'); if (one('iframe', card)) return;
    const iframe = document.createElement('iframe'); iframe.src = 'https://maps.google.com/maps?q=Claxon%20Via%20d%27Argine%2015%20Bedano&z=15&output=embed'; iframe.title = t('Mappa del Claxon, Via d’Argine 15, Bedano'); iframe.loading = 'lazy'; iframe.referrerPolicy = 'no-referrer-when-downgrade'; card.append(iframe);
    const close = document.createElement('button'); close.className = 'close-map'; close.textContent = t('Torna al locale ×');
    close.addEventListener('click', () => { iframe.remove(); close.remove(); card.classList.remove('map-loaded'); one('.load-map').focus(); }); card.append(close); card.classList.add('map-loaded'); close.focus();
  });

  document.addEventListener('claxon:languagechange', () => {
    journeyPhase=-1; paintJourney(journeyProgress);
    const ingredient=activeIngredient; paintRecipe(); if (ingredient) focusIngredient(ingredient);
    one('.lab-take-slice').textContent=t(pizzaScene.classList.contains('lab-open')?'↙ Rimetti la fetta':'↗ Prendi una fetta');
    renderMenu(); if (detailDish) paintDish(); renderGallery(); updateOpening();
    many('.cinema-card video').forEach(paintFilm);
    if (one('#photo-dialog').open) { const photo=visiblePhotos[lightboxIndex]; one('#photo-caption').textContent=photo.caption; one('.lightbox-picture img').alt=photo.caption; }
    const map=one('.map-card iframe'); if(map) { map.title=t('Mappa del Claxon, Via d’Argine 15, Bedano'); one('.close-map').textContent=t('Torna al locale ×'); }
  });

  // Keep anchored navigation stable after the webfont and initial images settle.
  window.addEventListener('load', () => { const hash = location.hash.slice(1); if (hash) { const target = document.getElementById(decodeURIComponent(hash)); if (target && hash !== 'momenti') target.scrollIntoView({block:'start', behavior:'instant'}); } });
  const prefetch = window.requestIdleCallback || (callback => setTimeout(callback, 700));
  prefetch(() => Object.values(recipes).forEach(recipe => prepareImage(`assets/${recipe.file}.webp`).catch(() => {})));
})();
