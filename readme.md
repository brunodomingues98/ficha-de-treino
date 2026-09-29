# 🏋️ Ponto Fit

Aplicação web mobile-first para academias, personal trainers e usuários
autônomos acompanharem treino e nutrição de forma individual e organizada.

O sistema tem três papéis: **Admin**, **Professor** e **Aluno** — além de um
modo **Autônomo**, em que qualquer pessoa se cadastra sozinha, responde um
questionário rápido, e recebe um treino pronto (que pode editar depois).

Funciona como **PWA** — pode ser instalado na tela inicial do celular como
app nativo, sem loja de aplicativos.

---

## 🔗 Acesse o projeto

👉 https://ponto-fit.vercel.app/login.html

---

## 🚀 Funcionalidades

### Para o Admin
- Aprova, inativa e reativa cadastros de professores
- Vê quantos alunos cada professor tem e o status de cada um
- Inativar um professor bloqueia também o acesso dos alunos dele

### Para o Professor
- Cadastro com aprovação prévia do Admin
- Cadastra alunos com e-mail e senha provisória
- Biblioteca com mais de 100 exercícios (fotos/GIFs), organizados por grupo
  muscular, com busca por nome
- Monta treinos ilimitados por aluno — sem limite fixo de A/B/C/D —
  com opção de **editar e excluir** treinos já criados
- Define séries, repetições e tempo de descanso por exercício
- Define **período de vigência** por treino (data início/fim); passada a
  data, o aluno vê "aguardando renovação"
- Monta plano nutricional individual (refeições + suplementação) por aluno
- Acompanha a **evolução de carga** de cada aluno em gráficos de linha

### Para o Aluno (vinculado a um professor)
- Login com e-mail e senha, opção de "lembrar login"
- Vê apenas os próprios treinos e plano nutricional
- Marca séries concluídas com checklist e cronômetro de descanso automático
  por exercício
- Registra a carga usada em cada exercício (histórico com data)
- Linha do tempo semanal de dias treinados (D S T Q Q S S)
- Altera nome de exibição e senha pelo próprio perfil

### Modo Autônomo (sem professor)
- Cadastro livre com questionário: gênero, idade, altura, peso, objetivo
  (hipertrofia, emagrecimento ou condicionamento), nível de experiência e
  **frequência semanal de treino** (2 a 7 dias)
- Geração automática de treinos com base nessas respostas
- Editor completo do próprio treino: adicionar, remover e trocar
  exercícios, ajustar séries/repetições/descanso — acessível direto pela
  tela do treino ("Editar este treino") ou pelo perfil
- Geração de **plano alimentar via IA** (Claude): formulário coleta
  restrições alimentares, preferências, número de refeições, orçamento e
  hábito de preparo — o plano gerado é totalmente **editável** depois
- Dicas diárias personalizadas com cálculos reais (meta de água, proteína,
  necessidade calórica, IMC, zona de frequência cardíaca) baseados no perfil
- Notificação automática a cada ~45 dias sugerindo renovar o treino

### Geral
- **PWA instalável** — banner automático no Android, instruções no iOS
- Acesso por desktop liberado para Professor e Admin; Aluno é bloqueado no
  desktop com uma tela explicativa sobre o app e como acessar pelo celular
- Autenticação e banco de dados via Firebase (Auth + Firestore)
- Imagens de exercícios hospedadas no Cloudinary

---

## 🛠️ Tecnologias utilizadas

- HTML5, CSS3, JavaScript (Vanilla, ES Modules)
- [Firebase Authentication](https://firebase.google.com/docs/auth) — login
  de admin, professores e alunos
- [Cloud Firestore](https://firebase.google.com/docs/firestore) — dados de
  usuários, treinos, nutrição e histórico
- [Cloudinary](https://cloudinary.com) — hospedagem das imagens/GIFs de
  exercícios
- API da Anthropic (Claude) — geração de planos alimentares no modo autônomo
- PWA (Web App Manifest + Service Worker)
- Deploy: Vercel

---

## 📁 Estrutura do projeto

```
fichaDeTreino/
├── assets/
│   ├── css/
│   │   ├── style.css         # Design system principal (usado por todas as páginas)
│   │   └── professor.css     # Estilos específicos do painel do professor/admin
│   ├── js/
│   │   ├── firebase.js       # Configuração e helpers do Firebase
│   │   ├── exercicios-db.js  # Biblioteca de exercícios (Cloudinary)
│   │   ├── treinos-autonomo.js # Gerador de treinos automáticos por perfil
│   │   ├── app.js            # Lógica do app do aluno/autônomo (SPA)
│   │   ├── professor.js      # Lógica do painel do professor
│   │   ├── admin.js          # Lógica do painel do admin
│   │   ├── device.js         # Detecção mobile/desktop e bloqueio condicional
│   │   └── pwa.js            # Registro do Service Worker + banner de instalação
│   └── images/
│       └── icons/            # Ícones do PWA (vários tamanhos)
├── index.html                # App principal (aluno / autônomo)
├── login.html                # Login (todos os papéis)
├── cadastro.html             # Auto-cadastro do modo autônomo (com questionário)
├── cadastro-professor.html   # Auto-cadastro de professor (pendente de aprovação)
├── professor.html            # Painel de gerenciamento de alunos
├── admin.html                # Painel de aprovação de professores
├── manifest.json             # Manifest do PWA
├── sw.js                     # Service Worker
└── README.md
```

---

## 🔧 Como executar localmente

```bash
git clone https://github.com/SEU_USUARIO/fichaDeTreino.git
cd fichaDeTreino
```

> ⚠️ O projeto usa ES Modules (`import`/`export`), então **não funciona**
> abrindo o `index.html` direto no navegador (`file://`). É necessário
> servir os arquivos por HTTP:

```bash
# Com Python
python3 -m http.server 8000

# Com Node (npx)
npx serve
```

Acesse `http://localhost:8000` (idealmente em modo responsivo/mobile, já
que o app é mobile-first para alunos/autônomos).

> ⚠️ A instalação como PWA só funciona em produção, servido via **HTTPS**
> (a Vercel já fornece isso automaticamente no deploy).

---

## ⚙️ Configuração necessária (Firebase)

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Authentication** → método **E-mail/senha**
3. Crie um banco **Firestore Database**
4. Publique as regras de segurança (veja o passo a passo completo, com as
   regras prontas para copiar e colar, e a criação manual do primeiro
   Admin, no arquivo `CONFIGURACAO-PROFESSOR-ALUNO.md`)
5. Cole as credenciais do Firebase (`firebaseConfig`) em:
   - `assets/js/firebase.js`
   - `login.html`, `index.html`, `professor.html`, `admin.html`,
     `cadastro.html`, `cadastro-professor.html`

## 🖼️ Configuração necessária (Cloudinary)

As imagens dos exercícios ficam hospedadas no Cloudinary. Para atualizar ou
adicionar exercícios, suba o arquivo na sua conta do Cloudinary e edite a
URL correspondente em `assets/js/exercicios-db.js`.

## 🤖 Configuração necessária (geração de dieta por IA)

A geração de plano alimentar no modo autônomo chama a API da Anthropic
diretamente do navegador (`fetch` para `api.anthropic.com`). Isso funciona
no ambiente de artifacts/preview, mas **em produção real** o ideal é rotear
essa chamada por um backend próprio (Vercel Function, por exemplo) para não
expor a chave de API no cliente.

---

## 📈 Evolução do projeto

Próximos passos possíveis:
- Backend próprio (serverless) para a chamada de IA, protegendo a API key
- Histórico de peso/medidas do aluno ao longo do tempo
- Notificações push reais (hoje o alerta de 45 dias é local, via banner)
- Redefinição de senha self-service via e-mail (hoje é manual pelo suporte)
- Painel de múltiplos admins

---

## 👨‍💻 Autor

Bruno Domingues dos Santos
🔗 https://bdportfolio.vercel.app
🔗 https://www.linkedin.com/in/bruno-domingues-33288b16a/

---

## 📄 Licença

Projeto livre para estudo e uso pessoal.
