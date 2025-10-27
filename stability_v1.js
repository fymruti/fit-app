/* stability_v1.js — twarde logowanie + HUD + panel diagnostyczny (?diag=1) — v12.2.6 */
(function(){
  const NS = 'fit_stability_v1';
  const BUF_KEY = NS+':log';
  const BUF_MAX = 200;
  const state = { hud:null };

  function now(){ return new Date().toISOString(); }
  function readBuf(){ try{ return JSON.parse(localStorage.getItem(BUF_KEY)||'[]'); }catch(_){ return []; } }
  function writeBuf(a){ try{ localStorage.setItem(BUF_KEY, JSON.stringify(a.slice(-BUF_MAX))); }catch(_){ } }
  function log(level, msg, meta){
    const rec = { t: now(), level, msg: String(msg||''), meta: meta||null };
    const a = readBuf(); a.push(rec); writeBuf(a);
    if(console && console[level||'log']) console[level||'log']('[FIT]', rec);
    hud(`${level.toUpperCase()}: ${rec.msg}`);
  }
  function hud(txt){
    try{
      if(!state.hud){
        const d = document.createElement('div');
        d.style.cssText='position:fixed;left:8px;bottom:8px;max-width:70vw;background:rgba(0,0,0,.65);color:#fff;border-radius:8px;padding:6px 10px;font:12px system-ui;z-index:9999;display:none';
        d.id='fit_hud'; document.body.appendChild(d); state.hud=d;
      }
      state.hud.textContent = txt;
      state.hud.style.display='block';
      clearTimeout(state.hud._t);
      state.hud._t = setTimeout(()=>{state.hud.style.display='none'}, 4000);
    }catch(_){}
  }

  // PRZECHWYTYWANIE BŁĘDÓW
  window.addEventListener('error', (e)=>{
    log('error', e.message||'window.error', {source:e.filename, line:e.lineno, col:e.colno, stack: (e.error && e.error.stack)||null});
  });
  window.addEventListener('unhandledrejection', (e)=>{
    // ✅ POPRAWKA: używamy && zamiast "and"
    log('error', 'unhandledrejection', {reason: (e.reason && (e.reason.message||String(e.reason)))||String(e), stack: e.reason && e.reason.stack});
  });

  // Helpery
  function qs(sel, root){ const el=(root||document).querySelector(sel); if(!el) log('warn', 'qs() not found: '+sel); return el; }
  function on(el, ev, fn, opts){ try{ el && el.addEventListener(ev, fn, opts||{passive:true}); }catch(e){ log('error','on() failed '+ev,{e:String(e)}); } }
  async function fetchRetry(url, opt={}, tries=3, backoff=300){
    for(let i=0;i<tries;i++){
      try{
        const r = await fetch(url, {...opt, cache:'no-cache'});
        if(!r.ok) throw new Error('HTTP '+r.status);
        return r;
      }catch(err){
        log('warn', 'fetch fail '+url, {try:i+1, err:String(err)});
        if(i===tries-1) throw err;
        await new Promise(res=>setTimeout(res, backoff*(i+1)));
      }
    }
  }

  // Panel diagnostyczny
  function diagPanel(){
    const wrap = document.createElement('div');
    wrap.style.cssText='position:fixed;inset:10px;background:#0b1220;color:#e2e8f0;border:1px solid #334155;border-radius:12px;z-index:99999;padding:10px;display:flex;flex-direction:column';
    wrap.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b>Diagnostyka Fit</b><div><button id="fit_dl" style="margin-right:6px">Pobierz log</button><button id="fit_x">Zamknij</button></div></div><textarea id="fit_area" style="flex:1;width:100%;background:#0b1220;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px;font:12px/1.3 ui-monospace,Menlo,Consolas"></textarea>';
    document.body.appendChild(wrap);
    const area = qs('#fit_area', wrap); area.value = JSON.stringify(readBuf(), null, 2);
    on(qs('#fit_x', wrap), 'click', ()=>wrap.remove());
    on(qs('#fit_dl', wrap), 'click', ()=>{
      try{
        const blob = new Blob([area.value], {type:'application/json;charset=utf-8'});
        const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
        a.download = 'fit-diagnostic-'+Date.now()+'.json'; a.click();
      }catch(e){ log('error','download log fail', {e:String(e)}); }
    });
  }

  try{
    const url = new URL(location.href);
    if(url.searchParams.get('diag')==='1'){ setTimeout(diagPanel, 100); }
  }catch(_){}

  window.FIT_STAB = { log, qs, on, fetchRetry, hud };
})();
