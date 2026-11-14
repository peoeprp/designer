/* Страница кейса: берёт данные из js/data.js по <body data-project="id"> */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

/* тема */
(function(){
  const root=document.documentElement;
  try{const t=localStorage.getItem('theme'); if(t) root.dataset.theme=t;}catch(e){}
  $('#themeBtn').onclick=()=>{
    const dark=root.dataset.theme? root.dataset.theme==='dark' : matchMedia('(prefers-color-scheme:dark)').matches;
    root.dataset.theme=dark?'light':'dark';
    try{localStorage.setItem('theme',root.dataset.theme)}catch(e){}
  };
})();

/* курсор */
(function(){
  const cur=$('#cursor'); if(!cur||!matchMedia('(pointer:fine)').matches) return;
  let X=0,Y=0,x=0,y=0,raf=0;
  const loop=()=>{x+=(X-x)*.2;y+=(Y-y)*.2;cur.style.transform=`translate3d(${x-18}px,${y-18}px,0)`;
    raf=(Math.abs(X-x)+Math.abs(Y-y)>.3)?requestAnimationFrame(loop):0;};
  addEventListener('pointermove',e=>{X=e.clientX;Y=e.clientY;cur.classList.add('live');if(!raf)raf=requestAnimationFrame(loop);},{passive:true});
  document.addEventListener('pointerover',e=>{cur.classList.toggle('big',!!e.target.closest('a,button,.shot'))});
})();

const brand=projects.filter(p=>p.cat==='brand');
const p=projects.find(x=>x.id===document.body.dataset.project);
const idx=brand.indexOf(p), next=brand[(idx+1)%brand.length], prev=brand[(idx-1+brand.length)%brand.length];
document.title=`${p.title} — Васильева Анна`;

const sec=s=>`<section class="pp-sec"><h2 class="mono">${s.h}</h2><div class="pp-txt">
  ${(s.p||[]).map(t=>`<p>${t}</p>`).join('')}
  ${s.list?`<ul>${s.list.map(l=>`<li>${l}</li>`).join('')}</ul>`:''}</div></section>`;

$('#pp').innerHTML=`
<div class="wrap">
  <nav class="crumbs"><a href="../index.html#projects">← Все проекты</a><span>${idx+1} / ${brand.length}</span></nav>
  <div class="pp-head">
    <span class="mono">Визуал бренда · ${p.kind}</span>
    <h1>${p.title}</h1>
    <p class="pp-lead">${p.lead}</p>
    <dl class="facts">${Object.entries(p.facts).map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  </div>
</div>
<div class="wrap"><div class="pp-cover" id="ppCover">${covers[p.cover]}</div></div>
<div class="wrap pp-body">${p.sections.map(sec).join('')}
  <section class="pp-sec"><h2 class="mono">Теги</h2><div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div></section>
</div>
<div class="wrap" id="galWrap" hidden><h2 class="pp-gtitle">Материалы проекта</h2><div class="shots" id="shots"></div></div>
<div class="wrap">
  <div class="pp-nav">
    <a class="pp-next" href="${prev.id}.html"><span class="mono">← Предыдущий</span><b>${prev.title}</b></a>
    <a class="pp-next r" href="${next.id}.html"><span class="mono">Следующий →</span><b>${next.title}</b></a>
  </div>
  <div class="pp-cta"><h2>Нужен похожий проект?</h2><a class="btn" href="../index.html#brief">Оставить заявку</a></div>
</div>`;

/* картинки из папки img/projects/<id>/ */
const dir=`../img/projects/${p.folder||p.id}/`;
const probe=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(src);i.onerror=()=>r(null);i.src=src;});
async function findImages(){
  if(!p.images.length)return [];
  const ok=await Promise.all(p.images.map(n=>probe(dir+encodeURIComponent(n))));
  return ok.filter(Boolean);
}
findImages().then(list=>{
  if(!list.length)return;
  const cov=$('#ppCover'); const im=new Image(); im.src=list[0]; im.alt=p.title; cov.appendChild(im);
  const rest=list.length>1?list.slice(1):list;
  $('#shots').innerHTML=rest.map((s,j)=>`<button class="shot" aria-label="Открыть изображение ${j+1}"><img src="${s}" alt="${p.title}, изображение ${j+1}" loading="lazy"></button>`).join('');
  $('#galWrap').hidden=false;
});

/* лайтбокс */
const modal=$('#modal'); let li=0;
function srcs(){return $$('.shot img').map(i=>i.src)}
function openLb(j){const s=srcs(); li=j;
  $('#modalBox').innerHTML=`<div class="mg lb">${s.map((x,k)=>`<img src="${x}" alt="" class="${k===j?'on':''}">`).join('')}
  ${s.length>1?'<button class="mg-nav mg-prev" aria-label="Предыдущее">‹</button><button class="mg-nav mg-next" aria-label="Следующее">›</button>':''}</div>
  <div class="lb-bar"><span class="mono" id="lbCount">${j+1} / ${s.length}</span><button class="btn ghost sm" data-close>Закрыть</button></div>`;
  modal.hidden=false; document.body.style.overflow='hidden';}
function lbShow(n){const im=$$('.lb img'); li=(n+im.length)%im.length; im.forEach((x,k)=>x.classList.toggle('on',k===li)); $('#lbCount').textContent=`${li+1} / ${im.length}`;}
function closeLb(){modal.hidden=true;document.body.style.overflow='';}
document.addEventListener('click',e=>{const s=e.target.closest('.shot'); if(s) openLb([...$$('.shot')].indexOf(s));});
modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close]'))return closeLb();
  if(e.target.closest('.mg-prev'))lbShow(li-1); if(e.target.closest('.mg-next'))lbShow(li+1);});
addEventListener('keydown',e=>{if(modal.hidden)return; if(e.key==='Escape')closeLb(); if(e.key==='ArrowRight')lbShow(li+1); if(e.key==='ArrowLeft')lbShow(li-1);});
