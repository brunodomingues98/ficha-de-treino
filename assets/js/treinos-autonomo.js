// Gera treinos automáticos com base no perfil (objetivo, nível, gênero, dias/semana)
import { BIBLIOTECA_EXERCICIOS } from './exercicios-db.js';

function ex(nome, numSeries, repeticoes, descansoSegundos) {
  const e = BIBLIOTECA_EXERCICIOS.find(x => x.nome === nome);
  if (!e) return null;
  return { ...e, numSeries, repeticoes, descansoSegundos, series: `${numSeries}x${repeticoes}` };
}

function filtrar(lista) {
  return lista.map(item => ex(...item)).filter(Boolean);
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

// Sem exercícios cardio dedicados na biblioteca — usa compostos em circuito,
// mais repetições e menos descanso para efeito de condicionamento.
const CIRCUITO_BASICO = [
  ['Agachamento', 3, '15', 30],
  ['Leg Press', 3, '15', 30],
  ['Afundo', 3, '15', 30],
];
const CIRCUITO_AVANCADO = [
  ['Agachamento', 4, '20', 20],
  ['Leg Press', 4, '20', 20],
  ['Afundo', 4, '20', 20],
  ['Panturrilha em pé', 3, '20', 20],
];

const CORE_BASICO = [
  ['Prancha', 3, '30-45s', 45],
  ['Dead Bug', 3, '12', 45],
  ['Prancha lateral', 3, '20-30s', 45],
];

export function gerarTreinos(perfil) {
  const { objetivo, nivel, genero, diasSemana = 3 } = perfil;
  const avancado = nivel === 'avancado';
  const feminino = genero === 'feminino';

  let blocos = [];

  if (objetivo === 'hipertrofia') {
    blocos = [
      { nome: 'Superior A — Peito e Tríceps', exercicios: [...(avancado ? PEITO_AVANCADO : PEITO_BASICO), ...(avancado ? TRICEPS_AVANCADO : TRICEPS_BASICO)] },
      { nome: 'Inferior — Pernas e Glúteos',  exercicios: feminino ? GLUTEOS_BASICO : (avancado ? PERNAS_AVANCADO : PERNAS_BASICO) },
      { nome: 'Superior B — Costas e Bíceps', exercicios: [...(avancado ? COSTAS_AVANCADO : COSTAS_BASICO), ...(avancado ? BICEPS_AVANCADO : BICEPS_BASICO)] },
      { nome: 'Ombros e Core',                exercicios: [...(avancado ? OMBRO_AVANCADO : OMBRO_BASICO), ...CORE_BASICO.slice(0,2)] },
      { nome: 'Inferior B — Glúteos',         exercicios: [...GLUTEOS_BASICO, ...PERNAS_BASICO.slice(3)] },
      { nome: 'Full Body — Força',            exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0], OMBRO_BASICO[0]] },
      { nome: 'Acessórios e Core',            exercicios: [...BICEPS_BASICO, ...TRICEPS_BASICO, ...CORE_BASICO.slice(0,1)] },
    ];
  } else if (objetivo === 'emagrecimento') {
    blocos = [
      { nome: 'Circuito Superior',    exercicios: [...PEITO_BASICO.slice(0,2), ...COSTAS_BASICO.slice(0,2)] },
      { nome: 'Circuito Inferior',    exercicios: avancado ? CIRCUITO_AVANCADO : CIRCUITO_BASICO },
      { nome: 'Full Body',            exercicios: [PERNAS_BASICO[0], PEITO_BASICO[0], COSTAS_BASICO[0], ...CORE_BASICO.slice(0,2)] },
      { nome: 'Inferior Intenso',     exercicios: [...GLUTEOS_BASICO.slice(0,2), ...(avancado ? CIRCUITO_AVANCADO : CIRCUITO_BASICO).slice(0,2)] },
      { nome: 'Superior + Core',      exercicios: [...OMBRO_BASICO.slice(0,2), ...BICEPS_BASICO, ...CORE_BASICO] },
      { nome: 'Circuito Completo',    exercicios: avancado ? CIRCUITO_AVANCADO : CIRCUITO_BASICO },
      { nome: 'Full Body Leve',       exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0]] },
    ];
  } else {
    blocos = [
      { nome: 'Força Superior',    exercicios: [...PEITO_BASICO, ...COSTAS_BASICO.slice(0,2), ...OMBRO_BASICO.slice(0,2)] },
      { nome: 'Força Inferior',    exercicios: [...PERNAS_BASICO, ...(feminino ? GLUTEOS_BASICO.slice(0,2) : [])] },
      { nome: 'Circuito e Core',   exercicios: [...(avancado ? CIRCUITO_AVANCADO : CIRCUITO_BASICO), ...CORE_BASICO] },
      { nome: 'Superior + Braços', exercicios: [...PEITO_BASICO.slice(0,2), ...COSTAS_BASICO.slice(0,2), ...BICEPS_BASICO, ...TRICEPS_BASICO] },
      { nome: 'Inferior + Core',   exercicios: [...PERNAS_BASICO.slice(0,4), ...GLUTEOS_BASICO.slice(0,2)] },
      { nome: 'Full Body',         exercicios: [PEITO_BASICO[0], COSTAS_BASICO[0], PERNAS_BASICO[0]] },
      { nome: 'Recuperação Ativa', exercicios: CORE_BASICO },
    ];
  }

  const selecionados = blocos.slice(0, Math.min(diasSemana, blocos.length));

  const treinos = {};
  selecionados.forEach((bloco, idx) => {
    treinos[`treino_${Date.now()}_${idx}`] = {
      nome: bloco.nome,
      exercicios: filtrar(bloco.exercicios),
      dataInicio: null,
      dataFim: null
    };
  });

  return treinos;
}
