// ============================================================
//  app.js — SPA: roteamento, renderização, interações
// ============================================================
import {
  auth, db, googleProvider,
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  doc, setDoc, getDoc, updateDoc
} from './firebase.js';

import {
  BIBLIOTECA_EXERCICIOS, GRUPOS_MUSCULARES,
  getExerciciosPorGrupo, getExercicioPorId
} from './exercicios-db.js';

// ── ESTADO ─────────────────────────────────────────────────
let currentUser  = null;
let userData     = null;  // documento do Firestore (inclui role, treinos)
let TREINOS      = {};    // treinos do aluno, vindos do Firestore
let currentPage  = 'home';
let currentTreino = null;
let seriesState  = {};
let treinoSessaoAtiva = false; // true enquanto o aluno está "dentro" de um treino iniciado

// ── ELEMENTOS ──────────────────────────────────────────────
const loginScreen  = document.getElementById('login-screen');
const appShell     = document.getElementById('app-shell');
const appMain      = document.getElementById('app-main');
const headerAvatar = document.getElementById('header-avatar');
const navDropdown  = document.getElementById('nav-dropdown');
const btnMenu      = document.getElementById('btn-menu');
const toast        = document.getElementById('toast');

// ── FIREBASE AUTH ───────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    const ok = await loadUserData(user);
    if (!ok) return; // já redirecionou (professor ou erro)
    showApp();
    renderPage('home');
  } else {
    currentUser = null;
    showLogin();
  }
});

async function loadUserData(user) {
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Conta sem perfil no Firestore — não deveria acontecer no fluxo
      // novo (professor sempre cria o doc), mas tratamos por segurança.
      showToast('⚠️ Conta sem perfil. Fale com seu professor.');
      await signOut(auth);
      return false;
    }

    userData = snap.data();

    if (userData.role === 'professor' || userData.role === 'admin') {
      window.location.href = userData.role === 'admin' ? '/admin.html' : '/professor.html';
      return false;
    }

    // Cascata: se o professor responsável está inativo, o aluno também é bloqueado
    if (userData.professorId) {
      const profSnap = await getDoc(doc(db, 'users', userData.professorId));
      if (profSnap.exists() && profSnap.data().status === 'inativo') {
        showToast('⛔ Seu professor está temporariamente inativo. Acesso indisponível.');
        await signOut(auth);
        return false;
      }
    }

    TREINOS = userData.treinos || {};
    return true;
  } catch (e) {
    console.error('Erro ao carregar dados do usuário:', e);
    return false;
  }
}

// ── HISTÓRICO DE TREINOS CONCLUÍDOS ─────────────────────────
// Guardado em users/{uid}.historico = { "2026-06-22": true, ... }
// Histórico permanente (não reseta) — a barra semanal só filtra
// os 7 dias da semana atual a partir desses dados.

function getChaveHoje() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

async function marcarTreinoConcluidoHoje() {
  const chave = getChaveHoje();
  try {
    const ref = doc(db, 'users', currentUser.uid);
    const historico = { ...(userData.historico || {}), [chave]: true };

    // Coleta cargas preenchidas nos inputs visíveis
    const cargasNovas = {};
    document.querySelectorAll('.carga-input').forEach(inp => {
      const exId = inp.id.replace('carga-', '');
      const valor = inp.value.trim();
      if (valor) {
        const histAtual = userData?.cargas?.[exId] || [];
        // Só adiciona se a carga for diferente da última registrada hoje
        const ultimaHoje = histAtual.find(h => h.data === chave);
        if (!ultimaHoje) {
          cargasNovas[exId] = [...histAtual, { data: chave, carga: valor }];
        } else if (ultimaHoje.carga !== valor) {
          // Atualiza a entrada de hoje
          cargasNovas[exId] = histAtual.map(h =>
            h.data === chave ? { ...h, carga: valor } : h
          );
        }
      }
    });

    const cargas = { ...(userData.cargas || {}), ...cargasNovas };
    await updateDoc(ref, { historico, cargas });
    userData.historico = historico;
    userData.cargas = cargas;
  } catch (e) {
    console.error('Erro ao marcar treino concluído:', e);
    showToast('⚠️ Treino finalizado, mas houve um erro ao salvar o registro.');
  }
}

// Retorna array de 7 objetos { letra, dataISO, isHoje, treinou }
// representando domingo a sábado da semana atual.
function getDiasDaSemanaAtual() {
  const letras = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const hoje = new Date();
  const diaSemanaHoje = hoje.getDay(); // 0 = domingo
  const domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() - diaSemanaHoje);

  const historico = userData?.historico || {};
  const hojeISO = getChaveHoje();

  return letras.map((letra, i) => {
    const dia = new Date(domingo);
    dia.setDate(domingo.getDate() + i);
    const ano = dia.getFullYear();
    const mes = String(dia.getMonth() + 1).padStart(2, '0');
    const diaNum = String(dia.getDate()).padStart(2, '0');
    const dataISO = `${ano}-${mes}-${diaNum}`;
    return {
      letra,
      dataISO,
      isHoje: dataISO === hojeISO,
      isFuturo: dataISO > hojeISO,
      treinou: !!historico[dataISO]
    };
  });
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
}
function showApp() {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  updateHeaderAvatar();
}

// ── AVATAR NO HEADER ────────────────────────────────────────
function updateHeaderAvatar() {
  if (!currentUser) return;
  const nome = userData?.name || currentUser.email;
  headerAvatar.textContent = getInitials(nome);
}
function getInitials(str) {
  return str.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

// ── MENU HAMBURGER ──────────────────────────────────────────
btnMenu.addEventListener('click', e => {
  e.stopPropagation();
  navDropdown.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!navDropdown.contains(e.target) && e.target !== btnMenu) {
    navDropdown.classList.remove('open');
  }
});

// ── LOGOUT ──────────────────────────────────────────────────
document.getElementById('btn-logout-menu').addEventListener('click', doLogout);

async function doLogout() {
  await signOut(auth);
}

// ── BOTTOM NAV ──────────────────────────────────────────────
document.querySelectorAll('.bottom-nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    setActiveNav(page);
    renderPage(page);
  });
});
function setActiveNav(page) {
  document.querySelectorAll('.bottom-nav-item').forEach(b =>
    b.classList.toggle('active', b.dataset.page === page));
}

// ── ROTEADOR ────────────────────────────────────────────────
function renderPage(page, params = {}) {
  currentPage = page;
  appMain.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'page-enter';

  switch (page) {
    case 'home':
      treinoSessaoAtiva = false;
      wrap.innerHTML = renderHome();
      break;
    case 'treinos':
      treinoSessaoAtiva = false;
      wrap.innerHTML = renderListaTreinos();
      break;
    case 'treino':
      if (currentTreino !== params.id) treinoSessaoAtiva = false;
      wrap.innerHTML = renderTreinoPage(params.id);
      currentTreino = params.id;
      break;
    case 'nutricao':  wrap.innerHTML = renderNutricao(); break;
    case 'perfil':
      treinoSessaoAtiva = false;
      wrap.innerHTML = renderPerfil();
      break;
    default: wrap.innerHTML = renderHome();
  }

  appMain.appendChild(wrap);
  bindEvents(page, params);
}

// ── HOME ────────────────────────────────────────────────────
// Dicas rotativas — muda a cada dia
const DICAS = [
  { icon: '💧', titulo: 'Hidratação', texto: 'Beba pelo menos 2L de água por dia. Durante o treino, tome pequenos goles a cada 15-20 minutos.' },
  { icon: '😴', titulo: 'Descanso', texto: 'O músculo cresce no repouso, não durante o treino. Priorize 7-9h de sono por noite.' },
  { icon: '🥩', titulo: 'Proteína', texto: 'Consuma 1,6 a 2g de proteína por kg de peso para hipertrofia. Distribua ao longo do dia.' },
  { icon: '🔥', titulo: 'Aquecimento', texto: 'Dedique 5-10 minutos de aquecimento antes de cada treino para evitar lesões.' },
  { icon: '📈', titulo: 'Progressão', texto: 'Aumente a carga gradualmente — 2-5% por semana. A progressão de carga é o principal gatilho de hipertrofia.' },
  { icon: '🍌', titulo: 'Pré-treino', texto: 'Consuma carboidratos 1-2h antes do treino. Banana, batata doce e aveia são ótimas opções.' },
  { icon: '⏱', titulo: 'Descanso entre séries', texto: 'Para hipertrofia, descanse 60-90s entre séries. Para força, 2-4 minutos. Respeite esse tempo.' },
  { icon: '🧘', titulo: 'Mobilidade', texto: 'Reserve 10 minutos após o treino para alongamento. Melhora a recuperação e previne encurtamentos.' },
  { icon: '🥗', titulo: 'Pós-treino', texto: 'Consuma proteína + carboidrato nas 2h após o treino. Essa janela é crucial para a recuperação muscular.' },
  { icon: '📅', titulo: 'Consistência', texto: 'Resultados vêm da consistência, não da intensidade. Treinar 3x por semana por 1 ano supera qualquer semana perfeita.' },
  { icon: '💊', titulo: 'Creatina', texto: 'A creatina é o suplemento mais estudado e seguro. 3-5g por dia, sem ciclar. Consulte um profissional.' },
  { icon: '🫀', titulo: 'Cardio', texto: 'Cardio moderado (150 min/semana) melhora a recuperação muscular e a saúde cardiovascular.' },
  { icon: '🍳', titulo: 'Café da manhã', texto: 'Um café da manhã rico em proteínas aumenta a saciedade e melhora o desempenho no treino matinal.' },
  { icon: '🧠', titulo: 'Conexão mente-músculo', texto: 'Concentre-se no músculo que está trabalhando durante o exercício. Isso aumenta a ativação muscular em até 20%.' },
];

function getDicaDoDia() {
  const idx = new Date().getDate() % DICAS.length;
  return DICAS[idx];
}

function renderHome() {
  const nome = userData?.name?.split(' ')[0]
             || currentUser?.email?.split('@')[0]
             || 'Atleta';

  const ids = Object.keys(TREINOS);
  const hoje = new Date().toISOString().split('T')[0];
  const dica = getDicaDoDia();

  const cards = ids.length ? ids.map((id, idx) => {
    const t = TREINOS[id];
    const vencido = t.dataFim && t.dataFim < hoje;
    const letra = String.fromCharCode(65 + idx);
    return `
      <div class="treino-card" data-treino="${id}">
        <div class="treino-card-icon">${vencido ? '⏳' : '💪'}</div>
        <div class="treino-card-letra">${letra}</div>
        <div class="treino-card-nome">${t.nome || ''}</div>
        ${vencido ? `<div class="treino-card-dia" style="color:#f87171">Vencido</div>` : ''}
      </div>
    `;
  }).join('') : `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="icon">📋</div>
      <p>${userData?.role === 'autonomo'
        ? 'Nenhum treino ainda. Crie um no seu perfil!'
        : 'Seu professor ainda não montou nenhum treino.<br>Volte em breve!'}</p>
    </div>
  `;

  const diasSemana = getDiasDaSemanaAtual();
  const totalTreinados = diasSemana.filter(d => d.treinou).length;

  const semanaHtml = diasSemana.map(d => `
    <div class="semana-dia ${d.treinou ? 'treinou' : ''} ${d.isHoje ? 'hoje' : ''} ${d.isFuturo ? 'futuro' : ''}">
      <div class="semana-dia-letra">${d.letra}</div>
      <div class="semana-dia-marca">${d.treinou ? '✓' : ''}</div>
    </div>
  `).join('');

  return `
    <div class="hero-banner">
      <img src="/assets/images/logoKB.jpg" alt="Banner" loading="lazy">
    </div>

    <div class="home-greeting">
      <p class="label">Bom treino,</p>
      <h1>Olá, <span>${nome}</span> 👋</h1>
    </div>

    <div class="semana-tracker">
      <div class="semana-tracker-header">
        <span class="semana-tracker-title">Sua semana</span>
        <span class="semana-tracker-count">${totalTreinados}/7 dias treinados</span>
      </div>
      <div class="semana-tracker-bar">${semanaHtml}</div>
    </div>

    <p class="section-title">SEUS TREINOS</p>
    <div class="treino-cards">${cards}</div>

    <p class="section-title">💡 DICA DO DIA</p>
    <div style="padding:0 16px 24px">
      <div class="suplem-card" style="display:flex;gap:14px;align-items:flex-start">
        <div style="font-size:32px;flex-shrink:0">${dica.icon}</div>
        <div>
          <div class="suplem-nome">${dica.titulo}</div>
          <div class="suplem-obs" style="border-top:none;padding-top:4px">${dica.texto}</div>
        </div>
      </div>
    </div>
  `;
}

// ── LISTA DE TREINOS (aba "Treinos") ─────────────────────────
function renderListaTreinos() {
  const ids = Object.keys(TREINOS);
  const hoje = new Date().toISOString().split('T')[0];

  return `
    <div class="home-greeting" style="padding-top:20px">
      <h1 style="font-size:26px">💪 <span>Meus Treinos</span></h1>
    </div>

    <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px;padding-bottom:24px">
      ${ids.length ? ids.map((id, idx) => {
        const t = TREINOS[id];
        const count = t.exercicios?.length || 0;
        const vencido = t.dataFim && t.dataFim < hoje;
        const letra = String.fromCharCode(65 + idx);
        return `
          <div class="aluno-card" data-treino-id="${id}" style="cursor:pointer">
            <div class="aluno-avatar" style="${vencido ? 'background:rgba(220,38,38,.3)' : ''}">${letra}</div>
            <div class="aluno-info">
              <div class="aluno-nome">${t.nome}</div>
              <div class="aluno-email">${count} exercício${count !== 1 ? 's' : ''}</div>
              ${t.dataInicio && t.dataFim ? `
                <div class="aluno-meta" style="color:${vencido ? '#f87171' : 'var(--gold)'}">
                  ${vencido ? '⚠️ Vencido' : '✅ Vigente'} · ${formatarDataBR(t.dataInicio)} – ${formatarDataBR(t.dataFim)}
                </div>` : ''}
            </div>
            <span class="aluno-chevron">›</span>
          </div>
        `;
      }).join('') : `
        <div class="empty-state">
          <div class="icon">📋</div>
          <p>${userData?.role === 'autonomo'
            ? 'Nenhum treino ainda. Crie um no seu perfil!'
            : 'Seu professor ainda não montou nenhum treino.'}</p>
        </div>
      `}
    </div>
  `;
}

function bindListaTreinos() {
  document.querySelectorAll('[data-treino-id]').forEach(card => {
    card.addEventListener('click', () => {
      renderPage('treino', { id: card.dataset.treinoId });
    });
  });
}


function formatarDataBR(isoDate) {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

function renderTreinoVencido(letra, t) {
  const dataFimBR = formatarDataBR(t.dataFim);
  return `
    <div class="page-header">
      <button class="btn-back" id="btn-back">‹</button>
      <div>
        <div class="page-title">💪 ${t.nome}</div>
        <div class="page-badge">Treino ${letra}</div>
      </div>
    </div>
    <div class="empty-state" style="margin-top:40px">
      <div class="icon">⏳</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.04em;color:var(--text-primary);margin-bottom:8px">
        Aguardando renovação
      </h2>
      <p>Este treino venceu em <strong style="color:var(--gold)">${dataFimBR}</strong>.<br>
      Fale com seu professor para renovar.</p>
    </div>
  `;
}

function renderTreinoPage(id) {
  if (!id || !TREINOS[id]) return renderHome();
  const t = TREINOS[id];

  // ── Checagem de vigência ──────────────────────────────
  const hoje = new Date().toISOString().split('T')[0];
  if (t.dataFim && t.dataFim < hoje) {
    return renderTreinoVencido(id, t);
  }

  const exercicios = t.exercicios.map(ex => {
    const numSeries = ex.numSeries || parseInt(ex.series?.match(/(\d+)\s*x/)?.[1]) || 3;
    const descanso = ex.descansoSegundos || 60;
    const repsLabel = ex.repeticoes || ex.series?.split('x')[1] || '';

    // Última carga registrada como referência
    const histCarga = userData?.cargas?.[ex.id] || [];
    const ultimaCarga = histCarga.length ? histCarga[histCarga.length - 1] : null;

    const seriesRows = Array.from({length: numSeries}, (_, i) => `
      <div class="serie-row" data-ex="${ex.id}" data-idx="${i}">
        <button class="serie-check" data-ex="${ex.id}" data-idx="${i}">
          <span class="serie-check-icon">✓</span>
        </button>
        <span class="serie-row-label">Série ${i + 1}</span>
        <button class="serie-timer-btn" data-ex="${ex.id}" data-descanso="${descanso}" title="Ver tempo de descanso">
          ⏱ ${descanso}s
        </button>
      </div>
    `).join('');

    const dicas = (ex.dicas || []).map(d => `
      <div class="dica-item">${d}</div>
    `).join('');

    return `
      <div class="exercicio-item" id="ex-${ex.id}">
        <div class="exercicio-row" data-toggle="${ex.id}">
          <img class="exercicio-thumb"
               src="${ex.gif}"
               alt="${ex.nome}"
               loading="lazy"
               decoding="async">
          <div class="exercicio-info">
            <div class="exercicio-nome">${ex.nome}</div>
            <div class="exercicio-series">${numSeries}x${repsLabel}</div>
            <div class="exercicio-musculos">${(ex.musculos || []).join(', ')}</div>
          </div>
          <span class="exercicio-chevron">›</span>
        </div>

        <div class="exercicio-detail">
          <img class="detail-gif"
               src="${ex.gif}"
               alt="${ex.nome}"
               loading="lazy"
               decoding="async">
          ${dicas ? `
            <div class="dicas-label">💡 DICAS DE EXECUÇÃO</div>
            <div class="dicas-list">${dicas}</div>
          ` : ''}

          <div class="carga-box">
            <div class="carga-label">⚖️ Carga utilizada</div>
            <div class="carga-input-row">
              <input type="text" class="carga-input" id="carga-${ex.id}"
                     placeholder="Ex: 20kg, 2x10kg, peso corporal"
                     value="${ultimaCarga?.carga || ''}">
              ${ultimaCarga ? `<span class="carga-ultima">Última: ${ultimaCarga.carga} <span style="color:var(--text-muted)">(${formatarDataBR(ultimaCarga.data)})</span></span>` : ''}
            </div>
          </div>

          <div class="series-tracker">
            <div class="series-tracker-label">Marcar séries concluídas</div>
            <div class="series-rows-list" id="rows-${ex.id}">
              ${seriesRows}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <button class="btn-back" id="btn-back">‹</button>
      <div>
        <div class="page-title">💪 ${t.nome}</div>
        <div class="page-badge">${t.exercicios.length} exercício${t.exercicios.length !== 1 ? 's' : ''}</div>
      </div>
    </div>

    <div style="padding:0 16px 16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn-treino-toggle ${treinoSessaoAtiva ? 'ativo' : ''}" id="btn-toggle-treino">
        ${treinoSessaoAtiva ? '⏹ Finalizar Treino' : '▶ Iniciar Treino'}
      </button>
      ${userData?.role === 'autonomo' ? `
        <button class="btn-secondary" id="btn-editar-este-treino" style="font-size:13px;padding:10px">
          ✏️ Editar este treino
        </button>
      ` : ''}
    </div>

    <div class="exercicios-list">${exercicios}</div>

    <!-- Modal de descanso (cronômetro regressivo) -->
    <div class="modal-overlay hidden" id="modal-descanso">
      <div class="modal-sheet" style="text-align:center;padding-bottom:32px">
        <div class="modal-handle"></div>
        <div class="modal-title" style="text-align:center">⏱ Tempo de Descanso</div>
        <div class="descanso-circle">
          <span id="descanso-numero">60</span>
          <span class="descanso-unidade">segundos</span>
        </div>
        <button class="btn-secondary" id="btn-fechar-descanso" style="margin-top:20px">Fechar</button>
      </div>
    </div>
  `;
}

// ── NUTRIÇÃO ────────────────────────────────────────────────
function renderNutricao(activeTab = 'suplemenacao') {
  return `
    <div style="padding-top:8px">
      <div class="nutri-tabs">
        <button class="nutri-tab ${activeTab==='suplemenacao'?'active':''}" data-tab="suplemenacao">💊 Suplementação</button>
        <button class="nutri-tab ${activeTab==='dieta'?'active':''}" data-tab="dieta">🥗 Dieta</button>
      </div>
      <div class="nutri-content" id="nutri-body">
        ${activeTab === 'suplemenacao' ? renderSupl() : renderDieta()}
      </div>
    </div>
  `;
}

function renderSupl() {
  const suplementos = userData?.nutricao?.suplementos || [];
  const isAutonomo = userData?.role === 'autonomo';
  if (!suplementos.length) {
    return isAutonomo
      ? `<div class="empty-state">
           <div class="icon">💊</div>
           <p>Nenhuma suplementação cadastrada ainda.</p>
           <p style="font-size:12px;color:var(--text-muted);margin-top:8px">Gere um plano nutricional completo com a IA abaixo.</p>
         </div>`
      : `<div class="empty-state"><div class="icon">💊</div><p>Seu professor ainda não cadastrou suplementos.</p></div>`;
  }
  return suplementos.map(s => `
    <div class="suplem-card">
      <div class="suplem-header">
        <span class="suplem-nome">${s.nome}</span>
        <span class="suplem-qty">${s.quantidade}</span>
      </div>
      <div class="suplem-row">
        <span class="suplem-meta"><strong>⏰</strong> ${s.horario}</span>
        <span class="suplem-meta"><strong>📅</strong> ${s.dias}</span>
      </div>
      <div class="suplem-obs">${s.obs}</div>
    </div>
  `).join('');
}

function renderDieta() {
  const refeicoes = userData?.nutricao?.refeicoes || [];
  const isAutonomo = userData?.role === 'autonomo';

  if (!refeicoes.length) {
    if (isAutonomo) {
      const perfil = userData?.perfil || {};
      return `
        <div class="empty-state" style="padding-bottom:8px">
          <div class="icon">🥗</div>
          <p>Nenhum plano alimentar ainda.</p>
        </div>
        <div style="padding:0 0 16px">
          <div class="suplem-card" style="text-align:center">
            <div style="font-size:32px;margin-bottom:8px">🤖</div>
            <div class="suplem-nome" style="text-align:center;margin-bottom:6px">Gerar dieta com IA</div>
            <div class="suplem-obs" style="border-top:none;padding-top:0;text-align:center;margin-bottom:14px">
              Baseado no seu perfil (${perfil.objetivo || 'objetivo'}, ${perfil.peso || '?'}kg, ${perfil.idade || '?'} anos),
              a IA vai montar um plano alimentar personalizado pra você.
            </div>
            <button class="btn-primary" id="btn-gerar-dieta-ia">✨ Gerar meu plano alimentar</button>
          </div>
        </div>
      `;
    }
    return `<div class="empty-state"><div class="icon">🥗</div><p>Seu professor ainda não cadastrou a dieta.</p></div>`;
  }

  return `
    ${isAutonomo ? `
      <div style="margin-bottom:12px">
        <button class="btn-secondary" id="btn-regenerar-dieta" style="font-size:12px;padding:8px">
          🤖 Gerar nova dieta com IA
        </button>
      </div>
    ` : ''}
    ${refeicoes.map(m => `
      <div class="meal-card">
        <div class="meal-time">${m.horario}</div>
        <div class="meal-info">
          <div class="meal-nome">${m.ref}</div>
          ${(m.opcoes || []).map(o => `<div class="meal-opcao">${o}</div>`).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

// ── PERFIL ──────────────────────────────────────────────────
function renderPerfil() {
  if (!currentUser) return '';
  const nome = userData?.name || currentUser.email.split('@')[0];
  const email = currentUser.email;
  const avatarContent = `<span>${getInitials(nome)}</span>`;

  const totalExercicios = Object.values(TREINOS)
    .reduce((acc, t) => acc + (t.exercicios?.length || 0), 0);

  return `
    <div class="profile-page">
      <div class="profile-header">
        <div class="profile-avatar">${avatarContent}</div>
        <div class="profile-name">${nome}</div>
        <div class="profile-email">${email}</div>
      </div>

      <div class="profile-stats">
        <div class="stat-card">
          <div class="stat-value">${Object.keys(TREINOS).length}</div>
          <div class="stat-label">Treinos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalExercicios}</div>
          <div class="stat-label">Exercícios</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${userData?.nutricao?.suplementos?.length || 0}</div>
          <div class="stat-label">Suplementos</div>
        </div>
      </div>

      <div class="profile-section-title">Conta</div>

      <div class="profile-option">
        <div class="profile-option-left">
          <span class="profile-option-icon">✉️</span>
          ${email}
        </div>
      </div>

      <div class="profile-option" id="btn-editar-nome">
        <div class="profile-option-left">
          <span class="profile-option-icon">✏️</span>
          Alterar nome de exibição
        </div>
        <span style="color:var(--text-muted);font-size:14px">›</span>
      </div>

      <div class="profile-option" id="btn-trocar-senha">
        <div class="profile-option-left">
          <span class="profile-option-icon">🔒</span>
          Trocar senha
        </div>
        <span style="color:var(--text-muted);font-size:14px">›</span>
      </div>

      ${userData?.role === 'autonomo' ? `
      <div class="profile-section-title">Meus treinos</div>
      <div class="profile-option" id="btn-editar-treinos">
        <div class="profile-option-left">
          <span class="profile-option-icon">🏋️</span>
          Editar meus treinos
        </div>
        <span style="color:var(--text-muted);font-size:14px">›</span>
      </div>
      <div class="profile-option" id="btn-adicionar-treino">
        <div class="profile-option-left">
          <span class="profile-option-icon">➕</span>
          Adicionar treino
        </div>
        <span style="color:var(--text-muted);font-size:14px">›</span>
      </div>
      ` : ''}

      <button class="btn-logout" id="btn-logout-profile">Sair da conta</button>
    </div>

    <!-- Modal: alterar nome -->
    <div class="modal-overlay hidden" id="modal-editar-nome">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Alterar nome de exibição</div>
        <div class="login-error" id="erro-nome"></div>
        <div class="form-stack">
          <div class="field-group">
            <label>Como você quer ser chamado(a)</label>
            <input type="text" id="input-novo-nome" value="${nome}" placeholder="Seu nome">
          </div>
          <button class="btn-primary" id="btn-salvar-nome">Salvar</button>
          <button class="btn-secondary" id="btn-cancelar-nome">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal: trocar senha -->
    <div class="modal-overlay hidden" id="modal-trocar-senha">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Trocar senha</div>
        <div class="login-error" id="erro-senha"></div>
        <div class="form-stack">
          <div class="field-group">
            <label>Senha atual</label>
            <input type="password" id="input-senha-atual" placeholder="••••••••" autocomplete="current-password">
          </div>
          <div class="field-group">
            <label>Nova senha</label>
            <input type="password" id="input-senha-nova" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
          </div>
          <div class="field-group">
            <label>Confirmar nova senha</label>
            <input type="password" id="input-senha-nova2" placeholder="Repita a nova senha" autocomplete="new-password">
          </div>
          <button class="btn-primary" id="btn-salvar-senha">Salvar nova senha</button>
          <button class="btn-secondary" id="btn-cancelar-senha">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

// ── BINDINGS POR PÁGINA ─────────────────────────────────────
function bindEvents(page, params) {
  switch (page) {
    case 'home':    bindHome();            break;
    case 'treinos': bindListaTreinos();    break;
    case 'treino':  bindTreino(params.id); break;
    case 'nutricao':bindNutricao();        break;
    case 'perfil':  bindPerfil();          break;
  }
}

function bindHome() {
  document.querySelectorAll('.treino-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.treino;
      setActiveNav('treinos');
      renderPage('treino', { id });
    });
  });
}

function bindTreino(id) {
  // botão voltar
  document.getElementById('btn-back')?.addEventListener('click', () => {
    setActiveNav('home');
    renderPage('home');
  });

  // botão editar treino (só autônomo)
  document.getElementById('btn-editar-este-treino')?.addEventListener('click', () => {
    abrirEditorBuilder(id);
  });

  // botão iniciar/finalizar treino
  document.getElementById('btn-toggle-treino')?.addEventListener('click', async () => {
    if (!treinoSessaoAtiva) {
      treinoSessaoAtiva = true;
      showToast('▶ Treino iniciado! Bom treino 💪');
      renderPage('treino', { id });
    } else {
      treinoSessaoAtiva = false;
      await marcarTreinoConcluidoHoje();
      showToast('✅ Treino finalizado e registrado!');
      navigator.vibrate?.(200);
      setActiveNav('home');
      renderPage('home');
    }
  });

  // expand/collapse exercício
  document.querySelectorAll('[data-toggle]').forEach(row => {
    row.addEventListener('click', () => {
      const id   = row.dataset.toggle;
      const item = document.getElementById(`ex-${id}`);
      const wasOpen = item.classList.contains('expanded');
      // fecha todos
      document.querySelectorAll('.exercicio-item.expanded')
        .forEach(i => i.classList.remove('expanded'));
      if (!wasOpen) {
        item.classList.add('expanded');
        // lazy load do gif expandido
        const gif = item.querySelector('.detail-gif');
        if (gif && !gif.src.includes('blob')) {
          gif.src = gif.src; // força load
        }
      }
    });
  });

  // marcar série como feita (checkbox) → abre modal de descanso
  document.querySelectorAll('.serie-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const exId = btn.dataset.ex;
      const idx  = parseInt(btn.dataset.idx);
      btn.classList.toggle('done');

      const allChecks = document.querySelectorAll(`.serie-check[data-ex="${exId}"]`);
      const done = [...allChecks].filter(c => c.classList.contains('done')).length;

      if (btn.classList.contains('done')) {
        if (done < allChecks.length) {
          const timerBtn = document.querySelector(`.serie-timer-btn[data-ex="${exId}"]`);
          const descanso = parseInt(timerBtn?.dataset.descanso) || 60;
          abrirModalDescanso(descanso);
        } else {
          const nomeEx = TREINOS[letra]?.exercicios.find(e => e.id === exId)?.nome;
          showToast(`✅ ${nomeEx} concluído!`);
          navigator.vibrate?.(200);
        }
      }
    });
  });

  // botão de relógio individual → abre modal de descanso manualmente
  document.querySelectorAll('.serie-timer-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const descanso = parseInt(btn.dataset.descanso) || 60;
      abrirModalDescanso(descanso);
    });
  });

  // fechar modal de descanso
  document.getElementById('btn-fechar-descanso')?.addEventListener('click', fecharModalDescanso);
  document.getElementById('modal-descanso')?.addEventListener('click', e => {
    if (e.target.id === 'modal-descanso') fecharModalDescanso();
  });
}

// ── MODAL DE DESCANSO (cronômetro regressivo) ───────────────
let descansoInterval = null;

function abrirModalDescanso(segundosTotais) {
  const modal = document.getElementById('modal-descanso');
  const numeroEl = document.getElementById('descanso-numero');
  if (!modal || !numeroEl) return;

  clearInterval(descansoInterval);
  let restante = segundosTotais;
  numeroEl.textContent = restante;
  modal.classList.remove('hidden');

  descansoInterval = setInterval(() => {
    restante--;
    if (restante <= 0) {
      clearInterval(descansoInterval);
      numeroEl.textContent = '0';
      navigator.vibrate?.(300);
      showToast('🔔 Descanso encerrado! Próxima série.');
      setTimeout(fecharModalDescanso, 600);
    } else {
      numeroEl.textContent = restante;
    }
  }, 1000);
}

function fecharModalDescanso() {
  clearInterval(descansoInterval);
  document.getElementById('modal-descanso')?.classList.add('hidden');
}

function bindNutricao() {
  document.querySelectorAll('.nutri-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const active = tab.dataset.tab;
      document.querySelectorAll('.nutri-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === active));
      document.getElementById('nutri-body').innerHTML =
        active === 'suplemenacao' ? renderSupl() : renderDieta();
      bindNutricaoIA();
    });
  });
  bindNutricaoIA();
}

function bindNutricaoIA() {
  document.getElementById('btn-gerar-dieta-ia')?.addEventListener('click', gerarDietaIA);
  document.getElementById('btn-regenerar-dieta')?.addEventListener('click', gerarDietaIA);
}

async function gerarDietaIA() {
  const btn = document.getElementById('btn-gerar-dieta-ia') ||
              document.getElementById('btn-regenerar-dieta');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Gerando sua dieta...'; }

  const perfil = userData?.perfil || {};
  const objetivo = { hipertrofia: 'ganho de massa muscular', emagrecimento: 'perda de peso', condicionamento: 'condicionamento físico' }[perfil.objetivo] || perfil.objetivo;
  const prompt = `Crie um plano alimentar diário em JSON para uma pessoa com as seguintes características:
- Gênero: ${perfil.genero || 'não informado'}
- Idade: ${perfil.idade || '?'} anos
- Peso: ${perfil.peso || '?'} kg
- Altura: ${perfil.altura || '?'} cm
- Objetivo: ${objetivo || 'não informado'}
- Nível de atividade: ${perfil.nivel || 'intermediário'}

Retorne APENAS um JSON válido, sem texto antes ou depois, no seguinte formato:
{
  "refeicoes": [
    { "horario": "07:00", "ref": "Café da Manhã", "opcoes": ["opção 1", "opção 2", "opção 3"] },
    { "horario": "10:00", "ref": "Lanche da Manhã", "opcoes": ["opção 1", "opção 2"] }
  ],
  "suplementos": [
    { "nome": "Whey Protein", "quantidade": "30g", "horario": "Pós-treino", "dias": "Dias de treino", "obs": "Misturar com água ou leite" }
  ]
}
Inclua 5-6 refeições e os principais suplementos recomendados para o objetivo. As opções devem ser práticas e acessíveis no Brasil.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const texto = data.content?.map(i => i.text || '').join('');
    const jsonLimpo = texto.replace(/```json|```/g, '').trim();
    const nutricao = JSON.parse(jsonLimpo);

    await updateDoc(doc(db, 'users', currentUser.uid), { nutricao });
    userData.nutricao = nutricao;
    showToast('✅ Dieta gerada com sucesso!');
    renderPage('nutricao');
  } catch (e) {
    console.error('Erro ao gerar dieta:', e);
    showToast('❌ Erro ao gerar dieta. Tente novamente.');
    if (btn) { btn.disabled = false; btn.textContent = '✨ Gerar meu plano alimentar'; }
  }
}


function bindPerfil() {
  document.getElementById('btn-logout-profile')?.addEventListener('click', doLogout);

  // ── Alterar nome ────────────────────────────────────────
  const modalNome = document.getElementById('modal-editar-nome');
  document.getElementById('btn-editar-nome')?.addEventListener('click', () => {
    modalNome.classList.remove('hidden');
  });
  document.getElementById('btn-cancelar-nome')?.addEventListener('click', () => {
    modalNome.classList.add('hidden');
  });
  modalNome?.addEventListener('click', e => { if (e.target === modalNome) modalNome.classList.add('hidden'); });

  document.getElementById('btn-salvar-nome')?.addEventListener('click', async () => {
    const errEl = document.getElementById('erro-nome');
    const novoNome = document.getElementById('input-novo-nome').value.trim();
    errEl.classList.remove('show');

    if (!novoNome) {
      errEl.textContent = 'Digite um nome.';
      errEl.classList.add('show');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { name: novoNome });
      userData.name = novoNome;
      modalNome.classList.add('hidden');
      showToast('✅ Nome atualizado!');
      updateHeaderAvatar();
      renderPage('perfil');
    } catch (e) {
      errEl.textContent = 'Erro ao salvar: ' + e.message;
      errEl.classList.add('show');
    }
  });

  // ── Trocar senha ────────────────────────────────────────
  const modalSenha = document.getElementById('modal-trocar-senha');
  document.getElementById('btn-trocar-senha')?.addEventListener('click', () => {
    modalSenha.classList.remove('hidden');
  });
  document.getElementById('btn-cancelar-senha')?.addEventListener('click', () => {
    modalSenha.classList.add('hidden');
  });
  modalSenha?.addEventListener('click', e => { if (e.target === modalSenha) modalSenha.classList.add('hidden'); });

  document.getElementById('btn-salvar-senha')?.addEventListener('click', async () => {
    const errEl = document.getElementById('erro-senha');
    const senhaAtual = document.getElementById('input-senha-atual').value;
    const senhaNova  = document.getElementById('input-senha-nova').value;
    const senhaNova2 = document.getElementById('input-senha-nova2').value;
    errEl.classList.remove('show');

    if (!senhaAtual || !senhaNova || !senhaNova2) {
      errEl.textContent = 'Preencha todos os campos.';
      errEl.classList.add('show');
      return;
    }
    if (senhaNova.length < 6) {
      errEl.textContent = 'A nova senha deve ter ao menos 6 caracteres.';
      errEl.classList.add('show');
      return;
    }
    if (senhaNova !== senhaNova2) {
      errEl.textContent = 'As senhas não coincidem.';
      errEl.classList.add('show');
      return;
    }

    const btn = document.getElementById('btn-salvar-senha');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, senhaAtual);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, senhaNova);

      modalSenha.classList.add('hidden');
      showToast('✅ Senha alterada com sucesso!');
    } catch (e) {
      const map = {
        'auth/wrong-password':       'Senha atual incorreta.',
        'auth/invalid-credential':   'Senha atual incorreta.',
        'auth/too-many-requests':    'Muitas tentativas. Aguarde alguns minutos.',
        'auth/weak-password':        'Senha muito fraca.',
      };
      errEl.textContent = map[e.code] || ('Erro: ' + e.message);
      errEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar nova senha';
    }
  });

  // ── Editor de treinos (só para autônomo) ───────────────
  if (userData?.role === 'autonomo') {
    document.getElementById('btn-editar-treinos')?.addEventListener('click', abrirEditorTreinos);
    document.getElementById('btn-adicionar-treino')?.addEventListener('click', () => abrirEditorBuilder(null));
  }
}

// ── EDITOR DE TREINOS DO AUTÔNOMO ──────────────────────────
function abrirEditorTreinos() {
  const ids = Object.keys(TREINOS);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-editor-treinos';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="modal-title" style="margin:0">🏋️ Meus Treinos</div>
        <button id="btn-fechar-editor" style="color:var(--text-muted);font-size:22px">×</button>
      </div>

      <div id="lista-treinos-editor" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${ids.length ? ids.map(id => {
          const t = TREINOS[id];
          const count = t.exercicios?.length || 0;
          return `
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;display:flex;align-items:center;gap:10px">
              <div style="flex:1">
                <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${t.nome}</div>
                <div style="font-size:12px;color:var(--text-muted)">${count} exercício${count !== 1 ? 's' : ''}</div>
              </div>
              <button class="btn-edit-autonomo" data-id="${id}" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:7px 12px;color:var(--gold);font-size:12px;font-weight:700">✏️ Editar</button>
              <button class="btn-del-autonomo" data-id="${id}" style="background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.25);border-radius:8px;padding:7px 10px;color:#f87171;font-size:12px">🗑️</button>
            </div>
          `;
        }).join('') : `
          <div class="empty-state" style="padding:24px 0">
            <div class="icon">📋</div>
            <p>Nenhum treino ainda. Adicione o primeiro!</p>
          </div>
        `}
      </div>

      <button class="btn-primary" id="btn-novo-treino-autonomo">+ Adicionar novo treino</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('btn-fechar-editor').addEventListener('click', () => overlay.remove());
  document.getElementById('btn-novo-treino-autonomo').addEventListener('click', () => {
    overlay.remove();
    abrirEditorBuilder(null);
  });

  overlay.querySelectorAll('.btn-edit-autonomo').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.remove();
      abrirEditorBuilder(btn.dataset.id);
    });
  });

  overlay.querySelectorAll('.btn-del-autonomo').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const nome = TREINOS[id]?.nome || 'este treino';
      if (!confirm(`Excluir "${nome}"?`)) return;
      delete TREINOS[id];
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { treinos: TREINOS });
        userData.treinos = { ...TREINOS };
        showToast('✅ Treino excluído');
        overlay.remove();
        renderPage('perfil');
      } catch (e) {
        showToast('❌ Erro: ' + e.message);
      }
    });
  });
}

// ── BUILDER DO AUTÔNOMO ────────────────────────────────────
let autonomoExercicios = [];
let autonomoTreinoId = null;

function abrirEditorBuilder(id) {
  autonomoTreinoId = id || ('treino_' + Date.now());
  const existente = id ? TREINOS[id] : null;
  autonomoExercicios = existente?.exercicios?.map(e => ({
    exId: e.id, numSeries: e.numSeries || 3,
    repeticoes: e.repeticoes || '8-12', descansoSegundos: e.descansoSegundos || 60
  })) || [];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-builder-autonomo';
  overlay.innerHTML = `
    <div class="modal-sheet" style="max-height:92vh">
      <div class="modal-handle"></div>
      <div class="modal-title">${existente ? 'Editar Treino' : 'Novo Treino'}</div>

      <div class="form-stack" style="margin-bottom:12px">
        <input type="text" id="nome-treino-autonomo"
          value="${existente?.nome || ''}"
          placeholder="Nome do treino (ex: Peito e Tríceps)"
          style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-family:inherit">
      </div>

      <div class="treino-montado-list" id="autonomo-montado-list"></div>

      <p class="section-title" style="padding:0 0 8px">ADICIONAR EXERCÍCIO</p>
      <div style="margin-bottom:10px">
        <input type="text" id="autonomo-search"
          placeholder="🔍 Buscar exercício..."
          style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-size:14px;font-family:inherit">
      </div>
      <div class="picker-list" id="autonomo-picker-list"></div>

      <button class="btn-primary" id="btn-salvar-autonomo" style="width:100%;margin-top:8px">Salvar Treino</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  renderAutonomoMontado();
  renderAutonomoPicker('');

  document.getElementById('autonomo-search').addEventListener('input', e => {
    renderAutonomoPicker(e.target.value.trim());
  });

  document.getElementById('btn-salvar-autonomo').addEventListener('click', salvarTreinoAutonomo);
}

function renderAutonomoMontado() {
  const el = document.getElementById('autonomo-montado-list');
  if (!el) return;
  if (!autonomoExercicios.length) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:12px 0">Nenhum exercício adicionado ainda.</p>`;
    return;
  }
  el.innerHTML = autonomoExercicios.map((sel, idx) => {
    const ex = getExercicioPorId(sel.exId);
    if (!ex) return '';
    return `
      <div class="treino-montado-item" style="flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <img class="treino-montado-thumb" src="${ex.gif}" loading="lazy">
          <div class="treino-montado-nome" style="flex:1">${ex.nome}</div>
          <button class="autonomo-remove-ex" data-idx="${idx}" style="background:rgba(220,38,38,.15);border:none;border-radius:50%;width:26px;height:26px;color:#f87171;font-size:14px">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div class="exercicio-param">
            <label>Séries</label>
            <input type="number" class="autonomo-series" data-idx="${idx}" value="${sel.numSeries}" min="1" max="10"
              style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 6px;color:#fff;font-family:inherit;width:100%">
          </div>
          <div class="exercicio-param">
            <label>Reps</label>
            <input type="text" class="autonomo-reps" data-idx="${idx}" value="${sel.repeticoes}" placeholder="8-12"
              style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 6px;color:#fff;font-family:inherit;width:100%">
          </div>
          <div class="exercicio-param">
            <label>Descanso</label>
            <select class="autonomo-descanso" data-idx="${idx}"
              style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 6px;color:#fff;font-family:inherit;width:100%">
              ${[15,20,30,45,60,75,90,120,150,180].map(s =>
                `<option value="${s}" ${sel.descansoSegundos===s?'selected':''}>${s}s</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.autonomo-series').forEach(inp => {
    inp.addEventListener('input', () => { autonomoExercicios[inp.dataset.idx].numSeries = parseInt(inp.value)||1; });
  });
  el.querySelectorAll('.autonomo-reps').forEach(inp => {
    inp.addEventListener('input', () => { autonomoExercicios[inp.dataset.idx].repeticoes = inp.value; });
  });
  el.querySelectorAll('.autonomo-descanso').forEach(sel => {
    sel.addEventListener('change', () => { autonomoExercicios[sel.dataset.idx].descansoSegundos = parseInt(sel.value); });
  });
  el.querySelectorAll('.autonomo-remove-ex').forEach(btn => {
    btn.addEventListener('click', () => {
      autonomoExercicios.splice(parseInt(btn.dataset.idx), 1);
      renderAutonomoMontado();
      renderAutonomoPicker(document.getElementById('autonomo-search')?.value.trim() || '');
    });
  });
}

function renderAutonomoPicker(termo) {
  const el = document.getElementById('autonomo-picker-list');
  if (!el) return;
  const lista = termo.length < 1
    ? BIBLIOTECA_EXERCICIOS
    : BIBLIOTECA_EXERCICIOS.filter(ex =>
        ex.nome.toLowerCase().includes(termo.toLowerCase()) ||
        ex.grupo.toLowerCase().includes(termo.toLowerCase())
      );

  if (!lista.length) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px 0">Nenhum exercício encontrado.</p>`;
    return;
  }

  const porGrupo = {};
  lista.forEach(ex => {
    if (!porGrupo[ex.grupo]) porGrupo[ex.grupo] = [];
    porGrupo[ex.grupo].push(ex);
  });

  el.innerHTML = Object.entries(porGrupo).map(([grupo, exercicios]) => `
    <div class="picker-grupo-label">${grupo}</div>
    ${exercicios.map(ex => {
      const sel = autonomoExercicios.some(s => s.exId === ex.id);
      return `
        <div class="picker-item ${sel ? 'selected' : ''}" data-id="${ex.id}">
          <img class="picker-thumb" src="${ex.gif}" loading="lazy">
          <div class="picker-nome">${ex.nome}</div>
          <div class="picker-check"></div>
        </div>
      `;
    }).join('')}
  `).join('');

  el.querySelectorAll('.picker-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const idx = autonomoExercicios.findIndex(s => s.exId === id);
      if (idx >= 0) autonomoExercicios.splice(idx, 1);
      else autonomoExercicios.push({ exId: id, numSeries: 3, repeticoes: '8-12', descansoSegundos: 60 });
      renderAutonomoMontado();
      renderAutonomoPicker(document.getElementById('autonomo-search')?.value.trim() || '');
    });
  });
}

async function salvarTreinoAutonomo() {
  const nome = document.getElementById('nome-treino-autonomo').value.trim() || 'Meu Treino';
  if (!autonomoExercicios.length) { showToast('⚠️ Adicione ao menos um exercício'); return; }

  const treinoData = {
    nome,
    exercicios: autonomoExercicios.map(s => {
      const ex = getExercicioPorId(s.exId);
      return { id: ex.id, nome: ex.nome, gif: ex.gif, musculos: ex.musculos,
               numSeries: s.numSeries, repeticoes: s.repeticoes,
               descansoSegundos: s.descansoSegundos,
               series: `${s.numSeries}x${s.repeticoes}` };
    }),
    dataInicio: null, dataFim: null
  };

  try {
    TREINOS[autonomoTreinoId] = treinoData;
    await updateDoc(doc(db, 'users', currentUser.uid), { treinos: TREINOS });
    userData.treinos = { ...TREINOS };
    document.getElementById('modal-builder-autonomo')?.remove();
    showToast('✅ Treino salvo!');
    renderPage('home');
  } catch (e) {
    showToast('❌ Erro: ' + e.message);
  }
}
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── EXPÕE para login.js ─────────────────────────────────────
window.__appReady = true;
