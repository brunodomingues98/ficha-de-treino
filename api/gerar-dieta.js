// Função serverless (Vercel). Recebe perfil + respostas do formulário,
// monta o prompt e chama a API da Anthropic do lado do servidor —
// a chave de API nunca fica exposta no navegador.
//
// Requer a variável de ambiente ANTHROPIC_API_KEY configurada no
// projeto da Vercel (Settings → Environment Variables).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' });
  }

  const { perfil = {}, extras = {} } = req.body || {};

  const objetivoMap = {
    hipertrofia: 'ganho de massa muscular',
    emagrecimento: 'perda de peso',
    condicionamento: 'condicionamento físico'
  };
  const objetivo = objetivoMap[perfil.objetivo] || perfil.objetivo || 'condicionamento';

  const orcamentoMap = {
    baixo: 'econômico (até R$30/dia, priorizando arroz, feijão, ovos, frango)',
    medio: 'moderado (R$30-60/dia)',
    alto: 'sem restrição de orçamento'
  };
  const cozinhaMap = {
    sim: 'cozinha em casa',
    parcial: 'às vezes cozinha / usa marmita',
    nao: 'come fora ou pede comida'
  };

  const prompt = `Crie um plano alimentar diário detalhado em JSON para uma pessoa com as seguintes características:
- Gênero: ${perfil.genero || 'não informado'}
- Idade: ${perfil.idade || 25} anos
- Peso: ${perfil.peso || 70} kg
- Altura: ${perfil.altura || 170} cm
- Objetivo: ${objetivo}
- Nível: ${perfil.nivel || 'intermediário'}
- Restrições alimentares: ${extras.restricoes || 'nenhuma'}
- Alimentos que não gosta: ${extras.naoGosta || 'nenhum'}
- Número de refeições: ${extras.refeicoes || 5}
- Orçamento: ${orcamentoMap[extras.orcamento] || 'moderado'}
- Hábito de preparo: ${cozinhaMap[extras.cozinha] || 'cozinha em casa'}

Retorne APENAS um JSON válido, sem markdown, sem texto antes ou depois:
{
  "refeicoes": [
    { "horario": "07:00", "ref": "Café da Manhã", "opcoes": ["opção completa 1 com quantidades", "opção completa 2 com quantidades", "opção completa 3 com quantidades"] }
  ],
  "suplementos": [
    { "nome": "Nome", "quantidade": "dose", "horario": "quando tomar", "dias": "frequência", "obs": "como usar" }
  ]
}
Inclua ${extras.refeicoes || 5} refeições com 3 opções cada. Coloque quantidades (ex: "2 ovos mexidos + 2 fatias pão integral + 1 copo leite 200ml"). Suplementos baseados no objetivo. Tudo prático e acessível no Brasil.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Erro da API Anthropic', detalhe: errText });
    }

    const data = await response.json();
    const texto = data.content?.map(i => i.text || '').join('') || '';
    const jsonLimpo = texto.replace(/```json|```/g, '').trim();
    const nutricao = JSON.parse(jsonLimpo);

    return res.status(200).json({ nutricao });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao gerar dieta', detalhe: e.message });
  }
}
