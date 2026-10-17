(() => {
  'use strict';
  const AGE = {'2-3':'2～3岁','4-5':'4～5岁','6-8':'6～8岁'};
  const SCENE = {home:'在家',outdoor:'户外',travel:'旅途中',bedtime:'睡前',table:'餐桌边',party:'多人聚会'};
  const TYPE = {thinking:'动脑',movement:'运动',funny:'搞笑',observation:'观察',language:'语言'};
  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const validGames = Array.isArray(window.GAMES) ? window.GAMES.filter(g => g && typeof g.id === 'string' && g.isPublished === true && typeof g.name === 'string' && Array.isArray(g.eligibleAgeGroups) && Array.isArray(g.scenes) && Array.isArray(g.types) && Array.isArray(g.materials) && Array.isArray(g.steps) && g.steps.length >= 3 && Array.isArray(g.variations) && Array.isArray(g.safetyNotes) && Number.isFinite(g.minAge) && Number.isFinite(g.maxAge) && Number.isFinite(g.durationMin) && Number.isFinite(g.durationMax)) : [];
  const gameById = new Map(validGames.map(g => [g.id, g]));
  const defaults = {age:'',scene:'',type:'',noExtra:false,seen:[],batch:[],origin:'home',recent:[],exhausted:false};
  let state = {...defaults};
  let favorites = [];
  let storageOK = true;
  let busy = false;
  let toastTimer;

  function getJSON(storage, key, fallback) {
    try { const value = JSON.parse(storage.getItem(key)); return value ?? fallback; } catch { return fallback; }
  }
  try {
    const raw = getJSON(sessionStorage, 'gamebox-session-v1', {});
    state = {...defaults, ...raw};
    if (!AGE[state.age]) state.age = '';
    if (state.scene && !SCENE[state.scene]) state.scene = '';
    if (state.type && !TYPE[state.type]) state.type = '';
    state.noExtra = !!state.noExtra;
    state.seen = Array.isArray(state.seen) ? state.seen.filter(id => gameById.has(id)) : [];
    state.batch = Array.isArray(state.batch) ? state.batch.filter(id => gameById.has(id)) : [];
    state.recent = Array.isArray(state.recent) ? state.recent.filter(id => gameById.has(id)).slice(0, 8) : [];
  } catch { /* Recommendation works without session storage. */ }
  try {
    favorites = getJSON(localStorage, 'gamebox-favorites-v1', []);
    if (!Array.isArray(favorites)) favorites = [];
    favorites = [...new Set(favorites.filter(id => gameById.has(id)))];
    localStorage.setItem('gamebox-favorites-v1', JSON.stringify(favorites));
  } catch { storageOK = false; favorites = []; }

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rand = max => Math.floor(Math.random() * max);
  const shuffle = items => { const a = [...items]; for (let i=a.length-1;i>0;i--) { const j=rand(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const saveSession = () => { try { sessionStorage.setItem('gamebox-session-v1', JSON.stringify(state)); } catch {} };
  function notice(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'), 3300); }
  function route() { try { const value=decodeURIComponent(location.hash.slice(1) || '/'); return value.startsWith('/') ? value : '/'; } catch { return '/'; } }
  function navigate(path) { if (location.hash === '#' + path) render(); else location.hash = path; }
  function heading(eyebrow, title, body='') { return `<div class="heading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${body ? `<p class="intro">${body}</p>` : ''}</div>`; }
  function candidateGames() { return validGames.filter(g => g.eligibleAgeGroups.includes(state.age) && (!state.scene || g.scenes.includes(state.scene)) && (!state.type || g.types.includes(state.type)) && (!state.noExtra || g.noExtraMaterials)); }
  function conditions() { return [AGE[state.age], state.scene && SCENE[state.scene], state.type && TYPE[state.type], state.noExtra && '无需额外道具'].filter(Boolean); }
  function filterSummary() { return conditions().map(x=>`<span>${esc(x)}</span>`).join('<i aria-hidden="true">·</i>'); }
  function resetRecommendation() { state.seen=[]; state.batch=[]; state.exhausted=false; saveSession(); }
  function pickOne() { const pool=shuffle(candidateGames().filter(g=>!state.seen.includes(g.id))); const chosen=pool[0]; if (chosen) { state.seen.push(chosen.id); state.exhausted=false; saveSession(); } return chosen; }
  function pickBatch() { const pool=shuffle(candidateGames().filter(g=>!state.seen.includes(g.id))).slice(0,3); state.batch=pool.map(g=>g.id); state.seen.push(...state.batch); state.exhausted=pool.length===0; saveSession(); return pool; }
  function requireAge() { if (state.age) return true; document.querySelector('#age-error')?.removeAttribute('hidden'); document.querySelector('#age-group')?.focus(); notice('先选一下孩子年龄'); return false; }
  function startRandom() { if (!requireAge() || busy) return; busy=true; const g=pickOne(); state.origin='home'; saveSession(); if (g) navigate('/game/'+encodeURIComponent(g.id)); else navigate('/results'); setTimeout(()=>busy=false,150); }
  function startList() { if (!requireAge() || busy) return; busy=true; resetRecommendation(); pickBatch(); navigate('/results'); setTimeout(()=>busy=false,150); }
  function optionGroup(label, key, options, optional=false) {
    const value=state[key];
    return `<fieldset class="filter-group" id="${key}-group" tabindex="-1"><legend><span class="filter-number">${key==='age'?'01':key==='scene'?'02':'03'}</span>${label}${optional?'<small>选填</small>':'<small>必选</small>'}</legend><div class="options">${options.map(([id,text])=>`<button type="button" class="option ${value===id?'selected':''}" data-filter="${key}" data-value="${id}" aria-pressed="${value===id}">${value===id?'<span class="check" aria-hidden="true">✓</span>':''}${text}</button>`).join('')}</div>${key==='age'?'<p id="age-error" class="field-error" hidden>先选一下孩子年龄</p>':''}</fieldset>`;
  }
  function home() {
    const recents=state.recent.slice(0,3).map(id=>gameById.get(id)).filter(Boolean);
    return `<section class="hero"><div class="hero-illustration" aria-hidden="true"><span class="sun">✦</span><span class="box"><span class="box-face">•ᴥ•</span></span><span class="spark spark-one">✳</span><span class="spark spark-two">✴</span></div><div class="hero-copy"><p class="eyebrow">给今天一点好玩的灵感</p><h1>今天陪娃<br><em>玩什么？</em></h1><p>选几个条件，马上找到好玩的。每个游戏都能照着步骤，立即开始。</p></div></section>
      <section class="filter-panel" aria-label="找游戏"><div class="panel-head"><div><p class="eyebrow">PLAY FINDER</p><h2>找一个刚刚好的游戏</h2></div><span class="tiny-doodle" aria-hidden="true">✳</span></div>
      ${optionGroup('孩子的年龄','age',Object.entries(AGE))}
      ${optionGroup('现在在哪里玩','scene',[['','不限场景'],...Object.entries(SCENE)],true)}
      ${optionGroup('想玩哪一类','type',[['','不限类型'],...Object.entries(TYPE)],true)}
      <label class="toggle-row"><span><strong>无需额外道具</strong><small>用身边已有的东西就能玩</small></span><input id="no-extra" type="checkbox" ${state.noExtra?'checked':''}><span class="switch" aria-hidden="true"></span></label>
      <div class="actions"><button class="button primary" data-action="random">🎲 <span>随机抽一个游戏</span><span aria-hidden="true">→</span></button><button class="button secondary" data-action="list">看看有哪些游戏</button></div></section>
      ${recents.length?`<section class="recent-section"><div class="section-title"><div><p class="eyebrow">RECENTLY PLAYED</p><h2>最近看过</h2></div></div><div class="recent-list">${recents.map(g=>`<a href="#/game/${encodeURIComponent(g.id)}" data-origin="home">${esc(g.name)} <span aria-hidden="true">↗</span></a>`).join('')}</div></section>`:''}`;
  }
  function favoriteButton(g, small=false) { const active=favorites.includes(g.id); return `<button class="favorite-button ${small?'small':''} ${active?'active':''}" data-favorite="${esc(g.id)}" aria-label="${active?'取消收藏':'收藏'}${esc(g.name)}" aria-pressed="${active}">${active?'♥':'♡'}</button>`; }
  function card(g) { return `<article class="game-card"><div class="card-top"><span class="card-icon" aria-hidden="true">${icon(g.types[0])}</span>${favoriteButton(g,true)}</div><div class="card-body"><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p></div><div class="card-meta"><span>${g.minAge}～${g.maxAge}岁</span><span>${g.durationMin}～${g.durationMax}分钟</span>${g.noExtraMaterials?'<span>无需额外道具</span>':''}</div><div class="card-bottom"><span>准备：${esc(g.materials.length?g.materials.join('、'):'不需要材料')}</span><a class="text-link" href="#/game/${encodeURIComponent(g.id)}" data-origin="${route()==='/favorites'?'favorites':'results'}">查看玩法 <span aria-hidden="true">→</span></a></div></article>`; }
  function icon(type) { return ({thinking:'✳',movement:'✦',funny:'☺',observation:'◉',language:'✧'})[type]||'✦'; }
  function results() {
    if (!state.age) return `<section class="empty-state">${heading('RESULTS','先选孩子的年龄','选择年龄后，就能看到适合的游戏。')}<a class="button primary" href="#/">去选择年龄</a></section>`;
    const matches=candidateGames(); const batch=state.batch.map(id=>gameById.get(id)).filter(g=>g&&matches.includes(g));
    const top=`<section class="result-head"><a class="back-link" href="#/">← 修改条件</a>${heading('YOUR PICKS','给你们的游戏清单',`${matches.length} 款游戏符合当前条件`) }<div class="condition-line">${filterSummary()}</div></section>`;
    if (!matches.length) return top+`<section class="empty-state"><div class="empty-icon" aria-hidden="true">☁</div><h2>暂时没有找到合适的游戏</h2><p>可以试试放宽一个条件，继续找。</p><div class="empty-actions">${state.type?'<button class="button secondary" data-relax="type">不限类型</button>':''}${state.scene?'<button class="button secondary" data-relax="scene">不限场景</button>':''}<a class="button primary" href="#/">修改年龄</a></div></section>`;
    if (!batch.length && state.exhausted) return top+`<section class="empty-state"><div class="empty-icon" aria-hidden="true">✓</div><h2>这类游戏已经看完啦</h2><p>已经看过 ${state.seen.length} 款符合条件的游戏。</p><div class="empty-actions"><button class="button primary" data-action="restart-list">重新看看</button><a class="button secondary" href="#/">修改条件</a></div></section>`;
    return top+`<section class="results-list">${batch.map(card).join('')}</section><div class="results-actions">${candidateGames().some(g=>!state.seen.includes(g.id))?'<button class="button secondary" data-action="next-batch">换一批 <span aria-hidden="true">↻</span></button>':'<p class="end-note">这类游戏已经看完啦 <button data-action="restart-list">重新看看</button></p>'}</div>`;
  }
  function detail(id) {
    const g=gameById.get(id);
    if (!g) return `<section class="empty-state missing"><div class="empty-icon" aria-hidden="true">?</div><h1>游戏不存在或已下架</h1><p>可能是旧链接，换一个游戏看看吧。</p><div class="empty-actions"><a class="button primary" href="#/">返回首页</a><a class="button secondary" href="#/favorites">我的收藏</a></div></section>`;
    state.recent=[g.id,...state.recent.filter(x=>x!==g.id)].slice(0,8); saveSession();
    const back=state.origin==='favorites'?'/favorites':state.origin==='results'?'/results':'/';
    const tags=[`${g.minAge}～${g.maxAge}岁`,...g.scenes.slice(0,2).map(x=>SCENE[x]),...g.types.slice(0,2).map(x=>TYPE[x]),`${g.durationMin}～${g.durationMax}分钟`];
    return `<article class="detail"><a class="back-link" href="#${back}">← 返回${state.origin==='favorites'?'收藏':state.origin==='results'?'结果':'首页'}</a><div class="detail-hero"><div class="detail-hero-art" aria-hidden="true"><span>${icon(g.types[0])}</span></div><p class="eyebrow">A LITTLE GAME FOR TODAY</p><h1>${esc(g.name)}</h1><p class="detail-desc">${esc(g.description)}</p><div class="tags">${tags.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>
      <div class="detail-content"><section class="detail-section"><h2><span>01</span>准备材料</h2><p>${esc(g.materials.length?g.materials.join('、'):'不需要准备材料')}</p>${g.noExtraMaterials?'<p class="material-note">✓ 无需额外购买道具</p>':''}</section>
      <section class="detail-section"><h2><span>02</span>怎么玩</h2><ol class="steps">${g.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>
      <section class="detail-section"><h2><span>03</span>换个玩法</h2><div class="variation-list">${g.variations.map(x=>`<p>${esc(x)}</p>`).join('')}</div></section>
      <section class="detail-section safety"><h2><span>!</span>安全小提醒</h2><ul>${g.safetyNotes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section></div>
      <div class="detail-actions"><button class="button secondary favorite-action ${favorites.includes(g.id)?'is-favorite':''}" data-favorite="${esc(g.id)}">${favorites.includes(g.id)?'♥ 已收藏':'♡ 收藏游戏'}</button><button class="button primary" data-action="next-game">换一个游戏 <span aria-hidden="true">→</span></button></div><div id="detail-end" class="detail-end" hidden></div></article>`;
  }
  function favoritesPage() {
    const games=favorites.map(id=>gameById.get(id)).filter(Boolean);
    return `<section class="favorites-page"><a class="back-link" href="#/">← 返回首页</a>${heading('YOUR COLLECTION','我的收藏',games.length?`收藏了 ${games.length} 款喜欢的游戏，想玩时随时打开。`:'喜欢的游戏，收藏起来下次接着玩。')}${games.length?`<div class="results-list">${games.map(card).join('')}</div>`:`<div class="empty-state"><div class="empty-icon" aria-hidden="true">♡</div><h2>这里还没有收藏游戏</h2><p>找到喜欢的游戏，点爱心就能收进来。</p><a class="button primary" href="#/">去找游戏</a></div>`}<p class="storage-note">收藏保存在当前浏览器。清理浏览器数据或更换设备后可能丢失。${storageOK?'':' 当前浏览器暂不能保存收藏。'}</p></section>`;
  }
  function render(preserveScroll=false) {
    const oldScroll=window.scrollY;
    const path=route();
    document.querySelector('#favorite-count').textContent=favorites.length;
    document.querySelector('#favorite-count').hidden=favorites.length===0;
    if(path==='/') app.innerHTML=home();
    else if(path==='/results') app.innerHTML=results();
    else if(path==='/favorites') app.innerHTML=favoritesPage();
    else if(path.startsWith('/game/')) app.innerHTML=detail(path.slice(6));
    else app.innerHTML=detail('');
    document.title=(path==='/favorites'?'我的收藏':path==='/results'?'推荐结果':path.startsWith('/game/')?(gameById.get(path.slice(6))?.name||'游戏详情'):'亲子游戏盒')+' · 亲子游戏盒';
    window.scrollTo({top:preserveScroll?oldScroll:0,behavior:'instant'});
  }
  document.addEventListener('click', e => {
    const filter=e.target.closest('[data-filter]');
    if(filter) { const key=filter.dataset.filter; const value=filter.dataset.value; if(state[key]!==value) { state[key]=value; resetRecommendation(); render(true); } return; }
    const origin=e.target.closest('[data-origin]'); if(origin) { state.origin=origin.dataset.origin; saveSession(); }
    const fav=e.target.closest('[data-favorite]');
    if(fav) { const id=fav.dataset.favorite; if(!gameById.has(id)) return; if(!storageOK) { notice('当前浏览器暂不能保存收藏'); return; } const previous=favorites; favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[id,...favorites]; try {localStorage.setItem('gamebox-favorites-v1',JSON.stringify(favorites));} catch {favorites=previous;storageOK=false;notice('当前浏览器暂不能保存收藏');return;} notice(favorites.includes(id)?'已加入收藏':'已取消收藏'); render(true); return; }
    const relax=e.target.closest('[data-relax]'); if(relax) {state[relax.dataset.relax]='';resetRecommendation();pickBatch();render();return;}
    const action=e.target.closest('[data-action]'); if(!action) return;
    switch(action.dataset.action) {
      case 'random': startRandom(); break;
      case 'list': startList(); break;
      case 'next-batch': pickBatch(); render(); break;
      case 'restart-list': resetRecommendation(); pickBatch(); render(); break;
      case 'next-game': {
        if(busy) return; busy=true;
        const current=route().slice(6); const candidates=candidateGames();
        if(!state.seen.includes(current) && candidates.some(g=>g.id===current)) { state.seen.push(current); saveSession(); }
        const next=pickOne();
        if(next) navigate('/game/'+encodeURIComponent(next.id));
        else { const box=document.querySelector('#detail-end'); box.hidden=false; box.innerHTML='<p>这类游戏已经看完，可以重新抽取或更改条件。</p><div class="empty-actions"><button class="button secondary" data-action="restart-game">重新抽取</button><a class="button secondary" href="#/">更改条件</a></div>'; box.scrollIntoView({behavior:'smooth',block:'nearest'}); }
        setTimeout(()=>busy=false,150); break;
      }
      case 'restart-game': resetRecommendation(); state.origin='home'; { const next=pickOne(); if(next) navigate('/game/'+encodeURIComponent(next.id)); else navigate('/results'); } break;
    }
  });
  document.addEventListener('change', e => { if(e.target.id==='no-extra') { state.noExtra=e.target.checked; resetRecommendation(); render(true); } });
  window.addEventListener('hashchange',render);
  if (!storageOK) setTimeout(()=>notice('当前浏览器暂不能保存收藏，仍可继续找游戏'),500);
  render();
})();
