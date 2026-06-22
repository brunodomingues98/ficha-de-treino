// ============================================================
//  app.js — SPA: roteamento, renderização, interações
// ============================================================
import {
  auth, db, googleProvider,
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile,
  doc, setDoc, getDoc, updateDoc
} from './firebase.js';

// ── ESTADO ─────────────────────────────────────────────────
let currentUser  = null;
let userData     = null;  // documento do Firestore (inclui role, treinos)
let TREINOS      = {};    // treinos do aluno, vindos do Firestore
let currentPage  = 'home';
let currentTreino = null;
let seriesState  = {};
let timers       = {};
let restCounters = {};
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

    if (userData.role === 'professor') {
      window.location.href = '/professor.html';
      return false;
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
  return new Date().toISOString().split('T')[0];
}

async function marcarTreinoConcluidoHoje() {
  const chave = getChaveHoje();
  try {
    const ref = doc(db, 'users', currentUser.uid);
    const historico = { ...(userData.historico || {}), [chave]: true };
    await updateDoc(ref, { historico });
    userData.historico = historico;
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
    const dataISO = dia.toISOString().split('T')[0];
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
    case 'treino':
      if (currentTreino !== params.letra) treinoSessaoAtiva = false;
      wrap.innerHTML = renderTreinoPage(params.letra);
      currentTreino = params.letra;
      break;
    case 'nutricao':  wrap.innerHTML = renderNutricao(); break;
    case 'perfil':
      treinoSessaoAtiva = false;
      wrap.innerHTML = renderPerfil();
      break;
    default:          wrap.innerHTML = renderHome();
  }

  appMain.appendChild(wrap);
  bindEvents(page, params);
}

// ── HOME ────────────────────────────────────────────────────
function renderHome() {
  const nome = userData?.name?.split(' ')[0]
             || currentUser?.email?.split('@')[0]
             || 'Atleta';

  const letras = Object.keys(TREINOS);

  const hoje = new Date().toISOString().split('T')[0];

  const cards = letras.length ? letras.map(letra => {
    const t = TREINOS[letra];
    const vencido = t.dataFim && t.dataFim < hoje;
    return `
      <div class="treino-card" data-treino="${letra}">
        <div class="treino-card-icon">${vencido ? '⏳' : '💪'}</div>
        <div class="treino-card-letra">${letra}</div>
        <div class="treino-card-nome">${t.nome || ''}</div>
        ${vencido ? `<div class="treino-card-dia" style="color:#f87171">Vencido</div>` : ''}
      </div>
    `;
  }).join('') : `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="icon">📋</div>
      <p>Seu professor ainda não montou nenhum treino.<br>Volte em breve!</p>
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
  `;
}

// ── TREINO ──────────────────────────────────────────────────
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

function renderTreinoPage(letra) {
  if (!letra || !TREINOS[letra]) return renderHome();
  const t = TREINOS[letra];

  // ── Checagem de vigência ──────────────────────────────
  const hoje = new Date().toISOString().split('T')[0];
  if (t.dataFim && t.dataFim < hoje) {
    return renderTreinoVencido(letra, t);
  }

  const exercicios = t.exercicios.map(ex => {
    const series = ex.series.match(/(\d+)\s*x/)?.[1] || 3;
    const dots = Array.from({length: parseInt(series)}, (_, i) => `
      <button class="serie-dot" data-ex="${ex.id}" data-idx="${i}">
        ${i + 1}
      </button>
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
            <div class="exercicio-series">${ex.series}</div>
            <div class="exercicio-musculos">${ex.musculos.join(', ')}</div>
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

          <div class="series-tracker">
            <div class="series-tracker-label">Marcar séries concluídas</div>
            <div class="series-dots" id="dots-${ex.id}">
              ${dots}
              <span class="rest-timer hidden" id="timer-${ex.id}">⏱ 60s</span>
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
        <div class="page-badge">Treino ${letra} · ${t.exercicios.length} exercícios</div>
      </div>
    </div>

    <div style="padding:0 16px 16px">
      <button class="btn-treino-toggle ${treinoSessaoAtiva ? 'ativo' : ''}" id="btn-toggle-treino">
        ${treinoSessaoAtiva ? '⏹ Finalizar Treino' : '▶ Iniciar Treino'}
      </button>
    </div>

    <div class="exercicios-list">${exercicios}</div>
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
  if (!suplementos.length) {
    return `<div class="empty-state"><div class="icon">💊</div><p>Seu professor ainda não cadastrou suplementos.</p></div>`;
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
  if (!refeicoes.length) {
    return `<div class="empty-state"><div class="icon">🥗</div><p>Seu professor ainda não cadastrou a dieta.</p></div>`;
  }
  return refeicoes.map(m => `
    <div class="meal-card">
      <div class="meal-time">${m.horario}</div>
      <div class="meal-info">
        <div class="meal-nome">${m.ref}</div>
        ${(m.opcoes || []).map(o => `<div class="meal-opcao">${o}</div>`).join('')}
      </div>
    </div>
  `).join('');
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

      <button class="btn-logout" id="btn-logout-profile">Sair da conta</button>
    </div>
  `;
}

// ── BINDINGS POR PÁGINA ─────────────────────────────────────
function bindEvents(page, params) {
  switch (page) {
    case 'home':    bindHome();            break;
    case 'treino':  bindTreino(params.letra); break;
    case 'nutricao':bindNutricao();        break;
    case 'perfil':  bindPerfil();          break;
  }
}

function bindHome() {
  document.querySelectorAll('.treino-card').forEach(card => {
    card.addEventListener('click', () => {
      const letra = card.dataset.treino;
      setActiveNav('treinos');
      renderPage('treino', { letra });
    });
  });
}

function bindTreino(letra) {
  // botão voltar
  document.getElementById('btn-back')?.addEventListener('click', () => {
    setActiveNav('home');
    renderPage('home');
  });

  // botão iniciar/finalizar treino
  document.getElementById('btn-toggle-treino')?.addEventListener('click', async () => {
    if (!treinoSessaoAtiva) {
      treinoSessaoAtiva = true;
      showToast('▶ Treino iniciado! Bom treino 💪');
      renderPage('treino', { letra });
    } else {
      treinoSessaoAtiva = false;
      await marcarTreinoConcluidoHoje();
      showToast('✅ Treino finalizado e registrado!');
      navigator.vibrate?.(200);
      renderPage('treino', { letra });
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

  // séries (pontos)
  document.querySelectorAll('.serie-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const exId = dot.dataset.ex;
      const idx  = parseInt(dot.dataset.idx);
      dot.classList.toggle('done');

      const allDots = document.querySelectorAll(`.serie-dot[data-ex="${exId}"]`);
      const done    = [...allDots].filter(d => d.classList.contains('done')).length;

      if (dot.classList.contains('done') && done < allDots.length) {
        startRestTimer(exId);
      } else if (done === allDots.length) {
        clearRestTimer(exId);
        showToast(`✅ ${TREINOS[letra]?.exercicios.find(e => e.id === exId)?.nome} concluído!`);
        // vibrar se disponível
        navigator.vibrate?.(200);
      }
    });
  });
}

function startRestTimer(exId) {
  clearRestTimer(exId);
  const el = document.getElementById(`timer-${exId}`);
  if (!el) return;
  el.classList.remove('hidden');
  restCounters[exId] = 60;
  el.textContent = `⏱ 60s`;

  timers[exId] = setInterval(() => {
    restCounters[exId]--;
    if (restCounters[exId] <= 0) {
      clearRestTimer(exId);
      el.classList.add('hidden');
      navigator.vibrate?.(300);
      showToast('🔔 Descanso encerrado! Próxima série.');
    } else {
      el.textContent = `⏱ ${restCounters[exId]}s`;
    }
  }, 1000);
}

function clearRestTimer(exId) {
  if (timers[exId]) { clearInterval(timers[exId]); delete timers[exId]; }
  const el = document.getElementById(`timer-${exId}`);
  if (el) el.classList.add('hidden');
}

function bindNutricao() {
  document.querySelectorAll('.nutri-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const active = tab.dataset.tab;
      document.querySelectorAll('.nutri-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === active));
      document.getElementById('nutri-body').innerHTML =
        active === 'suplemenacao' ? renderSupl() : renderDieta();
    });
  });
}

function bindPerfil() {
  document.getElementById('btn-logout-profile')?.addEventListener('click', doLogout);
}

// ── TOAST ───────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── EXPÕE para login.js ─────────────────────────────────────
window.__appReady = true;
