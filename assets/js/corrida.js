// Gerador de planos de corrida por regras fixas 
// ── Opções do questionário ─────────────────────────────────

export const NIVEIS = [
  { id: 'nao_corro', icone: '🚶', titulo: 'Não corro', desc: 'Nunca corri ou estou parado há bastante tempo' },
  { id: 'ate5min',   icone: '🏃', titulo: 'Corro até 5 minutos seguidos', desc: 'Consigo correr um pouco, mas me canso rápido' },
  { id: '20a30min',  icone: '⚡', titulo: 'Corro de 20 a 30 minutos seguidos', desc: 'Já tenho uma base de corrida contínua' },
  { id: '5km',       icone: '🔥', titulo: 'Corro 5 km', desc: 'Completo 5 km sem parar' },
  { id: '10km',      icone: '🏅', titulo: 'Corro 10 km ou mais', desc: 'Tenho boa base de resistência' },
];

export const OBJETIVOS = {
  condicionamento: { icone: '❤️', titulo: 'Condicionamento', desc: 'Correr com regularidade e ganhar fôlego' },
  prova:           { icone: '🏁', titulo: 'Preparar uma prova', desc: '5, 10, 21 ou 42 km' },
  pace:            { icone: '⏱', titulo: 'Baixar o pace', desc: 'Correr mais rápido' },
  distancia:       { icone: '📏', titulo: 'Aumentar a distância', desc: 'Correr mais longe' },
};

export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // segunda a domingo

const INICIANTES = ['nao_corro', 'ate5min'];
export const ehIniciante = nivel => INICIANTES.includes(nivel);

export function objetivosDoNivel(nivel) {
  if (ehIniciante(nivel)) return ['condicionamento', 'prova'];
  if (nivel === '20a30min') return ['condicionamento', 'distancia', 'prova'];
  return ['condicionamento', 'distancia', 'pace', 'prova'];
}

export function distanciasDoNivel(nivel) {
  const mapa = {
    nao_corro: [5, 10],
    ate5min: [5, 10],
    '20a30min': [5, 10, 21],
    '5km': [5, 10, 21],
    '10km': [5, 10, 21, 42],
  };
  return mapa[nivel] || [5];
}

export const limiteDias = nivel => ({ min: 2, max: ehIniciante(nivel) ? 4 : 6 });

// ── Datas (ISO local "YYYY-MM-DD") ─────────────────────────

export function isoLocal(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}
export function parseISO(s) {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
}
export function somarDias(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}
// dias de A até B (B - A)
export function diferencaDias(isoA, isoB) {
  return Math.round((parseISO(isoB) - parseISO(isoA)) / 86400000);
}

// ── Tempo e ritmo ──────────────────────────────────────────

// "28:30" ou "28" → segundos. Aceita só tempos plausíveis de 5 km (12 a 70 min).
export function parseTempo(str) {
  if (str == null || str === '') return null;
  const m = String(str).trim().match(/^(\d{1,3})(?::(\d{1,2}))?$/);
  if (!m) return null;
  const seg = m[2] ? parseInt(m[2], 10) : 0;
  if (seg > 59) return null;
  const total = parseInt(m[1], 10) * 60 + seg;
  return total >= 12 * 60 && total <= 70 * 60 ? total : null;
}

export function formatarRitmo(segPorKm) {
  let m = Math.floor(segPorKm / 60);
  let s = Math.round(segPorKm % 60);
  if (s === 60) { m += 1; s = 0; }
  return `${m}:${String(s).padStart(2, '0')}`;
}

const RITMO_FACIL_PADRAO = { nao_corro: 480, ate5min: 450, '20a30min': 420, '5km': 375, '10km': 345 };
const DIST_REAL = { 5: 5, 10: 10, 21: 21.1, 42: 42.2 };

export function calcularRitmos(e) {
  const t5 = e.tempo5k || null;
  const base = t5 ? t5 / 5 : null;
  let provas = null;
  if (t5) {
    provas = {};
    for (const d of [5, 10, 21, 42]) {
      provas[d] = Math.round(t5 * Math.pow(DIST_REAL[d] / 5, 1.06) / DIST_REAL[d]);
    }
  }
  return {
    facil: base ? Math.round(base * 1.25) : (RITMO_FACIL_PADRAO[e.nivel] || 420),
    ritmo: base ? Math.round(base * 1.07) : null,
    forte: base ? Math.round(base * 0.98) : null,
    provas,
  };
}

// ── Parâmetros de progressão ───────────────────────────────

// Iniciantes: caminhada + corrida até chegar a 30 min contínuos
const TABELA_INICIANTE = [
  { corr: 1,  cam: 2, reps: 8 },
  { corr: 2,  cam: 2, reps: 6 },
  { corr: 3,  cam: 2, reps: 5 },
  { corr: 5,  cam: 2, reps: 4 },
  { corr: 8,  cam: 2, reps: 3 },
  { corr: 10, cam: 1, reps: 3 },
  { corr: 15, cam: 2, reps: 2 },
  { corr: 20, cam: 0, reps: 1 },
  { corr: 25, cam: 0, reps: 1 },
  { corr: 30, cam: 0, reps: 1 },
];
const INICIO_TABELA = { nao_corro: 0, ate5min: 3 };

const TAPER = { 5: 1, 10: 1, 21: 2, 42: 3 };
const PISO_SEMANAS = { 5: 4, 10: 6, 21: 10, 42: 16 };
export const MAX_SEMANAS = 26;

const picoProvaKm = (dist, iniciante) =>
  iniciante ? { 5: 5.5, 10: 9 }[dist] : { 5: 5.5, 10: 12, 21: 19, 42: 32 }[dist];

const arredMin = v => (v >= 40 ? Math.round(v / 5) * 5 : Math.round(v));
const arred1 = v => Math.round(v * 10) / 10;

export function normalizarEntrada(x) {
  const objetivo = x.objetivo;
  const iniciante = ehIniciante(x.nivel);
  const t5 = typeof x.tempo5k === 'number' ? x.tempo5k : parseTempo(x.tempo5k);
  return {
    nivel: x.nivel,
    objetivo,
    distanciaProva: objetivo === 'prova' ? (Number(x.distanciaProva) || null) : null,
    dataProva: objetivo === 'prova' && x.dataProva ? x.dataProva : null,
    tempo5k: iniciante ? null : t5,
    distanciaAtual: objetivo === 'distancia' ? (Number(x.distanciaAtual) || null) : null,
    distanciaAlvo: objetivo === 'distancia' ? (Number(x.distanciaAlvo) || null) : null,
    dias: [...new Set((x.dias || []).map(Number))].filter(d => d >= 0 && d <= 6),
    lesao: ['nenhuma', 'leve', 'atual'].includes(x.lesao) ? x.lesao : 'nenhuma',
  };
}

// Simula o longão semana a semana (em minutos).
// A cada 4ª semana há uma semana leve; as últimas semanas de prova reduzem (taper).
function simularLongos(L0, pico, n, taper, cresc, cresceNaSemana1) {
  const fatores = { 1: [0.6], 2: [0.7, 0.45], 3: [0.8, 0.6, 0.4] }[taper] || [];
  const construcao = n - taper;
  const longos = [];
  let base = L0;
  for (let w = 1; w <= n; w++) {
    if (w > construcao) {
      longos.push({ min: arredMin(base * fatores[w - construcao - 1]), tipo: 'taper' });
      continue;
    }
    if (w > 1 && w % 4 === 0) {
      longos.push({ min: arredMin(base * 0.75), tipo: 'leve' });
      continue;
    }
    if (w > 1 || cresceNaSemana1) base = Math.min(pico, base * cresc);
    longos.push({ min: arredMin(base), tipo: 'normal' });
  }
  return longos;
}

// Menor número de semanas de construção+taper para chegar perto do pico
function semanasNecessarias(cfg, piso) {
  for (let n = Math.max(piso, cfg.taper + 1); n <= MAX_SEMANAS; n++) {
    const longos = simularLongos(cfg.L0, cfg.pico, n, cfg.taper, cfg.cresc, cfg.iniciante);
    const maior = Math.max(...longos.slice(0, n - cfg.taper).map(l => l.min));
    if (maior >= cfg.pico * 0.9) return n;
  }
  return null;
}

function configurar(e) {
  const ritmos = calcularRitmos(e);
  const pace = ritmos.facil / 60; // min por km em ritmo leve
  const iniciante = ehIniciante(e.nivel);
  const conservador = e.lesao !== 'nenhuma';
  const cresc = conservador ? 1.07 : 1.12;
  const K = iniciante ? TABELA_INICIANTE.length - INICIO_TABELA[e.nivel] : 0;

  let L0;
  if (iniciante) L0 = 30;
  else if (e.objetivo === 'distancia') L0 = Math.max(25, (e.distanciaAtual || 5) * pace);
  else if (e.nivel === '20a30min') L0 = 30;
  else L0 = (e.nivel === '5km' ? 6 : 10) * pace;
  if (!iniciante && conservador) L0 *= 0.85;
  L0 = arredMin(L0);

  let pico, taper = 0, piso = 4;
  if (e.objetivo === 'prova') {
    pico = picoProvaKm(e.distanciaProva, iniciante) * pace;
    taper = TAPER[e.distanciaProva];
    piso = PISO_SEMANAS[e.distanciaProva];
  } else if (e.objetivo === 'distancia') {
    pico = (e.distanciaAlvo || 5) * pace;
    piso = 6;
  } else if (e.objetivo === 'pace') {
    pico = L0 * 1.2;
    piso = 8;
  } else {
    pico = iniciante ? 35 : L0 * 1.25;
    piso = iniciante ? 2 : 8;
  }
  pico = arredMin(Math.max(pico, L0));

  return { ritmos, iniciante, cresc, K, L0, pico, taper, piso };
}

// Prazo do plano em semanas (blocos de 7 dias)
function calcularSemanas(e, cfg) {
  if (e.objetivo === 'prova' || e.objetivo === 'distancia') {
    const construtor = semanasNecessarias(cfg, cfg.iniciante ? 2 : cfg.piso);
    if (construtor == null) return null;
    const minimo = cfg.K + construtor;
    if (e.objetivo === 'distancia') return { min: minimo, max: minimo, recomendadas: minimo };
    return { min: minimo, max: MAX_SEMANAS, recomendadas: Math.min(MAX_SEMANAS, minimo + 1) };
  }
  const total = cfg.iniciante ? cfg.K + 2 : 8;
  return { min: total, max: total, recomendadas: total };
}

// Usado pela interface para mostrar o prazo mínimo de uma prova
export function prazoProva(nivel, distancia, lesao = 'nenhuma', hojeISO) {
  if (!nivel || !distancia) return null;
  const e = normalizarEntrada({ nivel, objetivo: 'prova', distanciaProva: distancia, lesao, dias: [] });
  const cfg = configurar(e);
  const s = calcularSemanas(e, cfg);
  if (!s) return null;
  return {
    minSemanas: s.min,
    dataMinima: somarDias(hojeISO, 7 * (s.min - 1)),
    dataMaxima: somarDias(hojeISO, 7 * MAX_SEMANAS - 1),
  };
}

export function validarEntrada(e, hojeISO) {
  const erros = [];
  if (!NIVEIS.some(n => n.id === e.nivel)) { erros.push('Escolha seu nível atual.'); return erros; }
  if (!objetivosDoNivel(e.nivel).includes(e.objetivo)) { erros.push('Escolha um objetivo.'); return erros; }

  const lim = limiteDias(e.nivel);
  if (e.dias.length < lim.min || e.dias.length > lim.max) {
    erros.push(`Escolha de ${lim.min} a ${lim.max} dias de treino na semana.`);
  }

  if (e.objetivo === 'prova') {
    if (!distanciasDoNivel(e.nivel).includes(e.distanciaProva)) erros.push('Escolha a distância da prova.');
  }
  if (e.objetivo === 'pace' && !e.tempo5k) {
    erros.push('Informe seu tempo recente de 5 km (exemplo: 28:30).');
  }
  if (e.objetivo === 'distancia') {
    if (!e.distanciaAtual || e.distanciaAtual < 1 || e.distanciaAtual > 42) erros.push('Informe a maior distância que você corre hoje (em km).');
    else if (!e.distanciaAlvo || e.distanciaAlvo <= e.distanciaAtual || e.distanciaAlvo > 42) erros.push('A distância alvo precisa ser maior que a atual (máximo 42 km).');
  }
  if (erros.length) return erros;

  const cfg = configurar(e);
  const semanas = calcularSemanas(e, cfg);
  if (!semanas) {
    erros.push('Essa meta está distante demais para os próximos 6 meses. Escolha uma distância alvo menor.');
    return erros;
  }
  if (e.objetivo === 'prova' && e.dataProva) {
    const dias = diferencaDias(hojeISO, e.dataProva);
    const n = Math.floor(dias / 7) + 1;
    if (dias < 0) erros.push('A data da prova precisa ser no futuro.');
    else if (n < semanas.min) {
      const d = somarDias(hojeISO, 7 * (semanas.min - 1));
      erros.push(`Para chegar bem nessa prova com o seu nível atual, o ideal são pelo menos ${semanas.min} semanas. Escolha uma data a partir de ${d.split('-').reverse().join('/')} ou deixe a data em branco.`);
    } else if (n > MAX_SEMANAS) erros.push(`A prova precisa estar a no máximo ${MAX_SEMANAS} semanas (cerca de 6 meses).`);
  }
  return erros;
}

// ── Geração do plano ───────────────────────────────────────

function sessaoQualidade(tipo, qi, tipoSemana) {
  const fator = tipoSemana === 'leve' ? 0.7 : tipoSemana === 'taper' ? 0.6 : 1;
  if (tipo === 'intervalado') {
    const reps = Math.min(8, Math.max(3, Math.round((4 + Math.floor(qi / 2)) * fator)));
    return { tipo: 'intervalado', reps, dur: qi < 4 ? 2 : 3, rec: qi < 4 ? 90 : 120 };
  }
  if (tipo === 'ritmo') {
    return { tipo: 'ritmo', min: Math.max(10, Math.round(Math.min(35, 15 + 2.5 * qi) * fator)) };
  }
  const reps = Math.min(8, Math.max(4, Math.round((5 + Math.floor(qi / 2)) * fator)));
  return { tipo: 'fartlek', reps, forte: 1, leve: 2 };
}

function tipoQualidade(e, qi) {
  if (e.objetivo === 'condicionamento') return 'fartlek';
  if (e.objetivo === 'distancia') return 'ritmo';
  if (e.objetivo === 'prova' && e.distanciaProva >= 21) return 'ritmo';
  return qi % 2 === 0 ? 'intervalado' : 'ritmo';
}

function papeisDaSemana(n, qual, qual2) {
  const q1 = qual ? 'qualidade' : 'facil';
  const q2 = qual2 ? 'qualidade2' : 'facil3';
  switch (n) {
    case 2: return ['facil', 'longo'];
    case 3: return ['facil', q1, 'longo'];
    case 4: return ['facil', q1, 'facil2', 'longo'];
    case 5: return ['facil', q1, 'facil2', q2, 'longo'];
    default: return ['facil', q1, 'facil2', q2, 'facil4', 'longo'];
  }
}

const FATOR_FACIL = { facil: 0.6, facil2: 0.5, facil3: 0.5, facil4: 0.45 };

function diasConsecutivos(diasOrdenados) {
  const pos = diasOrdenados.map(d => (d + 6) % 7);
  return pos.some(p => pos.includes((p + 1) % 7));
}

export function gerarPlanoCorrida(entrada, hojeISO) {
  const e = normalizarEntrada(entrada);
  const erros = validarEntrada(e, hojeISO);
  if (erros.length) return { ok: false, erros };

  const cfg = configurar(e);
  const prazo = calcularSemanas(e, cfg);
  const N = e.objetivo === 'prova' && e.dataProva
    ? Math.floor(diferencaDias(hojeISO, e.dataProva) / 7) + 1
    : prazo.recomendadas;

  const M = N - cfg.K; // semanas do construtor (depois da tabela de iniciante)
  const longos = M > 0 ? simularLongos(cfg.L0, cfg.pico, M, cfg.taper, cfg.cresc, cfg.iniciante) : [];

  const diasOrd = [...e.dias].sort((a, b) => ORDEM_SEMANA.indexOf(a) - ORDEM_SEMANA.indexOf(b));
  const n = diasOrd.length;
  const inicioWd = parseISO(hojeISO).getDay();
  const qualidadeAtiva = !cfg.iniciante && e.lesao !== 'atual' && n >= 3;
  const segundaQualidade = qualidadeAtiva && n >= 5 && (e.objetivo === 'pace' || e.objetivo === 'prova');

  const semanas = [];
  let qi = 0;

  for (let w = 1; w <= N; w++) {
    const inicio = somarDias(hojeISO, (w - 1) * 7);
    const fim = somarDias(inicio, 6);
    let tipoSemana = 'normal';
    let params;

    if (cfg.iniciante && w <= cfg.K) {
      const linha = TABELA_INICIANTE[INICIO_TABELA[e.nivel] + w - 1];
      params = diasOrd.map(() => ({ tipo: 'caminhada_corrida', corr: linha.corr, cam: linha.cam, reps: linha.reps }));
    } else {
      const b = w - cfg.K;
      const L = longos[b - 1];
      tipoSemana = L.tipo;
      const ultimaDeTaper = cfg.taper > 0 && b === M;
      const inicioQualidade = e.nivel === '20a30min' ? 4 : 3;
      const temQ = qualidadeAtiva && b >= inicioQualidade && !ultimaDeTaper;
      const temQ2 = segundaQualidade && b >= inicioQualidade + 1 && tipoSemana === 'normal';
      const papeis = papeisDaSemana(n, temQ, temQ2);
      let usouQ = false;
      params = papeis.map(p => {
        if (p === 'longo') return { tipo: 'longao', min: L.min };
        if (p === 'qualidade') {
          usouQ = true;
          return sessaoQualidade(tipoQualidade(e, qi), qi, tipoSemana);
        }
        if (p === 'qualidade2') {
          const q = Math.min(35, 15 + 2.5 * qi);
          return { tipo: 'ritmo', min: Math.max(10, Math.round(q * 0.6)) };
        }
        const min = Math.min(60, Math.max(20, arredMin(L.min * FATOR_FACIL[p])));
        return { tipo: 'rodagem', min };
      });
      if (usouQ) qi += 1;
    }

    let sessoes = diasOrd.map((wd, i) => ({
      data: somarDias(inicio, (wd - inicioWd + 7) % 7),
      ...params[i],
    }));

    if (e.objetivo === 'prova' && w === N) {
      const dataProva = e.dataProva || sessoes[sessoes.length - 1].data;
      const leves = sessoes
        .filter(s => diferencaDias(s.data, dataProva) >= 2)
        .slice(-2)
        .map(s => ({ data: s.data, tipo: 'rodagem', min: 20 }));
      sessoes = [...leves, { data: dataProva, tipo: 'prova', km: e.distanciaProva }];
      tipoSemana = 'prova';
    }

    sessoes.sort((a, b) => a.data.localeCompare(b.data));
    sessoes = sessoes.map((s, idx) => ({ id: `w${w}s${idx + 1}`, ...s }));
    semanas.push({ n: w, inicio, fim, tipo: tipoSemana, sessoes });
  }

  const avisos = [];
  if (e.lesao === 'atual') avisos.push('lesao_atual');
  if (e.lesao === 'leve') avisos.push('lesao_leve');
  if (cfg.iniciante) avisos.push('iniciante');
  if (cfg.iniciante && diasConsecutivos(diasOrd)) avisos.push('dias_seguidos');

  return {
    ok: true,
    entrada: e,
    ritmos: cfg.ritmos,
    plano: {
      inicio: hojeISO,
      semanas,
      totalSessoes: semanas.reduce((t, s) => t + s.sessoes.length, 0),
      avisos,
    },
  };
}

// ── Estimativas e textos de cada sessão ────────────────────

export function estimarSessao(s, ritmos) {
  const kmPorMin = 60 / ritmos.facil;
  let min = 0, km = 0;
  switch (s.tipo) {
    case 'caminhada_corrida': {
      const corrida = s.corr * s.reps;
      const caminhada = s.cam * s.reps + 10;
      min = corrida + caminhada;
      km = corrida * kmPorMin + caminhada / 12;
      break;
    }
    case 'rodagem':
    case 'longao':
      min = s.min; km = min * kmPorMin; break;
    case 'intervalado':
      min = 15 + Math.round(s.reps * (s.dur + s.rec / 60)); km = min * kmPorMin; break;
    case 'ritmo':
      min = 15 + s.min; km = min * kmPorMin; break;
    case 'fartlek':
      min = 15 + s.reps * (s.forte + s.leve); km = min * kmPorMin; break;
    case 'prova': {
      const pace = (ritmos.provas && ritmos.provas[s.km]) || ritmos.facil * 0.92;
      km = s.km; min = Math.round(s.km * pace / 60); break;
    }
  }
  return { min: Math.round(min), km: arred1(km) };
}

const fmtKm = n => String(n).replace('.', ',');

export function descreverSessao(s, ritmos) {
  const est = estimarSessao(s, ritmos);
  const kmTxt = `≈ ${fmtKm(est.km)} km`;
  const facil = ritmos.facil ? ` (cerca de ${formatarRitmo(ritmos.facil)} min/km)` : '';

  switch (s.tipo) {
    case 'caminhada_corrida': {
      const continua = s.cam === 0;
      return {
        titulo: continua ? 'Corrida contínua' : 'Caminhada + corrida',
        resumo: continua ? `${s.corr} min correndo sem parar` : `${s.reps}× (${s.corr} min correndo + ${s.cam} min caminhando)`,
        detalhe: continua
          ? `Aquecimento: 5 min caminhando. Depois ${s.corr} min correndo em ritmo leve, sem parar (um ritmo em que dá para conversar). Desaquecimento: 5 min caminhando.`
          : `Aquecimento: 5 min caminhando. Depois ${s.reps} vezes: ${s.corr} min correndo leve + ${s.cam} min caminhando. Desaquecimento: 5 min caminhando. Se ficar muito cansado, caminhe um pouco mais: o importante é terminar o treino.`,
        est,
      };
    }
    case 'rodagem':
      return {
        titulo: 'Corrida leve',
        resumo: `${s.min} min · ${kmTxt}`,
        detalhe: `Corra ${s.min} min em ritmo confortável, daquele em que você consegue conversar${facil}. Se quiser, termine com 5 min de caminhada e alongamento leve.`,
        est,
      };
    case 'longao':
      return {
        titulo: 'Corrida longa',
        resumo: `${s.min} min · ${kmTxt}`,
        detalhe: `Corra ${s.min} min em ritmo bem leve${facil}. É o treino mais importante da semana: priorize terminar bem, sem forçar. Em treinos acima de 60 min, leve água.`,
        est,
      };
    case 'intervalado':
      return {
        titulo: 'Treino intervalado',
        resumo: `${s.reps}× ${s.dur} min fortes`,
        detalhe: `Aquecimento: 10 min correndo leve. Principal: ${s.reps}× ${s.dur} min em ritmo forte (esforço 8 de 10${ritmos.forte ? `, cerca de ${formatarRitmo(ritmos.forte)} min/km` : ''}), com ${s.rec} s de caminhada ou trote entre as repetições. Desaquecimento: 5 min leve.`,
        est,
      };
    case 'ritmo':
      return {
        titulo: 'Corrida em ritmo',
        resumo: `${s.min} min em ritmo moderado`,
        detalhe: `Aquecimento: 10 min leve. Principal: ${s.min} min em ritmo moderadamente forte (esforço 7 de 10; dá para falar só frases curtas${ritmos.ritmo ? `, cerca de ${formatarRitmo(ritmos.ritmo)} min/km` : ''}). Desaquecimento: 5 min leve.`,
        est,
      };
    case 'fartlek':
      return {
        titulo: 'Fartlek',
        resumo: `${s.reps}× (${s.forte} min forte + ${s.leve} min leve)`,
        detalhe: `Aquecimento: 10 min leve. Principal: ${s.reps} vezes ${s.forte} min mais forte (esforço 7 a 8 de 10) seguido de ${s.leve} min bem leve. Desaquecimento: 5 min leve. É um treino solto: ajuste pela sensação, sem se preocupar com o relógio.`,
        est,
      };
    case 'prova': {
      const alvo = ritmos.provas && ritmos.provas[s.km];
      return {
        titulo: 'Dia da prova',
        resumo: `${s.km} km`,
        detalhe: `Aqueça 10 min, comece um pouco mais leve que o ritmo-alvo e vá acelerando. Hidrate-se e aproveite.${alvo ? ` Ritmo-alvo: cerca de ${formatarRitmo(alvo)} min/km.` : ''}`,
        est,
      };
    }
  }
  return { titulo: 'Treino', resumo: '', detalhe: '', est };
}

export const ROTULO_SEMANA = {
  leve: 'Semana leve',
  taper: 'Redução',
  prova: 'Semana da prova',
};