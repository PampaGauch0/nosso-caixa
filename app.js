(() => {
/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = v => BRL.format(Math.round((+v || 0) * 100) / 100);
const pct = v => (isFinite(v) ? Math.round(v) : 0) + '%';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, isFinite(v) ? v : a));
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const ym = s => String(s || '').slice(0, 7);
const curYM = () => today().slice(0, 7);
const addM = (m, n) => { let [y, mo] = m.split('-').map(Number); mo += n; y += Math.floor((mo - 1) / 12); mo = ((mo - 1) % 12 + 12) % 12 + 1; return `${y}-${pad(mo)}`; };
const daysIn = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
const mLabel = (m, short) => new Date(m + '-15T12:00').toLocaleDateString('pt-BR', short ? { month: 'short' } : { month: 'long', year: 'numeric' }).replace('.', '');
const dLabel = s => new Date(s + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const dShort = s => s ? new Date(s + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const parseMoney = s => { s = String(s || '').replace(/[R$\s]/g, ''); if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); const v = parseFloat(s); return isFinite(v) ? Math.round(v * 100) / 100 : NaN; };
const moneyIn = v => v ? String(v.toFixed(2)).replace('.', ',') : '';
const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const clone = o => JSON.parse(JSON.stringify(o));
const sum = (a, f = l => +l.valor || 0) => a.reduce((s, l) => s + f(l), 0);

const CAT_COLORS = ['#3E7CB1', '#D0743C', '#4E9A6A', '#B5487A', '#8A6BC9', '#C9A227', '#3FA3A0', '#C2564B', '#6E8B3D', '#7C7F8C', '#D9739A', '#5468C4', '#A0784F', '#2F8F86', '#9C5BB0'];

const DEF = {
  pessoas: { a: { nome: 'Pessoa 1' }, b: { nome: 'Pessoa 2' } },
  divisao: { modo: 'igual', pctA: 50 },
  metaPoupanca: 20,
  categorias: [
    { nome: 'Moradia', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Mercado', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Contas da casa', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Transporte', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Saúde', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Educação', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Pets', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Restaurantes e delivery', tipo: 'despesa', superfluo: true, orcamento: 0 },
    { nome: 'Lazer', tipo: 'despesa', superfluo: true, orcamento: 0 },
    { nome: 'Compras pessoais', tipo: 'despesa', superfluo: true, orcamento: 0 },
    { nome: 'Assinaturas', tipo: 'despesa', superfluo: true, orcamento: 0 },
    { nome: 'Viagens', tipo: 'despesa', superfluo: true, orcamento: 0 },
    { nome: 'Presentes', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Impostos e taxas', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Outros', tipo: 'despesa', superfluo: false, orcamento: 0 },
    { nome: 'Salário', tipo: 'receita' },
    { nome: 'Renda extra', tipo: 'receita' },
    { nome: 'Rendimentos', tipo: 'receita' },
    { nome: 'Reembolso', tipo: 'receita' },
    { nome: 'Outras receitas', tipo: 'receita' }
  ]
};

/* ---------- estado ---------- */
const S = {
  cfg: clone(DEF), lanc: [], metas: [], month: curYM(), tab: 'painel',
  me: ls.get('nc_me') === 'b' ? 'b' : 'a',
  f: { q: '', tipo: '', quem: '', escopo: '', cat: '', status: '' },
  db: null, local: false, acesso: null, isDono: false, email: '', auth: null, canWrite: true, live: false, first: { l: true, m: true }, charts: {}, memo: {}
};
const nome = k => (k === 'conjunto' ? 'Conjunto' : (S.cfg.pessoas?.[k]?.nome || (k === 'a' ? 'Pessoa 1' : 'Pessoa 2')));
const outro = k => (k === 'a' ? 'b' : 'a');
const cats = tipo => S.cfg.categorias.filter(c => (c.tipo || 'despesa') === tipo);
const catInfo = n => S.cfg.categorias.find(c => c.nome === n);
const catColor = n => { const i = S.cfg.categorias.findIndex(c => c.nome === n); return CAT_COLORS[(i < 0 ? 9 : i) % CAT_COLORS.length]; };
const isSup = l => l.classe === 'superfluo' ? true : l.classe === 'essencial' ? false : !!catInfo(l.categoria)?.superfluo;
const DATA_OK = /^\d{4}-\d{2}-\d{2}$/;
// Tudo que vem do banco é tratado como não confiável: campos usados em atributos e cálculos são normalizados.
function normLanc(d, id) {
  const l = { ...d, id };
  l.quem = l.quem === 'b' ? 'b' : 'a';
  l.tipo = ['despesa', 'receita', 'acerto'].includes(l.tipo) ? l.tipo : 'despesa';
  l.escopo = l.escopo === 'conjunto' ? 'conjunto' : 'individual';
  l.valor = Number.isFinite(+l.valor) ? +l.valor : 0;
  l.data = DATA_OK.test(String(l.data)) ? l.data : '1970-01-01';
  l.categoria = String(l.categoria ?? ''); l.descricao = String(l.descricao ?? ''); l.obs = String(l.obs ?? '');
  if (!['padrao', 'metade', 'custom'].includes(l.divisao)) l.divisao = 'padrao';
  if (!['auto', 'essencial', 'superfluo'].includes(l.classe)) l.classe = 'auto';
  if (!['a', 'b'].includes(l.atualizadoPor)) delete l.atualizadoPor;
  return l;
}
function normMeta(d, id) {
  const g = { ...d, id };
  g.nome = String(g.nome ?? ''); g.alvo = Number.isFinite(+g.alvo) ? +g.alvo : 0;
  g.prazo = DATA_OK.test(String(g.prazo)) ? g.prazo : '';
  g.aportes = (Array.isArray(g.aportes) ? g.aportes : []).map(a => ({ valor: Number.isFinite(+a?.valor) ? +a.valor : 0, quem: a?.quem === 'b' ? 'b' : 'a', data: DATA_OK.test(String(a?.data)) ? a.data : '1970-01-01' }));
  if (!['a', 'b'].includes(g.atualizadoPor)) delete g.atualizadoPor;
  return g;
}
const isPend = l => l.tipo === 'despesa' && l.pago === false;
const isLate = l => isPend(l) && l.data < today();

/* ---------- cálculos ---------- */
function rendaPessoas(m) {
  let a = 0, b = 0;
  for (const l of S.lanc) if (l.tipo === 'receita' && ym(l.data) === m) {
    const v = +l.valor || 0;
    if (l.escopo === 'conjunto') { a += v / 2; b += v / 2; } else if (l.quem === 'b') b += v; else a += v;
  }
  return { a, b };
}
function pctPadrao(m) {
  const k = 'p' + m; if (k in S.memo) return S.memo[k];
  const d = S.cfg.divisao || {}; let p = 50;
  if (d.modo === 'fixo') p = clamp(+d.pctA, 0, 100);
  else if (d.modo === 'renda') { const r = rendaPessoas(m); p = r.a + r.b > 0 ? r.a / (r.a + r.b) * 100 : 50; }
  return (S.memo[k] = p);
}
function pctA(l, m) { if (l.divisao === 'metade') return 50; if (l.divisao === 'custom') return clamp(+l.pctA, 0, 100); return pctPadrao(m || ym(l.data)); }
function divLabel(l) {
  const p = pctA(l); const pa = Math.round(p), pb = 100 - pa;
  return pa === 50 ? '50/50' : `${pa}/${pb}`;
}
function netDe(l) {
  const v = +l.valor || 0;
  if (l.tipo === 'acerto') return l.quem === 'a' ? v : -v;
  if (l.tipo === 'despesa' && l.escopo === 'conjunto' && l.pago !== false) { const p = pctA(l) / 100; return (l.quem === 'a' ? v : 0) - v * p; }
  return 0;
}
function calc(m) {
  const k = 'c' + m; if (S.memo[k]) return S.memo[k];
  const L = S.lanc.filter(l => ym(l.data) === m);
  const rec = L.filter(l => l.tipo === 'receita'), des = L.filter(l => l.tipo === 'despesa');
  const receitas = sum(rec), despesas = sum(des);
  const pagas = sum(des.filter(l => l.pago !== false));
  const pend = des.filter(isPend);
  const renda = rendaPessoas(m);
  const P = { a: { renda: renda.a, ind: 0, parte: 0, pagouJ: 0 }, b: { renda: renda.b, ind: 0, parte: 0, pagouJ: 0 } };
  let netMes = 0;
  const byCat = {};
  let sup = 0, conj = 0;
  for (const l of des) {
    const v = +l.valor || 0; const q = l.quem === 'b' ? 'b' : 'a';
    byCat[l.categoria || 'Outros'] = (byCat[l.categoria || 'Outros'] || 0) + v;
    if (isSup(l)) sup += v;
    if (l.escopo === 'conjunto') {
      conj += v; const p = pctA(l, m) / 100;
      P.a.parte += v * p; P.b.parte += v * (1 - p);
      if (l.pago !== false) P[q].pagouJ += v;
    } else P[q].ind += v;
  }
  for (const l of L) netMes += netDe(l);
  let netTot = 0; for (const l of S.lanc) if (ym(l.data) <= m) netTot += netDe(l);
  const metaAportes = sum(S.metas.flatMap(g => (g.aportes || []).filter(a => ym(a.data) === m)));
  return (S.memo[k] = { L, rec, des, receitas, despesas, pagas, pend, P, netMes, netTot, byCat, sup, conj, saldo: receitas - despesas, disponivel: receitas - pagas, metaAportes, taxa: receitas > 0 ? (receitas - despesas) / receitas * 100 : null });
}

/* ---------- armazenamento ---------- */
async function put(col, id, data) {
  if (!S.canWrite) { toast('Você só pode visualizar esta página.'); return false; }
  data.atualizadoPor = S.me; data.atualizadoEm = new Date().toISOString();
  if (S.local) {
    const arr = col === 'lancamentos' ? S.lanc : col === 'metas' ? S.metas : null;
    if (col === 'config') S.cfg = Object.assign(clone(DEF), data);
    else { const i = arr.findIndex(x => x.id === id); const o = { ...data, id }; if (i >= 0) arr[i] = o; else arr.push(o); }
    changed(); return true;
  }
  // Grava na hora no aparelho (funciona offline) e sincroniza com o servidor em segundo plano.
  S.db.collection(col).doc(id).set(data).catch(writeErr);
  vibrar(); return true;
}
async function del(col, id) {
  if (!S.canWrite) return false;
  if (S.local) { const arr = col === 'lancamentos' ? S.lanc : S.metas; const i = arr.findIndex(x => x.id === id); if (i >= 0) arr.splice(i, 1); changed(); return true; }
  S.db.collection(col).doc(id).delete().catch(writeErr); vibrar(); return true;
}
function writeErr(e) {
  if (e?.code === 'permission-denied') { S.canWrite = false; showBanner(); toast('Não foi possível salvar: esta conta só tem acesso de leitura.'); }
  else if (e?.code === 'resource-exhausted') toast('O limite gratuito diário do Firebase foi atingido. Tente de novo amanhã.');
  else toast('Não foi possível salvar agora. Tente de novo em alguns segundos.');
}
function changed() { S.memo = {}; render(); }
function vibrar() { try { navigator.vibrate && navigator.vibrate(12); } catch {} }

/* ---------- ícones ---------- */
const IC = {
  painel: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z"/>',
  lancamentos: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  contas: '<path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z"/><path d="M10 8h4M10 12h4"/>',
  metas: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
  relatorios: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'
};
const TABS = [['painel', 'Painel'], ['lancamentos', 'Lançamentos'], ['contas', 'Contas'], ['metas', 'Metas'], ['relatorios', 'Relatórios'], ['ajustes', 'Ajustes']];
function buildTabs() {
  const h = TABS.map(([k, t]) => `<button class="tab" data-tab="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>${t}</button>`).join('');
  $('#tabs-top').innerHTML = h; $('#tabs-bottom').innerHTML = h;
}

/* ---------- render geral ---------- */
function render() {
  $('#m-lbl').textContent = mLabel(S.month);
  $('#me-name').textContent = nome(S.me);
  $$('.tab').forEach(b => { if (b.dataset.tab === S.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $$('[data-view]').forEach(v => v.hidden = v.id !== 'v-' + S.tab);
  const V = { painel: vPainel, lancamentos: vLanc, contas: vContas, metas: vMetas, relatorios: vRel, ajustes: vAjustes };
  if (S.tab !== 'relatorios') destroyCharts();
  V[S.tab]();
}

/* ---------- painel ---------- */
function insights(m, c) {
  const out = []; const hoje = today();
  const late = S.lanc.filter(l => isLate(l));
  if (late.length) out.push(['neg', `${late.length} conta${late.length > 1 ? 's' : ''} vencida${late.length > 1 ? 's' : ''}`, `Somam ${money(sum(late))}. Paguem logo para evitar juros e multa.`]);
  for (const ct of cats('despesa')) {
    const o = +ct.orcamento || 0; if (!o) continue; const g = c.byCat[ct.nome] || 0;
    if (g > o) out.push(['neg', `${esc(ct.nome)} passou do orçamento`, `Gastaram ${money(g)} de ${money(o)} (${money(g - o)} acima).`]);
    else if (g >= o * .8) out.push(['warn', `${esc(ct.nome)} perto do limite`, `${pct(g / o * 100)} do orçamento usado; restam ${money(o - g)}.`]);
  }
  if (c.despesas > 0 && c.sup > 0) {
    const p = c.sup / c.despesas * 100;
    out.push([p > 25 ? 'warn' : 'info', `Gastos supérfluos: ${money(c.sup)} (${pct(p)})`, p > 25 ? `Cortar metade disso deixaria ${money(c.sup / 2)} a mais por mês para as metas.` : 'Dentro de um nível saudável. Continuem acompanhando.']);
  }
  const prev = [1, 2, 3].map(i => calc(addM(m, -i)));
  for (const [cat, g] of Object.entries(c.byCat)) {
    const media = sum(prev, p => p.byCat[cat] || 0) / 3;
    if (media > 0 && g > media * 1.25 && g - media > 50) out.push(['warn', `${esc(cat)} subiu ${pct((g / media - 1) * 100)}`, `${money(g)} este mês contra média de ${money(media)} nos 3 meses anteriores.`]);
  }
  const ass = c.des.filter(l => /assinatura/i.test(l.categoria));
  if (ass.length) out.push(['info', `${ass.length} assinatura${ass.length > 1 ? 's' : ''}: ${money(sum(ass))} no mês`, `Equivale a ${money(sum(ass) * 12)} por ano. Revisem as que não usam.`]);
  const deliv = c.des.filter(l => /delivery|restaurante/i.test(l.categoria));
  if (deliv.length >= 6) out.push(['info', `${deliv.length} pedidos em restaurantes e delivery`, `Média de ${money(sum(deliv) / deliv.length)} por pedido. Trocar 2 por semana por comida em casa faz diferença.`]);
  const peq = c.des.filter(l => +l.valor < 30);
  if (peq.length >= 8 && sum(peq) > 150) out.push(['info', `Pequenas compras somaram ${money(sum(peq))}`, `${peq.length} gastos abaixo de R$ 30. Os pequenos valores passam despercebidos e se acumulam.`]);
  if (m === curYM() && c.receitas > 0) {
    const dia = +hoje.slice(8), dm = daysIn(m);
    const fixos = sum(c.des.filter(l => l.recorrente)), varAte = sum(c.des.filter(l => !l.recorrente && l.data <= hoje));
    const proj = fixos + varAte / dia * dm;
    if (dia >= 5 && proj > c.receitas) out.push(['warn', 'No ritmo atual, o mês fecha no vermelho', `Projeção de gastos: ${money(proj)} para receitas de ${money(c.receitas)}.`]);
  }
  const meta = +S.cfg.metaPoupanca || 0;
  if (c.taxa !== null && meta) {
    if (c.taxa >= meta) out.push(['ok', `Vocês estão guardando ${pct(c.taxa)} da renda`, `Acima da meta de ${meta}%. Destinem a sobra às metas.`]);
    else out.push(['warn', `Taxa de economia em ${pct(c.taxa)}`, `Para chegar a ${meta}%, faltam ${money(c.receitas * meta / 100 - c.saldo)} neste mês.`]);
  }
  if (!out.length) out.push(['ok', 'Nada fora do comum', 'Sem contas vencidas, orçamentos estourados ou aumentos fora do padrão.']);
  const ord = { neg: 0, warn: 1, info: 2, ok: 3 };
  return out.sort((x, y) => ord[x[0]] - ord[y[0]]);
}
function settleText(n) {
  if (Math.abs(n) < 0.01) return ['Tudo acertado entre vocês', ''];
  const dev = n > 0 ? 'b' : 'a';
  return [`${esc(nome(dev))} deve ${money(Math.abs(n))} para ${esc(nome(outro(dev)))}`, dev];
}
function vPainel() {
  const m = S.month, c = calc(m), el = $('#v-painel');
  const inst = !isStandalone() && ls.get('nc_inst_off') !== '1' ? installHTML(true) : '';
  const instBox = inst ? `<div style="margin-bottom:12px">${inst.replace('</div></div>', '</div><button class="btn sm" data-inst-off>Agora não</button></div>')}</div>` : '';
  if (!S.lanc.length) {
    el.innerHTML = instBox + `<div class="card empty">
      <h3>Comecem pelo primeiro lançamento</h3>
      <p>Aqui vão aparecer receitas, despesas, saldo, a divisão entre vocês, contas pendentes e alertas de economia. Tudo que um de vocês lançar aparece na hora para o outro.</p>
      <div class="steps">
        <div><b>1</b>Em <a href="#" data-go="ajustes">Ajustes</a>, coloquem os nomes de vocês e como dividir os gastos em conjunto.</div>
        <div><b>2</b>Lancem as receitas do mês: salários e rendas extras de cada um.</div>
        <div><b>3</b>Registrem as despesas, marcando se são individuais ou do casal.</div>
      </div>
      <p style="margin-top:16px"><button class="btn pri" data-new="despesa">Lançar primeira despesa</button> <button class="btn" data-new="receita">Lançar receita</button></p>
    </div>`;
    return;
  }
  const [st, dev] = settleText(c.netTot);
  const pend = S.lanc.filter(isPend).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6);
  const orc = cats('despesa').filter(x => +x.orcamento > 0);
  const totalOrc = sum(orc, x => +x.orcamento);
  const person = k => { const p = c.P[k]; const tot = p.ind + p.parte; return `<div class="person ${k}"><h3>${esc(nome(k))}</h3><div class="rows">
      <div><span>Renda</span><span>${money(p.renda)}</span></div>
      <div><span>Gastos individuais</span><span>${money(p.ind)}</span></div>
      <div><span>Parte nos conjuntos</span><span>${money(p.parte)}</span></div>
      <div><span>Pagou dos conjuntos</span><span>${money(p.pagouJ)}</span></div>
      <div class="tot"><span>Sobra pessoal</span><span class="${p.renda - tot >= 0 ? 'pos' : 'neg'}">${money(p.renda - tot)}</span></div></div></div>`; };
  el.innerHTML = instBox + `<div class="grid">
    <div class="s12 kpis">
      <div class="kpi"><label>Saldo previsto do mês</label><strong class="${c.saldo >= 0 ? 'pos' : 'neg'}">${money(c.saldo)}</strong><span>receitas menos todas as despesas</span></div>
      <div class="kpi"><label>Receitas</label><strong>${money(c.receitas)}</strong><span>${c.rec.length} lançamento${c.rec.length === 1 ? '' : 's'}</span></div>
      <div class="kpi"><label>Despesas</label><strong>${money(c.despesas)}</strong><span>${money(c.pagas)} pagas</span></div>
      <div class="kpi"><label>Disponível agora</label><strong class="${c.disponivel >= 0 ? '' : 'neg'}">${money(c.disponivel)}</strong><span>${money(sum(c.pend))} a pagar</span></div>
      <div class="kpi"><label>Economizado</label><strong class="${c.saldo >= 0 ? 'pos' : 'neg'}">${c.taxa === null ? '—' : pct(c.taxa)}</strong><span>${money(c.metaAportes)} guardado em metas</span></div>
    </div>
    <div class="card s5 settle"><h2>Acerto do casal <small>gastos em conjunto</small></h2>
      <div class="big ${dev ? '' : 'pos'}">${st}</div>
      <p class="note">Neste mês vocês gastaram ${money(c.conj)} em conjunto. Divisão padrão: ${esc(divPadraoTxt(m))}.</p>
      <div class="pair">${person('a')}${person('b')}</div>
      ${dev ? `<div><button class="btn sm" data-acerto="${dev}">Registrar acerto</button></div>` : ''}
    </div>
    <div class="card s7"><h2>Onde dá para economizar <small>${esc(mLabel(m))}</small></h2>
      <div class="ins">${insights(m, c).map(([k, t, p]) => `<div class="in ${k}"><div><b>${t}</b><p>${p}</p></div></div>`).join('')}</div>
    </div>
    <div class="card s6"><h2>Orçamento por categoria <small>${totalOrc ? money(sum(orc, x => c.byCat[x.nome] || 0)) + ' de ' + money(totalOrc) : ''}</small></h2>
      ${orc.length ? `<div class="bars">${orc.map(x => { const g = c.byCat[x.nome] || 0, o = +x.orcamento, r = g / o; return `<div class="bar-row"><div class="lbl"><span>${esc(x.nome)}</span><span class="${r > 1 ? 'neg' : r >= .8 ? 'warn' : 'muted'}">${money(g)} / ${money(o)}</span></div><div class="track"><div class="fill ${r > 1 ? 'neg' : r >= .8 ? 'warn' : ''}" style="width:${Math.min(100, r * 100)}%"></div></div></div>`; }).join('')}</div>`
      : `<p class="note">Definam um limite mensal por categoria em <a href="#" data-go="ajustes">Ajustes</a> para acompanhar aqui.</p>`}
    </div>
    <div class="card s6"><h2>Próximas contas <small>${S.lanc.filter(isPend).length} pendente${S.lanc.filter(isPend).length === 1 ? '' : 's'}</small></h2>
      ${pend.length ? `<div class="list">${pend.map(itemHTML).join('')}</div>` : '<p class="note">Nenhuma conta pendente. Lancem contas a pagar como “pendente” para acompanhar vencimentos.</p>'}
    </div>
    ${S.metas.length ? `<div class="card s12"><h2>Metas <small><a href="#" data-go="metas">ver todas</a></small></h2><div class="bars">${S.metas.slice(0, 4).map(g => { const gd = sum(g.aportes || []), r = g.alvo ? gd / g.alvo : 0; return `<div class="bar-row"><div class="lbl"><span>${esc(g.nome)}</span><span class="muted">${money(gd)} de ${money(g.alvo)} · ${pct(r * 100)}</span></div><div class="track"><div class="fill" style="width:${Math.min(100, r * 100)}%"></div></div></div>`; }).join('')}</div></div>` : ''}
  </div>`;
}
function divPadraoTxt(m) {
  const d = S.cfg.divisao || {};
  if (d.modo === 'renda') { const p = Math.round(pctPadrao(m)); return `proporcional à renda (${nome('a')} ${p}%, ${nome('b')} ${100 - p}%)`; }
  if (d.modo === 'fixo') { const p = Math.round(pctPadrao(m)); return `${nome('a')} ${p}%, ${nome('b')} ${100 - p}%`; }
  return 'meio a meio';
}

/* ---------- item de lista ---------- */
function itemHTML(l) {
  const v = +l.valor || 0;
  let chips = '';
  if (l.tipo === 'acerto') chips = `<span class="chip ${l.quem}">${esc(nome(l.quem))} pagou ${esc(nome(outro(l.quem)))}</span>`;
  else if (l.escopo === 'conjunto') chips = `<span class="chip j">Conjunto</span><span class="chip ${l.quem}">${l.tipo === 'receita' ? 'recebido' : 'pago'} por ${esc(nome(l.quem))}</span>${l.tipo === 'despesa' ? `<span class="chip">${divLabel(l)}</span>` : ''}`;
  else chips = `<span class="chip ${l.quem}">${esc(nome(l.quem))}</span>`;
  if (isLate(l)) chips += '<span class="chip late">Vencida</span>'; else if (isPend(l)) chips += '<span class="chip pend">Pendente</span>';
  if (l.tipo === 'despesa' && isSup(l)) chips += '<span class="chip sup">Supérfluo</span>';
  if (l.recorrente) chips += '<span class="chip">Mensal</span>';
  const cls = l.tipo === 'receita' ? 'pos' : l.tipo === 'acerto' ? 'muted' : '';
  const sign = l.tipo === 'receita' ? '+ ' : l.tipo === 'despesa' ? '− ' : '';
  const color = l.tipo === 'acerto' ? 'var(--muted)' : catColor(l.categoria);
  return `<button class="item" data-edit="${esc(l.id)}"><span class="dot" style="background:${color}"></span>
    <span style="min-width:0"><div class="t">${esc(l.descricao || l.categoria || 'Sem descrição')}</div><div class="m"><span>${esc(l.tipo === 'acerto' ? 'Acerto entre vocês' : l.categoria)} · ${dShort(l.data)}</span>${chips}</div></span>
    <span class="v ${cls}">${sign}${money(v)}${l.tipo === 'despesa' && l.escopo === 'conjunto' ? `<small>${esc(nome(S.me))}: ${money(v * (S.me === 'a' ? pctA(l) : 100 - pctA(l)) / 100)}</small>` : ''}</span></button>`;
}

/* ---------- lançamentos ---------- */
function vLanc() {
  const el = $('#v-lancamentos'), f = S.f;
  if (!el.dataset.built) {
    el.dataset.built = 1;
    el.innerHTML = `<div class="card"><h2>Lançamentos <small id="l-mes"></small></h2>
      <div class="filters">
        <input id="f-q" type="search" placeholder="Buscar descrição ou categoria" aria-label="Buscar">
        <button type="button" class="btn ftog" id="f-tog" aria-expanded="false">Filtros</button>
        <div class="fsel"><select id="f-tipo" aria-label="Tipo"><option value="">Todos os tipos</option><option value="despesa">Despesas</option><option value="receita">Receitas</option><option value="acerto">Acertos</option></select>
        <select id="f-quem" aria-label="Pessoa"></select>
        <select id="f-escopo" aria-label="Individual ou conjunto"><option value="">Individual e conjunto</option><option value="individual">Só individuais</option><option value="conjunto">Só conjuntos</option></select>
        <select id="f-cat" aria-label="Categoria"></select>
        <select id="f-status" aria-label="Situação"><option value="">Qualquer situação</option><option value="pago">Pagos</option><option value="pendente">Pendentes</option><option value="sup">Supérfluos</option></select></div>
      </div><div class="sumline" id="l-sum"></div><div id="l-list"></div></div>`;
    ['q', 'tipo', 'quem', 'escopo', 'cat', 'status'].forEach(k => $('#f-' + k).addEventListener('input', e => { S.f[k] = e.target.value; vLanc(); }));
    $('#f-tog').onclick = () => { const f = $('.filters', el); const o = f.classList.toggle('open'); $('#f-tog').setAttribute('aria-expanded', o); };
  }
  $('#l-mes').textContent = mLabel(S.month);
  const nf = ['tipo', 'quem', 'escopo', 'cat', 'status'].filter(k => f[k]).length; $('#f-tog').textContent = nf ? `Filtros (${nf})` : 'Filtros';
  $('#f-quem').innerHTML = `<option value="">Os dois</option><option value="a">${esc(nome('a'))}</option><option value="b">${esc(nome('b'))}</option>`;
  $('#f-cat').innerHTML = `<option value="">Todas as categorias</option>` + S.cfg.categorias.map(c => `<option>${esc(c.nome)}</option>`).join('');
  ['tipo', 'quem', 'escopo', 'cat', 'status'].forEach(k => $('#f-' + k).value = f[k]);
  const q = f.q.trim().toLowerCase();
  const L = calc(S.month).L.filter(l => (!f.tipo || l.tipo === f.tipo) && (!f.quem || l.quem === f.quem) && (!f.escopo || (l.escopo || 'individual') === f.escopo) && (!f.cat || l.categoria === f.cat)
    && (!f.status || (f.status === 'pago' ? !isPend(l) : f.status === 'pendente' ? isPend(l) : l.tipo === 'despesa' && isSup(l)))
    && (!q || (l.descricao + ' ' + l.categoria + ' ' + (l.obs || '')).toLowerCase().includes(q)))
    .sort((a, b) => b.data.localeCompare(a.data) || (b.atualizadoEm || '').localeCompare(a.atualizadoEm || ''));
  const r = sum(L.filter(l => l.tipo === 'receita')), d = sum(L.filter(l => l.tipo === 'despesa'));
  $('#l-sum').innerHTML = `<span>${L.length} lançamento${L.length === 1 ? '' : 's'}</span><span>Receitas <b class="pos">${money(r)}</b></span><span>Despesas <b>${money(d)}</b></span><span>Resultado <b class="${r - d >= 0 ? 'pos' : 'neg'}">${money(r - d)}</b></span>`;
  if (!L.length) { $('#l-list').innerHTML = `<div class="empty"><h3>Nada por aqui em ${esc(mLabel(S.month))}</h3><p>${S.lanc.length ? 'Mudem os filtros ou o mês, ou lancem algo novo.' : 'Usem o botão “Novo lançamento” para registrar a primeira receita ou despesa.'}</p></div>`; return; }
  let html = '', last = '';
  for (const l of L) { if (l.data !== last) { html += `<div class="day">${dLabel(l.data)}</div>`; last = l.data; } html += itemHTML(l); }
  $('#l-list').innerHTML = `<div class="list">${html}</div>`;
}

/* ---------- contas ---------- */
function vContas() {
  const el = $('#v-contas'), m = S.month, hoje = today();
  const pend = S.lanc.filter(isPend).sort((a, b) => a.data.localeCompare(b.data));
  const late = pend.filter(l => l.data < hoje), soon = pend.filter(l => l.data >= hoje && ym(l.data) <= m), later = pend.filter(l => ym(l.data) > m && l.data >= hoje);
  const prev = addM(m, -1);
  const series = new Set(S.lanc.filter(l => ym(l.data) === m).map(l => l.serie || l.id));
  const rec = S.lanc.filter(l => l.recorrente && ym(l.data) === prev && !series.has(l.serie || l.id));
  const fixos = S.lanc.filter(l => l.recorrente && l.tipo === 'despesa' && ym(l.data) === m);
  const grp = (t, arr, cls) => arr.length ? `<div class="day ${cls || ''}">${t} · ${money(sum(arr))}</div>${arr.map(l => `<div style="display:flex;align-items:center;gap:8px"><div style="flex:1;min-width:0">${itemHTML(l)}</div><button class="btn sm" data-pay="${esc(l.id)}">Pagar</button></div>`).join('')}` : '';
  el.innerHTML = `<div class="grid">
    <div class="card s7"><h2>Contas a pagar <small>${money(sum(pend))} no total</small></h2>
      ${pend.length ? grp('Vencidas', late, 'neg') + grp('A vencer até o fim de ' + mLabel(m).split(' ')[0], soon) + grp('Meses seguintes', later)
      : '<div class="empty"><h3>Nenhuma conta pendente</h3><p>Ao lançar uma despesa, escolham “Pendente” para que ela apareça aqui com o vencimento.</p></div>'}
    </div>
    <div class="card s5"><h2>Contas fixas do mês <small>${money(sum(fixos))}</small></h2>
      ${rec.length ? `<p class="note">${rec.length} lançamento${rec.length > 1 ? 's' : ''} mensa${rec.length > 1 ? 'is' : 'l'} de ${esc(mLabel(prev))} ainda não ${rec.length > 1 ? 'foram lançados' : 'foi lançado'} em ${esc(mLabel(m))}.</p>
        <ul class="rows" style="padding:0;list-style:none;margin:10px 0">${rec.map(l => `<li style="display:flex;justify-content:space-between"><span>${esc(l.descricao || l.categoria)}</span><span>${money(l.valor)}</span></li>`).join('')}</ul>
        <button class="btn pri" id="gen-rec">Lançar ${rec.length} em ${esc(mLabel(m).split(' ')[0])}</button>`
      : `<p class="note">${fixos.length ? 'Todas as contas mensais já estão lançadas neste mês.' : 'Marquem “Repete todo mês” em aluguel, internet, assinaturas e salários. No mês seguinte, vocês lançam todas de uma vez por aqui.'}</p>`}
      ${fixos.length ? `<div class="list" style="margin-top:10px">${fixos.map(itemHTML).join('')}</div>` : ''}
    </div></div>`;
  $('#gen-rec')?.addEventListener('click', async e => {
    e.target.disabled = true;
    for (const l of rec) {
      const day = Math.min(+l.data.slice(8), daysIn(m));
      const n = clone(l); delete n.id; n.data = `${m}-${pad(day)}`; n.serie = l.serie || l.id;
      if (n.tipo === 'despesa') n.pago = false;
      await put('lancamentos', uid(), n);
    }
    toast(`${rec.length} lançamento${rec.length > 1 ? 's' : ''} criado${rec.length > 1 ? 's' : ''}.`);
  });
}

/* ---------- metas ---------- */
function vMetas() {
  const el = $('#v-metas'), hoje = today();
  const card = g => {
    const gd = sum(g.aportes || []), alvo = +g.alvo || 0, r = alvo ? gd / alvo : 0, falta = Math.max(0, alvo - gd);
    let prazoTxt = '';
    if (g.prazo) {
      const [y1, m1] = hoje.split('-').map(Number), [y2, m2] = g.prazo.split('-').map(Number);
      const meses = Math.max(1, (y2 - y1) * 12 + (m2 - m1));
      prazoTxt = g.prazo < hoje && falta > 0 ? `<span class="neg">Prazo vencido em ${dShort(g.prazo)}/${g.prazo.slice(0, 4)}</span>` : falta > 0 ? `<span>Guardar <b>${money(falta / meses)}</b> por mês até ${new Date(g.prazo + 'T12:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>` : '';
    }
    const ap = (g.aportes || []).slice().sort((a, b) => b.data.localeCompare(a.data));
    const porPessoa = k => sum(ap.filter(a => a.quem === k));
    return `<div class="card goal"><h2>${esc(g.nome)} <small>${r >= 1 ? '<span class="pos">Concluída</span>' : pct(r * 100)}</small></h2>
      <div class="amt"><strong>${money(gd)}</strong><span class="muted">de ${money(alvo)}</span></div>
      <div class="track"><div class="fill" style="width:${Math.min(100, r * 100)}%"></div></div>
      <div class="meta">${falta > 0 ? `<span>Faltam ${money(falta)}</span>` : ''}${prazoTxt}<span>${esc(nome('a'))}: ${money(porPessoa('a'))} · ${esc(nome('b'))}: ${money(porPessoa('b'))}</span></div>
      <form class="inline-form" data-aporte="${esc(g.id)}"><input id="ap-v-${esc(g.id)}" name="v" inputmode="decimal" placeholder="Valor" aria-label="Valor"><select id="ap-q-${esc(g.id)}" name="q" aria-label="Quem"><option value="a"${S.me === 'a' ? ' selected' : ''}>${esc(nome('a'))}</option><option value="b"${S.me === 'b' ? ' selected' : ''}>${esc(nome('b'))}</option></select><button class="btn sm pri" name="op" value="add">Guardar</button><button class="btn sm" name="op" value="sub">Retirar</button></form>
      ${ap.length ? `<details class="hist"><summary>Histórico (${ap.length})</summary><ul>${ap.slice(0, 30).map(a => `<li><span>${dShort(a.data)} · ${esc(nome(a.quem))}</span><span class="${a.valor < 0 ? 'neg' : ''}">${money(a.valor)}</span></li>`).join('')}</ul></details>` : ''}
      <div class="btns" style="margin-top:10px"><button class="btn sm" data-goal-edit="${esc(g.id)}">Editar</button></div></div>`;
  };
  const tot = sum(S.metas, g => sum(g.aportes || []));
  el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap"><div><h2 style="font-size:1.3rem">Metas de economia</h2><p class="note">${S.metas.length ? `${money(tot)} guardados no total` : 'Reserva de emergência, viagem, entrada do apartamento…'}</p></div><button class="btn pri" id="goal-new">Nova meta</button></div>
    ${S.metas.length ? `<div class="goals">${S.metas.slice().sort((a, b) => (a.prazo || '9').localeCompare(b.prazo || '9')).map(card).join('')}</div>`
    : '<div class="card empty"><h3>Nenhuma meta ainda</h3><p>Criem uma meta com valor e prazo. O app calcula quanto guardar por mês e mostra quanto cada um já contribuiu.</p></div>'}`;
  $('#goal-new').onclick = () => openGoal();
  $$('form[data-aporte]', el).forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault(); const g = S.metas.find(x => x.id === f.dataset.aporte); if (!g) return;
    const v = parseMoney(f.v.value); if (!(v > 0)) { f.v.focus(); toast('Informe um valor maior que zero.'); return; }
    const sub = e.submitter?.value === 'sub';
    const n = clone(g); delete n.id; n.aportes = [...(n.aportes || []), { valor: sub ? -v : v, quem: f.q.value, data: today() }];
    if (await put('metas', g.id, n)) toast(sub ? `Retirada de ${money(v)} registrada.` : `${money(v)} guardados em ${g.nome}.`);
  }));
}

/* ---------- relatórios ---------- */
function destroyCharts() { for (const k in S.charts) { S.charts[k].destroy(); delete S.charts[k]; } }
function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function vRel() {
  const el = $('#v-relatorios'), m = S.month, c = calc(m), p1 = calc(addM(m, -1));
  const meses = [5, 4, 3, 2, 1, 0].map(i => addM(m, -i)), cs = meses.map(calc);
  const catRows = Object.keys({ ...c.byCat, ...p1.byCat }).map(k => { const media = sum([1, 2, 3].map(i => calc(addM(m, -i))), x => x.byCat[k] || 0) / 3; return { k, a: c.byCat[k] || 0, p: p1.byCat[k] || 0, media }; }).sort((x, y) => y.a - x.a);
  const top = c.des.slice().sort((a, b) => b.valor - a.valor).slice(0, 5);
  destroyCharts();
  const hasData = S.lanc.length > 0;
  el.innerHTML = `<div class="grid">
    <div class="card s12" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h2 style="font-size:1.3rem">Relatórios de ${esc(mLabel(m))}</h2><p class="note">Comparações usam o mês anterior e a média dos 3 meses anteriores.</p></div><button class="btn" id="csv">Exportar mês em planilha (CSV)</button></div>
    ${!hasData ? '<div class="card s12 empty"><h3>Os gráficos aparecem com os primeiros lançamentos</h3><p>Evolução de receitas e despesas, gastos por categoria, por pessoa e supérfluos.</p></div>' : `
    <div class="card s8"><h2>Receitas, despesas e saldo <small>últimos 6 meses</small></h2><div class="chart-box"><canvas id="c-evol" aria-label="Gráfico de receitas e despesas"></canvas></div></div>
    <div class="card s4"><h2>Essencial × supérfluo</h2><div class="chart-box sm"><canvas id="c-sup"></canvas></div><p class="note" style="margin-top:8px">${c.despesas ? `${pct(c.sup / c.despesas * 100)} dos gastos foram supérfluos (${money(c.sup)}).` : 'Sem despesas neste mês.'}</p></div>
    <div class="card s6"><h2>Despesas por categoria</h2><div class="chart-box"><canvas id="c-cat"></canvas></div></div>
    <div class="card s6"><h2>Gastos por pessoa <small>individual + parte nos conjuntos</small></h2><div class="chart-box"><canvas id="c-pes"></canvas></div></div>
    <div class="card s7"><h2>Categorias comparadas</h2><div class="tbl-wrap"><table><thead><tr><th>Categoria</th><th>${esc(mLabel(m, 1))}</th><th>Mês anterior</th><th>Média 3m</th><th>Variação</th></tr></thead><tbody>
      ${catRows.length ? catRows.map(r => { const v = r.media ? (r.a / r.media - 1) * 100 : null; return `<tr><td><span class="dot" style="display:inline-block;background:${catColor(r.k)};margin-right:6px"></span>${esc(r.k)}</td><td>${money(r.a)}</td><td class="muted">${money(r.p)}</td><td class="muted">${money(r.media)}</td><td class="${v === null ? 'muted' : v > 10 ? 'neg' : v < -10 ? 'pos' : 'muted'}">${v === null ? 'novo' : (v > 0 ? '+' : '') + pct(v)}</td></tr>`; }).join('') : '<tr><td colspan="5" class="muted">Sem despesas.</td></tr>'}
    </tbody></table></div></div>
    <div class="card s5"><h2>Maiores gastos do mês</h2>${top.length ? `<div class="list">${top.map(itemHTML).join('')}</div>` : '<p class="note">Sem despesas neste mês.</p>'}</div>
    <div class="card s12"><h2>Resumo dos 6 meses</h2><div class="tbl-wrap"><table><thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th><th>Economia</th><th>Supérfluos</th><th>${esc(nome('a'))} gastou</th><th>${esc(nome('b'))} gastou</th></tr></thead><tbody>
      ${meses.map((mm, i) => { const x = cs[i]; return `<tr><td style="text-transform:capitalize">${esc(mLabel(mm))}</td><td>${money(x.receitas)}</td><td>${money(x.despesas)}</td><td class="${x.saldo >= 0 ? 'pos' : 'neg'}">${money(x.saldo)}</td><td>${x.taxa === null ? '—' : pct(x.taxa)}</td><td>${money(x.sup)}</td><td>${money(x.P.a.ind + x.P.a.parte)}</td><td>${money(x.P.b.ind + x.P.b.parte)}</td></tr>`; }).join('')}
    </tbody></table></div></div>`}
  </div>`;
  $('#csv').onclick = exportCSV;
  if (!hasData || !window.Chart) return;
  const ink = tok('--muted'), grid = tok('--line'), font = { family: 'Figtree, system-ui, sans-serif', size: 12 };
  Chart.defaults.color = ink; Chart.defaults.font = font; Chart.defaults.borderColor = grid;
  const tip = { callbacks: { label: x => ` ${x.dataset.label ? x.dataset.label + ': ' : (x.label ? x.label + ': ' : '')}${money(x.parsed.y ?? x.parsed.x ?? x.parsed)}` } };
  const yMoney = { ticks: { callback: v => 'R$ ' + (Math.abs(v) >= 1000 ? (v / 1000).toLocaleString('pt-BR') + ' mil' : v) }, grid: { color: grid } };
  S.charts.evol = new Chart($('#c-evol'), { data: { labels: meses.map(x => mLabel(x, 1)), datasets: [
    { type: 'bar', label: 'Receitas', data: cs.map(x => x.receitas), backgroundColor: tok('--pos'), borderRadius: 4 },
    { type: 'bar', label: 'Despesas', data: cs.map(x => x.despesas), backgroundColor: tok('--neg'), borderRadius: 4 },
    { type: 'line', label: 'Saldo', data: cs.map(x => x.saldo), borderColor: tok('--ink'), backgroundColor: tok('--ink'), tension: .3, pointRadius: 3 }] },
    options: { maintainAspectRatio: false, plugins: { tooltip: tip, legend: { position: 'bottom' } }, scales: { y: yMoney, x: { grid: { display: false } } } } });
  const ck = Object.entries(c.byCat).sort((a, b) => b[1] - a[1]);
  S.charts.cat = new Chart($('#c-cat'), { type: 'doughnut', data: { labels: ck.map(x => x[0]), datasets: [{ data: ck.map(x => x[1]), backgroundColor: ck.map(x => catColor(x[0])), borderColor: tok('--surface'), borderWidth: 2 }] },
    options: { maintainAspectRatio: false, cutout: '60%', plugins: { tooltip: { callbacks: { label: x => ` ${x.label}: ${money(x.parsed)} (${pct(x.parsed / c.despesas * 100)})` } }, legend: { position: innerWidth < 700 ? 'bottom' : 'right', labels: { boxWidth: 10 } } } } });
  S.charts.sup = new Chart($('#c-sup'), { type: 'doughnut', data: { labels: ['Essencial', 'Supérfluo'], datasets: [{ data: [c.despesas - c.sup, c.sup], backgroundColor: [tok('--accent'), tok('--warn')], borderColor: tok('--surface'), borderWidth: 2 }] },
    options: { maintainAspectRatio: false, cutout: '62%', plugins: { tooltip: { callbacks: { label: x => ` ${x.label}: ${money(x.parsed)}` } }, legend: { position: 'bottom', labels: { boxWidth: 10 } } } } });
  S.charts.pes = new Chart($('#c-pes'), { type: 'bar', data: { labels: [nome('a'), nome('b')], datasets: [
    { label: 'Individual', data: [c.P.a.ind, c.P.b.ind], backgroundColor: [tok('--pa'), tok('--pb')], borderRadius: 4 },
    { label: 'Parte nos conjuntos', data: [c.P.a.parte, c.P.b.parte], backgroundColor: tok('--pj'), borderRadius: 4 }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: x => ` ${x.dataset.label}: ${money(x.parsed.x)}` } }, legend: { position: 'bottom' } }, scales: { x: { stacked: true, ...yMoney }, y: { stacked: true, grid: { display: false } } } } });
}
async function exportCSV() {
  const L = calc(S.month).L.slice().sort((a, b) => a.data.localeCompare(b.data));
  const q = s => { let t = String(s ?? ''); if (/^[=+\-@\t\r]/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  const rows = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Quem', 'Individual/Conjunto', `% ${nome('a')}`, 'Situação', 'Supérfluo', 'Mensal', 'Observação']]
    .concat(L.map(l => [l.data, l.tipo, l.descricao, l.categoria, String((+l.valor).toFixed(2)).replace('.', ','), nome(l.quem), l.escopo === 'conjunto' ? 'Conjunto' : 'Individual', l.escopo === 'conjunto' && l.tipo === 'despesa' ? Math.round(pctA(l)) : '', isPend(l) ? 'Pendente' : 'Pago', l.tipo === 'despesa' && isSup(l) ? 'Sim' : 'Não', l.recorrente ? 'Sim' : 'Não', l.obs]));
  const csv = '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n');
  const fn = `nosso-caixa-${S.month}.csv`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Planilha baixada.');
}

/* ---------- ajustes ---------- */
function acessoHTML() {
  const ac = S.acesso || { emails: [] };
  return `<ul class="mem">${(ac.emails || []).map(e => `<li><span>${esc(e)}${e === ac.dono ? ' <span class="chip">administrador</span>' : ''}${e === S.email ? ' <span class="chip">você</span>' : ''}</span>${S.isDono && e !== ac.dono ? `<button type="button" class="btn sm danger" data-revoke="${esc(e)}">Remover</button>` : ''}</li>`).join('')}</ul>
    ${S.isDono ? `<div class="inline-form" style="margin-top:0"><input type="email" id="ac-new" placeholder="E-mail da sua esposa" aria-label="E-mail para autorizar"><button type="button" class="btn sm pri" id="ac-add">Autorizar</button></div><div id="ac-confirm"></div>
    <p class="note" style="margin-top:8px">Depois de autorizar, envie o link do app para ela. Ela toca em “Primeiro acesso? Criar senha” com esse mesmo e-mail e confirma pelo link que chega na caixa de entrada.</p>`
    : '<p class="note">Só o administrador pode adicionar ou remover pessoas.</p>'}
`;
}
async function setAcesso(emails) {
  try { await S.db.doc('acesso/membros').set({ dono: S.acesso.dono, emails }); return true; }
  catch (e) { toast('Não foi possível alterar o acesso: ' + (e.code === 'permission-denied' ? 'só o administrador pode fazer isso.' : 'tente novamente.')); return false; }
}
function vAjustes() {
  const el = $('#v-ajustes'), c = S.cfg;
  const catRow = (x, i) => `<div class="r" data-i="${i}"><input type="text" id="cat-n-${i}" value="${esc(x.nome)}" aria-label="Nome da categoria">
    ${x.tipo === 'receita' ? '<span class="muted" style="font-size:.8rem">receita</span><span></span>' : `<input type="text" id="cat-o-${i}" inputmode="decimal" value="${moneyIn(+x.orcamento || 0)}" placeholder="Sem limite" aria-label="Orçamento mensal">
    <label class="check sup-c"><input type="checkbox" id="cat-s-${i}" ${x.superfluo ? 'checked' : ''}> Supérfluo</label>`}
    <button type="button" class="x" data-rm="${i}" aria-label="Remover categoria">×</button></div>`;
  const desp = c.categorias.map((x, i) => [x, i]).filter(([x]) => (x.tipo || 'despesa') === 'despesa');
  const rec = c.categorias.map((x, i) => [x, i]).filter(([x]) => x.tipo === 'receita');
  el.innerHTML = `<form id="cfg-form" class="grid">
    <div class="card s6"><h2>Vocês <button type="button" class="btn sm sair-m" data-signout>Sair da conta</button></h2><div class="fields">
      <div class="field"><label for="p-a">Nome da pessoa 1</label><input id="p-a" value="${esc(nome('a'))}" maxlength="30"></div>
      <div class="field"><label for="p-ae">E-mail da pessoa 1</label><input id="p-ae" type="email" value="${esc(c.pessoas?.a?.email || '')}"></div>
      <div class="field"><label for="p-b">Nome da pessoa 2</label><input id="p-b" value="${esc(nome('b'))}" maxlength="30"></div>
      <div class="field"><label for="p-be">E-mail da pessoa 2</label><input id="p-be" type="email" value="${esc(c.pessoas?.b?.email || '')}"></div>
      <div class="field"><label for="p-me">Quem usa este aparelho</label><select id="p-me"><option value="a">${esc(nome('a'))}</option><option value="b">${esc(nome('b'))}</option></select></div>
    </div><p class="note" style="margin-top:10px">Com os e-mails preenchidos, o app reconhece quem entrou e já marca os lançamentos com o nome certo.</p></div>
    <div class="card s6"><h2>Divisão e metas</h2><div class="fields">
      <div class="field"><label for="d-modo">Como dividir gastos em conjunto</label><select id="d-modo"><option value="igual">Meio a meio</option><option value="renda">Proporcional à renda do mês</option><option value="fixo">Percentual fixo</option></select></div>
      <div class="field" id="d-pct-w"><label for="d-pct">Percentual de ${esc(nome('a'))}</label><input id="d-pct" inputmode="numeric" value="${Math.round(+c.divisao?.pctA || 50)}"></div>
      <div class="field"><label for="d-meta">Meta de economia (% da renda)</label><input id="d-meta" inputmode="numeric" value="${+c.metaPoupanca || 0}"></div>
    </div><p class="note" style="margin-top:10px">Cada lançamento pode ter sua própria divisão. Esta é a regra padrão.</p></div>
    <div class="card s8"><h2>Categorias de despesa <small>orçamento mensal e o que conta como supérfluo</small></h2>
      <div class="cat-ed"><div class="r hd"><span>Categoria</span><span>Orçamento</span><span></span><span></span></div>${desp.map(([x, i]) => catRow(x, i)).join('')}</div>
      <button type="button" class="btn sm" data-addcat="despesa" style="margin-top:10px">Adicionar categoria</button></div>
    <div class="card s4"><h2>Categorias de receita</h2><div class="cat-ed">${rec.map(([x, i]) => catRow(x, i)).join('')}</div>
      <button type="button" class="btn sm" data-addcat="receita" style="margin-top:10px">Adicionar categoria</button>
      <h2 style="margin:22px 0 8px">Quem tem acesso</h2>${acessoHTML()}
      <h2 style="margin:22px 0 8px">Instalar no celular</h2>${installHTML(false)}</div>
    <div class="s12 btns"><button class="btn pri" id="cfg-save">Salvar ajustes</button><span class="note" id="cfg-msg" style="align-self:center"></span></div>
  </form>`;
  $('#p-me').value = S.me; $('#d-modo').value = c.divisao?.modo || 'igual';
  const syncPct = () => $('#d-pct-w').hidden = $('#d-modo').value !== 'fixo'; syncPct(); $('#d-modo').onchange = syncPct;
  const readForm = () => {
    const n = clone(S.cfg);
    n.categorias = n.categorias.map((x, i) => {
      const nm = ($('#cat-n-' + i)?.value || '').trim();
      return x.tipo === 'receita' ? { nome: nm, tipo: 'receita' } : { nome: nm, tipo: 'despesa', orcamento: Math.max(0, parseMoney($('#cat-o-' + i)?.value) || 0), superfluo: !!$('#cat-s-' + i)?.checked };
    });
    return n;
  };
  el.onclick = async e => {
    if (e.target.id === 'ac-add') {
      const em = ($('#ac-new').value || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast('Digite um e-mail válido.'); $('#ac-new').focus(); return; }
      if ((S.acesso?.emails || []).includes(em)) { toast('Este e-mail já tem acesso.'); return; }
      $('#ac-confirm').innerHTML = `<div class="confirm-box"><span>Dar acesso completo aos dados financeiros do casal para <b>${esc(em)}</b>? Essa pessoa poderá ver, lançar, editar e excluir.</span><div class="btns"><button type="button" class="btn sm pri" id="ac-yes" data-em="${esc(em)}">Confirmar acesso</button><button type="button" class="btn sm" id="ac-no">Cancelar</button></div></div>`;
      return;
    }
    if (e.target.id === 'ac-no') { $('#ac-confirm').innerHTML = ''; return; }
    if (e.target.id === 'ac-yes') {
      const em = e.target.dataset.em; e.target.disabled = true;
      if (await setAcesso([...(S.acesso.emails || []), em])) {
        if (!S.cfg.pessoas?.b?.email) { const n = clone(S.cfg); n.pessoas.b = { ...(n.pessoas.b || {}), email: em }; delete n.atualizadoPor; delete n.atualizadoEm; await put('config', 'geral', n); }
        toast(`${em} agora tem acesso.`);
      }
      return;
    }
    const rv = e.target.closest('[data-revoke]');
    if (rv) {
      if (!rv.classList.contains('armed')) { rv.classList.add('armed'); rv.textContent = 'Confirmar remoção'; return; }
      if (await setAcesso((S.acesso.emails || []).filter(x => x !== rv.dataset.revoke))) toast('Acesso removido.');
      return;
    }
    const rm = e.target.closest('[data-rm]'), add = e.target.closest('[data-addcat]');
    if (rm) { const n = readForm(); n.categorias.splice(+rm.dataset.rm, 1); S.cfg = n; vAjustes(); }
    if (add) { const n = readForm(); const t = add.dataset.addcat; n.categorias.push(t === 'receita' ? { nome: '', tipo: 'receita' } : { nome: '', tipo: 'despesa', orcamento: 0, superfluo: false }); S.cfg = n; vAjustes(); const last = n.categorias.length - 1; $('#cat-n-' + last)?.focus(); }
  };
  $('#cfg-form').onsubmit = async e => {
    e.preventDefault();
    const n = readForm();
    n.categorias = n.categorias.filter(x => x.nome);
    n.pessoas = { a: { nome: $('#p-a').value.trim() || 'Pessoa 1', email: $('#p-ae').value.trim().toLowerCase() }, b: { nome: $('#p-b').value.trim() || 'Pessoa 2', email: $('#p-be').value.trim().toLowerCase() } };
    n.divisao = { modo: $('#d-modo').value, pctA: clamp(parseFloat($('#d-pct').value), 0, 100) };
    n.metaPoupanca = clamp(parseFloat($('#d-meta').value), 0, 100);
    S.me = $('#p-me').value; ls.set('nc_me', S.me);
    delete n.atualizadoPor; delete n.atualizadoEm;
    if (await put('config', 'geral', n)) { S.cfg = Object.assign(clone(DEF), n); S.memo = {}; render(); toast('Ajustes salvos para vocês dois.'); }
  };
}

/* ---------- formulário de lançamento ---------- */
let F = null, MODE = 'lanc', G = null;
function openForm(l, preset) {
  MODE = 'lanc';
  const novo = !l;
  F = novo ? Object.assign({ tipo: 'despesa', valor: 0, descricao: '', data: S.month === curYM() ? today() : S.month + '-01', categoria: '', quem: S.me, escopo: 'individual', divisao: 'padrao', pctA: 50, pago: true, classe: 'auto', recorrente: false, obs: '' }, preset || {}) : clone(l);
  F.id = l?.id; F.escopo ||= 'individual'; F.divisao ||= 'padrao'; F.classe ||= 'auto'; if (F.pago === undefined) F.pago = true;
  drawForm(novo);
  $('#dlg').showModal();
  setTimeout(() => $('#fm-valor')?.focus(), 30);
}
function drawForm(novo) {
  const seg = (name, opts, val, cls = '') => `<div class="seg ${cls}" role="group" data-seg="${name}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${String(val) === String(v)}">${esc(t)}</button>`).join('')}</div>`;
  const t = F.tipo;
  const catOpts = (t === 'acerto' ? [] : cats(t)).map(c => `<option${c.nome === F.categoria ? ' selected' : ''}>${esc(c.nome)}</option>`).join('');
  const sup = t === 'despesa' ? (F.classe === 'auto' ? (catInfo(F.categoria)?.superfluo ? 'supérfluo' : 'essencial') : '') : '';
  $('#frm').innerHTML = `<header><h2>${novo ? 'Novo lançamento' : 'Editar lançamento'}</h2><button type="button" class="x-btn" data-close aria-label="Fechar">×</button></header>
    ${seg('tipo', [['despesa', 'Despesa'], ['receita', 'Receita'], ['acerto', 'Acerto entre vocês']], t)}
    <div class="f2"><div class="field amount"><label for="fm-valor">Valor (R$)</label><input id="fm-valor" inputmode="decimal" placeholder="0,00" value="${moneyIn(+F.valor)}" required></div>
    <div class="field"><label for="fm-data">${t === 'despesa' && !F.pago ? 'Vencimento' : 'Data'}</label><input id="fm-data" type="date" value="${esc(F.data)}" required></div></div>
    ${t === 'acerto' ? `<div class="field"><span class="flabel">Quem pagou o acerto</span>${seg('quem', [['a', nome('a') + ' pagou ' + nome('b')], ['b', nome('b') + ' pagou ' + nome('a')]], F.quem, 'who')}</div><p class="hint">Use para registrar quando um transfere ao outro para zerar a divisão dos gastos em conjunto.</p>` : `
    <div class="field"><label for="fm-desc">Descrição</label><input id="fm-desc" value="${esc(F.descricao)}" placeholder="${t === 'despesa' ? 'Ex.: Mercado do mês' : 'Ex.: Salário'}" maxlength="80"></div>
    <div class="field"><label for="fm-cat">Categoria</label><select id="fm-cat"><option value="">Escolha…</option>${catOpts}</select></div>
    <div class="field"><span class="flabel">${t === 'despesa' ? 'É de quem?' : 'Receita de quem?'}</span>${seg('escopo', [['individual', 'Individual'], ['conjunto', 'Do casal']], F.escopo)}</div>
    <div class="field"><span class="flabel">${F.escopo === 'conjunto' ? (t === 'despesa' ? 'Quem pagou' : 'Quem recebeu') : 'Pessoa'}</span>${seg('quem', [['a', nome('a')], ['b', nome('b')]], F.quem, 'who')}</div>
    ${t === 'despesa' && F.escopo === 'conjunto' ? `<div class="field"><span class="flabel">Como dividir</span>${seg('divisao', [['padrao', 'Padrão'], ['metade', '50/50'], ['custom', 'Personalizado']], F.divisao)}
      ${F.divisao === 'custom' ? `<div class="f2" style="margin-top:6px"><div class="field"><label for="fm-pct">% de ${esc(nome('a'))}</label><input id="fm-pct" inputmode="numeric" value="${Math.round(+F.pctA)}"></div><div class="hint" style="align-self:end;padding-bottom:10px" id="fm-pct-h"></div></div>` : `<span class="hint" id="fm-div-h"></span>`}</div>` : ''}
    ${t === 'despesa' ? `<div class="f2"><div class="field"><span class="flabel">Situação</span>${seg('pago', [['true', 'Pago'], ['false', 'Pendente']], F.pago)}</div>
      <div class="field"><span class="flabel">Classificação</span>${seg('classe', [['auto', 'Auto'], ['essencial', 'Essencial'], ['superfluo', 'Supérfluo']], F.classe)}${sup ? `<span class="hint">Pela categoria: ${sup}</span>` : ''}</div></div>` : ''}
    <label class="check"><input type="checkbox" id="fm-rec" ${F.recorrente ? 'checked' : ''}> Repete todo mês (aluguel, internet, salário…)</label>
    <div class="field"><label for="fm-obs">Observação</label><textarea id="fm-obs" maxlength="300">${esc(F.obs)}</textarea></div>`}
    <footer><div>${novo ? '' : '<button type="button" class="btn danger" id="fm-del">Excluir</button>'}</div><div class="btns"><button type="button" class="btn" data-close>Cancelar</button><button class="btn pri" id="fm-save">${novo ? 'Lançar' : 'Salvar'}</button></div></footer>`;
  divHint();
}
function divHint() {
  const v = parseMoney($('#fm-valor')?.value) || 0;
  const h = $('#fm-div-h'), hp = $('#fm-pct-h');
  if (h) { const p = F.divisao === 'metade' ? 50 : pctPadrao(ym(F.data)); h.textContent = `${nome('a')}: ${money(v * p / 100)} · ${nome('b')}: ${money(v * (100 - p) / 100)}`; }
  if (hp) { const p = clamp(parseFloat($('#fm-pct').value), 0, 100); hp.textContent = `${nome('b')}: ${Math.round(100 - p)}% · ${money(v * p / 100)} / ${money(v * (100 - p) / 100)}`; }
}
function readFormFields() {
  F.valor = parseMoney($('#fm-valor').value); F.data = $('#fm-data').value || today();
  if ($('#fm-desc')) F.descricao = $('#fm-desc').value.trim();
  if ($('#fm-cat')) F.categoria = $('#fm-cat').value;
  if ($('#fm-pct')) F.pctA = clamp(parseFloat($('#fm-pct').value), 0, 100);
  if ($('#fm-rec')) F.recorrente = $('#fm-rec').checked;
  if ($('#fm-obs')) F.obs = $('#fm-obs').value.trim();
}
$('#frm').addEventListener('click', e => { if (e.target.closest('[data-close]')) $('#dlg').close(); });
$('#frm').addEventListener('click', async e => {
  if (MODE !== 'lanc') return;
  const b = e.target.closest('[data-seg] button');
  if (b) { readFormFields(); const k = b.closest('[data-seg]').dataset.seg; let v = b.dataset.v; if (k === 'pago') v = v === 'true'; F[k] = v; if (k === 'tipo') { F.categoria = ''; if (v === 'acerto') F.escopo = 'individual'; } drawForm(!F.id); return; }
  if (e.target.id === 'fm-del') {
    if (!e.target.classList.contains('armed')) { e.target.classList.add('armed'); e.target.textContent = 'Confirmar exclusão'; return; }
    if (await del('lancamentos', F.id)) { $('#dlg').close(); toast('Lançamento excluído.'); }
  }
});
$('#frm').addEventListener('input', e => { if (MODE !== 'lanc') return; if (['fm-valor', 'fm-pct'].includes(e.target.id)) divHint(); if (e.target.id === 'fm-cat' && F.tipo === 'despesa') { readFormFields(); drawForm(!F.id); } });
$('#frm').addEventListener('submit', async e => {
  e.preventDefault(); if (MODE !== 'lanc') return; readFormFields();
  if (!(F.valor > 0)) { toast('Informe um valor maior que zero.'); $('#fm-valor').focus(); return; }
  if (F.tipo !== 'acerto' && !F.categoria) { toast('Escolha uma categoria.'); $('#fm-cat').focus(); return; }
  const id = F.id || uid();
  const d = { tipo: F.tipo, valor: F.valor, data: F.data, quem: F.quem === 'b' ? 'b' : 'a', descricao: F.tipo === 'acerto' ? (F.descricao || 'Acerto entre vocês') : F.descricao, categoria: F.tipo === 'acerto' ? 'Acerto' : F.categoria };
  if (F.tipo !== 'acerto') Object.assign(d, { escopo: F.escopo, recorrente: !!F.recorrente, obs: F.obs || '', serie: F.serie || id });
  if (F.tipo === 'despesa') Object.assign(d, { pago: F.pago !== false, classe: F.classe, divisao: F.escopo === 'conjunto' ? F.divisao : 'padrao', pctA: F.escopo === 'conjunto' && F.divisao === 'custom' ? F.pctA : null });
  const novo = !F.id;
  $('#fm-save').disabled = true;
  if (await put('lancamentos', id, d)) { $('#dlg').close(); toast(novo ? `${F.tipo === 'receita' ? 'Receita' : F.tipo === 'acerto' ? 'Acerto' : 'Despesa'} de ${money(d.valor)} lançada.` : 'Alterações salvas.'); if (novo && ym(d.data) !== S.month) { S.month = ym(d.data); render(); } }
  else $('#fm-save').disabled = false;
});

/* ---------- meta ---------- */
function openGoal(g) {
  MODE = 'goal'; G = g || null;
  const novo = !g;
  $('#frm').innerHTML = `<header><h2>${novo ? 'Nova meta' : 'Editar meta'}</h2><button type="button" class="x-btn" data-close aria-label="Fechar">×</button></header>
    <div class="field"><label for="g-nome">Nome da meta</label><input id="g-nome" value="${esc(g?.nome || '')}" placeholder="Ex.: Reserva de emergência" maxlength="60"></div>
    <div class="f2"><div class="field amount"><label for="g-alvo">Valor da meta (R$)</label><input id="g-alvo" inputmode="decimal" value="${moneyIn(+g?.alvo || 0)}" placeholder="0,00"></div>
    <div class="field"><label for="g-prazo">Prazo (opcional)</label><input id="g-prazo" type="date" value="${esc(g?.prazo || '')}"></div></div>
    ${novo ? '<p class="hint">Dica: uma reserva de emergência costuma cobrir de 3 a 6 meses das despesas essenciais do casal.</p>' : ''}
    <footer><div>${novo ? '' : '<button type="button" class="btn danger" id="g-del">Excluir meta</button>'}</div><div class="btns"><button type="button" class="btn" data-close>Cancelar</button><button class="btn pri">${novo ? 'Criar meta' : 'Salvar'}</button></div></footer>`;
  $('#dlg').showModal();
}

$('#frm').addEventListener('submit', async e => {
  if (MODE !== 'goal') return; e.preventDefault();
  const g = G, novo = !g;
  const nomeG = $('#g-nome').value.trim(), alvo = parseMoney($('#g-alvo').value);
  if (!nomeG) { toast('Dê um nome para a meta.'); return; }
  if (!(alvo > 0)) { toast('Informe o valor da meta.'); return; }
  const d = { nome: nomeG, alvo, prazo: $('#g-prazo').value || '', aportes: g?.aportes || [], criadoEm: g?.criadoEm || today() };
  if (await put('metas', g?.id || uid(), d)) { $('#dlg').close(); toast(novo ? 'Meta criada.' : 'Meta atualizada.'); }
});
$('#frm').addEventListener('click', async e => {
  if (MODE !== 'goal' || e.target.id !== 'g-del') return;
  if (!e.target.classList.contains('armed')) { e.target.classList.add('armed'); e.target.textContent = 'Confirmar exclusão'; return; }
  if (await del('metas', G.id)) { $('#dlg').close(); toast('Meta excluída.'); }
});

/* ---------- eventos globais ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  const tab = t.closest('[data-tab]'); if (tab) { S.tab = tab.dataset.tab; ls.set('nc_tab', S.tab); render(); scrollTo(0, 0); return; }
  const go = t.closest('[data-go]'); if (go) { e.preventDefault(); S.tab = go.dataset.go; render(); scrollTo(0, 0); return; }
  const ed = t.closest('[data-edit]'); if (ed) { const l = S.lanc.find(x => x.id === ed.dataset.edit); if (l) openForm(l); return; }
  const nw = t.closest('[data-new]'); if (nw) { openForm(null, { tipo: nw.dataset.new }); return; }
  const ac = t.closest('[data-acerto]'); if (ac) { openForm(null, { tipo: 'acerto', quem: ac.dataset.acerto, valor: Math.round(Math.abs(calc(S.month).netTot) * 100) / 100 }); return; }
  const pay = t.closest('[data-pay]'); if (pay) { const l = S.lanc.find(x => x.id === pay.dataset.pay); if (l) { const n = clone(l); delete n.id; n.pago = true; if (await put('lancamentos', l.id, n)) toast(`${l.descricao || l.categoria} marcada como paga.`); } return; }
  const ge = t.closest('[data-goal-edit]'); if (ge) { openGoal(S.metas.find(x => x.id === ge.dataset.goalEdit)); return; }
});
$('#fab').onclick = () => openForm();
$('#m-prev').onclick = () => { S.month = addM(S.month, -1); render(); };
$('#m-next').onclick = () => { S.month = addM(S.month, 1); render(); };
$('#me-btn').onclick = () => { S.me = outro(S.me); ls.set('nc_me', S.me); render(); toast(`Agora lançando como ${nome(S.me)}.`); };
$('#dlg').addEventListener('click', e => { if (e.target === $('#dlg')) $('#dlg').close(); });

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200); }
function setLive(on, txt) { $('#live').classList.toggle('on', on); $('#live-t').textContent = txt; }
function showBanner() {
  const b = $('#banner');
  if (S.local) { b.hidden = false; b.textContent = 'O Firebase ainda não foi configurado (arquivo firebase-config.js). Nada está sendo salvo.'; }
  else if (!S.canWrite) { b.hidden = false; b.textContent = 'Esta conta não tem acesso aos dados do casal. Saia e entre com uma conta autorizada.'; $('#fab').hidden = true; }
  else b.hidden = true;
}

const mq = matchMedia('(prefers-color-scheme: dark)');
const reTheme = () => { if (S.tab === 'relatorios') render(); };
mq.addEventListener?.('change', reTheme);
new MutationObserver(reTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });


/* ---------- aplicativo instalável (PWA) ---------- */
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const SHARE_ICON = '<svg class="share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Compartilhar"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
function installHTML(compact) {
  if (isStandalone()) return compact ? '' : '<p class="note">O app já está instalado neste aparelho.</p>';
  if (installEvt) return `<div class="install"><div><b>Instale o Nosso Caixa</b><p>Abre direto da tela inicial, em tela cheia, como um aplicativo.</p></div><div class="btns"><button class="btn pri" data-install>Instalar</button></div></div>`;
  if (isIOS) return `<div class="install"><div><b>Instale no iPhone</b><p>No Safari, toque em ${SHARE_ICON} <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</p></div></div>`;
  if (/android/i.test(navigator.userAgent)) return `<div class="install"><div><b>Instale no Android</b><p>No Chrome, toque no menu <b>⋮</b> e depois em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p></div></div>`;
  return compact ? '' : '<p class="note">Abra este link no celular para instalar o app na tela inicial.</p>';
}
function renderInstall() { const l = $('#install-login'); if (l) l.innerHTML = installHTML(true); if (S.tab === 'painel' || S.tab === 'ajustes') render(); }
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderInstall(); });
addEventListener('appinstalled', () => { installEvt = null; toast('App instalado na tela inicial.'); renderInstall(); });
document.addEventListener('click', async e => {
  if (e.target.closest('[data-install]') && installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch {} installEvt = null; renderInstall(); }
  if (e.target.closest('[data-inst-off]')) { ls.set('nc_inst_off', '1'); render(); }
});

/* botão Voltar do Android fecha o formulário em vez de sair do app */
(() => {
  const dlg = $('#dlg'), open = dlg.showModal.bind(dlg);
  dlg.showModal = () => { open(); history.pushState({ modal: 1 }, ''); };
  dlg.addEventListener('close', () => { if (history.state && history.state.modal) history.back(); });
  addEventListener('popstate', () => { if (dlg.open) dlg.close(); });
})();

/* service worker: abre rápido, funciona sem internet e avisa quando há versão nova */
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const show = () => { $('#update').hidden = false; $('#update-btn').onclick = () => { (reg.waiting || reg.installing)?.postMessage('SKIP_WAITING'); $('#update-btn').disabled = true; }; };
    if (reg.waiting && hadController) show();
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) show(); }); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController || reloading) return; reloading = true; location.reload(); });
}

/* atalhos do ícone (segurar o ícone do app): nova despesa / nova receita */
function atalhoInicial() {
  const p = new URLSearchParams(location.search), t = p.get('nova');
  if (!t) return;
  history.replaceState(null, '', location.pathname);
  if (['despesa', 'receita'].includes(t)) setTimeout(() => openForm(null, { tipo: t }), 300);
}

/* ---------- conexão em tempo real ---------- */
async function start() {
  buildTabs();
  const saved = ls.get('nc_tab'); if (TABS.some(([k]) => k === saved)) S.tab = saved;
  render();
  const conf = window.FIREBASE_CONFIG;
  if (!window.firebase || !conf || !conf.apiKey || conf.apiKey.startsWith('COLE')) { S.local = true; setLive(false, 'Sem sincronização'); showBanner(); render(); $('#sair-btn').hidden = true; return; }
  firebase.initializeApp(conf);
  const db = firebase.firestore();
  try { await db.enablePersistence({ synchronizeTabs: true }); } catch {}
  S.db = db;
  const auth = firebase.auth(); S.auth = auth;
  auth.languageCode = 'pt';
  const DONO = String(window.APP_DONO || '').toLowerCase();
  const errEl = $('#login-err'), okEl = $('#login-ok');
  const msg = (t, ok) => { errEl.hidden = ok || !t; okEl.hidden = !ok || !t; (ok ? okEl : errEl).textContent = t || ''; };
  const AUTH_ERR = { 'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.', 'auth/user-not-found': 'Não existe conta com este e-mail. Toque em “Primeiro acesso? Criar senha”.', 'auth/email-already-in-use': 'Este e-mail já tem senha criada. Use “Entrar”.', 'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.', 'auth/invalid-email': 'Digite um e-mail válido.', 'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.', 'auth/network-request-failed': 'Sem conexão com a internet.' };
  const authErr = e => msg(AUTH_ERR[e.code] || ('Não foi possível concluir: ' + (e.message || e.code)));
  let criar = false;
  const showPane = id => { ['auth-form-w', 'auth-verify', 'auth-denied'].forEach(x => $('#' + x).hidden = x !== id); };
  $('#au-toggle').onclick = () => { criar = !criar; $('#au-go').textContent = criar ? 'Criar senha' : 'Entrar'; $('#au-toggle').textContent = criar ? 'Já tenho senha. Entrar' : 'Primeiro acesso? Criar senha'; $('#au-pass').autocomplete = criar ? 'new-password' : 'current-password'; $('#au-pass').placeholder = criar ? 'Crie uma senha (mínimo 6 caracteres)' : 'Senha'; msg(''); };
  $('#auth-form').onsubmit = async e => {
    e.preventDefault(); msg('');
    const em = $('#au-email').value.trim(), pw = $('#au-pass').value;
    if (!em || !pw) { msg('Preencha e-mail e senha.'); return; }
    $('#au-go').disabled = true;
    try {
      if (criar) { const c = await auth.createUserWithEmailAndPassword(em, pw); await c.user.sendEmailVerification(); }
      else await auth.signInWithEmailAndPassword(em, pw);
    } catch (er) { authErr(er); }
    $('#au-go').disabled = false;
  };
  $('#au-reset').onclick = async () => {
    const em = $('#au-email').value.trim(); if (!em) { msg('Digite seu e-mail no campo acima e toque de novo em “Esqueci a senha”.'); return; }
    try { await auth.sendPasswordResetEmail(em); msg('Enviamos um link para redefinir a senha. Veja sua caixa de entrada e o lixo eletrônico.', true); } catch (er) { authErr(er); }
  };
  $('#av-resend').onclick = async () => { try { await auth.currentUser.sendEmailVerification(); msg('E-mail reenviado.', true); } catch (er) { authErr(er); } };
  $('#av-ok').onclick = async () => { msg(''); try { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); gate(auth.currentUser); } catch (er) { authErr(er); } };
  $('#ad-retry').onclick = () => { msg(''); gate(auth.currentUser); };
  // Sair também apaga a cópia offline dos dados guardada neste aparelho.
  async function sair() {
    try { unsub.forEach(f => f()); unsub = []; await auth.signOut(); await db.terminate(); await db.clearPersistence(); } catch {}
    location.reload();
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-signout]')) sair(); });
  $('#sair-btn').onclick = sair;
  let unsub = [];
  const onErr = e => {
    if (e?.code === 'permission-denied') {
      unsub.forEach(f => f()); unsub = [];
      S.lanc = []; S.metas = []; changed(); setLive(false, 'Sem acesso');
      $('#ad-email').textContent = auth.currentUser?.email || ''; $('#login').hidden = false; showPane('auth-denied'); return;
    }
    setLive(false, 'Desconectado');
  };
  function subscribe() {
    unsub.forEach(f => f()); unsub = [];
    unsub.push(db.doc('acesso/membros').onSnapshot(s => {
      S.acesso = s.exists ? s.data() : { dono: DONO, emails: [DONO] };
      // Primeiro acesso do administrador: cria a lista de pessoas autorizadas.
      if (!s.exists && !s.metadata.fromCache && S.isDono) db.doc('acesso/membros').set({ dono: DONO, emails: [DONO] }).catch(() => {});
      if (S.tab === 'ajustes') render();
    }, onErr));
    unsub.push(db.doc('config/geral').onSnapshot(s => {
      if (s.exists) { const d = s.data(); S.cfg = Object.assign(clone(DEF), clone(d)); if (!Array.isArray(d.categorias) || !d.categorias.length) S.cfg.categorias = clone(DEF.categorias); S.cfg.categorias = S.cfg.categorias.filter(c => c && typeof c === 'object').map(c => ({ ...c, nome: String(c.nome ?? '') })); if (!S.cfg.pessoas || typeof S.cfg.pessoas !== 'object') S.cfg.pessoas = clone(DEF.pessoas); }
      const em = S.email;
      if (em && S.cfg.pessoas?.a?.email === em) S.me = 'a'; else if (em && S.cfg.pessoas?.b?.email === em) S.me = 'b';
      changed();
    }, onErr));
    unsub.push(db.collection('lancamentos').orderBy('data', 'desc').limit(1000).onSnapshot({ includeMetadataChanges: true }, s => {
      S.lanc = s.docs.map(d => normLanc(d.data(), d.id));
      setLive(!s.metadata.fromCache, s.metadata.fromCache ? (navigator.onLine ? 'Sincronizando…' : 'Offline') : 'Ao vivo');
      if (!S.first.l) for (const ch of s.docChanges()) {
        if (ch.doc.metadata.hasPendingWrites) continue; const d = ch.doc.data() && normLanc(ch.doc.data(), ch.doc.id); if (!d || d.atualizadoPor === S.me) continue;
        const quem = nome(d.atualizadoPor || outro(S.me));
        toast(ch.type === 'removed' ? `${quem} excluiu: ${d.descricao || d.categoria}` : `${quem} ${ch.type === 'added' ? 'lançou' : 'editou'}: ${d.descricao || d.categoria} · ${money(d.valor)}`);
      }
      if (!s.metadata.fromCache) S.first.l = false;
      if ($('#dlg').open && MODE === 'lanc' && F?.id && !S.lanc.some(x => x.id === F.id)) { $('#dlg').close(); toast('Este lançamento foi excluído no outro aparelho.'); }
      changed();
    }, onErr));
    unsub.push(db.collection('metas').onSnapshot(s => {
      S.metas = s.docs.map(d => normMeta(d.data(), d.id));
      if (!S.first.m) for (const ch of s.docChanges()) { if (ch.doc.metadata.hasPendingWrites) continue; const d = ch.doc.data() && normMeta(ch.doc.data(), ch.doc.id); if (d && d.atualizadoPor !== S.me && ch.type !== 'removed') toast(`${nome(d.atualizadoPor || outro(S.me))} atualizou a meta ${d.nome}.`); }
      S.first.m = false;
      changed();
    }, onErr));
  }
  async function gate(u) {
    unsub.forEach(f => f()); unsub = [];
    renderInstall();
    if (!u) { S.lanc = []; S.metas = []; S.acesso = null; S.first = { l: true, m: true }; $('#login').hidden = false; showPane('auth-form-w'); changed(); return; }
    S.email = (u.email || '').toLowerCase(); S.isDono = !!DONO && S.email === DONO;
    $('#login').hidden = false;
    if (!u.emailVerified) { $('#av-email').textContent = u.email; showPane('auth-verify'); return; }
    // Entra na hora (inclusive offline); as regras do servidor decidem o acesso e,
    // se a conta não for autorizada, os listeners recebem permission-denied e mostram o aviso.
    msg(''); $('#login').hidden = true;
    S.canWrite = true; showBanner(); $('#fab').hidden = false;
    atalhoInicial();
    subscribe();
  }
  auth.onAuthStateChanged(u => gate(u));
}
start();
})();
