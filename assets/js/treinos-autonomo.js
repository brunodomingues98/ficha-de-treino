// Gera treinos automáticos com base no perfil (objetivo, nível, gênero, dias/semana)
import { BIBLIOTECA_EXERCICIOS } from './exercicios-db.js';

// "grupo" desempata nomes repetidos (ex.: Agachamento existe em Pernas e em Calistenia)
function ex(nome, numSeries, repeticoes, descansoSegundos, grupo) {
  const e = BIBLIOTECA_EXERCICIOS.find(x => x.nome === nome && (!grupo || x.grupo === grupo));
  if (!e) return null;
  return { ...e, numSeries, repeticoes, descansoSegundos, series: `${numSeries}x${repeticoes}` };
}

function filtrar(lista, grupo) {
  return lista.map(i => ex(i[0], i[1], i[2], i[3], grupo)).filter(Boolean);
}

const PEITO_BASICO = [
  ['Supino reto', 4, '8-12', 90],
  ['Supino inclinado', 3, '10-12', 75],
  ['Voador na máquina', 3, '12-15', 60],
];
const PEITO_AVANCADO = [
  ['Supino reto', 4, '6-10', 120],
  ['Supino inclinado', 4, '8-12', 90],
  ['Supino reto com halteres', 3, '10-12', 75],
  ['Crucifixo na máquina', 3, '12-15', 60],
];

const COSTAS_BASICO = [
  ['Puxada frontal', 4, '8-12', 90],
  ['Remada baixa', 3, '10-12', 75],
  ['Remada curvada com halteres', 3, '12', 60],
];
const COSTAS_AVANCADO = [
  ['Puxada supinada', 4, '6-10', 120],
  ['Remada baixa', 4, '8-12', 90],
  ['Remada cavalinho', 3, '10-12', 75],
  ['Pulldown com corda', 3, '12-15', 60],
];

const OMBRO_BASICO = [
  ['Desenvolvimento com halteres', 3, '10-12', 75],
  ['Elevação lateral', 3, '12-15', 60],
  ['Crucifixo inverso', 3, '12-15', 60],
];
const OMBRO_AVANCADO = [
  ['Desenvolvimento com halteres', 4, '8-12', 90],
  ['Elevação lateral', 4, '12-15', 60],
  ['Elevação frontal', 3, '12', 60],
  ['Crucifixo inverso', 3, '15', 45],
];

const BICEPS_BASICO = [
  ['Rosca direta', 3, '10-12', 60],
  ['Rosca martelo', 3, '12', 60],
];
const BICEPS_AVANCADO = [
  ['Rosca direta com barra', 4, '8-12', 75],
  ['Rosca na barra W', 3, '10-12', 60],
  ['Rosca concentrada', 3, '12-15', 45],
];

const TRICEPS_BASICO = [
  ['Tríceps pulley com barra', 3, '12-15', 60],
  ['Tríceps francês', 3, '12', 60],
];
const TRICEPS_AVANCADO = [
  ['Tríceps pulley com barra', 4, '10-12', 75],
  ['Tríceps testa', 3, '10-12', 60],
  ['Tríceps coice', 3, '15', 45],
];

const PERNAS_BASICO = [
  ['Agachamento', 4, '10-12', 90],
  ['Leg Press', 3, '12-15', 75],
  ['Cadeira extensora', 3, '15', 60],
  ['Mesa flexora', 3, '12-15', 60],
  ['Panturrilha em pé', 4, '15-20', 45],
];
const PERNAS_AVANCADO = [
  ['Agachamento', 5, '6-10', 120],
  ['Leg Press', 4, '10-12', 90],
  ['Agachamento Hack', 3, '12', 75],
  ['Cadeira extensora', 3, '15', 60],
  ['Mesa flexora', 3, '12', 60],
  ['Levantamento terra', 3, '10-12', 75],
  ['Panturrilha em pé', 4, '15-20', 45],
];

const GLUTEOS_BASICO = [
  ['Ponte para glúteos', 4, '15', 60],
  ['Cadeira abdutora', 3, '15-20', 45],
  ['Cadeira adutora', 3, '15-20', 45],
  ['Afundo', 3, '12', 75],
];

const CARDIO_BASICO = [
  ['Esteira ergométrica', 1, '20 min', 0],
  ['Bicicleta ergométrica', 1, '15 min', 0],
];
const CARDIO_AVANCADO = [
  ['Esteira ergométrica', 1, '30 min', 0],
  ['Escada (step)', 1, '15 min', 0],
  ['Bicicleta ergométrica', 1, '15 min', 0],
];

const CORE_BASICO = [
  ['Prancha', 3, '30-45s', 45],
  ['Dead Bug', 3, '12', 45],
  ['Prancha lateral', 3, '20-30s', 45],
];

export const OBJETIVOS_TREINO = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
  calistenia: 'Calistenia',
};
export const MAX_OBJETIVOS = 2;

// Calistenia usa somente os exercícios do grupo "Calistenia" (pasta calistenia)
function blocosCalistenia(avancado) {
  const v = (basico, avanc) => (avancado ? avanc : basico);
  return [
    { nome: 'Peito e Tríceps', grupo: 'Calistenia', exercicios: [
      ['Flexão de braço', v(3, 4), v('8-12', '15-20'), 60],
      ['Dips na cadeira', 3, v('8-10', '12-15'), 60],
      ['Extensão de tríceps', 3, '12-15', 45]] },
    { nome: 'Pernas', grupo: 'Calistenia', exercicios: [
      ['Agachamento', v(3, 4), v('15', '20'), 45],
      ['Agachamento búlgaro', 3, v('8-10', '12'), 75],
      ['Afundo', 3, v('10', '12'), 60]] },
    { nome: 'Costas e Bíceps', grupo: 'Calistenia', exercicios: [
      ['Barra fixa pegada supinada', v(3, 4), v('3-6', '8-10'), 90],
      ['Barra fixa pegada fechada', 3, v('3-6', '8-10'), 90]] },
    { nome: 'Full Body', grupo: 'Calistenia', exercicios: [
      ['Flexão de braço', 3, v('8-10', '12-15'), 60],
      ['Agachamento', 3, v('12-15', '15-20'), 45],
      ['Barra fixa pegada supinada', 3, v('3-5', '6-8'), 90],
      ['Dips na cadeira', 3, v('8', '10-12'), 60]] },
    { nome: 'Pernas 2', grupo: 'Calistenia', exercicios: [
      ['Agachamento com joelho elevado', 3, '12', 60],
      ['Afundo', 3, '12', 60],
      ['Agachamento búlgaro', 3, v('8', '10'), 75]] },
    { nome: 'Superior', grupo: 'Calistenia', exercicios: [
      ['Flexão de braço', 3, v('10', '15'), 60],
      ['Barra fixa pegada fechada', 3, v('3-5', '6-8'), 90],
      ['Dips na cadeira', 3, v('8', '10-12'), 60],
      ['Extensão de tríceps', 3, '12', 45]] },
    { nome: 'Full Body Leve', grupo: 'Calistenia', exercicios: [
      ['Agachamento', 3, '15', 45],
      ['Flexão de braço', 3, '10', 60],
      ['Afundo', 3, '10', 60]] },
  ];
}

// Os 7 treinos-modelo de cada objetivo, na ordem em que entram na semana
function blocosDoObjetivo(objetivo, { avancado, feminino }) {
  const cardio = avancado ? CARDIO_AVANCADO : CARDIO_BASICO;

  if (objetivo === 'hipertrofia') {
    return [
      { nome: 'Superior A — Peito e Tríceps', exercicios: [...(avancado ? PEITO_AVANCADO : PEITO_BASICO), ...(avancado ? TRICEPS_AVANCADO : TRICEPS_BASICO)] },
      { nome: 'Inferior — Pernas e Glúteos',  exercicios: feminino ? GLUTEOS_BASICO : (avancado ? PERNAS_AVANCADO : PERNAS_BASICO) },
      { nome: 'Superior B — Costas e Bíceps', exercicios: [...(avancado ? COSTAS_AVANCADO : COSTAS_BASICO), ...(avancado ? BICEPS_AVANCADO : BICEPS_BASICO)] },
      { nome: 'Ombros e Core',                exercicios: [...(avancado ? OMBRO_AVANCADO : OMBRO_BASICO), ...CORE_BASICO.slice(0, 2)] },
      { nome: 'Inferior B — Glúteos',         exercicios: [...GLUTEOS_BASICO, ...PERNAS_BASICO.slice(3)] },
      { nome: 'Full Body — Força',            exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0], OMBRO_BASICO[0]] },
      { nome: 'Acessórios e Core',            exercicios: [...BICEPS_BASICO, ...TRICEPS_BASICO, ...CORE_BASICO.slice(0, 1)] },
    ];
  }
  if (objetivo === 'emagrecimento') {
    return [
      { nome: 'Superior + Cardio',  exercicios: [...PEITO_BASICO.slice(0, 2), ...COSTAS_BASICO.slice(0, 2), ...cardio.slice(0, 1)] },
      { nome: 'Inferior + Cardio',  exercicios: [...PERNAS_BASICO.slice(0, 3), ...cardio.slice(0, 1)] },
      { nome: 'Full Body + Cardio', exercicios: [PERNAS_BASICO[0], PEITO_BASICO[0], COSTAS_BASICO[0], ...CORE_BASICO.slice(0, 2)] },
      { nome: 'Inferior Intenso',   exercicios: [...GLUTEOS_BASICO.slice(0, 2), ...cardio.slice(0, 1)] },
      { nome: 'Superior + Core',    exercicios: [...OMBRO_BASICO.slice(0, 2), ...BICEPS_BASICO, ...CORE_BASICO] },
      { nome: 'Cardio',             exercicios: cardio },
      { nome: 'Full Body Leve',     exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0]] },
    ];
  }
  if (objetivo === 'calistenia') return blocosCalistenia(avancado);

  // condicionamento
  return [
    { nome: 'Força Superior',    exercicios: [...PEITO_BASICO, ...COSTAS_BASICO.slice(0, 2), ...OMBRO_BASICO.slice(0, 2)] },
    { nome: 'Força Inferior',    exercicios: [...PERNAS_BASICO, ...(feminino ? GLUTEOS_BASICO.slice(0, 2) : [])] },
    { nome: 'Cardio e Core',     exercicios: [...cardio, ...CORE_BASICO] },
    { nome: 'Superior + Braços', exercicios: [...PEITO_BASICO.slice(0, 2), ...COSTAS_BASICO.slice(0, 2), ...BICEPS_BASICO, ...TRICEPS_BASICO] },
    { nome: 'Inferior + Core',   exercicios: [...PERNAS_BASICO.slice(0, 4), ...GLUTEOS_BASICO.slice(0, 2)] },
    { nome: 'Full Body',         exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0]] },
    { nome: 'Recuperação Ativa', exercicios: CORE_BASICO },
  ];
}

// perfil.objetivos (lista, até 2) tem prioridade; perfil.objetivo (único) continua valendo
export function objetivosDoPerfil(perfil) {
  const lista = Array.isArray(perfil.objetivos) && perfil.objetivos.length ? perfil.objetivos : [perfil.objetivo];
  const validos = [...new Set(lista)].filter(o => OBJETIVOS_TREINO[o]).slice(0, MAX_OBJETIVOS);
  return validos.length ? validos : ['condicionamento'];
}

export function gerarTreinos(perfil) {
  const { nivel, genero, diasSemana = 3 } = perfil;
  const opts = { avancado: nivel === 'avancado', feminino: genero === 'feminino' };
  const objetivos = objetivosDoPerfil(perfil);
  const total = Math.min(Math.max(Number(diasSemana) || 3, 1), 7);

  let selecionados;
  if (objetivos.length === 1) {
    selecionados = blocosDoObjetivo(objetivos[0], opts).slice(0, total);
  } else {
    // Com dois objetivos, os dias são divididos entre eles (o primeiro fica com o dia
    // extra quando o total é ímpar) e os treinos se alternam na semana.
    const listas = objetivos.map(o =>
      blocosDoObjetivo(o, opts).map(b => ({ ...b, nome: `${b.nome} · ${OBJETIVOS_TREINO[o]}` })));
    const cotas = [Math.ceil(total / 2), Math.floor(total / 2)];
    const usados = [0, 0];
    selecionados = [];
    for (let i = 0; i < total; i++) {
      let k = i % 2;
      if (usados[k] >= cotas[k] || usados[k] >= listas[k].length) k = 1 - k;
      selecionados.push(listas[k][usados[k]++]);
    }
  }

  const agora = Date.now();
  const treinos = {};
  selecionados.forEach((bloco, idx) => {
    treinos[`treino_${agora}_${idx}`] = {
      nome: bloco.nome,
      exercicios: filtrar(bloco.exercicios, bloco.grupo),
      dataInicio: null,
      dataFim: null,
      ordem: idx
    };
  });

  return treinos;
}
