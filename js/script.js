/* peoeprp — интерактив сайта: тема, сетка в первом экране, курсор,
   проекты, этапы работы, калькулятор услуг, бриф */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>n.toLocaleString('ru-RU')+' ₽';
const TG='https://t.me/peoeprp';
const MAX='https://max.ru/u/f9LHodD0cOK9vm0CRAUXUcQ7ODRmkYsMzyy_TiV0z68gTOM1ugSY7S1gc2U';

/* ---------- theme ---------- */
(function(){
  const root=document.documentElement;
  try{const t=localStorage.getItem('theme'); if(t) root.dataset.theme=t;}catch(e){}
  $('#themeBtn').onclick=()=>{
    const dark=root.dataset.theme? root.dataset.theme==='dark' : matchMedia('(prefers-color-scheme:dark)').matches;
    root.dataset.theme=dark?'light':'dark';
    try{localStorage.setItem('theme',root.dataset.theme)}catch(e){}
  };
})();

/* ---------- hero field ----------
   Оптимизация: цвета кешируются, кадры рисуются только когда первый экран
   виден и точки двигаются; точки одного цвета рисуются одним путём. */
const heroVisible={on:true};
(function(){
  const c=$('#field'); if(!c)return; const x=c.getContext('2d'); let w,h,dpr,pts=[],m={x:-999,y:-999};
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let line='',acc='',raf=0;
  const readColors=()=>{const cs=getComputedStyle(document.documentElement);line=cs.getPropertyValue('--line').trim();acc=cs.getPropertyValue('--accent').trim();};
  function size(){dpr=Math.min(devicePixelRatio||1,2);w=c.offsetWidth;h=c.offsetHeight;c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);
    pts=[];const s=w<600?26:34;for(let yy=s/2;yy<h;yy+=s)for(let xx=s/2;xx<w;xx+=s)pts.push({ox:xx,oy:yy,x:xx,y:yy});}
  function frame(){
    raf=0; let moving=false; x.clearRect(0,0,w,h);
    const R=150, near=[];
    x.fillStyle=line; x.beginPath();
    for(const p of pts){
      const dx=p.ox-m.x, dy=p.oy-m.y, d=Math.hypot(dx,dy);
      let tx=p.ox, ty=p.oy;
      if(d<R){const f=1-d/R; tx+=dx/d*f*28||0; ty+=dy/d*f*28||0; near.push([p,1.4+f*3]);}
      const vx=(tx-p.x)*.15, vy=(ty-p.y)*.15; p.x+=vx; p.y+=vy;
      if(Math.abs(vx)+Math.abs(vy)>.05) moving=true;
      if(d>=R){x.moveTo(p.x+1.4,p.y);x.arc(p.x,p.y,1.4,0,7);}
    }
    x.fill();
    if(near.length){x.fillStyle=acc;x.beginPath();for(const [p,r] of near){x.moveTo(p.x+r,p.y);x.arc(p.x,p.y,r,0,7);}x.fill();}
    if(!reduce && heroVisible.on && (moving||m.x>-999)) kick();
  }
  const kick=()=>{if(!raf) raf=requestAnimationFrame(frame);};
  heroVisible.kick=kick;
  readColors(); size(); frame();
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{size();frame();},150);});
  const redraw=()=>{readColors();frame();};
  $('#themeBtn').addEventListener('click',()=>setTimeout(redraw,30));
  matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',redraw);
  const hero=$('.hero');
  hero.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();m.x=e.clientX-r.left;m.y=e.clientY-r.top;kick();});
  hero.addEventListener('pointerleave',()=>{m.x=m.y=-999;kick();});
  new IntersectionObserver(es=>{heroVisible.on=es[0].isIntersecting && !document.hidden; if(heroVisible.on){kick();heroVisible.wave?.();}}).observe(hero);
  document.addEventListener('visibilitychange',()=>{heroVisible.on=!document.hidden; if(heroVisible.on){kick();heroVisible.wave?.();}});
})();

/* ---------- cursor + magnet ---------- */
(function(){
  const cur=$('#cursor'); if(!matchMedia('(pointer:fine)').matches) return;
  let X=0,Y=0,x=0,y=0,raf=0;
  const loop=()=>{x+=(X-x)*.2;y+=(Y-y)*.2;cur.style.transform=`translate3d(${x-18}px,${y-18}px,0)`;
    raf=(Math.abs(X-x)+Math.abs(Y-y)>.3)?requestAnimationFrame(loop):0;};
  addEventListener('pointermove',e=>{X=e.clientX;Y=e.clientY;cur.classList.add('live');if(!raf)raf=requestAnimationFrame(loop);},{passive:true});
  document.addEventListener('pointerover',e=>{cur.classList.toggle('big',!!e.target.closest('a,button,.card,.svc,label'))});
  $$('.magnet').forEach(b=>{
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`});
    b.addEventListener('pointerleave',()=>b.style.transform='');
  });
})();

/* ---------- проекты (данные в js/data.js) ---------- */
const arrowSVG='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
const grid=$('#grid');
grid.innerHTML=projects.map((p,i)=>{
  const tag=p.cat==='brand'?`a href="${pageOf(p)}"`:'button type="button"';
  return `<${tag} class="card" data-cat="${p.cat}" data-i="${i}">
  <div class="cover">${covers[p.cover]}</div>
  <div class="card-b"><div><span class="mono">${p.kind}</span><h3>${p.title}</h3><p class="card-desc">${p.done}</p></div>
  <span class="arrow">${arrowSVG}</span></div></${p.cat==='brand'?'a':'button'}>`;}).join('');
$('#c-all').textContent=projects.length;
$('#c-web').textContent=projects.filter(p=>p.cat==='web').length;
$('#c-brand').textContent=projects.filter(p=>p.cat==='brand').length;
$('#c-app').textContent=projects.filter(p=>p.cat==='app').length;

function movePill(btn){const p=$('#pill');p.style.left=btn.offsetLeft+'px';p.style.width=btn.offsetWidth+'px';}
$$('.filters button').forEach(b=>b.onclick=()=>{
  $$('.filters button').forEach(x=>x.classList.toggle('on',x===b)); movePill(b);
  const f=b.dataset.f;
  $$('.card').forEach((c,i)=>{const show=f==='all'||c.dataset.cat===f;c.classList.toggle('hide',!show);c.classList.remove('fade');
    if(show){void c.offsetWidth;c.style.animationDelay=(i*50)+'ms';c.classList.add('fade');}});
});
requestAnimationFrame(()=>movePill($('.filters button.on')));
addEventListener('resize',()=>movePill($('.filters button.on')));
if(document.fonts) document.fonts.ready.then(()=>movePill($('.filters button.on')));

/* наведение: лёгкий 3D-наклон обложки */
$$('.card').forEach(c=>{
  c.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=c.getBoundingClientRect();const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(900px) rotateY(${px*5}deg) rotateX(${-py*5}deg) translateY(-4px)`});
  c.addEventListener('pointerleave',()=>{c.style.transform='';});
  if(c.tagName==='BUTTON') c.addEventListener('click',()=>openSite(+c.dataset.i));
});

/* предпросмотр сайта */
const modal=$('#modal');
function openSite(i){
  const p=projects[i];
  const btn=(p.link?`<a class="btn" href="${p.link}" target="_blank" rel="noopener">${p.linkLabel||'Открыть сайт'} ↗</a>`:`<span class="btn ghost is-off">Ссылка скоро появится</span>`)
    +(p.link2?`<a class="btn ghost" href="${p.link2}" target="_blank" rel="noopener">${p.link2Label||'Ещё'} ↗</a>`:'')
    +(p.here?`<a class="btn ghost" href="#top" data-close>Версия в коде — вы на ней</a>`:'');
  const media=p.shots?`<div class="app-shots">${p.shots.map((src,j)=>`<img src="${src}" alt="${p.title}, экраны ${j+1}" loading="lazy" decoding="async">`).join('')}</div>`:`<div class="cover">${covers[p.cover]}</div>`;
  $('#modalBox').innerHTML=`${media}
  <div class="modal-in"><span class="mono">${p.cat==='app'?'Приложения':'Сайты'} · ${p.kind}</span><h3>${p.title}</h3>
  ${p.status==='prototype'?'<p class="proto-note">Это прототип: сайт не действующий, записаться через него нельзя. По ссылке можно посмотреть, как он устроен.</p>':''}
  ${p.here?'<p class="here-note">Сайт, который вы сейчас смотрите, — тоже моя работа: та же идея портфолио, но сделанная кодом без конструктора.</p>':''}
  <dl>${Object.entries(p.info).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
  <div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap">${btn}<button class="btn ghost" data-close>Закрыть</button></div></div>`;
  modal.hidden=false; document.body.style.overflow='hidden';
  $('#modalBox [data-close]')?.focus();
}
function closeModal(){modal.hidden=true;document.body.style.overflow='';}
modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close]'))closeModal();});
addEventListener('keydown',e=>{if(!modal.hidden&&e.key==='Escape')closeModal();});


/* ---------- запуск сайта ---------- */
const hosts={
  free:{h:'Бесплатный хостинг',price:'0 ₽',p:'Публикую сайт на бесплатном хостинге. Он сразу доступен по ссылке, работает по HTTPS и не требует ежемесячной оплаты.',li:['GitHub Pages, Netlify или Vercel','Защищённое соединение HTTPS','Адрес вида имя.github.io'],url:'peoeprp.github.io'},
  domain:{h:'Свой красивый домен',price:'от 3 000 ₽',p:'Подберу короткое запоминающееся имя, помогу купить домен и подключу к нему сайт. Сам домен оплачивается отдельно у регистратора, обычно 200–1 500 ₽ в год.',li:['Подбор и проверка свободных имён','Подключение домена и SSL-сертификата','Почта на домене по запросу'],url:'peoeprp-designer.ru'}
};
function setHost(k){
  const h=hosts[k]; $$('#hostSeg button').forEach(b=>b.classList.toggle('on',b.dataset.h===k));
  const box=$('#hostInfo'); box.classList.remove('anim'); void box.offsetWidth; box.classList.add('anim');
  box.innerHTML=`<span class="price-tag">${h.price}</span><h3>${h.h}</h3><p>${h.p}</p><ul>${h.li.map(l=>`<li>${l}</li>`).join('')}</ul>`;
  $('#urlText').textContent=h.url; $('#pvSite').textContent=h.url; $('#msgLink').textContent='https://'+h.url;
  const u=$('.url'); u.classList.remove('flash'); void u.offsetWidth; u.classList.add('flash'); setTimeout(()=>u.classList.remove('flash'),900);
}
$$('#hostSeg button').forEach(b=>b.onclick=()=>setHost(b.dataset.h));
setHost('free');

/* ---------- волнистая обводка фото ---------- */
(function(){
  const A=$('#waveA'),B=$('#waveB'); if(!A)return;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const ring=(r,amp,waves,ph)=>{let d='';for(let i=0;i<=240;i++){const a=i/240*Math.PI*2;const rr=r+Math.sin(a*waves+ph)*amp;d+=(i?'L':'M')+(200+Math.cos(a)*rr).toFixed(2)+' '+(200+Math.sin(a)*rr).toFixed(2);}return d+'Z';};
  let t=0,raf=0;
  const f=()=>{t+=.012;A.setAttribute('d',ring(170,7,9,t));B.setAttribute('d',ring(186,5,12,-t*1.3+1));
    raf=(!reduce&&heroVisible.on)?requestAnimationFrame(f):0;};
  heroVisible.wave=()=>{if(!raf&&!reduce)raf=requestAnimationFrame(f);};
  f();
})();

/* ---------- фото: лёгкий параллакс ---------- */
(function(){const ph=$('#heroPhoto'), hero=$('.hero'); if(!ph||!matchMedia('(pointer:fine)').matches)return;
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;ph.style.transform=`translate(${x*-14}px,${y*-10}px)`});
  hero.addEventListener('pointerleave',()=>ph.style.transform='');})();

/* ---------- копирование контактов ---------- */
function copyText(text,okMsg){
  const fallback=()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(okMsg)}catch(e){toast('Не получилось скопировать: '+text)}ta.remove();};
  if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>toast(okMsg),fallback); else fallback();
}
$$('.copy-btn').forEach(b=>b.onclick=()=>copyText(b.dataset.copy,'Скопировано'));


/* ---------- process ---------- */
const stages=[
  {t:'Бриф и знакомство',d:'Созваниваемся или переписываемся. Разбираю задачу, аудиторию, конкурентов и цели.',li:['Заполняем бриф','Фиксируем цели и результат','Обсуждаем бюджет и сроки'],ok:'Согласуем техзадание и смету',time:'1–2 дня',pay:'—'},
  {t:'Структура',d:'Собираю структуру сайта и прототип. При редизайне подключаю бизнес-аналитику: прорабатываю процессы и пути пользователя.',li:['Анализ конкурентов и референсы','Структура страниц и прототип','При редизайне: процессы и пути пользователя'],ok:'Согласуем структуру и прототип',time:'3–5 дней',pay:'Предоплата 50%'},
  {t:'Концепция',d:'Показываю визуальное направление на ключевом экране или носителе: цвет, шрифты, настроение, графику.',li:['1–2 концепции на выбор','Moodboard и обоснование решений','Выбор направления'],ok:'Утверждаем концепцию',time:'4–7 дней',pay:'—'},
  {t:'Дизайн и правки',d:'Развиваю концепцию на все страницы и носители. На этапе включены два круга правок.',li:['Все страницы или носители','Макеты под телефон и планшет','2 круга правок включены'],ok:'Принимаем финальные макеты',time:'1–3 недели',pay:'—'},
  {t:'Код и запуск',d:'Верстаю сайт, публикую на бесплатном хостинге или на вашем домене и настраиваю отображение. Для бренда готовлю файлы для печати и брендбук.',li:['Вёрстка на HTML, CSS, JS','Публикация на хостинге или домене','Иконка сайта и красивое превью ссылки'],ok:'Проверяем сайт вместе, подписываем акт',time:'3–10 дней',pay:'Оставшиеся 50%'},
];
let cur=0, timer=null; const DUR=7000;
$('#steps').innerHTML=stages.map((s,i)=>`<button class="step-btn" data-i="${i}"><span class="n">${String(i+1).padStart(2,'0')}</span>${s.t}<span class="prog"></span></button>`).join('');
function showStage(i,auto){
  cur=i; const s=stages[i];
  $$('.step-btn').forEach((b,j)=>{b.classList.toggle('on',j===i);b.classList.toggle('done',j<i);const p=b.querySelector('.prog');p.style.transition='none';p.style.width='0';});
  const st=$('#stage'); st.classList.remove('anim'); void st.offsetWidth; st.classList.add('anim');
  st.innerHTML=`<span class="num">${String(i+1).padStart(2,'0')}</span><span class="mono">Этап ${i+1} из ${stages.length}</span><h3>${s.t}</h3><p>${s.d}</p>
  <ul>${s.li.map(l=>`<li>${l}</li>`).join('')}</ul>
  <div class="approve"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color:var(--tulip);flex:none"><path d="M20 6 9 17l-5-5"/></svg><span><b>Согласование:</b> ${s.ok}</span></div>
  <div class="meta"><span>⏱ ${s.time}</span><span>₽ ${s.pay}</span></div>`;
  clearTimeout(timer);
  if(auto!==false && !matchMedia('(prefers-reduced-motion:reduce)').matches){
    const p=$$('.step-btn')[i].querySelector('.prog'); requestAnimationFrame(()=>{p.style.transition=`width ${DUR}ms linear`;p.style.width='100%';});
    timer=setTimeout(()=>showStage((i+1)%stages.length),DUR);
  }
}
$$('.step-btn').forEach(b=>b.onclick=()=>showStage(+b.dataset.i,false));
showStage(0);
const pio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)clearTimeout(timer);}),{threshold:0});pio.observe($('#process'));

/* ---------- services ---------- */
const services=[
  {id:'land',c:'web',t:'Лендинг под ключ',d:'Дизайн и код одностраничного сайта, адаптив, публикация',p:35000,days:12},
  {id:'multi',c:'web',t:'Многостраничный сайт под ключ',d:'Дизайн и код до 7 страниц, адаптив, публикация',p:70000,days:24},
  {id:'redes',c:'web',t:'Редизайн сайта',d:'Новый визуал и код плюс бизнес-аналитика: процессы и пути пользователя',p:45000,days:16},
  {id:'tilda',c:'web',t:'Лендинг на Tilda',d:'Простая сборка без сложной анимации и интерактива',p:15000,days:5},
  {id:'host',c:'web',t:'Публикация на бесплатном хостинге',d:'GitHub Pages, Netlify или Vercel, HTTPS',p:0,days:1},
  {id:'domain',c:'web',t:'Публикация на своём домене',d:'Подбор красивого имени, подключение, SSL. Домен оплачивается отдельно',p:3000,days:2},
  {id:'setup',c:'web',t:'Настройка отображения сайта',d:'Адаптив и браузеры, иконка сайта, красивая шапка ссылки в мессенджерах',p:5000,days:2},
  {id:'logo',c:'brand',t:'Логотип',d:'3 концепции, доработка выбранной, все форматы',p:15000,days:7},
  {id:'style',c:'brand',t:'Фирменный стиль',d:'Логотип, цвета, шрифты, графика, носители',p:40000,days:14},
  {id:'book',c:'brand',t:'Брендбук',d:'Полное руководство по использованию стиля',p:60000,days:21},
  {id:'print',c:'brand',t:'Рекламная продукция',d:'Плакат, флаер, меню или баннер, за единицу',p:5000,days:3},
  {id:'smm',c:'brand',t:'Шаблоны для соцсетей',d:'Набор из 10 шаблонов постов и сторис',p:12000,days:5},
];
const sel=new Set(['land','host','setup']); let k=1;
const check='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><path d="M20 6 9 17l-5-5"/></svg>';
$('#svcList').innerHTML=services.map(s=>`<label class="svc" data-c="${s.c}" data-id="${s.id}"><input type="checkbox" id="svc-${s.id}" ${sel.has(s.id)?'checked':''}>
  <span class="box">${check}</span><span><h4>${s.t}</h4><small>${s.d}</small></span><span class="price">${s.p?'от '+fmt(s.p):'бесплатно'}<em>~${s.days} дн.</em></span></label>`).join('');
function calc(){
  $$('.svc').forEach(l=>l.classList.toggle('on',sel.has(l.dataset.id)));
  const ch=services.filter(s=>sel.has(s.id));
  $('#cnt').textContent=ch.length;
  $('#chosen').innerHTML=ch.length?ch.map(s=>`<div><span>${s.t}</span><span>${s.p?fmt(Math.round(s.p*k)):'бесплатно'}</span></div>`).join(''):'<div class="empty">Отметьте услуги слева</div>';
  const sum=ch.reduce((a,s)=>a+s.p,0)*k;
  animateNum($('#total'),Math.round(sum/500)*500);
  const d=ch.length?Math.max(...ch.map(s=>s.days))+Math.round(ch.reduce((a,s)=>a+s.days,0)*.25):0;
  $('#days').textContent=ch.length?`Срок: около ${Math.max(2,Math.round(d/k))} рабочих дней`:'Срок: —';
}
let numNow=0, numRaf;
function animateNum(el,to){cancelAnimationFrame(numRaf);const from=numNow,t0=performance.now();
  (function f(t){const p=Math.min(1,(t-t0)/500),e=1-Math.pow(1-p,3);numNow=Math.round(from+(to-from)*e);el.textContent=fmt(numNow);if(p<1)numRaf=requestAnimationFrame(f)})(t0);}
$('#svcList').addEventListener('change',e=>{const id=e.target.closest('.svc').dataset.id;e.target.checked?sel.add(id):sel.delete(id);calc();});
$$('#svcTabs button').forEach(b=>b.onclick=()=>{$$('#svcTabs button').forEach(x=>x.classList.toggle('on',x===b));const c=b.dataset.c;$$('.svc').forEach(l=>l.classList.toggle('hide',c!=='all'&&l.dataset.c!==c));});
$$('#urg button').forEach(b=>b.onclick=()=>{$$('#urg button').forEach(x=>x.classList.toggle('on',x===b));k=+b.dataset.k;calc();});
numNow=0; calc();

/* ---------- brief ---------- */
const chipMap={land:'Лендинг',multi:'Сайт под ключ',redes:'Редизайн сайта',tilda:'Лендинг на Tilda',logo:'Логотип',style:'Фирменный стиль',book:'Фирменный стиль',print:'Рекламная графика',smm:'Рекламная графика'};
function syncChips(){const want=new Set([...sel].map(i=>chipMap[i]));$$('#f-chips input').forEach(c=>c.checked=want.has(c.value));}
$('#toBrief').addEventListener('click',syncChips); syncChips();

function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200);}
$('#form').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('#f-name'), contact=$('#f-contact'); let ok=true;
  [name,contact].forEach(f=>{const bad=!f.value.trim();f.parentElement.classList.toggle('err',bad);if(bad)ok=false;});
  if(!ok){toast('Заполните имя и контакт');(name.value.trim()?contact:name).focus();return;}
  if(!$('#f-consent').checked){toast('Отметьте согласие на обработку данных');$('#f-consent').focus();return;}
  const what=$$('#f-chips input:checked').map(c=>c.value);
  const ch=services.filter(s=>sel.has(s.id));
  const urgTxt=$('#urg button.on').textContent;
  const text=`Заявка с сайта Васильевой Анны
Имя: ${name.value.trim()}
Контакт: ${contact.value.trim()}
Нужно: ${what.join(', ')||'—'}
Бюджет: ${$('#f-budget').value}
Сроки: ${$('#f-deadline').value}
Смета: ${ch.length?ch.map(s=>s.t).join(', ')+` · ${urgTxt} · от ${$('#total').textContent}`:'—'}
О проекте: ${$('#f-msg').value.trim()||'—'}`;
  $('#form').hidden=true; const d=$('#done'); d.hidden=false;
  d.innerHTML=`<div class="done-box"><h3 style="font-size:24px">Заявка готова 🎉</h3>
  <p style="margin:0;color:var(--muted)">Скопируйте текст и отправьте его мне в Telegram или MAX, так я увижу все детали сразу.</p>
  <pre id="briefText">${text.replace(/</g,'&lt;')}</pre>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="copyBtn">Скопировать</button><a class="btn ghost" href="${TG}" target="_blank" rel="noopener">Telegram ↗</a><a class="btn ghost" href="${MAX}" target="_blank" rel="noopener">MAX ↗</a><button class="btn ghost" id="editBtn">Изменить</button></div></div>`;
  $('#copyBtn').onclick=()=>{navigator.clipboard?.writeText(text).then(()=>toast('Скопировано'),()=>{selectPre();toast('Текст выделен, нажмите Ctrl+C')}) ?? (selectPre(),toast('Текст выделен'));};
  $('#editBtn').onclick=()=>{d.hidden=true;$('#form').hidden=false;};
});
function selectPre(){const r=document.createRange();r.selectNodeContents($('#briefText'));const s=getSelection();s.removeAllRanges();s.addRange(r);}
