// ============================================================
//  db.js — Fonte única de verdade para todos os exercícios
//  As imagens continuam em /assets/images/ (sem mudança de pasta)
//  Para hospedar em CDN no futuro, basta trocar o BASE_URL
// ============================================================

const BASE_URL = "/assets/images/treinos";

// --------------- TREINOS ----------------
export const TREINOS = {

  // ── TREINO A: Peito e Tríceps ───────────────────────────
  A: {
    nome: "Peito e Tríceps",
    icone: "💪",
    dia: "Segunda",
    cor: "#7c3aed",
    exercicios: [
      {
        id: "supino-halter",
        nome: "Supino Halter",
        series: "4 x 8–12",
        gif: `${BASE_URL}/superiores/supino-reto-com-halteres.webp`,
        dicas: [
          "Cotovelos a 45° do tronco",
          "Desça o halter até o peito com controle",
          "Respire fundo antes de empurrar"
        ],
        musculos: ["Peitoral maior", "Deltóide anterior", "Tríceps"]
      },
      {
        id: "supino-inclinado",
        nome: "Supino Inclinado",
        series: "3 x 8–12",
        gif: `${BASE_URL}/superiores/supinoInclinado.webp`,
        dicas: [
          "Banco a 30–45 graus",
          "Foco na parte superior do peitoral",
          "Não deixe os cotovelos caírem abaixo do banco"
        ],
        musculos: ["Peitoral superior", "Deltóide anterior"]
      },
      {
        id: "chest-press",
        nome: "Chest Press",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/chest-press.gif`,
        dicas: [
          "Ajuste o assento para o pino ficar na altura do peito",
          "Empurre de forma explosiva, volte com controle"
        ],
        musculos: ["Peitoral", "Tríceps"]
      },
      {
        id: "crucifixo-maquina",
        nome: "Crucifixo Máquina",
        series: "3 x 12–15",
        gif: `${BASE_URL}/superiores/cruxifixioMaquina.gif`,
        dicas: [
          "Cotovelos levemente flexionados durante todo o movimento",
          "Sinta o alongamento no peitoral na abertura"
        ],
        musculos: ["Peitoral", "Deltóide anterior"]
      },
      {
        id: "triceps-barra",
        nome: "Tríceps Pulley Barra",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/tricepsPulleyBarra.gif`,
        dicas: [
          "Cotovelos fixos ao lado do corpo",
          "Extensão completa no final do movimento"
        ],
        musculos: ["Tríceps (cabeça longa)"]
      },
      {
        id: "triceps-frances",
        nome: "Tríceps Francês",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/triceps-frances-polia.webp`,
        dicas: [
          "Mantenha os cotovelos apontados para o teto",
          "Amplitude completa de movimento"
        ],
        musculos: ["Tríceps (todas as cabeças)"]
      },
      {
        id: "triceps-maquina",
        nome: "Tríceps Máquina",
        series: "3 x 12–15",
        gif: `${BASE_URL}/superiores/tricepsMaquina.gif`,
        dicas: [
          "Bom para finalizar com pump muscular",
          "Controle o peso na volta"
        ],
        musculos: ["Tríceps"]
      }
    ]
  },

  // ── TREINO B: Inferiores ────────────────────────────────
  B: {
    nome: "Inferiores",
    icone: "🦵",
    dia: "Terça",
    cor: "#059669",
    exercicios: [
      {
        id: "agachamento-smith",
        nome: "Agachamento Smith",
        series: "4 x 8–10",
        gif: `${BASE_URL}/inferiores/agachamento.gif`,
        dicas: [
          "Pés levemente afastados e apontados para fora",
          "Joelhos seguindo a direção dos pés",
          "Desça até a coxa ficar paralela ao chão"
        ],
        musculos: ["Quadríceps", "Glúteos", "Isquiotibiais"]
      },
      {
        id: "leg-press",
        nome: "Leg Press 45°",
        series: "3 x 10–12",
        gif: `${BASE_URL}/inferiores/legPress45.webp`,
        dicas: [
          "Não trave os joelhos no topo",
          "Pés mais altos = mais glúteo; mais baixos = mais quadríceps"
        ],
        musculos: ["Quadríceps", "Glúteos", "Isquiotibiais"]
      },
      {
        id: "levantamento-terra",
        nome: "Levantamento Terra",
        series: "3 x 10–12",
        gif: `${BASE_URL}/inferiores/levantamento-terra.gif`,
        dicas: [
          "Costas retas durante todo o movimento",
          "Empurre o chão com os pés ao subir",
          "Quadril como dobradiça"
        ],
        musculos: ["Isquiotibiais", "Glúteos", "Lombar", "Trapézio"]
      },
      {
        id: "leg-extension",
        nome: "Leg Extension",
        series: "3 x 12–15",
        gif: `${BASE_URL}/inferiores/bancoExtensor.gif`,
        dicas: [
          "Extensão completa no topo, segure 1 segundo",
          "Descida lenta e controlada"
        ],
        musculos: ["Quadríceps"]
      },
      {
        id: "leg-curl",
        nome: "Leg Curl",
        series: "3 x 10–12",
        gif: `${BASE_URL}/inferiores/legCurl.gif`,
        dicas: [
          "Quadril firme contra o apoio",
          "Contração máxima no final"
        ],
        musculos: ["Isquiotibiais"]
      },
      {
        id: "abdutora",
        nome: "Abdutora",
        series: "4 x 10–15",
        gif: `${BASE_URL}/inferiores/cadeiraAbdutora.gif`,
        dicas: [
          "Abertura total, fechamento controlado",
          "Não use impulso"
        ],
        musculos: ["Glúteo médio", "Tensor da fáscia lata"]
      },
      {
        id: "panturrilha",
        nome: "Panturrilha em Pé",
        series: "4 x 10–15",
        gif: `${BASE_URL}/inferiores/panturrilhaempe.gif`,
        dicas: [
          "Amplitude completa: calcanhar baixo, ponta dos pés no alto",
          "Pausa de 1 segundo no topo"
        ],
        musculos: ["Gastrocnêmio", "Sóleo"]
      },
      {
        id: "prancha",
        nome: "Prancha",
        series: "3 x 30–60s",
        gif: `${BASE_URL}/abdomen/prancha.webp`,
        dicas: [
          "Corpo reto como uma tábua",
          "Ative o core, não prenda a respiração"
        ],
        musculos: ["Core", "Reto abdominal", "Oblíquos"]
      }
    ]
  },

  // ── TREINO C: Costas e Bíceps ──────────────────────────
  C: {
    nome: "Costas e Bíceps",
    icone: "🏋️",
    dia: "Quinta",
    cor: "#dc2626",
    exercicios: [
      {
        id: "puxada-frontal",
        nome: "Puxada Frontal",
        series: "4 x 8–12",
        gif: `${BASE_URL}/superiores/puxadaFrontal.webp`,
        dicas: [
          "Pegada maior que a largura dos ombros",
          "Puxe o cotovelo para baixo e para trás"
        ],
        musculos: ["Latíssimo do dorso", "Romboides", "Bíceps"]
      },
      {
        id: "remada-baixa",
        nome: "Remada Baixa",
        series: "3 x 8–12",
        gif: `${BASE_URL}/superiores/remadaBaixa.gif`,
        dicas: [
          "Costas retas, não arredonde a lombar",
          "Puxe o cotovelo para trás, juntando as escápulas"
        ],
        musculos: ["Latíssimo", "Romboides", "Bíceps"]
      },
      {
        id: "remada-cavalinho",
        nome: "Remada Cavalinho",
        series: "3 x 8–12",
        gif: `${BASE_URL}/superiores/remadaCavalinho.gif`,
        dicas: [
          "Tronco inclinado a ~45°",
          "Retração escapular no fim do movimento"
        ],
        musculos: ["Latíssimo", "Romboides", "Trapézio médio"]
      },
      {
        id: "pulldown",
        nome: "Pulldown",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/pulldown.gif`,
        dicas: [
          "Pegada supinada ativa mais o bíceps",
          "Amplitude total de movimento"
        ],
        musculos: ["Latíssimo", "Bíceps braquial"]
      },
      {
        id: "rosca-direta",
        nome: "Rosca Direta",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/rosca-direta-barra.gif`,
        dicas: [
          "Cotovelos fixos ao lado do corpo",
          "Supinação no topo para máxima contração"
        ],
        musculos: ["Bíceps braquial", "Braquial"]
      },
      {
        id: "rosca-inclinada",
        nome: "Rosca Inclinada",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/rosca-alternada-inclinada.gif`,
        dicas: [
          "Máximo alongamento do bíceps pela posição do banco",
          "Alternada para maior amplitude"
        ],
        musculos: ["Bíceps braquial (cabeça longa)"]
      },
      {
        id: "rosca-martelo",
        nome: "Rosca Martelo",
        series: "3 x 12–15",
        gif: `${BASE_URL}/superiores/roscaMartelo.gif`,
        dicas: [
          "Pegada neutra (polegar para cima)",
          "Trabalha o braquiorradial e o braquial"
        ],
        musculos: ["Braquiorradial", "Bíceps", "Braquial"]
      }
    ]
  },

  // ── TREINO D: Ombro, Bíceps e Tríceps ─────────────────
  D: {
    nome: "Ombro, Bíceps e Tríceps",
    icone: "🔱",
    dia: "Sábado",
    cor: "#d97706",
    exercicios: [
      {
        id: "desenvolvimento-maquina",
        nome: "Desenvolvimento Máquina",
        series: "4 x 8–12",
        gif: `${BASE_URL}/superiores/desenvolvimentoMaquina.gif`,
        dicas: [
          "Assento regulado para pinos na altura dos ombros",
          "Não trave os cotovelos no topo"
        ],
        musculos: ["Deltóide anterior e medial", "Tríceps"]
      },
      {
        id: "elevacao-lateral",
        nome: "Elevação Lateral",
        series: "3 x 8–12",
        gif: `${BASE_URL}/superiores/elevacaoLateral.webp`,
        dicas: [
          "Cotovelo levemente flexionado",
          "Eleve até a altura dos ombros, não acima",
          "Controle na descida"
        ],
        musculos: ["Deltóide medial"]
      },
      {
        id: "crucifixo-invertido",
        nome: "Crucifixo Invertido",
        series: "3 x 12–15",
        gif: `${BASE_URL}/superiores/crucifixoInvertido.gif`,
        dicas: [
          "Cabeça neutra, olhando para baixo",
          "Leve flexão do cotovelo durante o movimento"
        ],
        musculos: ["Deltóide posterior", "Romboides", "Trapézio"]
      },
      {
        id: "biceps-maquina",
        nome: "Bíceps Máquina",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/bicepsMaquina.webp`,
        dicas: [
          "Ajuste o apoio para que os cotovelos fiquem alinhados com o pino",
          "Contração total no topo"
        ],
        musculos: ["Bíceps braquial"]
      },
      {
        id: "rosca-polia",
        nome: "Rosca na Polia",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/rosca-na-polia.gif`,
        dicas: [
          "Tensão constante ao longo do movimento",
          "Ótimo para isolar o bíceps"
        ],
        musculos: ["Bíceps braquial"]
      },
      {
        id: "triceps-corda",
        nome: "Tríceps Corda",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/tricepsCorda.gif`,
        dicas: [
          "Abra a corda no final para máxima contração",
          "Cotovelos fixos ao lado do corpo"
        ],
        musculos: ["Tríceps (cabeça lateral e medial)"]
      },
      {
        id: "triceps-testa",
        nome: "Tríceps Testa",
        series: "3 x 10–12",
        gif: `${BASE_URL}/superiores/triceps-testa-polia.webp`,
        dicas: [
          "Cotovelos apontando para cima, não se abram",
          "Desça até próximo da testa"
        ],
        musculos: ["Tríceps (cabeça longa)"]
      }
    ]
  }
};

// --------------- PLANEJAMENTO SEMANAL ----------------
export const PLANEJAMENTO = [
  { dia: "Segunda",  horario: "19:00",          treino: "🏃 Corrida Leve (5–6 km)" },
  { dia: "Segunda",  horario: "21:30",          treino: "💪 Peito e Tríceps — Treino A" },
  { dia: "Terça",    horario: "21:00",          treino: "🦵 Inferiores — Treino B" },
  { dia: "Quarta",   horario: "19:00",          treino: "🏃 Intercalado (tiros 400m)" },
  { dia: "Quinta",   horario: "21:00",          treino: "🏋️ Costas e Bíceps — Treino C" },
  { dia: "Sexta",    horario: "—",              treino: "❌ Compromisso (se livre → Treino B)" },
  { dia: "Sábado",   horario: "—",              treino: "🚴 Livre / Esporte leve (opcional)" },
  { dia: "Domingo",  horario: "07:30 ou 17:30", treino: "🏃 Longão (7–10 km)" }
];

// --------------- SUPLEMENTAÇÃO ----------------
export const SUPLEMENTACAO = [
  {
    nome: "Creatina",
    quantidade: "3–5 g",
    horario: "Qualquer horário",
    dias: "Todos os dias",
    obs: "Misturar em ~200 ml de água ou junto do whey/hipercalórico. Não pausa."
  },
  {
    nome: "Pré-treino",
    quantidade: "6–10 g",
    horario: "30 min antes da musculação",
    dias: "Só dias de musculação",
    obs: "Misturar em 200–300 ml de água. Evitar se treinar tarde da noite."
  },
  {
    nome: "Whey Protein",
    quantidade: "1 scoop (30 g)",
    horario: "Pós-musculação",
    dias: "Dias de musculação",
    obs: "Misturar em 150–250 ml de água. Pode usar com leite."
  },
  {
    nome: "Hipercalórico",
    quantidade: "160 g (4 scoops)",
    horario: "15h–17h (lanche da tarde)",
    dias: "Todos os dias",
    obs: "Misturar em 250–300 ml de água. Evitar antes do treino noturno."
  }
];

// --------------- DIETA ----------------
export const DIETA = [
  { horario: "06:30",       ref: "Café da Manhã",    opcoes: ["Omelete com 3 ovos", "Pão integral com queijo", "Aveia com banana e whey"] },
  { horario: "09:30",       ref: "Lanche 1",         opcoes: ["Iogurte + granola", "Fruta + castanhas", "Vitamina com whey"] },
  { horario: "12:00–13:30", ref: "Almoço",           opcoes: ["Arroz, feijão, frango ou carne", "Legumes ou salada", "Batata doce ou macarrão"] },
  { horario: "15:00–17:00", ref: "Lanche 2",         opcoes: ["Sanduíche natural", "Frango desfiado + batata doce", "Hipercalórico"] },
  { horario: "19:00",       ref: "Pré-corrida",      opcoes: ["Banana + mel", "Torrada integral", "Shake leve"] },
  { horario: "21:00",       ref: "Pós-treino",       opcoes: ["Whey com água", "Banana", "Hipercalórico (opcional)"] },
  { horario: "22:00",       ref: "Ceia",             opcoes: ["Iogurte natural", "Cottage", "Frutas"] }
];
