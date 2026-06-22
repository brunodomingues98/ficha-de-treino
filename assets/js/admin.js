// ============================================================
//  admin.js — Painel do Super Admin
//  Gerencia aprovação, ativação e visão geral dos professores
// ============================================================
import {
  auth, db,
  signOut, onAuthStateChanged,
  doc, getDoc, updateDoc,
  collection, getDocs, query, where
} from './firebase.js';

let currentUser = null;
let professores = [];

const loginScreen = document.getElementById('login-screen');
const appShell     = document.getElementById('app-shell');
const appMain       = document.getElementById('app-main');
const headerAvatar = document.getElementById('header-avatar');
const navDropdown   = document.getElementById('nav-dropdown');
const btnMenu       = document.getElementById('btn-menu');
const toast           = document.getElementById('toast');

// ── AUTH GUARD ────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = '/login.html'; return; }

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || snap.data().role !== 'admin') {
    // não é admin → manda pro app de aluno (que por sua vez
    // redireciona pro painel certo se for professor)
    window.location.href = '/index.html';
    return;
  }

  currentUser = user;
  showApp();
  await loadProfessores();
  renderDashboard();
});

function showApp() {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  headerAvatar.textContent = 'A';
}

btnMenu.addEventListener('click', e => { e.stopPropagation(); navDropdown.classList.toggle('open'); });
document.addEventListener('click', e => {
  if (!navDropdown.contains(e.target) && e.target !== btnMenu) navDropdown.classList.remove('open');
});
document.getElementById('btn-logout-menu').addEventListener('click', () => signOut(auth));

// ── CARREGA TODOS OS PROFESSORES + CONTAGEM DE ALUNOS ────
async function loadProfessores() {
  const q = query(collection(db, 'users'), where('role', '==', 'professor'));
  const snap = await getDocs(q);
  professores = snap.docs.map(d => ({ uid: d.id, ...d.data() }));

  // busca contagem de alunos de cada professor em paralelo
  await Promise.all(professores.map(async p => {
    const alunosQ = query(collection(db, 'users'), where('professorId', '==', p.uid));
    const alunosSnap = await getDocs(alunosQ);
    p.totalAlunos = alunosSnap.size;
  }));

  // ordena: pendentes primeiro, depois por data de cadastro (mais recente primeiro)
  professores.sort((a, b) => {
    if (a.status === 'pendente' && b.status !== 'pendente') return -1;
    if (b.status === 'pendente' && a.status !== 'pendente') return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

// ── DASHBOARD ──────────────────────────────────────────────
function renderDashboard() {
  const pendentes = professores.filter(p => p.status === 'pendente').length;
  const aprovados = professores.filter(p => p.status === 'aprovado').length;
  const inativos  = professores.filter(p => p.status === 'inativo').length;
  const totalAlunos = professores.reduce((acc, p) => acc + (p.totalAlunos || 0), 0);

  appMain.innerHTML = `
    <div class="alunos-header">
      <h1>Painel do Sistema</h1>
      <p>Visão geral de professores e alunos</p>
    </div>

    <div class="profile-stats" style="padding:0 16px;margin-bottom:16px">
      <div class="stat-card">
        <div class="stat-value">${professores.length}</div>
        <div class="stat-label">Professores</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalAlunos}</div>
        <div class="stat-label">Alunos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:${pendentes ? '#f87171' : 'var(--gold)'}">${pendentes}</div>
        <div class="stat-label">Pendentes</div>
      </div>
    </div>

    <div class="aluno-search">
      <input type="text" id="busca-professor" placeholder="🔍 Buscar professor...">
    </div>

    <p class="section-title">PROFESSORES (${professores.length})</p>
    <div class="alunos-list" id="professores-list">
      ${professores.length ? professores.map(professorCardHtml).join('') : emptyStateHtml()}
    </div>
  `;

  document.getElementById('busca-professor').addEventListener('input', e => {
    const termo = e.target.value.toLowerCase();
    const filtrados = professores.filter(p => p.name?.toLowerCase().includes(termo) || p.email?.toLowerCase().includes(termo));
    document.getElementById('professores-list').innerHTML = filtrados.length ? filtrados.map(professorCardHtml).join('') : emptyStateHtml();
    bindProfessorCards();
  });

  bindProfessorCards();
}

function statusBadge(status) {
  const map = {
    pendente: { label: '⏳ Pendente', color: '#f59e0b' },
    aprovado: { label: '✅ Ativo',    color: '#34d399' },
    inativo:  { label: '⛔ Inativo',  color: '#f87171' },
  };
  const s = map[status] || map.pendente;
  return `<span style="font-size:10px;font-weight:700;color:${s.color}">${s.label}</span>`;
}

function professorCardHtml(p) {
  const initials = (p.name || p.email || '?').split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('');
  const dataCadastro = p.createdAt ? formatarDataBR(p.createdAt.split('T')[0]) : '—';
  return `
    <div class="aluno-card" data-uid="${p.uid}" style="align-items:flex-start">
      <div class="aluno-avatar">${initials}</div>
      <div class="aluno-info">
        <div class="aluno-nome">${p.name || '(sem nome)'}</div>
        <div class="aluno-email">${p.email}</div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:4px;flex-wrap:wrap">
          ${statusBadge(p.status)}
          <span style="font-size:11px;color:var(--text-muted)">👥 ${p.totalAlunos || 0} aluno${p.totalAlunos === 1 ? '' : 's'}</span>
          <span style="font-size:11px;color:var(--text-muted)">📅 ${dataCadastro}</span>
        </div>
      </div>
      <span class="aluno-chevron">›</span>
    </div>
  `;
}

function emptyStateHtml() {
  return `
    <div class="empty-state">
      <div class="icon">👨‍🏫</div>
      <p>Nenhum professor cadastrado ainda.</p>
    </div>
  `;
}

function formatarDataBR(isoDate) {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

function bindProfessorCards() {
  document.querySelectorAll('.aluno-card').forEach(card => {
    card.addEventListener('click', () => {
      const uid = card.dataset.uid;
      const professor = professores.find(p => p.uid === uid);
      abrirDetalheProfessor(professor);
    });
  });
}

// ── DETALHE / AÇÕES DO PROFESSOR (modal) ─────────────────
function abrirDetalheProfessor(p) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-professor';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">${p.name || '(sem nome)'}</div>

      <div style="margin-bottom:16px">
        <div class="credential-row"><strong>E-mail</strong><span>${p.email}</span></div>
        <div class="credential-row"><strong>Status</strong>${statusBadge(p.status)}</div>
        <div class="credential-row"><strong>Alunos</strong><span>${p.totalAlunos || 0}</span></div>
        <div class="credential-row"><strong>Cadastrado em</strong><span>${p.createdAt ? formatarDataBR(p.createdAt.split('T')[0]) : '—'}</span></div>
      </div>

      <div class="form-stack">
        ${p.status === 'pendente' ? `
          <button class="btn-primary" id="btn-aprovar">✅ Aprovar professor</button>
        ` : ''}
        ${p.status === 'aprovado' ? `
          <button class="btn-secondary" id="btn-inativar" style="color:#f87171">⛔ Inativar professor</button>
        ` : ''}
        ${p.status === 'inativo' ? `
          <button class="btn-primary" id="btn-reativar">✅ Reativar professor</button>
        ` : ''}
      </div>

      ${p.status !== 'pendente' ? `
        <p style="font-size:11px;color:var(--text-muted);margin-top:12px;line-height:1.5">
          ${p.status === 'aprovado'
            ? 'Inativar bloqueia o login do professor e de todos os seus alunos imediatamente.'
            : 'Reativar libera o login do professor e de todos os seus alunos novamente.'}
        </p>
      ` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('btn-aprovar')?.addEventListener('click', () => alterarStatusProfessor(p, 'aprovado'));
  document.getElementById('btn-inativar')?.addEventListener('click', () => alterarStatusProfessor(p, 'inativo'));
  document.getElementById('btn-reativar')?.addEventListener('click', () => alterarStatusProfessor(p, 'aprovado'));
}

async function alterarStatusProfessor(p, novoStatus) {
  try {
    await updateDoc(doc(db, 'users', p.uid), { status: novoStatus });
    p.status = novoStatus;
    const idx = professores.findIndex(x => x.uid === p.uid);
    if (idx >= 0) professores[idx] = p;

    document.getElementById('modal-professor').remove();
    const msgs = {
      aprovado: '✅ Professor aprovado/reativado!',
      inativo:  '⛔ Professor inativado.',
    };
    showToast(msgs[novoStatus] || '✅ Status atualizado');
    renderDashboard();
  } catch (e) {
    showToast('❌ Erro ao atualizar: ' + e.message);
  }
}

// ── TOAST ───────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
