/* Diglio citizenship tracker — app shell.
   Auth is Supabase email + password. Every read and write is scoped to the
   signed-in user by RLS, so the anon key below is safe to publish. */

const SUPABASE_URL = 'https://bawcxalgdcuwnpkajkxa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhd2N4YWxnZGN1d25wa2Fqa3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDYwNzEsImV4cCI6MjA5ODYyMjA3MX0.QhFaq71FKL_YvYT7B3PaPKh7hNxlBp6I2puaAuzswS4';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- state ---------- */

const state = {
  user: null,
  progress: new Map(), // item_key -> {status, notes}
  facts: new Map(),    // fact_key -> {value, source}
  log: [],
  costs: [],
  view: 's1',
};

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const allItemKeys = (step) => [
  ...(step.items || []).map((i) => i.k),
  ...(step.chain || []).flatMap((c) => (step.chainStages || []).map((s) => `${c.k}.${s.s}`)),
];

const getP = (k) => state.progress.get(k) || { status: 'open', notes: '' };
const isDone = (k) => ['found', 'norecord', 'na'].includes(getP(k).status);

/* ---------- save indicator ---------- */

let flagTimer;
function flash(text, isErr) {
  const el = $('#saveflag');
  el.textContent = text;
  el.dataset.on = 'true';
  el.dataset.err = isErr ? 'true' : 'false';
  clearTimeout(flagTimer);
  flagTimer = setTimeout(() => { el.dataset.on = 'false'; }, isErr ? 5000 : 1400);
}

/* ---------- auth ---------- */

async function boot() {
  const { data } = await sb.auth.getSession();
  state.user = data.session?.user ?? null;
  sb.auth.onAuthStateChange((_e, session) => {
    const next = session?.user ?? null;
    const changed = next?.id !== state.user?.id;
    state.user = next;
    if (changed) render();
  });
  await render();
}

async function render() {
  if (!state.user) { renderGate(); return; }
  renderApp();
  await loadAll();
}

function renderGate() {
  document.body.innerHTML = `
    <div class="gate">
      <div class="gate-card">
        <p class="eyebrow">In re: ${esc(CASE.subject)}</p>
        <h1>${esc(CASE.question)}</h1>
        <p class="sub">Sign in to open the evidence file.</p>
        <form id="authform" novalidate>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" autocomplete="email" required>
          </div>
          <div class="field">
            <label for="pw">Password</label>
            <input id="pw" type="password" autocomplete="current-password" required minlength="8">
          </div>
          <button class="btn wide" type="submit" id="signin">Sign in</button>
          <p class="msg" id="authmsg" role="status"></p>
        </form>
        <div class="gate-alt">
          First time here?
          <button class="linkbtn" id="signup">Create the account</button>
        </div>
      </div>
    </div>
    <div class="saveflag" id="saveflag"></div>`;

  const msg = $('#authmsg');
  const creds = () => ({ email: $('#email').value.trim(), password: $('#pw').value });

  $('#authform').addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'msg';
    msg.textContent = 'Checking…';
    const { error } = await sb.auth.signInWithPassword(creds());
    if (error) { msg.className = 'msg err'; msg.textContent = error.message; }
  });

  $('#signup').addEventListener('click', async () => {
    const c = creds();
    if (!c.email || c.password.length < 8) {
      msg.className = 'msg err';
      msg.textContent = 'Enter an email and a password of at least 8 characters, then press Create the account.';
      return;
    }
    msg.className = 'msg';
    msg.textContent = 'Creating…';
    const { error } = await sb.auth.signUp(c);
    if (error) { msg.className = 'msg err'; msg.textContent = error.message; return; }
    msg.className = 'msg ok';
    msg.textContent = 'Account created. If email confirmation is on, click the link, then sign in.';
  });
}

/* ---------- app shell ---------- */

function renderApp() {
  document.body.innerHTML = `
    <header class="masthead">
      <div class="caption-bar">
        <span><b>In re</b> ${esc(CASE.subject)}</span>
        <span><b>b.</b> ${esc(CASE.born)}</span>
        <span><b>d.</b> ${esc(CASE.died)}</span>
        <span class="spacer"></span>
        <span><b>Statute</b> ${esc(CASE.statute)}</span>
        <button class="linkbtn" id="signout" style="font-family:var(--mono);font-size:11px;letter-spacing:.07em">Sign out</button>
      </div>
      <h1 class="thesis">${esc(CASE.question)}</h1>
      <p class="thesis-sub">${esc(CASE.objective)}</p>
      <nav class="strip" id="strip" aria-label="Steps"></nav>
    </header>
    <div class="shell">
      <aside class="rail">
        <div class="rail-head">
          <p class="eyebrow">Evidence ledger</p>
          <p class="eyebrow" id="total"></p>
        </div>
        <div id="ledger"></div>
        <div class="rail-nav" id="railnav"></div>
      </aside>
      <main class="main" id="main"></main>
    </div>
    <div class="saveflag" id="saveflag"></div>`;

  $('#signout').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.reload();
  });

  const EXTRA = [
    ['pivot', 'The 1906 line'],
    ['names', 'Name variants'],
    ['tree', 'Decision tree'],
    ['log', 'Research log'],
    ['costs', 'Money spent'],
    ['open', 'Open questions'],
  ];

  $('#railnav').innerHTML = EXTRA.map(
    ([id, label]) => `<button class="navlink" data-view="${id}">${esc(label)}</button>`
  ).join('');

  document.body.addEventListener('click', (e) => {
    const t = e.target.closest('[data-view]');
    if (!t) return;
    state.view = t.dataset.view;
    paint();
    if (window.innerWidth <= 900) $('#main').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- data ---------- */

async function loadAll() {
  const uid = state.user.id;
  const [p, f, l, c] = await Promise.all([
    sb.from('diglio_progress').select('item_key,status,notes').eq('user_id', uid),
    sb.from('diglio_facts').select('fact_key,value,source').eq('user_id', uid),
    sb.from('diglio_log').select('*').eq('user_id', uid).order('entered_on', { ascending: false }),
    sb.from('diglio_costs').select('*').eq('user_id', uid).order('spent_on', { ascending: false }),
  ]);

  const firstErr = [p, f, l, c].find((r) => r.error);
  if (firstErr) { flash('Load failed', true); console.error(firstErr.error); }

  state.progress = new Map((p.data || []).map((r) => [r.item_key, { status: r.status, notes: r.notes }]));
  state.facts = new Map((f.data || []).map((r) => [r.fact_key, { value: r.value, source: r.source }]));
  state.log = l.data || [];
  state.costs = c.data || [];
  paint();
}

async function saveProgress(key, patch) {
  const cur = getP(key);
  const next = { ...cur, ...patch };
  state.progress.set(key, next);
  paintLedger();
  const { error } = await sb.from('diglio_progress').upsert(
    { user_id: state.user.id, item_key: key, status: next.status, notes: next.notes, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,item_key' }
  );
  flash(error ? 'Not saved' : 'Saved', !!error);
  if (error) console.error(error);
}

async function saveFact(key, patch) {
  const cur = state.facts.get(key) || { value: '', source: '' };
  const next = { ...cur, ...patch };
  state.facts.set(key, next);
  const { error } = await sb.from('diglio_facts').upsert(
    { user_id: state.user.id, fact_key: key, value: next.value, source: next.source, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,fact_key' }
  );
  flash(error ? 'Not saved' : 'Saved', !!error);
  if (error) console.error(error);
  paint();
}

/* ---------- painting ---------- */

function paint() {
  paintStrip();
  paintLedger();
  paintMain();
}

function stepStats(step) {
  const keys = allItemKeys(step);
  return { done: keys.filter(isDone).length, total: keys.length };
}

function paintStrip() {
  const strip = $('#strip');
  if (!strip) return;
  strip.innerHTML = STEPS.map((s) => {
    const { done, total } = stepStats(s);
    const pct = total ? (done / total) * 100 : 0;
    return `<button class="strip-cell" data-view="${s.id}" aria-current="${state.view === s.id}"
      title="${esc(s.title)}">
      <span class="strip-num">${s.num}</span>
      <span class="strip-name">${esc(s.title)}</span>
      <span class="strip-bar"><span style="width:${pct}%"></span></span>
      <span class="strip-frac">${done}/${total}</span>
    </button>`;
  }).join('');
}

function paintLedger() {
  const led = $('#ledger');
  if (!led) return;
  let dTot = 0, tTot = 0;
  led.innerHTML = STEPS.map((s) => {
    const { done, total } = stepStats(s);
    dTot += done; tTot += total;
    return `<button class="ledger-row" data-view="${s.id}" aria-current="${state.view === s.id}">
      <span class="ledger-num">${s.num}</span>
      <span class="ledger-title">${esc(s.title)}</span>
      <span class="ledger-count ${done === total && total ? 'done' : ''}">${done}/${total}</span>
    </button>`;
  }).join('');
  $('#total').textContent = `${dTot}/${tTot}`;
  paintStrip();
  document.querySelectorAll('.navlink').forEach((b) => {
    b.setAttribute('aria-current', String(b.dataset.view === state.view));
  });
}

function statusCell(key) {
  const st = getP(key).status;
  const opts = STATUS_ORDER.map(
    (s) => `<option value="${s}" ${s === st ? 'selected' : ''}>${STATUSES[s].code}</option>`
  ).join('');
  return `<span class="statuscell" data-s="${st}">
    <label class="sr-only" for="st-${key}">Status</label>
    <select id="st-${key}" data-status-for="${key}"
      title="${esc(STATUSES[st].l)} — ${esc(STATUSES[st].d)}">${opts}</select>
  </span>`;
}

function itemRow(it) {
  const p = getP(it.k);
  const hasNote = p.notes.trim().length > 0;
  return `<div class="item" data-s="${p.status}">
    ${statusCell(it.k)}
    <div class="item-body">
      <div class="item-label">${esc(it.l)}</div>
      ${it.h ? `<div class="item-hint">${esc(it.h)}</div>` : ''}
      <button class="notetoggle ${hasNote ? 'has' : ''}" data-note-for="${it.k}">
        ${hasNote ? 'Note ✱' : '+ Note'}
      </button>
      <div class="item-note" ${hasNote ? '' : 'hidden'}>
        <textarea data-notes-for="${it.k}" aria-label="Notes — ${esc(it.l)}"
          placeholder="What you searched, what you found, where it is filed.">${esc(p.notes)}</textarea>
      </div>
    </div>
  </div>`;
}

function factPanel(key) {
  const def = FACTS.find((f) => f.key === key);
  if (!def) return '';
  const cur = state.facts.get(key) || { value: '', source: '' };
  const tone = def.options.find((o) => o.v === cur.value)?.tone || 'neutral';
  const opts = def.options.map(
    (o) => `<option value="${o.v}" ${o.v === cur.value ? 'selected' : ''}>${esc(o.l)}</option>`
  ).join('');
  return `<div class="fact">
    <h4>${esc(def.label)}</h4>
    <p class="help">${esc(def.help)}</p>
    <div class="fact-row">
      <div>
        <label class="sr-only" for="fact-${key}">Answer</label>
        <select id="fact-${key}" data-fact-for="${key}" data-tone="${tone}">${opts}</select>
      </div>
      <div>
        <label class="sr-only" for="factsrc-${key}">Source</label>
        <input id="factsrc-${key}" type="text" data-factsrc-for="${key}"
          value="${esc(cur.source)}" placeholder="Source — citation or URL">
      </div>
    </div>
  </div>`;
}

function blocksHtml(blocks) {
  return blocks.map((b) => {
    if (b.t === 'p') return `<p>${esc(b.v)}</p>`;
    if (b.t === 'h') return `<h3>${esc(b.v)}</h3>`;
    if (b.t === 'note') return `<div class="callout note">${esc(b.v)}</div>`;
    if (b.t === 'warn') return `<div class="callout warn">${esc(b.v)}</div>`;
    if (b.t === 'list') return `<ul>${b.v.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return '';
  }).join('');
}

function chainTable(step) {
  const heads = step.chainStages.map((s) => `<th scope="col">${esc(s.l)}</th>`).join('');
  const rows = step.chain.map((c) => {
    const cells = step.chainStages.map((s) => {
      const key = `${c.k}.${s.s}`;
      const on = isDone(key);
      return `<td><button class="tick" data-tick-for="${key}" aria-pressed="${on}"
        aria-label="${esc(c.l)} — ${esc(s.l)}">✓</button></td>`;
    }).join('');
    return `<tr><td>${esc(c.l)}</td>${cells}</tr>`;
  }).join('');
  return `<table class="chain">
    <thead><tr><th scope="col">Document</th>${heads}</tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function stepView(step) {
  return `<article class="sheet">
    <header class="sheet-head">
      <p class="sheet-num">Step ${step.num} of 10</p>
      <h2 class="sheet-title">${esc(step.title)}</h2>
      <p class="sheet-lede">${esc(step.lede)}</p>
      <span class="tag">${esc(step.tag)}</span>
    </header>
    <div class="prose">${blocksHtml(step.blocks)}</div>
    ${step.links.length ? `<ul class="links">${step.links.map(
      (l) => `<li><a href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">${esc(l.l)}</a></li>`
    ).join('')}</ul>` : ''}
    ${(step.facts || []).map(factPanel).join('')}
    ${step.chain ? chainTable(step) : ''}
    ${step.items.length ? `<div class="items">${step.items.map(itemRow).join('')}</div>` : ''}
  </article>`;
}

function pivotView() {
  return `<article class="sheet">
    <header class="page-head">
      <p class="eyebrow">Read this first</p>
      <h2>The ${esc(PIVOT.date)} line</h2>
      <p>Everything in this file is organized around one date.</p>
    </header>
    <div class="prose">
      ${PIVOT.text.map((t) => `<p>${esc(t)}</p>`).join('')}
      <div class="callout warn">${esc(PIVOT.kicker)}</div>
    </div>
  </article>`;
}

function namesView() {
  const col = (title, arr) =>
    `<div class="vcol"><h4>${esc(title)}</h4><ul class="vlist">${
      arr.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>`;
  return `<article class="sheet">
    <header class="page-head">
      <p class="eyebrow">Use this list every single time</p>
      <h2>Name variants</h2>
      <p>${esc(NAME_VARIANTS.rule)}</p>
    </header>
    <div class="variants">
      ${col('Given', NAME_VARIANTS.given)}
      ${col('Surname', NAME_VARIANTS.surname)}
      ${col('Father', NAME_VARIANTS.father)}
      ${col('Wildcard', NAME_VARIANTS.wildcards)}
    </div>
    <div class="prose" style="margin-top:28px">
      <h3>Birth year is unsettled — search ${esc(NAME_VARIANTS.birthYears)}</h3>
      <ul>${NAME_VARIANTS.birthNotes.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>
  </article>`;
}

function treeView() {
  const answer = (state.facts.get('wwi_answer') || {}).value || '';
  const branches = [
    {
      key: ['alien'],
      tone: 'good',
      h: 'Card says ALIEN',
      p: 'Strong position. The Michael search drops to belt-and-suspenders. Focus on finishing USCIS and NARA (steps 5 and 6) and the vital record chain (step 8).',
    },
    {
      key: ['naturalized', 'natural_born'],
      tone: 'bad',
      h: 'Card says NATURALIZED or CITIZEN BY FATHER’S NATURALIZATION',
      p: 'Serious problem. Stop spending on Trenton searches. Get an Italian attorney opinion before anything else. The July 2026 Sezioni Unite ruling does not rescue this, because Joseph was born in Italy, not a dual citizen from birth.',
    },
    {
      key: ['declarant'],
      tone: 'warn',
      h: 'Card says DECLARED INTENTION',
      p: 'First papers are not naturalization. The chain still holds, but you now need the declaration itself and proof that no petition followed it. Push hard on steps 6 and 7.',
    },
    {
      key: ['notfound'],
      tone: 'warn',
      h: 'Not found after browsing the correct draft boards',
      p: 'Proceed to steps 2 through 7 as written, and document the negative browse — which board, which date, what you covered.',
    },
  ];
  const cards = branches.map((b) => {
    const live = b.key.includes(answer);
    return `<div class="branch" data-tone="${b.tone}" data-live="${live}">
      <h4>${esc(b.h)}<span class="verdict-flag">Current</span></h4>
      <p>${esc(b.p)}</p>
    </div>`;
  }).join('');

  return `<article class="sheet">
    <header class="page-head">
      <p class="eyebrow">Driven by the step 01 answer</p>
      <h2>Decision tree</h2>
      <p>${answer
        ? 'The live branch below is highlighted based on what you recorded for the WWI draft card.'
        : 'Record the WWI draft card answer in step 01 and the live branch will light up here.'}</p>
    </header>
    ${factPanel('wwi_answer')}
    <div class="tree" style="margin-top:26px">${cards}</div>
  </article>`;
}

function logView() {
  const rows = state.log.map((r) => `<tr>
    <td class="num">${esc(r.entered_on)}</td>
    <td>${esc(r.title)}${r.notes ? `<div class="item-hint">${esc(r.notes)}</div>` : ''}</td>
    <td>${r.url
      ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.source || 'link')}</a>`
      : esc(r.source)}</td>
    <td class="outcome" data-o="${esc(r.outcome)}">${esc(r.outcome.toUpperCase())}</td>
    <td><button class="del" data-del-log="${esc(r.id)}">Delete</button></td>
  </tr>`).join('');

  return `<article class="sheet" style="max-width:100%">
    <header class="page-head">
      <p class="eyebrow">What you searched and what came back</p>
      <h2>Research log</h2>
      <p>A negative search is evidence. Record it with enough detail that you could repeat it, or hand it to a reviewer.</p>
    </header>
    <form class="rowform log" id="logform">
      <div><label for="lg-date">Date</label><input id="lg-date" type="date" required></div>
      <div class="span2"><label for="lg-title">What you searched</label><input id="lg-title" type="text" required placeholder="Essex Co. draft board 3, surname Digl*"></div>
      <div><label for="lg-outcome">Outcome</label>
        <select id="lg-outcome">
          <option value="neutral">Neutral</option>
          <option value="positive">Positive — helps the case</option>
          <option value="negative">Negative — hurts the case</option>
        </select>
      </div>
      <div class="span2"><label for="lg-source">Source</label><input id="lg-source" type="text" placeholder="FamilySearch collection 1968530"></div>
      <div class="span2"><label for="lg-url">URL</label><input id="lg-url" type="url" placeholder="https://"></div>
      <div class="full"><label for="lg-notes">Notes</label><textarea id="lg-notes" placeholder="Exact terms, ranges, what you ruled out."></textarea></div>
      <div class="right"><button class="btn" type="submit">Add entry</button></div>
    </form>
    ${state.log.length ? `<table class="tbl">
      <thead><tr><th>Date</th><th>Search</th><th>Source</th><th>Outcome</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>` : '<div class="empty">No entries yet. The first one should be tonight’s FamilySearch draft-card search — whatever it returns.</div>'}
  </article>`;
}

function costsView() {
  const spent = state.costs.reduce((a, r) => a + Number(r.amount || 0), 0);
  const rows = state.costs.map((r) => `<tr>
    <td class="num">${esc(r.spent_on)}</td>
    <td>${esc(r.item)}</td>
    <td class="num">$${Number(r.amount).toFixed(2)}</td>
    <td><button class="del" data-del-cost="${esc(r.id)}">Delete</button></td>
  </tr>`).join('');

  return `<article class="sheet">
    <header class="page-head">
      <p class="eyebrow">Actual against estimate</p>
      <h2>Money spent</h2>
      <p>Fees at the archives are non-refundable whether or not they find anything, so it is worth knowing what the search has cost so far.</p>
    </header>
    <form class="rowform costs" id="costform">
      <div><label for="ct-date">Date</label><input id="ct-date" type="date" required></div>
      <div><label for="ct-item">What for</label><input id="ct-item" type="text" required placeholder="NJ Archives, Michael 1904–1908"></div>
      <div><label for="ct-amt">Amount</label><input id="ct-amt" type="number" step="0.01" min="0" required placeholder="10.00"></div>
      <div><button class="btn" type="submit">Add</button></div>
    </form>
    ${state.costs.length ? `<table class="tbl">
      <thead><tr><th>Date</th><th>Item</th><th class="num">Amount</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td></td><td>Total spent</td><td class="num">$${spent.toFixed(2)}</td><td></td></tr></tfoot>
    </table>` : '<div class="empty">Nothing logged yet. The $30 G-1041 filed in April 2026 is the first entry.</div>'}
    <div class="prose" style="margin-top:34px">
      <h3>Estimate from the checklist</h3>
      <table class="tbl">
        <thead><tr><th>Item</th><th class="num">Cost</th></tr></thead>
        <tbody>${BUDGET.map((b) => `<tr><td>${esc(b.l)}</td><td class="num">${esc(b.v)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </article>`;
}

function openView() {
  return `<article class="sheet">
    <header class="page-head">
      <p class="eyebrow">Flagged honestly in the source checklist</p>
      <h2>Open questions</h2>
      <p>These are unresolved, not settled findings. Nothing here has been verified by a lawyer, and the first item is the one worth paying to answer.</p>
    </header>
    ${OPEN_QUESTIONS.map((q) => `<div class="q">
      <span class="q-weight" data-w="${q.weight}">${esc(q.weight)}</span>
      <div><h4>${esc(q.t)}</h4><p>${esc(q.v)}</p></div>
    </div>`).join('')}
  </article>`;
}

function paintMain() {
  const main = $('#main');
  if (!main) return;
  const step = STEPS.find((s) => s.id === state.view);
  if (step) main.innerHTML = stepView(step);
  else if (state.view === 'pivot') main.innerHTML = pivotView();
  else if (state.view === 'names') main.innerHTML = namesView();
  else if (state.view === 'tree') main.innerHTML = treeView();
  else if (state.view === 'log') main.innerHTML = logView();
  else if (state.view === 'costs') main.innerHTML = costsView();
  else if (state.view === 'open') main.innerHTML = openView();

  const today = new Date().toISOString().slice(0, 10);
  const d1 = $('#lg-date'); if (d1) d1.value = today;
  const d2 = $('#ct-date'); if (d2) d2.value = today;

  const lf = $('#logform'); if (lf) lf.addEventListener('submit', addLog);
  const cf = $('#costform'); if (cf) cf.addEventListener('submit', addCost);
}

/* ---------- events ---------- */

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.statusFor) {
    const cell = t.closest('.statuscell');
    if (cell) cell.dataset.s = t.value;
    const item = t.closest('.item');
    if (item) item.dataset.s = t.value;
    saveProgress(t.dataset.statusFor, { status: t.value });
  }
  if (t.dataset.factFor) saveFact(t.dataset.factFor, { value: t.value });
});

/* Notes save on blur, not per keystroke. */
document.addEventListener('focusout', (e) => {
  const t = e.target;
  if (t.dataset.notesFor) {
    const key = t.dataset.notesFor;
    if (t.value !== getP(key).notes) saveProgress(key, { notes: t.value });
  }
  if (t.dataset.factsrcFor) {
    const key = t.dataset.factsrcFor;
    const cur = state.facts.get(key) || { value: '', source: '' };
    if (t.value !== cur.source) saveFact(key, { source: t.value });
  }
});

document.addEventListener('click', async (e) => {
  const note = e.target.closest('[data-note-for]');
  if (note) {
    const box = note.nextElementSibling;
    box.hidden = !box.hidden;
    if (!box.hidden) box.querySelector('textarea').focus();
    return;
  }

  const tick = e.target.closest('[data-tick-for]');
  if (tick) {
    const key = tick.dataset.tickFor;
    const on = tick.getAttribute('aria-pressed') === 'true';
    tick.setAttribute('aria-pressed', String(!on));
    await saveProgress(key, { status: on ? 'open' : 'found' });
    return;
  }

  const dl = e.target.closest('[data-del-log]');
  if (dl) {
    const row = state.log.find((r) => r.id === dl.dataset.delLog);
    if (!confirm(`Delete this log entry?\n\n${row ? row.entered_on + ' — ' + row.title : ''}`)) return;
    const { error } = await sb.from('diglio_log').delete().eq('id', dl.dataset.delLog);
    if (error) { flash('Not deleted', true); return; }
    state.log = state.log.filter((r) => r.id !== dl.dataset.delLog);
    flash('Deleted');
    paintMain();
    return;
  }

  const dc = e.target.closest('[data-del-cost]');
  if (dc) {
    const row = state.costs.find((r) => r.id === dc.dataset.delCost);
    if (!confirm(`Delete this cost entry?\n\n${row ? row.item + ' — $' + Number(row.amount).toFixed(2) : ''}`)) return;
    const { error } = await sb.from('diglio_costs').delete().eq('id', dc.dataset.delCost);
    if (error) { flash('Not deleted', true); return; }
    state.costs = state.costs.filter((r) => r.id !== dc.dataset.delCost);
    flash('Deleted');
    paintMain();
  }
});

async function addLog(e) {
  e.preventDefault();
  const row = {
    user_id: state.user.id,
    entered_on: $('#lg-date').value,
    title: $('#lg-title').value.trim(),
    source: $('#lg-source').value.trim(),
    url: $('#lg-url').value.trim(),
    outcome: $('#lg-outcome').value,
    notes: $('#lg-notes').value.trim(),
  };
  if (!row.title) return;
  const { data, error } = await sb.from('diglio_log').insert(row).select().single();
  if (error) { flash('Not saved', true); console.error(error); return; }
  state.log.unshift(data);
  state.log.sort((a, b) => (a.entered_on < b.entered_on ? 1 : -1));
  flash('Entry added');
  paintMain();
}

async function addCost(e) {
  e.preventDefault();
  const row = {
    user_id: state.user.id,
    spent_on: $('#ct-date').value,
    item: $('#ct-item').value.trim(),
    amount: Number($('#ct-amt').value),
  };
  if (!row.item || Number.isNaN(row.amount)) return;
  const { data, error } = await sb.from('diglio_costs').insert(row).select().single();
  if (error) { flash('Not saved', true); console.error(error); return; }
  state.costs.unshift(data);
  state.costs.sort((a, b) => (a.spent_on < b.spent_on ? 1 : -1));
  flash('Cost added');
  paintMain();
}

boot();
