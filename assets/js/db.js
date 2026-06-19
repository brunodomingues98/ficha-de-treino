// ============================================================
//  db.js — Dados estáticos de nutrição (suplementação e dieta)
//  Os treinos NÃO ficam mais aqui: cada aluno tem os próprios
//  treinos salvos no Firestore (users/{uid}.treinos), montados
//  pelo professor através do painel /professor.html
// ============================================================

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

export const DIETA = [
  { horario: "06:30",       ref: "Café da Manhã",    opcoes: ["Omelete com 3 ovos", "Pão integral com queijo", "Aveia com banana e whey"] },
  { horario: "09:30",       ref: "Lanche 1",         opcoes: ["Iogurte + granola", "Fruta + castanhas", "Vitamina com whey"] },
  { horario: "12:00–13:30", ref: "Almoço",           opcoes: ["Arroz, feijão, frango ou carne", "Legumes ou salada", "Batata doce ou macarrão"] },
  { horario: "15:00–17:00", ref: "Lanche 2",         opcoes: ["Sanduíche natural", "Frango desfiado + batata doce", "Hipercalórico"] },
  { horario: "19:00",       ref: "Pré-corrida",      opcoes: ["Banana + mel", "Torrada integral", "Shake leve"] },
  { horario: "21:00",       ref: "Pós-treino",       opcoes: ["Whey com água", "Banana", "Hipercalórico (opcional)"] },
  { horario: "22:00",       ref: "Ceia",             opcoes: ["Iogurte natural", "Cottage", "Frutas"] }
];
