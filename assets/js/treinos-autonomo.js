// ============================================================
//  treinos-autonomo.js
//  Gera treinos pré-montados baseados no perfil do usuário
//  (objetivo, nível, gênero) usando exercícios da biblioteca
// ============================================================
import { BIBLIOTECA_EXERCICIOS } from './exercicios-db.js';

function getId(nome) {
  return BIBLIOTECA_EXERCICIOS.find(e => e.nome === nome);
}

function ex(nome, numSeries, repeticoes, descansoSegundos) {
  const e = getId(nome);
  if (!e) return null;
  return { ...e, numSeries, repeticoes, descansoSegundos,
           series: `${numSeries}x${repeticoes}` };
}

function filtrar(lista) {
  return lista.map(item => {
    if (!item) return null;
    // Já é um objeto de exercício processado
    if (typeof item === 'object' && item.id) return item;
    // É um array [nome, series, reps, descanso]
    if (Array.isArray(item)) return ex(...item);
    return null;
  }).filter(Boolean);
}

// ── Blocos de exercícios por grupo ────────────────────────

const PEITO_BASICO = [
  ['Supino Reto', 4, '8-12', 90],
  ['Supino Inclinado com Halteres', 3, '10-12', 75],
  ['Voador na Máquina', 3, '12-15', 60],
];
const PEITO_AVANCADO = [
  ['Supino Reto', 4, '6-10', 120],
  ['Supino Inclinado com Halteres', 4, '8-12', 90],
  ['Supino com Halteres', 3, '10-12', 75],
  ['Cross Over', 3, '12-15', 60],
];

const COSTAS_BASICO = [
  ['Puxada Frontal', 4, '8-12', 90],
  ['Remada com Barra', 3, '10-12', 75],
  ['Remada Curvada com Halteres', 3, '12', 60],
];
const COSTAS_AVANCADO = [
  ['Barra Fixa', 4, '6-10', 120],
  ['Remada com Barra', 4, '8-12', 90],
  ['Serrote', 3, '10-12', 75],
  ['Pulldown com Corda', 3, '12-15', 60],
];

const OMBRO_BASICO = [
  ['Desenvolvimento com Halteres', 3, '10-12', 75],
  ['Elevação Lateral', 3, '12-15', 60],
  ['Voador Invertido', 3, '12-15', 60],
];
const OMBRO_AVANCADO = [
  ['Desenvolvimento com Halteres', 4, '8-12', 90],
  ['Elevação Lateral', 4, '12-15', 60],
  ['Elevação Frontal com Barra', 3, '12', 60],
  ['Voador Invertido', 3, '15', 45],
];

const BICEPS_BASICO = [
  ['Rosca Direta com Barra', 3, '10-12', 60],
  ['Rosca Martelo', 3, '12', 60],
];
const BICEPS_AVANCADO = [
  ['Rosca Direta com Barra', 4, '8-12', 75],
  ['Rosca Scott com Barra W', 3, '10-12', 60],
  ['Rosca Concentrada', 3, '12-15', 45],
];

const TRICEPS_BASICO = [
  ['Tríceps Pulley Barra', 3, '12-15', 60],
  ['Tríceps Francês com Halteres', 3, '12', 60],
];
const TRICEPS_AVANCADO = [
  ['Tríceps Pulley Barra', 4, '10-12', 75],
  ['Tríceps Testa com Barra', 3, '10-12', 60],
  ['Tríceps Coice com Halteres', 3, '15', 45],
];

const PERNAS_BASICO = [
  ['Agachamento', 4, '10-12', 90],
  ['Leg Press', 3, '12-15', 75],
  ['Cadeira Extensora', 3, '15', 60],
  ['Mesa Flexora', 3, '12-15', 60],
  ['Panturrilha em Pé', 4, '15-20', 45],
];
const PERNAS_AVANCADO = [
  ['Agachamento', 5, '6-10', 120],
  ['Leg Press', 4, '10-12', 90],
  ['Agachamento Hack', 3, '12', 75],
  ['Cadeira Extensora', 3, '15', 60],
  ['Mesa Flexora', 3, '12', 60],
  ['Stiff com Barra', 3, '10-12', 75],
  ['Panturrilha em Pé', 4, '15-20', 45],
];

const GLUTEOS_BASICO = [
  ['Ponte para Glúteos', 4, '15', 60],
  ['Abdução de Quadril', 3, '15-20', 45],
  ['Adução de Quadril', 3, '15-20', 45],
  ['Agachamento Búlgaro', 3, '12', 75],
];

const CARDIO_BASICO = [
  ['Corrida Estacionária', 1, '20 min', 0],
  ['Swing de Kettlebell', 3, '15', 45],
  ['Saltos em Tesoura', 3, '20', 30],
];
const CARDIO_AVANCADO = [
  ['Corrida Estacionária', 1, '30 min', 0],
  ['Burpees', 3, '12', 60],
  ['Swing de Kettlebell', 4, '20', 45],
  ['Salto com Joelhos Flexionados', 3, '15', 45],
];

const ALONGAMENTO = [
  ['Rolamento de Espuma nos Quadríceps', 1, '60s', 0],
  ['Rotação Coluna Torácica', 1, '60s', 0],
  ['Postura da Cobra', 1, '30s', 0],
];

// ── Gerador principal ─────────────────────────────────────
export function gerarTreinos(perfil) {
  const { objetivo, nivel, genero, diasSemana = 3 } = perfil;
  const avancado = nivel === 'avancado';
  const intermediario = nivel === 'intermediario';
  const feminino = genero === 'feminino';

  // Define blocos de treino baseados no objetivo
  let blocos = [];

  if (objetivo === 'hipertrofia') {
    blocos = [
      { nome: 'Superior A — Peito e Tríceps', exercicios: [...(avancado ? PEITO_AVANCADO : PEITO_BASICO), ...(avancado ? TRICEPS_AVANCADO : TRICEPS_BASICO)] },
      { nome: 'Inferior — Pernas e Glúteos',  exercicios: feminino ? GLUTEOS_BASICO : (avancado ? PERNAS_AVANCADO : PERNAS_BASICO) },
      { nome: 'Superior B — Costas e Bíceps', exercicios: [...(avancado ? COSTAS_AVANCADO : COSTAS_BASICO), ...(avancado ? BICEPS_AVANCADO : BICEPS_BASICO)] },
      { nome: 'Ombros e Abdômen',             exercicios: [...(avancado ? OMBRO_AVANCADO : OMBRO_BASICO)] },
      { nome: 'Inferior B — Glúteos e Posterior', exercicios: [...GLUTEOS_BASICO, ...PERNAS_BASICO.slice(4)] },
      { nome: 'Full Body — Força',            exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0], OMBRO_BASICO[0]] },
      { nome: 'Acessórios e Core',            exercicios: [...BICEPS_BASICO, ...TRICEPS_BASICO] },
    ];
  } else if (objetivo === 'emagrecimento') {
    blocos = [
      { nome: 'Circuito Superior + Cardio',   exercicios: [...PEITO_BASICO.slice(0,2), ...COSTAS_BASICO.slice(0,2), ...(avancado ? CARDIO_AVANCADO : CARDIO_BASICO)] },
      { nome: 'Circuito Inferior + Cardio',   exercicios: [...PERNAS_BASICO.slice(0,3), ...(feminino ? GLUTEOS_BASICO.slice(0,2) : []), ...(avancado ? CARDIO_AVANCADO : CARDIO_BASICO)] },
      { nome: 'Full Body + Cardio',           exercicios: [PERNAS_BASICO[0], PEITO_BASICO[0], COSTAS_BASICO[0], ...CARDIO_BASICO] },
      { nome: 'Inferior + Cardio Intenso',    exercicios: [...GLUTEOS_BASICO.slice(0,2), ...PERNAS_BASICO.slice(0,2), ...CARDIO_AVANCADO.slice(0,3)] },
      { nome: 'Superior + HIIT',              exercicios: [...OMBRO_BASICO.slice(0,2), ...BICEPS_BASICO, ...CARDIO_AVANCADO.slice(1,4)] },
      { nome: 'Cardio e Mobilidade',          exercicios: [...CARDIO_BASICO, ...ALONGAMENTO] },
      { nome: 'Full Body Leve',               exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0], ...CARDIO_BASICO.slice(0,2)] },
    ];
  } else {
    // condicionamento
    blocos = [
      { nome: 'Força Superior',    exercicios: [...PEITO_BASICO, ...COSTAS_BASICO.slice(0,2), ...OMBRO_BASICO.slice(0,2)] },
      { nome: 'Força Inferior',    exercicios: [...PERNAS_BASICO, ...(feminino ? GLUTEOS_BASICO.slice(0,2) : [])] },
      { nome: 'Cardio e Mobilidade', exercicios: [...CARDIO_BASICO, ...ALONGAMENTO] },
      { nome: 'Superior + Braços', exercicios: [...PEITO_BASICO.slice(0,2), ...COSTAS_BASICO.slice(0,2), ...BICEPS_BASICO, ...TRICEPS_BASICO] },
      { nome: 'Inferior + Core',   exercicios: [...PERNAS_BASICO.slice(0,4), ...GLUTEOS_BASICO.slice(0,2)] },
      { nome: 'Full Body',         exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0], ...CARDIO_BASICO.slice(0,2)] },
      { nome: 'Recuperação Ativa', exercicios: [...ALONGAMENTO, ...CARDIO_BASICO.slice(0,2)] },
    ];
  }

  // Pega apenas o número de blocos correspondente aos dias na semana
  const treinosSelecionados = blocos.slice(0, Math.min(diasSemana, blocos.length));

  const treinos = {};
  treinosSelecionados.forEach((bloco, idx) => {
    treinos[`treino_${Date.now()}_${idx}`] = {
      nome: bloco.nome,
      exercicios: filtrar(bloco.exercicios),
      dataInicio: null,
      dataFim: null
    };
  });

  return treinos;
}
