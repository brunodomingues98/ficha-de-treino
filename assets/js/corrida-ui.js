// Interface da aba Corrida: questionário, planilha semanal e progresso.
// O app.js injeta o contexto (usuário, salvar, toast...) via configurarCorrida().

import {
  NIVEIS, OBJETIVOS, DIAS_CURTOS, ORDEM_SEMANA, MAX_SEMANAS, ROTULO_SEMANA,
  objetivosDoNivel, distanciasDoNivel, limiteDias, ehIniciante,
  isoLocal, parseISO, somarDias, diferencaDias, parseTempo,
  prazoProva, gerarPlanoCorrida, descreverSessao, estimarSessao,
} from './corrida.js';

let getCtx = null;
export function configurarCorrida(fn) { getCtx = fn; }
const ctx = () => getCtx();

// ── Utilidades ─────────────────────────────────────────────

const hoje = () => isoLocal(new Date());
const fmtDM = iso => iso.slice(5).split('-').reverse().join('/');
const fmtDMA = iso => iso.split('-').reverse().join('/');
const fmtKm = n => String(n).replace('.', ',');
const arred1 = v => Math.round(v * 10) / 10;
const fmtTempo = seg => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
const fmtDuracao = min => {
  const h = Math.floor(min / 60);
  return h ? `${h}h${String(min % 60).padStart(2, '0')}` : `${min}min`;
};

const AVISOS = {
  lesao_atual: 'Você informou dor ou lesão atual. Procure um profissional de saúde antes de começar. Este plano é conservador, mas não substitui avaliação. Pare se sentir dor.',
  lesao_leve: 'Você informou um incômodo leve. O plano progride mais devagar. Reduza ou pule o treino se a dor aumentar.',
  iniciante: 'Este plano é uma orientação geral e não substitui avaliação médica. Pare e procure ajuda se sentir dor, tontura ou falta de ar fora do normal.',
  dias_seguidos: 'Você escolheu dias seguidos de treino. Para quem está começando, o ideal é descansar pelo menos um dia entre as sessões.',
};

function dadosPlano() {
  const c = ctx().userData?.corrida;
  return c && c.plano ? c : null;
}

function achar(plano, sid) {
  for (const s of plano.semanas) {
    const x = s.sessoes.find(y => y.id === sid);
    if (x) return x;
  }
  return null;
}

// Só as semanas dos últimos 30 dias em diante ficam visíveis (e com registro salvo)
function semanasVisiveis(plano, h) {
  const limite = somarDias(h, -30);
  return plano.semanas.filter(s => s.fim >= limite);
}

function podar(corrida, registro) {
  const vis = new Set();
  semanasVisiveis(corrida.plano, hoje()).forEach(s => s.sessoes.forEach(x => vis.add(x.id)));
  const novo = {};
  let mudou = false;
  Object.entries(registro).forEach(([id, r]) => { if (vis.has(id)) novo[id] = r; else mudou = true; });
  return { registro: novo, mudou };
}

async function podarSilencioso() {
  const c = dadosPlano();
  if (!c) return;
  const { registro, mudou } = podar(c, c.registro || {});
  if (!mudou) return;
  try {
    await ctx().salvar({ 'corrida.registro': registro });
    c.registro = registro;
  } catch { /* tenta de novo na próxima abertura */ }
}

// ── Aba Corrida ────────────────────────────────────────────

let semanasAbertas = null;

export function renderCorrida() {
  const c = dadosPlano();
  return `<div id="cor-root">${c ? htmlPlano(c) : htmlVazio()}</div>`;
}

function htmlVazio() {
  return `
    <div class="cor-topo"><h1>🏃 <span>Corrida</span></h1></div>
    <div class="cor-vazio">
      <div class="icon">🏃</div>
      <h2>Monte seu plano de corrida</h2>
      <p>Responda 4 perguntas rápidas e receba uma planilha semana a semana, com o treino de cada dia.</p>
      <button class="btn-primary" id="cor-criar">Criar plano de corrida</button>
    </div>`;
}

function htmlPlano(c) {
  const h = hoje();
  const { plano, entrada, totais = { sessoes: 0, km: 0, min: 0 } } = c;
  const visiveis = semanasVisiveis(plano, h);
  const atual = plano.semanas.find(s => s.inicio <= h && h <= s.fim);
  const ultima = plano.semanas[plano.semanas.length - 1];
  const finalizado = h > ultima.fim;

  if (!semanasAbertas) {
    const alvo = atual || visiveis[visiveis.length - 1];
    semanasAbertas = new Set(alvo ? [alvo.n] : []);
  }

  const pct = plano.totalSessoes ? Math.min(100, Math.round((totais.sessoes / plano.totalSessoes) * 100)) : 0;

  let infoProva = '';
  if (entrada.objetivo === 'prova') {
    if (entrada.dataProva) {
      const dias = diferencaDias(h, entrada.dataProva);
      infoProva = dias > 0
        ? `🏁 Prova de ${entrada.distanciaProva} km em ${dias} dia${dias === 1 ? '' : 's'} (${fmtDMA(entrada.dataProva)})`
        : dias === 0 ? `🏁 Sua prova de ${entrada.distanciaProva} km é hoje!`
        : `🏁 Prova de ${entrada.distanciaProva} km em ${fmtDMA(entrada.dataProva)}`;
    } else {
      infoProva = `🏁 Preparação para ${entrada.distanciaProva} km`;
    }
  }

  const avisos = (plano.avisos || []).map(a => `<div class="cor-aviso">${AVISOS[a] || ''}</div>`).join('');

  return `
    <div class="cor-topo">
      <h1>🏃 <span>Corrida</span></h1>
      <button class="cor-btn-mini" id="cor-refazer">Novo plano</button>
    </div>

    <div class="cor-resumo">
      <div class="cor-resumo-linha">
        <span>${finalizado ? 'Plano concluído' : atual ? `Semana ${atual.n} de ${plano.semanas.length}` : 'Plano de corrida'}</span>
        <span>${pct}% do plano</span>
      </div>
      <div class="cor-barra"><div style="width:${pct}%"></div></div>
      <div class="cor-tiles">
        <div class="cor-tile"><b>${totais.sessoes}</b><span>Sessões</span></div>
        <div class="cor-tile"><b>${fmtKm(arred1(totais.km))}</b><span>Km</span></div>
        <div class="cor-tile"><b>${fmtDuracao(totais.min)}</b><span>Tempo</span></div>
      </div>
    </div>

    ${infoProva ? `<div class="cor-prova">${infoProva}</div>` : ''}
    ${avisos}

    <p class="section-title">PLANILHA</p>
    ${visiveis.length
      ? visiveis.map(s => htmlSemana(s, c, h, atual)).join('')
      : `<div class="cor-aviso">Este plano terminou há mais de 30 dias. Crie um novo plano para continuar.</div>`}
    <p class="cor-legal">A planilha mostra as semanas dos últimos 30 dias em diante. Os totais de sessões, km e tempo continuam acumulados.</p>
  `;
}

function htmlSemana(sem, c, h, atual) {
  const registro = c.registro || {};
  const feitas = sem.sessoes.filter(s => registro[s.id]).length;
  const aberta = semanasAbertas.has(sem.n);
  const rotulo = ROTULO_SEMANA[sem.tipo];

  const linhas = [];
  for (let i = 0; i < 7; i++) {
    const data = somarDias(sem.inicio, i);
    const dia = DIAS_CURTOS[parseISO(data).getDay()];
    const eHoje = data === h;
    const s = sem.sessoes.find(x => x.data === data);

    if (!s) {
      linhas.push(`
        <div class="pl-linha descanso ${eHoje ? 'hoje' : ''}">
          <div class="pl-dia"><b>${dia}</b><span>${fmtDM(data)}</span></div>
          <div class="pl-treino"><div class="pl-resumo">Descanso</div></div>
          <span></span>
        </div>`);
      continue;
    }

    const d = descreverSessao(s, c.ritmos);
    const r = registro[s.id];
    const perdido = !r && data < h;
    linhas.push(`
      <div class="pl-linha ${eHoje ? 'hoje' : ''} ${r ? 'feito' : ''} ${perdido ? 'perdido' : ''}" data-sid="${s.id}">
        <div class="pl-dia"><b>${dia}</b><span>${fmtDM(data)}</span></div>
        <div class="pl-treino">
          <div class="pl-titulo">${d.titulo}</div>
          <div class="pl-resumo">${d.resumo}</div>
          <div class="pl-detalhe">${d.detalhe}</div>
          ${r ? `<div class="pl-real">Feito: ${fmtKm(r.km)} km · ${r.min} min${r.estimado ? ' (previsto)' : ''}<button class="pl-ajustar" data-sid="${s.id}">ajustar</button></div>` : ''}
        </div>
        <button class="pl-check ${r ? 'done' : ''}" data-sid="${s.id}" aria-label="Marcar como feito">✓</button>
      </div>`);
  }

  return `
    <div class="pl-semana ${aberta ? 'aberta' : ''} ${atual && atual.n === sem.n ? 'atual' : ''}" data-semana="${sem.n}">
      <div class="pl-semana-cab">
        <div class="tit">Semana ${sem.n}<small>${fmtDM(sem.inicio)} a ${fmtDM(sem.fim)}</small></div>
        ${rotulo ? `<span class="pl-badge">${rotulo}</span>` : ''}
        <span class="pl-cont">${feitas}/${sem.sessoes.length}</span>
      </div>
      <div class="pl-corpo">${linhas.join('')}</div>
    </div>`;
}

export function bindCorrida() {
  const root = document.getElementById('cor-root');
  if (!root) return;

  root.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('#cor-criar') || t.closest('#cor-refazer')) { abrirWizard(); return; }

    const check = t.closest('.pl-check');
    if (check) { await alternarSessao(check.dataset.sid); return; }

    const ajustar = t.closest('.pl-ajustar');
    if (ajustar) { abrirAjuste(ajustar.dataset.sid); return; }

    const cab = t.closest('.pl-semana-cab');
    if (cab) {
      const sem = cab.parentElement;
      const n = Number(sem.dataset.semana);
      sem.classList.toggle('aberta');
      if (sem.classList.contains('aberta')) semanasAbertas.add(n); else semanasAbertas.delete(n);
      return;
    }

    const linha = t.closest('.pl-linha[data-sid]');
    if (linha) linha.classList.toggle('aberta');
  });

  podarSilencioso();
}

async function alternarSessao(sid) {
  const c = ctx();
  const corrida = c.userData.corrida;
  const sessao = achar(corrida.plano, sid);
  if (!sessao) return;

  const registro = { ...(corrida.registro || {}) };
  const totais = { sessoes: 0, km: 0, min: 0, ...(corrida.totais || {}) };
  const patch = {};
  const h = hoje();

  if (registro[sid]) {
    const r = registro[sid];
    totais.sessoes = Math.max(0, totais.sessoes - 1);
    totais.km = arred1(Math.max(0, totais.km - (r.km || 0)));
    totais.min = Math.max(0, totais.min - (r.min || 0));
    delete registro[sid];
  } else {
    const est = estimarSessao(sessao, corrida.ritmos);
    registro[sid] = { data: sessao.data, feitoEm: h, km: est.km, min: est.min, estimado: true };
    totais.sessoes += 1;
    totais.km = arred1(totais.km + est.km);
    totais.min += est.min;
    // o dia também conta na barra "Sua semana" da Home
    patch.historico = { ...(c.userData.historico || {}), [h]: true };
  }

  const podado = podar(corrida, registro).registro;
  patch['corrida.registro'] = podado;
  patch['corrida.totais'] = totais;

  try {
    await c.salvar(patch);
    corrida.registro = podado;
    corrida.totais = totais;
    if (patch.historico) c.userData.historico = patch.historico;
    const y = window.scrollY;
    c.rerender();
    window.scrollTo(0, y);
  } catch (err) {
    c.showToast('❌ Erro ao salvar: ' + err.message);
  }
}

function abrirAjuste(sid) {
  const c = ctx();
  const corrida = c.userData.corrida;
  const r = (corrida.registro || {})[sid];
  if (!r) return;

  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Ajustar treino feito</div>
      <div class="login-error" id="aj-erro"></div>
      <div class="cor-form">
        <div class="field-group"><label>Distância (km)</label>
          <input type="text" inputmode="decimal" id="aj-km" value="${fmtKm(r.km)}"></div>
        <div class="field-group"><label>Tempo (min)</label>
          <input type="number" inputmode="numeric" id="aj-min" value="${r.min}" min="1" max="600"></div>
      </div>
      <button class="btn-primary" id="aj-salvar">Salvar</button>
      <button class="btn-secondary" id="aj-cancelar" style="margin-top:8px">Cancelar</button>
    </div>`;
  document.body.appendChild(ov);

  ov.querySelector('#aj-cancelar').addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.querySelector('#aj-salvar').addEventListener('click', async () => {
    const km = parseFloat(ov.querySelector('#aj-km').value.replace(',', '.'));
    const min = parseInt(ov.querySelector('#aj-min').value, 10);
    const erro = ov.querySelector('#aj-erro');
    if (!(km > 0 && km <= 100) || !(min >= 1 && min <= 600)) {
      erro.textContent = 'Informe uma distância (até 100 km) e um tempo (1 a 600 min) válidos.';
      erro.classList.add('show');
      return;
    }
    const totais = { sessoes: 0, km: 0, min: 0, ...(corrida.totais || {}) };
    totais.km = arred1(Math.max(0, totais.km - (r.km || 0) + km));
    totais.min = Math.max(0, totais.min - (r.min || 0) + min);
    const registro = { ...corrida.registro, [sid]: { ...r, km: arred1(km), min, estimado: false } };
    try {
      await c.salvar({ 'corrida.registro': registro, 'corrida.totais': totais });
      corrida.registro = registro;
      corrida.totais = totais;
      ov.remove();
      const y = window.scrollY;
      c.rerender();
      window.scrollTo(0, y);
    } catch (err) {
      erro.textContent = 'Erro ao salvar: ' + err.message;
      erro.classList.add('show');
    }
  });
}

// ── Card na Home ───────────────────────────────────────────

export function cartaoCorridaHome() {
  const c = dadosPlano();
  if (!c) return '';
  const h = hoje();
  const reg = c.registro || {};
  const todas = c.plano.semanas.flatMap(s => s.sessoes);
  const doDia = todas.find(s => s.data === h);

  let titulo, sub;
  if (doDia) {
    const d = descreverSessao(doDia, c.ritmos);
    titulo = reg[doDia.id] ? '✅ Corrida de hoje concluída' : `Hoje · ${d.titulo}`;
    sub = d.resumo;
  } else {
    const prox = todas.find(s => s.data > h);
    if (prox) {
      const d = descreverSessao(prox, c.ritmos);
      titulo = `Próxima corrida · ${DIAS_CURTOS[parseISO(prox.data).getDay()]} ${fmtDM(prox.data)}`;
      sub = `${d.titulo} · ${d.resumo}`;
    } else {
      titulo = 'Plano de corrida concluído 🎉';
      sub = 'Toque para ver o resumo ou criar um novo plano';
    }
  }

  return `
    <p class="section-title">🏃 CORRIDA</p>
    <div class="cor-card-home" id="cor-card-home">
      <div class="cor-card-icon">🏃</div>
      <div class="cor-card-info">
        <div class="cor-card-titulo">${titulo}</div>
        <div class="cor-card-sub">${sub}</div>
      </div>
      <span class="aluno-chevron">›</span>
    </div>`;
}

export function bindCartaoCorridaHome() {
  document.getElementById('cor-card-home')?.addEventListener('click', () => ctx().irParaCorrida());
}

// ── Questionário (4 passos) ────────────────────────────────

let wiz = null;

function dadosVazios() {
  return { nivel: '', objetivo: '', distanciaProva: null, dataProva: '', tempo5k: '', distanciaAtual: '', distanciaAlvo: '', dias: [], lesao: 'nenhuma' };
}

function dadosDeEntrada(e) {
  return {
    nivel: e.nivel, objetivo: e.objetivo, distanciaProva: e.distanciaProva, dataProva: e.dataProva || '',
    tempo5k: e.tempo5k ? fmtTempo(e.tempo5k) : '',
    distanciaAtual: e.distanciaAtual ?? '', distanciaAlvo: e.distanciaAlvo ?? '',
    dias: [...(e.dias || [])], lesao: e.lesao || 'nenhuma',
  };
}

function entradaDe(d) {
  const num = v => parseFloat(String(v).replace(',', '.'));
  return {
    nivel: d.nivel, objetivo: d.objetivo, distanciaProva: d.distanciaProva, dataProva: d.dataProva || null,
    tempo5k: d.tempo5k, distanciaAtual: num(d.distanciaAtual), distanciaAlvo: num(d.distanciaAlvo),
    dias: d.dias, lesao: d.lesao,
  };
}

function abrirWizard() {
  if (dadosPlano() && !confirm('Criar um novo plano substitui o plano atual e o progresso salvo dele. Continuar?')) return;
  const atual = dadosPlano();
  wiz = { passo: 1, d: atual ? dadosDeEntrada(atual.entrada) : dadosVazios() };

  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.id = 'cor-wizard';
  document.body.appendChild(ov);
  ov.addEventListener('click', onWizClick);
  ov.addEventListener('input', onWizInput);
  ov.addEventListener('change', onWizInput);
  renderWizard();
}

function erroDataProva(d) {
  if (!d.dataProva) return '';
  const p = prazoProva(d.nivel, d.distanciaProva, d.lesao, hoje());
  if (!p) return '';
  const dias = diferencaDias(hoje(), d.dataProva);
  const n = Math.floor(dias / 7) + 1;
  if (dias < 0) return 'A data da prova precisa ser no futuro.';
  if (n < p.minSemanas) return `Data cedo demais para o seu nível. Escolha a partir de ${fmtDMA(p.dataMinima)}.`;
  if (n > MAX_SEMANAS) return `A prova precisa estar a no máximo ${MAX_SEMANAS} semanas (cerca de 6 meses).`;
  return '';
}

function textoPrazo(d) {
  const p = prazoProva(d.nivel, d.distanciaProva, d.lesao, hoje());
  if (!p) return '';
  const base = `Prazo mínimo para o seu nível: ${p.minSemanas} semanas (prova a partir de ${fmtDMA(p.dataMinima)}). Sem data, o plano usa o prazo recomendado.`;
  if (!d.dataProva) return base;
  const erro = erroDataProva(d);
  if (erro) return `<span class="erro">${erro}</span> ${base}`;
  return `<span class="ok">✓ Data dentro do prazo (${Math.floor(diferencaDias(hoje(), d.dataProva) / 7) + 1} semanas de plano).</span>`;
}

function passoNivel(d) {
  return `
    <div class="cor-titulo">Você consegue correr hoje?</div>
    <div class="cor-sub">Assim o plano começa no ponto certo</div>
    <div class="cor-opcoes">
      ${NIVEIS.map(n => `
        <button class="cor-opcao ${d.nivel === n.id ? 'sel' : ''}" data-act="set" data-campo="nivel" data-valor="${n.id}">
          <span class="ic">${n.icone}</span>
          <span><b>${n.titulo}</b><small>${n.desc}</small></span>
        </button>`).join('')}
    </div>`;
}

function detalhesObjetivo(d) {
  const iniciante = ehIniciante(d.nivel);
  if (d.objetivo === 'prova') {
    const p = prazoProva(d.nivel, d.distanciaProva, d.lesao, hoje());
    const min = p ? p.dataMinima : somarDias(hoje(), 7);
    const max = p ? p.dataMaxima : somarDias(hoje(), 7 * MAX_SEMANAS - 1);
    return `
      <div class="cor-form">
        <div class="field-group"><label>Distância da prova</label>
          <select data-campo="distanciaProva">
            ${distanciasDoNivel(d.nivel).map(x => `<option value="${x}" ${d.distanciaProva === x ? 'selected' : ''}>${x} km</option>`).join('')}
          </select></div>
        <div class="field-group"><label>Data da prova (opcional)</label>
          <input type="date" data-campo="dataProva" value="${d.dataProva || ''}" min="${min}" max="${max}"></div>
        ${iniciante ? '' : `
        <div class="field-group"><label>Tempo recente de 5 km (opcional)</label>
          <input type="text" inputmode="numeric" data-campo="tempo5k" placeholder="28:30" value="${d.tempo5k}"></div>`}
        <div class="cor-dica" id="cor-prazo">${textoPrazo(d)}</div>
      </div>`;
  }
  if (d.objetivo === 'pace') {
    return `
      <div class="cor-form">
        <div class="field-group"><label>Seu tempo recente de 5 km</label>
          <input type="text" inputmode="numeric" data-campo="tempo5k" placeholder="28:30" value="${d.tempo5k}"></div>
        <div class="cor-dica">Com esse tempo, o plano calcula o ritmo de cada tipo de treino.</div>
      </div>`;
  }
  if (d.objetivo === 'distancia') {
    return `
      <div class="cor-form">
        <div class="field-group"><label>Maior distância que você corre hoje (km)</label>
          <input type="text" inputmode="decimal" data-campo="distanciaAtual" placeholder="5" value="${d.distanciaAtual}"></div>
        <div class="field-group"><label>Distância que quer alcançar (km)</label>
          <input type="text" inputmode="decimal" data-campo="distanciaAlvo" placeholder="10" value="${d.distanciaAlvo}"></div>
      </div>`;
  }
  return '';
}

function passoObjetivo(d) {
  return `
    <div class="cor-titulo">Qual o seu objetivo?</div>
    <div class="cor-sub">Escolha o foco principal do plano</div>
    <div class="cor-opcoes">
      ${objetivosDoNivel(d.nivel).map(id => `
        <button class="cor-opcao ${d.objetivo === id ? 'sel' : ''}" data-act="set" data-campo="objetivo" data-valor="${id}">
          <span class="ic">${OBJETIVOS[id].icone}</span>
          <span><b>${OBJETIVOS[id].titulo}</b><small>${OBJETIVOS[id].desc}</small></span>
        </button>`).join('')}
    </div>
    ${detalhesObjetivo(d)}`;
}

function passoDias(d) {
  const lim = limiteDias(d.nivel);
  return `
    <div class="cor-titulo">Quais dias você pode treinar?</div>
    <div class="cor-sub">Escolha de ${lim.min} a ${lim.max} dias por semana</div>
    <div class="cor-chips">
      ${ORDEM_SEMANA.map(wd => `<button class="cor-chip ${d.dias.includes(wd) ? 'sel' : ''}" data-act="dia" data-valor="${wd}">${DIAS_CURTOS[wd]}</button>`).join('')}
    </div>
    <div class="cor-dica" id="cor-dias-info">${d.dias.length} ${d.dias.length === 1 ? 'dia' : 'dias'} de treino por semana</div>
    ${ehIniciante(d.nivel) ? '<div class="cor-dica">Para quem está começando, o ideal é 3 dias por semana, com descanso entre os treinos.</div>' : ''}`;
}

function passoSaude(d) {
  const opcoes = [
    { id: 'nenhuma', titulo: 'Nenhuma', desc: 'Sem dores ou lesões' },
    { id: 'leve', titulo: 'Incômodo leve', desc: 'Dor ocasional no joelho, canela, tornozelo etc.' },
    { id: 'atual', titulo: 'Dor ou lesão atual', desc: 'Tenho dor ou estou me recuperando de lesão' },
  ];
  const dias = ORDEM_SEMANA.filter(wd => d.dias.includes(wd)).map(wd => DIAS_CURTOS[wd]).join(', ');
  let objetivo = OBJETIVOS[d.objetivo].titulo;
  if (d.objetivo === 'prova') objetivo += ` (${d.distanciaProva} km${d.dataProva ? ', ' + fmtDMA(d.dataProva) : ''})`;
  if (d.objetivo === 'distancia') objetivo += ` (${d.distanciaAtual} → ${d.distanciaAlvo} km)`;
  return `
    <div class="cor-titulo">Alguma dor ou lesão?</div>
    <div class="cor-sub">O plano fica mais cuidadoso quando há desconforto</div>
    <div class="cor-opcoes">
      ${opcoes.map(o => `
        <button class="cor-opcao ${d.lesao === o.id ? 'sel' : ''}" data-act="set" data-campo="lesao" data-valor="${o.id}">
          <span><b>${o.titulo}</b><small>${o.desc}</small></span>
        </button>`).join('')}
    </div>
    <div class="cor-resumo-lista">
      <b>Resumo</b><br>
      Nível: ${NIVEIS.find(n => n.id === d.nivel).titulo}<br>
      Objetivo: ${objetivo}<br>
      Dias: ${dias} (${d.dias.length} treinos por semana)
    </div>
    <p class="cor-legal">Este plano é uma orientação geral e não substitui avaliação médica ou de um profissional de educação física. Se você está começando, tem mais de 40 anos ou alguma condição de saúde, consulte um médico antes de iniciar. Pare se sentir dor, tontura ou falta de ar fora do normal.</p>`;
}

function renderWizard() {
  const ov = document.getElementById('cor-wizard');
  if (!ov || !wiz) return;
  const { passo, d } = wiz;
  const corpo = [passoNivel, passoObjetivo, passoDias, passoSaude][passo - 1](d);
  ov.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="cor-wiz-topo">
        <div class="modal-title" style="margin:0">🏃 Plano de corrida</div>
        <button class="cor-x" data-act="fechar" aria-label="Fechar">×</button>
      </div>
      <div class="cor-passos">${[1, 2, 3, 4].map(i => `<span class="cor-passo ${i === passo ? 'ativo' : i < passo ? 'ok' : ''}"></span>`).join('')}</div>
      <div class="login-error" id="cor-erro"></div>
      ${corpo}
      <div class="cor-wiz-botoes">
        ${passo > 1 ? '<button class="btn-secondary" data-act="voltar">Voltar</button>' : ''}
        <button class="btn-primary" data-act="${passo === 4 ? 'gerar' : 'avancar'}">${passo === 4 ? 'Gerar plano' : 'Continuar'}</button>
      </div>
    </div>`;
}

function mostrarErro(msg) {
  const el = document.getElementById('cor-erro');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}

function onWizInput(e) {
  const campo = e.target.dataset?.campo;
  if (!campo || !wiz) return;
  const v = e.target.value;
  wiz.d[campo] = campo === 'distanciaProva' ? Number(v) : v;
  if (campo === 'distanciaProva' || campo === 'dataProva') {
    const el = document.getElementById('cor-prazo');
    if (el) el.innerHTML = textoPrazo(wiz.d);
  }
}

function validarPasso() {
  const d = wiz.d;
  if (wiz.passo === 1 && !d.nivel) return 'Escolha uma opção para continuar.';
  if (wiz.passo === 2) {
    if (!d.objetivo) return 'Escolha seu objetivo.';
    if (d.tempo5k && !parseTempo(d.tempo5k)) return 'Tempo de 5 km inválido. Use o formato mm:ss, por exemplo 28:30.';
    if (d.objetivo === 'pace' && !parseTempo(d.tempo5k)) return 'Informe seu tempo recente de 5 km (exemplo: 28:30).';
    if (d.objetivo === 'prova') {
      if (!d.distanciaProva) return 'Escolha a distância da prova.';
      const erro = erroDataProva(d);
      if (erro) return erro;
    }
    if (d.objetivo === 'distancia') {
      const a = parseFloat(String(d.distanciaAtual).replace(',', '.'));
      const b = parseFloat(String(d.distanciaAlvo).replace(',', '.'));
      if (!(a >= 1 && a <= 42)) return 'Informe a maior distância que você corre hoje (de 1 a 42 km).';
      if (!(b > a && b <= 42)) return 'A distância que quer alcançar precisa ser maior que a atual (máximo 42 km).';
    }
  }
  if (wiz.passo === 3) {
    const lim = limiteDias(d.nivel);
    if (d.dias.length < lim.min || d.dias.length > lim.max) return `Escolha de ${lim.min} a ${lim.max} dias de treino.`;
  }
  return '';
}

async function onWizClick(e) {
  const btn = e.target.closest('[data-act]');
  if (!btn || !wiz) return;
  const act = btn.dataset.act;
  const d = wiz.d;

  if (act === 'fechar') { document.getElementById('cor-wizard')?.remove(); wiz = null; return; }
  if (act === 'voltar') { wiz.passo -= 1; renderWizard(); return; }

  if (act === 'set') {
    const { campo, valor } = btn.dataset;
    d[campo] = valor;
    if (campo === 'nivel') {
      if (!objetivosDoNivel(valor).includes(d.objetivo)) d.objetivo = '';
      d.distanciaProva = null;
      const lim = limiteDias(valor);
      if (d.dias.length > lim.max) d.dias = d.dias.slice(0, lim.max);
    }
    if (campo === 'objetivo' && valor === 'prova' && !d.distanciaProva) d.distanciaProva = distanciasDoNivel(d.nivel)[0];
    renderWizard();
    return;
  }

  if (act === 'dia') {
    const wd = Number(btn.dataset.valor);
    const lim = limiteDias(d.nivel);
    if (d.dias.includes(wd)) d.dias = d.dias.filter(x => x !== wd);
    else if (d.dias.length < lim.max) d.dias.push(wd);
    else { mostrarErro(`No máximo ${lim.max} dias por semana para o seu nível.`); return; }
    renderWizard();
    return;
  }

  if (act === 'avancar') {
    const erro = validarPasso();
    if (erro) { mostrarErro(erro); return; }
    if (wiz.passo === 2 && d.objetivo === 'prova' && !d.distanciaProva) d.distanciaProva = distanciasDoNivel(d.nivel)[0];
    wiz.passo += 1;
    renderWizard();
    return;
  }

  if (act === 'gerar') {
    const r = gerarPlanoCorrida(entradaDe(d), hoje());
    if (!r.ok) { mostrarErro(r.erros.join(' ')); return; }

    const c = ctx();
    const corrida = {
      versao: 1,
      entrada: r.entrada,
      ritmos: r.ritmos,
      plano: r.plano,
      registro: {},
      totais: { sessoes: 0, km: 0, min: 0 },
      criadoEm: new Date().toISOString(),
    };
    btn.disabled = true;
    btn.textContent = 'Gerando...';
    try {
      await c.salvar({ corrida });
      c.userData.corrida = corrida;
      semanasAbertas = null;
      document.getElementById('cor-wizard')?.remove();
      wiz = null;
      c.showToast('✅ Plano de corrida criado!');
      c.irParaCorrida();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Gerar plano';
      mostrarErro('Erro ao salvar: ' + err.message);
    }
  }
}
