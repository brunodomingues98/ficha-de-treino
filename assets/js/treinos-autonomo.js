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

function filtrar(nomes) {
  return nomes.map(args => ex(...args)).filter(Boolean);
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
  const { objetivo, nivel, genero } = perfil;
  const avancado = nivel === 'avancado';
  const intermediario = nivel === 'intermediario';
  const feminino = genero === 'feminino';

  const treinos = {};

  if (objetivo === 'hipertrofia') {
    // 3 treinos: Superior A, Inferior, Superior B
    treinos[`treino_${Date.now()}_1`] = {
      nome: 'Superior A — Peito e Tríceps',
      exercicios: filtrar([
        ...( avancado ? PEITO_AVANCADO : PEITO_BASICO ).map(e => e),
        ...( avancado ? TRICEPS_AVANCADO : TRICEPS_BASICO ).map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
    treinos[`treino_${Date.now()}_2`] = {
      nome: 'Inferior — Pernas e Glúteos',
      exercicios: filtrar([
        ...( feminino
          ? GLUTEOS_BASICO.map(e => e)
          : (avancado ? PERNAS_AVANCADO : PERNAS_BASICO).map(e => e)
        )
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
    treinos[`treino_${Date.now()}_3`] = {
      nome: 'Superior B — Costas e Bíceps',
      exercicios: filtrar([
        ...( avancado ? COSTAS_AVANCADO : COSTAS_BASICO ).map(e => e),
        ...( avancado ? BICEPS_AVANCADO : BICEPS_BASICO ).map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
    if (avancado || intermediario) {
      treinos[`treino_${Date.now()}_4`] = {
        nome: 'Ombros e Abdômen',
        exercicios: filtrar([
          ...( avancado ? OMBRO_AVANCADO : OMBRO_BASICO ).map(e => e),
        ].map(e => [e[0], e[1], e[2], e[3]])),
        dataInicio: null, dataFim: null
      };
    }

  } else if (objetivo === 'emagrecimento') {
    // 3 treinos com mais cardio
    treinos[`treino_${Date.now()}_1`] = {
      nome: 'Circuito Superior + Cardio',
      exercicios: filtrar([
        ...PEITO_BASICO.slice(0, 2).map(e => e),
        ...COSTAS_BASICO.slice(0, 2).map(e => e),
        ...( avancado ? CARDIO_AVANCADO : CARDIO_BASICO ).map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
    treinos[`treino_${Date.now()}_2`] = {
      nome: 'Circuito Inferior + Cardio',
      exercicios: filtrar([
        ...PERNAS_BASICO.slice(0, 3).map(e => e),
        ...( feminino ? GLUTEOS_BASICO.slice(0, 2) : [] ).map(e => e),
        ...( avancado ? CARDIO_AVANCADO : CARDIO_BASICO ).map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
    treinos[`treino_${Date.now()}_3`] = {
      nome: 'Full Body + Alongamento',
      exercicios: filtrar([
        ['Agachamento', 3, '15', 60],
        ['Supino Reto', 3, '12', 60],
        ['Remada com Barra', 3, '12', 60],
        ...CARDIO_BASICO.map(e => e),
        ...ALONGAMENTO.map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };

  } else {
    // condicionamento — mix equilibrado
    treinos[`treino_${Date.now()}_1`] = {
      nome: 'Força Superior',
      exercicios: filtrar([
        ...PEITO_BASICO.map(e => e),
        ...COSTAS_BASICO.slice(0,2).map(e => e),
        ...OMBRO_BASICO.slice(0,2).map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
    treinos[`treino_${Date.now()}_2`] = {
      nome: 'Força Inferior',
      exercicios: filtrar([
        ...PERNAS_BASICO.map(e => e),
        ...( feminino ? GLUTEOS_BASICO.slice(0,2) : [] ).map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
    treinos[`treino_${Date.now()}_3`] = {
      nome: 'Cardio e Mobilidade',
      exercicios: filtrar([
        ...CARDIO_BASICO.map(e => e),
        ...ALONGAMENTO.map(e => e),
      ].map(e => [e[0], e[1], e[2], e[3]])),
      dataInicio: null, dataFim: null
    };
  }

  return treinos;
}
