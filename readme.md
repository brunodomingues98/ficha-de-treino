# 🏋️ Ficha de Treino

Aplicação web para academias e personal trainers acompanharem o treino e a
nutrição dos seus alunos — de forma individual, organizada e 100% mobile.

Cada **professor** cadastra seus próprios alunos, monta os treinos (A/B/C/D)
escolhendo de uma biblioteca com mais de 70 exercícios ilustrados, e define
um plano nutricional individual. Cada **aluno** loga com as credenciais
recebidas e vê **somente** o que foi montado pra ele.

Funciona como **PWA** — pode ser instalado na tela inicial do celular como
se fosse um app nativo, sem precisar de loja de aplicativos.

---

## 🔗 Acesse o projeto

👉 _(adicione aqui o link do deploy na Vercel depois de publicar)_

---

## 🚀 Funcionalidades

### Para o professor
- Cadastro próprio com aprovação manual (evita acesso indevido ao painel)
- Cadastro de alunos com e-mail e senha provisória
- Biblioteca com **71 exercícios** catalogados por grupo muscular (peito,
  costas, ombro, bíceps, tríceps, pernas, abdômen), todos com imagem/GIF
  demonstrativo
- Montagem de treinos A/B/C/D por aluno, com séries e repetições customizadas
- **Período de vigência** por treino (data de início e fim) — passada a
  data, o aluno vê "aguardando renovação" até o professor atualizar
- Plano nutricional individual por aluno (refeições + suplementação)
- Gerenciamento de múltiplos alunos numa lista única

### Para o aluno
- Login simples com e-mail e senha
- Visualização dos próprios treinos, com fotos/GIFs de cada exercício e
  dicas de execução
- Cronômetro de descanso automático entre séries, com vibração ao final
- Marcação de séries concluídas
- Visualização do próprio plano nutricional (suplementos e refeições)
- Interface 100% pensada para uso direto na academia, com uma mão só

### Geral
- **PWA instalável** — banner automático de "Adicionar à tela inicial" no
  Android, instruções guiadas no iOS
- Interface mobile-first, com bloqueio de acesso por desktop (a experiência
  é pensada para o celular)
- Autenticação e banco de dados via Firebase (Auth + Firestore)

---

## 🛠️ Tecnologias utilizadas

- HTML5, CSS3, JavaScript (Vanilla, ES Modules)
- [Firebase Authentication](https://firebase.google.com/docs/auth) — login
  de professores e alunos
- [Cloud Firestore](https://firebase.google.com/docs/firestore) — dados de
  usuários, treinos e nutrição
- PWA (Web App Manifest + Service Worker)
- Deploy: Vercel

---

## 📁 Estrutura do projeto

```
fichaDeTreino/
├── assets/
│   ├── css/
│   │   ├── style.css         # Design system principal
│   │   ├── professor.css     # Estilos do painel do professor
│   │   ├── tabela.css
│   │   └── treino.css
│   ├── js/
│   │   ├── firebase.js       # Configuração e helpers do Firebase
│   │   ├── exercicios-db.js  # Biblioteca de 71 exercícios
│   │   ├── app.js            # Lógica do app do aluno (SPA)
│   │   ├── professor.js      # Lógica do painel do professor
│   │   └── pwa.js            # Registro do Service Worker + banner instalar
│   └── images/
│       ├── icons/            # Ícones do PWA (vários tamanhos)
│       └── treinos/
│           ├── superiores/   # GIFs/fotos: peito, costas, ombro, braços
│           ├── inferiores/   # GIFs/fotos: pernas
│           └── abdomen/      # GIFs/fotos: abdômen
├── index.html                # App principal (visão do aluno)
├── login.html                # Tela de login (professor e aluno)
├── cadastro-professor.html   # Auto-cadastro de professor (pendente de aprovação)
├── professor.html            # Painel de gerenciamento de alunos
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
> servir os arquivos por HTTP. Algumas opções simples:

```bash
# Com Python
python3 -m http.server 8000

# Com Node (npx)
npx serve
```

Depois acesse `http://localhost:8000` pelo navegador (idealmente em modo
responsivo/mobile, já que o app é mobile-first).

> ⚠️ O recurso de instalação como PWA só funciona em produção, servido via
> **HTTPS** (a Vercel já fornece isso automaticamente no deploy).

---

## ⚙️ Configuração necessária (Firebase)

Antes de rodar o projeto, é preciso:

1. Criar um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ativar **Authentication** → método de login **E-mail/senha**
3. Criar um banco **Firestore Database**
4. Publicar as regras de segurança (veja o passo a passo completo, com as
   regras prontas para copiar e colar, no arquivo
   `CONFIGURACAO-PROFESSOR-ALUNO.md`)
5. Colar as credenciais do Firebase (`firebaseConfig`) nos arquivos:
   - `assets/js/firebase.js`
   - `login.html`
   - `index.html`
   - `professor.html`
   - `cadastro-professor.html`

---

## 📈 Evolução do projeto

Este projeto está em constante evolução. Próximos passos possíveis:

- Histórico de treinos concluídos pelo aluno
- Gráficos de evolução (carga, frequência)
- Redefinição de senha self-service para o aluno
- Notificações push (treino do dia, renovação de período)
- Painel de super-admin para gerenciar múltiplos professores

---

## 👨‍💻 Autor

Bruno Domingues dos Santos
🔗 https://bdportfolio.vercel.app
🔗 https://www.linkedin.com/in/bruno-domingues-33288b16a/

---

## 📄 Licença

Projeto livre para estudo e uso pessoal.
