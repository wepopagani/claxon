'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const moments = {
  coffee: {number:'01',label:'Colazione',kicker:'IL BUONGIORNO, QUELLO BUONO',title:'Il buongiorno<br><em>ha più gusto.</em>',description:'Un caffè, qualcosa di dolce e il tempo per due chiacchiere. Prenditi il tuo buongiorno.',cta:'Comincia con gusto',word:'BUONGIORNO.',alt:'Colazione illustrativa con caffè, cornetti e succo',tags:['Prima il caffè','Con dolcezza'],tips:['Una tazzina e il tempo di fermarsi.','Chiedi quali cornetti trovi oggi al banco.'],caption:'Il buongiorno, quello buono.',color:'#e9d7bb'},
  lunch: {number:'02',label:'Pranzo',kicker:'LA PAUSA CHE CI VUOLE',title:'Una pausa<br><em>fatta bene.</em>',description:'Lascia fuori la fretta. Siediti e scopri le proposte della cucina: la giornata può ripartire da qui.',cta:'Scopri la cucina',word:'BUON APPETITO.',alt:'Piatto illustrativo di risotto con parmigiano e rosmarino',tags:['Stacca un attimo','Gusto, con calma'],tips:['Per una pausa breve o per un pranzo in compagnia.','Scrivici per conoscere il menu del giorno.'],caption:'Il resto può aspettare.',color:'#e1ce89'},
  pizza: {number:'03',label:'Pizza',kicker:'FATTA PER CONDIVIDERE',title:'Una fetta di<br><em>felicità.</em>',description:"La scelta più difficile? Decidere con chi dividere l'ultima fetta. Al gusto ci pensiamo dopo, insieme.",cta:'Trova la tua pizza',word:'BUONA.',alt:'Pizza illustrativa con mozzarella, crudo, pomodorini e basilico',tags:['Il primo morso','Da condividere'],tips:['Il piacere comincia dal primo morso.','Scegli con chi condividerla. Oppure tienila tutta per te.'],caption:"Una fetta tira l'altra.",color:'#e6b894'},
  aperitivo: {number:'04',label:'Aperitivo',kicker:'IL BELLO DI STARE INSIEME',title:'Un giro?<br><em>Volentieri.</em>',description:'Il tagliere al centro, il bicchiere giusto e la compagnia migliore. Hai trovato il tuo momento.',cta:"È ora di un aperitivo",word:'CIN CIN.',alt:'Tagliere e spritz illustrativi',tags:['Qualcosa da bere','Qualcosa da dividere'],tips:['Qual è il tuo aperitivo? Raccontacelo su WhatsApp.','Chiedi le proposte per il tuo tavolo.'],caption:'I programmi migliori? Restare.',color:'#e8b093'}
};
const dishes = {
  pizza:[{id:'pizza-crudo',name:'La voglia di crudo',eyebrow:'PIZZA',description:'Una pizza con crudo, da scegliere tra le proposte disponibili.'},{id:'pizza-salame',name:'Un carattere deciso',eyebrow:'PIZZA',description:'Salame e funghi: un abbinamento da chiedere al locale.'},{id:'pizza-classica',name:'La tua classica',eyebrow:'PIZZA',description:'Parti dai gusti che ami. Chiedi il menu completo delle pizze.'}],
  coffee:[{id:'espresso',name:'Il primo caffè',eyebrow:'AL BANCO',description:'Una piccola pausa da prendere al volo, o con calma.'},{id:'cornetto',name:'Qualcosa di dolce',eyebrow:'COLAZIONE',description:'Un cornetto per cominciare. Chiedi le farciture del giorno.'},{id:'succo',name:'Un sorso di buongiorno',eyebrow:'COLAZIONE',description:'Caffè, cornetto e un succo: la tua idea di colazione.'}],
  lunch:[{id:'risotto',name:'Voglia di risotto',eyebrow:'DALLA CUCINA',description:'Scopri quando trovarlo e quale propone la cucina.'},{id:'pranzo',name:'La pausa pranzo',eyebrow:'MENU DEL GIORNO',description:'Primi, secondi e proposte del momento: chiedi cosa bolle in pentola.'},{id:'fondue',name:'Una tavola da condividere',eyebrow:'IN COMPAGNIA',description:'Ti ispira la fondue delle foto? Chiedi disponibilità e prenotazione.'}],
  aperitivo:[{id:'spritz',name:'Il tuo aperitivo',eyebrow:'CIN CIN',description:'Uno spritz, un calice o il tuo drink preferito: chiedi la carta.'},{id:'tagliere',name:'Al centro del tavolo',eyebrow:'DA STUZZICARE',description:'Un tagliere in compagnia. Chiedi la selezione disponibile.'},{id:'gruppo',name:'Più siamo, meglio è',eyebrow:'APERITIVO IN GRUPPO',description:'Raccontaci quanti siete e organizziamo il vostro momento.'}]
};
const allDishes = Object.values(dishes).flat();
let currentMoment = 'pizza', currentCategory = 'pizza', dayMoment = 'coffee';
let momentRequest = 0, categoryRequest = 0, dayRequest = 0, toastTimer, soundEnabled = false;
let saved = new Set();
try { const value=JSON.parse(localStorage.getItem('claxon-ideas') || '[]'); if(Array.isArray(value)) saved=new Set(value.filter(id=>allDishes.some(d=>d.id===id))); } catch {}
const pause = ms => new Promise(resolve => setTimeout(resolve, reduceMotion.matches ? 0 : ms));
const imageCache = new Map();
function loadImage(key) {
  if (!imageCache.has(key)) imageCache.set(key, new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{imageCache.delete(key);reject(new Error('image unavailable'));};image.src=`assets/${key}.webp`;}));
  return imageCache.get(key);
}
function toast(message) { $('.toast').textContent=message;$('.toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('visible'),3600); }
function updateTablist(root, attribute, key) {
  $$('[role=tab]',root).forEach(tab=>{const selected=tab.dataset[attribute]===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
}
async function setMoment(key) {
  if(!moments[key])return;
  const request=++momentRequest;
  if(key===currentMoment){$('.hero-panel').classList.remove('changing');return;}
  try {await loadImage(key);} catch {toast('Immagine non disponibile. Riprova fra un momento.');return;}
  if(request!==momentRequest)return;
  const panel=$('.hero-panel');panel.classList.add('changing');await pause(230);if(request!==momentRequest)return;
  currentMoment=key;const moment=moments[key];
  document.body.dataset.moment=key;
  $('.hero-kicker').textContent=moment.kicker;$('#hero-title').innerHTML=moment.title;$('.hero-description').textContent=moment.description;
  $('.hero-cta').replaceChildren(document.createTextNode(moment.cta+' '),Object.assign(document.createElement('span'),{textContent:'↗'}));
  $$('.hero-food').forEach(image=>image.src=`assets/${key}.webp`);$('.main-food').alt=moment.alt;
  $('.hero-stage').setAttribute('aria-label',`${moment.label} interattiva`);$('.stage-word').textContent=moment.word;
  $('.stage-number').textContent=`${moment.number} / 04`;$('.moment-counter').innerHTML=`${moment.number} <i>/ 04</i>`;
  $$('.ingredient-tag').forEach((tag,i)=>{tag.replaceChildren(Object.assign(document.createElement('span'),{textContent:'+'}),document.createTextNode(moment.tags[i]));tag.dataset.tip=moment.tips[i];});
  $('.slice-button').hidden=key!=='pizza';$('.food-assembly').classList.remove('slice-open');$('.slice-button').setAttribute('aria-pressed','false');$('.slice-button').innerHTML='<span>↗</span> Prendi una fetta';
  updateTablist($('.moment-tabs'),'moment',key);panel.setAttribute('aria-labelledby',`tab-${key}`);panel.classList.remove('changing');
}
$$('.moment-tabs button').forEach(button=>button.addEventListener('click',()=>setMoment(button.dataset.moment)));
const keys=Object.keys(moments);
$('.prev').addEventListener('click',()=>setMoment(keys[(keys.indexOf(currentMoment)+3)%4]));
$('.next').addEventListener('click',()=>setMoment(keys[(keys.indexOf(currentMoment)+1)%4]));
$('.hero-cta').addEventListener('click',()=>setCategory(currentMoment));
function tabKeys(root,callback,attr) {root.addEventListener('keydown',event=>{const tabs=$$('[role=tab]',root);let index=tabs.indexOf(event.target);if(index<0)return;switch(event.key){case 'ArrowRight':index=(index+1)%tabs.length;break;case 'ArrowLeft':index=(index+tabs.length-1)%tabs.length;break;case 'Home':index=0;break;case 'End':index=tabs.length-1;break;default:return;}event.preventDefault();tabs[index].focus();callback(tabs[index].dataset[attr]);});}
tabKeys($('.moment-tabs'),setMoment,'moment');
$('.slice-button').addEventListener('click',()=>{const open=$('.food-assembly').classList.toggle('slice-open');$('.slice-button').setAttribute('aria-pressed',String(open));$('.slice-button').innerHTML=`<span>${open?'↙':'↗'}</span> ${open?'Rimetti la fetta':'Prendi una fetta'}`;});
$$('.ingredient-tag').forEach(button=>button.addEventListener('click',()=>toast(button.dataset.tip)));
let pointerFrame;
$('.hero-stage').addEventListener('pointermove',event=>{if(reduceMotion.matches||event.pointerType==='touch')return;const box=event.currentTarget.getBoundingClientRect();const x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;cancelAnimationFrame(pointerFrame);pointerFrame=requestAnimationFrame(()=>$('.food-tilt').style.transform=`perspective(900px) rotateY(${x*10}deg) rotateX(${-y*8}deg) translate(${x*8}px,${y*8}px)`);});
$('.hero-stage').addEventListener('pointerleave',()=>{cancelAnimationFrame(pointerFrame);$('.food-tilt').style.transform='';});
let touchStart=null;
$('.hero-stage').addEventListener('touchstart',event=>{if(event.target.closest('button'))return;touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
$('.hero-stage').addEventListener('touchend',event=>{if(!touchStart)return;const x=event.changedTouches[0].clientX-touchStart.x,y=event.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(x)>65 && Math.abs(x)>Math.abs(y)*1.6)setMoment(keys[(keys.indexOf(currentMoment)+(x<0?1:3))%4]);},{passive:true});
async function setDay(key){if(!moments[key])return;const request=++dayRequest;if(dayMoment===key){$('.day-picture').classList.remove('switching');return;}try{await loadImage(key);}catch{return;}if(request!==dayRequest)return;$('.day-picture').classList.add('switching');await pause(200);if(request!==dayRequest)return;dayMoment=key;const moment=moments[key];$('.day-picture img').src=`assets/${key}.webp`;$('.day-picture img').alt=moment.alt;$('.day-ghost').textContent=moment.number;$('.day-caption').textContent=moment.caption;$('.day-glow').style.background=moment.color;$('.day-glow').style.transform=`rotate(${keys.indexOf(key)*45}deg)`;$$('.day-story').forEach(button=>{const active=button.dataset.scene===key;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});$('.day-picture').classList.remove('switching');}
$$('.day-story').forEach(button=>button.addEventListener('click',()=>setDay(button.dataset.scene)));
function renderMenu(){const list=$('.menu-list');list.replaceChildren();dishes[currentCategory].forEach((dish,index)=>{const row=document.createElement('article');row.className='menu-row';row.style.animationDelay=`${index*60}ms`;const content=document.createElement('div');const eyebrow=document.createElement('small');eyebrow.textContent=dish.eyebrow;const title=document.createElement('h3');title.textContent=dish.name;const description=document.createElement('p');description.textContent=dish.description;content.append(eyebrow,title,description);const button=document.createElement('button');button.className='save-item';button.dataset.id=dish.id;button.setAttribute('aria-pressed',String(saved.has(dish.id)));button.setAttribute('aria-label',`${saved.has(dish.id)?'Rimuovi':'Salva'} ${dish.name}`);button.textContent=saved.has(dish.id)?'✓':'+';button.addEventListener('click',()=>toggleSaved(dish.id));row.append(content,button);list.append(row);});}
async function setCategory(key){if(!dishes[key])return;const request=++categoryRequest;try{await loadImage(key);}catch{toast('Immagine non disponibile. Riprova fra un momento.');return;}if(request!==categoryRequest)return;currentCategory=key;updateTablist($('.menu-filters'),'category',key);$('#menu-panel').setAttribute('aria-labelledby',`filter-${key}`);$('.menu-art img').src=`assets/${key}.webp`;$('.menu-art img').alt=moments[key].alt;$('.menu-art-word').textContent={coffee:'BUONGIORNO!',lunch:'BUON APPETITO!',pizza:'PIZZA!',aperitivo:'CIN CIN!'}[key];renderMenu();}
$$('.menu-filters button').forEach(button=>button.addEventListener('click',()=>setCategory(button.dataset.category)));tabKeys($('.menu-filters'),setCategory,'category');
function toggleSaved(id){if(saved.has(id))saved.delete(id);else{saved.add(id);toast('Aggiunto alle tue idee. Che buon gusto!');}try{localStorage.setItem('claxon-ideas',JSON.stringify([...saved]));}catch{}updateSaved();renderMenu();renderWishlist();}
function updateSaved(){$$('.wish-count').forEach(count=>count.textContent=saved.size);$('.wishlist-bar').hidden=saved.size===0;}
function renderWishlist(){const list=$('.wishlist-items');list.replaceChildren();const selected=allDishes.filter(d=>saved.has(d.id));if(!selected.length){const empty=document.createElement('p');empty.textContent='La tua lista è ancora vuota. Salva le idee che ti ispirano con il pulsante +.';list.append(empty);}selected.forEach(dish=>{const row=document.createElement('div');row.className='wishlist-item';const name=document.createElement('span');name.textContent=dish.name;const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label',`Rimuovi ${dish.name}`);remove.addEventListener('click',()=>toggleSaved(dish.id));row.append(name,remove);list.append(row);});const message=selected.length?`Ciao Claxon! Mi ispirano queste proposte:\n${selected.map(d=>`• ${d.name}`).join('\n')}\nMi dite cosa è disponibile e i prezzi aggiornati? Grazie!`:'Ciao Claxon! Posso avere il menu e i prezzi aggiornati? Grazie!';$('.wishlist-send').href=whatsapp(message);}
function whatsapp(message){return `https://wa.me/41786293164?text=${encodeURIComponent(message)}`;}
function openDialog(id){const dialog=$(id);if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');}
$$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});dialog.addEventListener('close',()=>{if(!$$('dialog[open]').length)document.body.classList.remove('modal-open');});});
$$('[data-open-wishlist]').forEach(button=>button.addEventListener('click',()=>{renderWishlist();openDialog('#wishlist-dialog');}));$('.credits-button').addEventListener('click',()=>openDialog('#credits-dialog'));
$('.mobile-nav').addEventListener('click',()=>{const open=$('.header nav').classList.toggle('open');$('.mobile-nav').setAttribute('aria-expanded',String(open));$('.mobile-nav').setAttribute('aria-label',open?'Chiudi navigazione':'Apri navigazione');$('.mobile-nav').textContent=open?'×':'☰';});
$$('.header nav a').forEach(link=>link.addEventListener('click',()=>{$('.header nav').classList.remove('open');$('.mobile-nav').setAttribute('aria-expanded','false');$('.mobile-nav').setAttribute('aria-label','Apri navigazione');$('.mobile-nav').textContent='☰';}));
let audioContext;
function chime(){if(!soundEnabled)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();[784,1046.5].forEach((frequency,index)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,audioContext.currentTime);gain.gain.linearRampToValueAtTime(.075,audioContext.currentTime+.015+index*.09);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.55+index*.09);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(audioContext.currentTime+index*.09);oscillator.stop(audioContext.currentTime+.7+index*.09);});}catch{}}
$('.sound-button').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('.sound-button').setAttribute('aria-pressed',String(soundEnabled));$('.sound-button').textContent=`Audio ${soundEnabled?'on ♪':'off ◌'}`;if(soundEnabled)chime();});
$('.cheers-button').addEventListener('click',event=>{toast('Cin cin! Ai momenti che vale la pena condividere.');chime();if(reduceMotion.matches)return;const box=event.currentTarget.getBoundingClientRect(),container=$('.celebration');for(let i=0;i<32;i++){const confetti=document.createElement('i');confetti.className='confetti';confetti.style.left=`${box.left+box.width/2}px`;confetti.style.top=`${box.top}px`;confetti.style.background=['#e8b45e','#f5efdf','#b72f26','#dc8b6c'][i%4];confetti.style.setProperty('--x',`${(Math.random()-.5)*650}px`);confetti.style.setProperty('--y',`${-100-Math.random()*300}px`);confetti.style.setProperty('--r',`${Math.random()*800}deg`);container.append(confetti);setTimeout(()=>confetti.remove(),1900);}});
document.body.classList.add('js-ready');
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:.08});$$('.reveal').forEach(element=>observer.observe(element));
$('#year').textContent=new Date().getFullYear();renderMenu();updateSaved();
// Decode the scene images during idle time; swapping never exposes an empty frame.
const idle=window.requestIdleCallback||((callback)=>setTimeout(callback,400));idle(()=>keys.forEach(key=>loadImage(key).catch(()=>{})));
