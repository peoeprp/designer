/* ==========================================================
   Отзывы: загрузка из базы, карусель, форма.
   Рисованная картинка у отзыва: поле art в базе = имя файла
   из папки img/reviews/. Заполняете его только вы, в панели базы.
   Пока картинки нет, рисуется скетч-заглушка «от руки».
   ========================================================== */
(function(){
  const cfg=SITE_CONFIG.reviews, $=s=>document.querySelector(s);
  const track=$('#revTrack'); if(!track)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const starRow=n=>'<span class="stars" aria-label="Оценка '+n+' из 5">'+[1,2,3,4,5].map(i=>`<svg viewBox="0 0 24 24" class="${i<=n?'on':''}"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`).join('')+'</span>';

  /* скетч-заглушка: случайный, но стабильный для имени «портрет от руки» */
  function seeded(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>((h=Math.imul(h^h>>>15,2246822507),h^=h>>>13,(h>>>0)/4294967296));}
  function doodle(name){
    const r=seeded(name||'гость'), j=(v,a)=>(v+(r()-.5)*a).toFixed(1);
    const loop=(cx,cy,rx,ry,n=18)=>{let d='';for(let i=0;i<=n+2;i++){const a=i/n*Math.PI*2+r()*.2;d+=(i?'L':'M')+j(cx+Math.cos(a)*rx,3)+' '+j(cy+Math.sin(a)*ry,3);}return d;};
    const hair=['M30 42 C34 18 66 16 70 40','M28 46 C30 22 52 14 72 34 M44 22 C52 26 62 30 70 42','M32 40 C36 30 44 26 50 30 C56 24 66 28 68 40 M50 30 L50 24','M30 40 C30 20 70 20 70 40 L74 64 M30 40 L26 62'][Math.floor(r()*4)];
    const extra=['<path d="M82 18l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L74 25l6-1z" class="dd-acc"/>','<path d="M80 30c-6-8 4-12 6-6 2-6 12-2 6 6l-6 6z" class="dd-acc"/>','<path d="M76 20c6 2 10 8 8 14M80 16c8 2 14 10 12 18" class="dd-acc"/>',''][Math.floor(r()*4)];
    return `<svg viewBox="0 0 100 100" class="doodle" aria-hidden="true">
      <path d="${loop(50,48,20,23)}" class="dd-ink"/>
      <path d="${hair}" class="dd-ink"/>
      <path d="M42 46 l0.5 2 M58 46 l0.5 2" class="dd-ink"/>
      <path d="M43 57 C47 ${j(62,3)} 54 ${j(62,3)} 58 56" class="dd-ink"/>
      <path d="M26 98 C28 ${j(76,4)} 40 ${j(72,4)} 50 72 C60 ${j(72,4)} 72 ${j(76,4)} 74 98" class="dd-ink"/>
      ${extra}</svg>`;
  }

  const fmtDate=d=>{try{return new Date(d).toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}catch(e){return''}};
  function card(rv){
    const art=doodle(rv.name)+(rv.art?`<img src="${esc(cfg.artFolder+rv.art)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`:'');
    return `<article class="rev-card"><div class="rev-art">${art}</div>${starRow(rv.rating|0)}
      <p class="rev-text">${esc(rv.text)}</p>
      <footer><b>${esc(rv.name)}</b><span>${fmtDate(rv.created_at)}</span></footer></article>`;
  }

  function empty(){
    track.innerHTML=`<article class="rev-card rev-empty"><div class="rev-art">${doodle('ваш отзыв')}</div>
      <p class="rev-text">Здесь появятся отзывы клиентов. Работали вместе? Расскажите, как всё прошло, — форма ниже.</p></article>`;
    $('#revSummary').hidden=true; updateNav();
  }
  function render(list){
    if(!list.length)return empty();
    track.innerHTML=list.map(card).join('');
    const avg=list.reduce((a,r)=>a+(r.rating|0),0)/list.length;
    const s=$('#revSummary'); s.hidden=false;
    s.innerHTML=`${starRow(Math.round(avg))}<b>${avg.toFixed(1).replace('.',',')}</b><span>${list.length} ${plural(list.length,['отзыв','отзыва','отзывов'])}</span>`;
    updateNav();
  }
  const plural=(n,f)=>f[(n%10===1&&n%100!==11)?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?1:2];

  /* ---------- запросы к базе ---------- */
  const base=()=>cfg.url.replace(/\/$/,'');
  const sbHeaders=()=>({'apikey':cfg.key,'Authorization':'Bearer '+cfg.key,'Content-Type':'application/json'});
  async function load(){
    if(cfg.provider==='none'||!cfg.url)return [];
    const CK='reviews-cache';
    try{const c=JSON.parse(sessionStorage.getItem(CK)||'null'); if(c&&Date.now()-c.t<5*60e3)return c.d;}catch(e){}
    let res;
    if(cfg.provider==='supabase') res=await fetch(`${base()}/rest/v1/${cfg.table}?select=name,rating,text,art,created_at&approved=eq.true&order=created_at.desc&limit=50`,{headers:sbHeaders()});
    else res=await fetch(base());
    if(!res.ok)throw new Error(res.status);
    const d=await res.json();
    try{sessionStorage.setItem(CK,JSON.stringify({t:Date.now(),d}))}catch(e){}
    return d;
  }
  async function send(r){
    let res;
    if(cfg.provider==='supabase') res=await fetch(`${base()}/rest/v1/${cfg.table}`,{method:'POST',headers:{...sbHeaders(),'Prefer':'return=minimal'},body:JSON.stringify(r)});
    // text/plain — «простой» запрос: браузер не делает предварительную проверку CORS,
    // функция всё равно читает тело как JSON
    else res=await fetch(base(),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(r)});
    if(!res.ok)throw new Error(res.status);
  }

  /* подгружаем, когда блок приближается к экрану */
  let started=false;
  new IntersectionObserver((es,o)=>{if(!es[0].isIntersecting||started)return;started=true;o.disconnect();
    track.innerHTML='<article class="rev-card rev-skel"></article>'.repeat(3);
    load().then(render).catch(()=>{empty();$('#revErr').hidden=false;});
  },{rootMargin:'400px'}).observe(track);

  /* ---------- карусель: стрелки, перетаскивание ---------- */
  const prev=$('#revPrev'), next=$('#revNext');
  function updateNav(){const max=track.scrollWidth-track.clientWidth-2;prev.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft>=max;}
  const stepW=()=>(track.querySelector('.rev-card')?.offsetWidth||300)+16;
  prev.onclick=()=>track.scrollBy({left:-stepW(),behavior:'smooth'});
  next.onclick=()=>track.scrollBy({left:stepW(),behavior:'smooth'});
  track.addEventListener('scroll',()=>requestAnimationFrame(updateNav),{passive:true});
  addEventListener('resize',updateNav);
  let drag=null;
  track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;drag={x:e.clientX,l:track.scrollLeft,moved:false};track.classList.add('drag');});
  addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>4)drag.moved=true;track.scrollLeft=drag.l-dx;});
  addEventListener('pointerup',()=>{if(!drag)return;drag=null;track.classList.remove('drag');});

  /* ---------- форма ---------- */
  const form=$('#revForm'), msg=$('#revMsg');
  const say=(t,ok)=>{msg.hidden=false;msg.className='rev-msg '+(ok?'ok':'bad');msg.textContent=t;};
  $('#rvText').addEventListener('input',e=>{$('#rvCount').textContent=e.target.value.length+' / 600';});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(form.website.value)return;              // ловушка для ботов
    const name=$('#rvName').value.trim(), text=$('#rvText').value.trim();
    const rating=+(form.querySelector('input[name="rating"]:checked')?.value||0);
    if(name.length<2)return say('Напишите имя, хотя бы 2 буквы.'),$('#rvName').focus();
    if(!rating)return say('Поставьте оценку от 1 до 5 звёзд.');
    if(text.length<10)return say('Отзыв слишком короткий: напишите хотя бы пару предложений.'),$('#rvText').focus();
    if(!$('#rvConsent').checked)return say('Отметьте согласие на обработку персональных данных.');
    let last=0;try{last=+localStorage.getItem('review-sent')||0}catch(e){}
    if(Date.now()-last<10*60e3)return say('Вы уже отправили отзыв. Следующий можно через 10 минут.');
    if(cfg.provider==='none'||!cfg.url)return say('Форма отзывов скоро заработает. Пока можно прислать отзыв мне в Telegram: @peoeprp.');
    const btn=form.querySelector('button[type=submit]'); btn.disabled=true;
    try{
      await send({name:name.slice(0,40),rating,text:text.slice(0,600)});
      try{localStorage.setItem('review-sent',Date.now())}catch(e){}
      form.reset(); $('#rvCount').textContent='0 / 600';
      say('Спасибо! Отзыв появится на сайте после проверки.',true);
    }catch(err){say('Не получилось отправить отзыв. Попробуйте позже или напишите мне в Telegram: @peoeprp.');}
    btn.disabled=false;
  });
})();
