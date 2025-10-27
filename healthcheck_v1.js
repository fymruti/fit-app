/* healthcheck_v1.js — raport sprawności do TXT */
(function(){
  function version(){ return document.querySelector('meta[name=app-version]')?.content || '?'; }
  function now(){ const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function fname(){ const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    return `FIT_report_v${version()}_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.txt`;
  }

  async function runChecks(){
    const checks = [];
    let lsOk=false; try{ localStorage.setItem('fit_test','1'); localStorage.removeItem('fit_test'); lsOk=true; }catch(_){}
    checks.push({name:'localStorage', ok:lsOk});

    let hasOk=false; try{ hasOk = CSS?.supports?.('selector(:has(*))') || false; }catch(_){}
    checks.push({name:'css_has_selector', ok:!!hasOk});

    const startVisible = !!document.querySelector('main > section#start');
    checks.push({name:'tabs_css_target_present', ok:startVisible});

    const dmTogglePossible = document.body.classList != null;
    checks.push({name:'darkmode_toggle_possible', ok:dmTogglePossible});

    const stab = !!window.FIT_STAB;
    checks.push({name:'stability_present', ok:stab});

    return checks;
  }

  function asText(checks){
    const pass = c=>c.ok?'OK':'FAIL';
    let lines = [];
    lines.push(`FIT — Raport sprawności`);
    lines.push(`Data: ${now()}`);
    lines.push(`Wersja: v${version()}`);
    lines.push(`Przeglądarka: ${navigator.userAgent}`);
    lines.push(`---`);
    checks.forEach(c=>lines.push(`${c.name}: ${pass(c)}`));
    lines.push(`---`);
    lines.push(`Uwaga: jeśli coś jest FAIL — kliknij 🧪Diag i pobierz log JSON.`);
    return lines.join('\n');
  }

  async function buildReport(){
    const checks = await runChecks();
    const text = asText(checks);
    try{ FIT_STAB?.log('info','health report', {checks}); }catch(_){}
    return text;
  }

  function buildFilename(){ return fname(); }

  window.FIT_HEALTH = { buildReport, buildFilename };
})();