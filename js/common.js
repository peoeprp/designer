/* ==========================================================
   Общее для всех страниц: прелоадер с ручкой, плавные переходы
   между страницами, плашка про cookie.
   ========================================================== */
(function(){
  const ROOT=document.body.dataset.root||'';
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
  const sget=k=>{try{return sessionStorage.getItem(k)}catch(e){return null}}, sset=(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}};

  /* ---------- прелоадер ---------- */
  const pl=document.getElementById('preloader');
  if(pl){
    const ink=pl.querySelector('.pl-ink'), pen=pl.querySelector('.pl-pen');
    const L=ink.getTotalLength();
    ink.style.strokeDasharray=L; ink.style.strokeDashoffset=L;
    const first=!sget('pl-seen'); sset('pl-seen','1');
    const DUR=reduce?0:(first?1700:950);
    const t0=performance.now();
    const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    function step(now){
      const t=DUR?Math.min(1,(now-t0)/DUR):1, k=ease(t), len=L*k;
      ink.style.strokeDashoffset=L-len;
      const pt=ink.getPointAtLength(len);
      pen.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')');
      if(t<1) requestAnimationFrame(step); else done();
    }
    function done(){
      pl.classList.add('pl-written');
      setTimeout(()=>{pl.classList.add('pl-hide'); setTimeout(()=>{pl.hidden=true;},600);}, reduce?200:(first?900:520));
    }
    requestAnimationFrame(step);
  }

  /* плавный переход на другие страницы сайта */
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]'); if(!a||!pl)return;
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin||!/\.html?$/.test(url.pathname)||url.pathname===location.pathname)return;
    e.preventDefault();
    pl.hidden=false; pl.classList.remove('pl-written','pl-hide'); pl.classList.add('pl-leave');
    pl.querySelector('.pl-ink').style.strokeDashoffset=pl.querySelector('.pl-ink').getTotalLength();
    setTimeout(()=>{location.href=url.href;}, reduce?0:280);
  });
  addEventListener('pageshow',e=>{if(e.persisted&&pl){pl.hidden=true;pl.classList.remove('pl-leave');}});

  /* ---------- плашка cookie ---------- */
  if(!store.get('cookie-ok')){
    const b=document.createElement('div');
    b.className='cookie'; b.setAttribute('role','region'); b.setAttribute('aria-label','Уведомление о cookie');
    b.innerHTML='<p>Сайт использует cookie и хранилище браузера: запоминает тему оформления и этот выбор. Подробнее в <a href="'+ROOT+'privacy.html#cookie">политике обработки данных</a>.</p><button class="btn sm" type="button">Понятно</button>';
    document.body.appendChild(b);
    requestAnimationFrame(()=>b.classList.add('on'));
    b.querySelector('button').onclick=()=>{store.set('cookie-ok',new Date().toISOString());b.classList.remove('on');setTimeout(()=>b.remove(),400);};
  }
})();
