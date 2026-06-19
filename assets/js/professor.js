// ============================================================
//  professor.js — Painel do professor
// ============================================================
import { BIBLIOTECA_EXERCICIOS, GRUPOS_MUSCULARES, getExerciciosPorGrupo, getExercicioPorId }
  from './exercicios-db.js';
import {
  auth, db,
  signOut, onAuthStateChanged,
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where,
  createAlunoSemDeslogar
} from './firebase.js';

let currentUser = null;
let alunos = [];
let alunoAtual = null;     // aluno sendo editado
let letraAtual = null;     // treino sendo montado (A/B/C/D)
let exerciciosSelecionados = []; // [{ exId, series }]
let grupoFiltro = GRUPOS_MUSCULARES[0];

const loginScreen  = document.getElementById('login-screen');
const appShell      = document.getElementById('app-shell');
const appMain        = document.getElementById('app-main');
const headerAvatar  = document.getElementById('header-avatar');
const navDropdown    = document.getElementById('nav-dropdown');
const btnMenu        = document.getElementById('btn-menu');
const fabAdd          = document.getElementById('fab-add-aluno');
const toast            = document.getElementById('toast');

// ── AUTH GUARD ────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = '/login.html'; return; }

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || snap.data().role !== 'professor') {
    window.location.href = '/index.html';
    return;
  }

  if (snap.data().status === 'pendente') {
    await signOut(auth);
    window.location.href = '/login.html';
    return;
  }

  currentUser = user;
  showApp();
  await loadAlunos();
  renderAlunosList();
});

function showApp() {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  const initials = (currentUser.displayName || currentUser.email).split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('');
  headerAvatar.textContent = initials;
}

btnMenu.addEventListener('click', e => { e.stopPropagation(); navDropdown.classList.toggle('open'); });
document.addEventListener('click', e => {
  if (!navDropdown.contains(e.target) && e.target !== btnMenu) navDropdown.classList.remove('open');
});
document.getElementById('btn-logout-menu').addEventListener('click', () => signOut(auth));

// ── CARREGA ALUNOS DO PROFESSOR ──────────────────────────
async function loadAlunos() {
  const q = query(collection(db, 'users'), where('professorId', '==', currentUser.uid));
  const snap = await getDocs(q);
  alunos = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// ── LISTA DE ALUNOS ───────────────────────────────────────
function renderAlunosList() {
  appMain.innerHTML = `
    <div class="alunos-header">
      <h1>Meus Alunos</h1>
      <p>${alunos.length} aluno${alunos.length !== 1 ? 's' : ''} cadastrado${alunos.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="aluno-search">
      <input type="text" id="busca-aluno" placeholder="🔍 Buscar aluno...">
    </div>
    <div class="alunos-list" id="alunos-list">
      ${alunos.length ? alunos.map(alunoCardHtml).join('') : emptyStateHtml()}
    </div>
  `;

  document.getElementById('busca-aluno').addEventListener('input', e => {
    const termo = e.target.value.toLowerCase();
    const filtrados = alunos.filter(a => a.name.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo));
    document.getElementById('alunos-list').innerHTML = filtrados.length ? filtrados.map(alunoCardHtml).join('') : emptyStateHtml();
    bindAlunoCards();
  });

  bindAlunoCards();
}

function alunoCardHtml(a) {
  const initials = a.name.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('');
  const treinosCount = a.treinos ? Object.keys(a.treinos).length : 0;
  return `
    <div class="aluno-card" data-uid="${a.uid}">
      <div class="aluno-avatar">${initials}</div>
      <div class="aluno-info">
        <div class="aluno-nome">${a.name}</div>
        <div class="aluno-email">${a.email}</div>
        <div class="aluno-meta">${treinosCount}/4 treinos montados</div>
      </div>
      <span class="aluno-chevron">›</span>
    </div>
  `;
}

function emptyStateHtml() {
  return `
    <div class="empty-state">
      <div class="icon">🏋️</div>
      <p>Nenhum aluno ainda.<br>Toque no botão "+" para cadastrar o primeiro.</p>
    </div>
  `;
}

function bindAlunoCards() {
  document.querySelectorAll('.aluno-card').forEach(card => {
    card.addEventListener('click', () => {
      const uid = card.dataset.uid;
      alunoAtual = alunos.find(a => a.uid === uid);
      renderAlunoDetail();
    });
  });
}

// ── DETALHE DO ALUNO (treinos A/B/C/D) ───────────────────
function renderAlunoDetail() {
  const a = alunoAtual;
  const letras = ['A', 'B', 'C', 'D'];

  appMain.innerHTML = `
    <div class="aluno-detail-header">
      <button class="btn-back" id="btn-back-detail">‹</button>
      <div>
        <div class="page-title" style="font-size:22px">${a.name}</div>
        <div class="page-badge">${a.email}</div>
      </div>
    </div>

    <p class="section-title">TREINOS</p>
    <div class="treino-edit-cards">
      ${letras.map(l => {
        const t = a.treinos?.[l];
        const count = t?.exercicios?.length || 0;
        return `
          <div class="treino-edit-card ${count ? 'filled' : ''}" data-letra="${l}">
            <div class="treino-edit-letra">${l}</div>
            <div class="treino-edit-count ${count ? 'has-exercicios' : ''}">
              ${count ? `${t.nome || ''} · ${count} exerc.` : 'Vazio · tocar para montar'}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <p class="section-title">AÇÕES</p>
    <div style="padding:0 16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn-secondary" id="btn-reset-senha">🔑 Redefinir senha do aluno</button>
      <button class="btn-secondary" id="btn-remover-aluno" style="color:#f87171">🗑️ Remover aluno</button>
    </div>
  `;

  document.getElementById('btn-back-detail').addEventListener('click', () => {
    alunoAtual = null;
    renderAlunosList();
  });

  document.querySelectorAll('.treino-edit-card').forEach(card => {
    card.addEventListener('click', () => abrirBuilderTreino(card.dataset.letra));
  });

  document.getElementById('btn-reset-senha').addEventListener('click', resetarSenhaAluno);
  document.getElementById('btn-remover-aluno').addEventListener('click', removerAluno);
}

async function resetarSenhaAluno() {
  const novaSenha = prompt(`Nova senha para ${alunoAtual.name} (mínimo 6 caracteres):`);
  if (!novaSenha || novaSenha.length < 6) {
    if (novaSenha !== null) showToast('⚠️ Senha deve ter ao menos 6 caracteres');
    return;
  }
  showToast('⚠️ Para redefinir senha é necessário usar o Firebase Console (Authentication → Users) por segurança.');
}

async function removerAluno() {
  if (!confirm(`Remover ${alunoAtual.name}? Isso vai apagar os dados do treino dele (a conta de login precisa ser removida manualmente no Firebase Console).`)) return;
  try {
    await deleteDoc(doc(db, 'users', alunoAtual.uid));
    showToast('✅ Aluno removido');
    alunos = alunos.filter(a => a.uid !== alunoAtual.uid);
    alunoAtual = null;
    renderAlunosList();
  } catch (e) {
    showToast('❌ Erro ao remover: ' + e.message);
  }
}

// ── BUILDER DE TREINO (modal) ─────────────────────────────
function abrirBuilderTreino(letra) {
  letraAtual = letra;
  const treinoExistente = alunoAtual.treinos?.[letra];
  exerciciosSelecionados = treinoExistente?.exercicios?.map(e => ({ exId: e.id, series: e.series })) || [];
  grupoFiltro = GRUPOS_MUSCULARES[0];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-builder';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Montar Treino ${letra}</div>

      <div class="form-stack" style="margin-bottom:16px">
        <input type="text" id="nome-treino" placeholder="Nome do treino (ex: Peito e Tríceps)"
               value="${treinoExistente?.nome || ''}"
               style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-family:inherit">
      </div>

      <div class="treino-montado-list" id="treino-montado-list"></div>

      <p class="section-title" style="padding:0 0 8px">ADICIONAR EXERCÍCIO</p>
      <div class="exercicio-picker-tabs" id="picker-tabs">
        ${GRUPOS_MUSCULARES.map(g => `<div class="picker-tab ${g===grupoFiltro?'active':''}" data-grupo="${g}">${g}</div>`).join('')}
      </div>
      <div class="picker-list" id="picker-list"></div>

      <button class="btn-primary" id="btn-salvar-treino" style="width:100%">Salvar Treino</button>
    </div>
  `;
  document.body.appendChild(overlay);

  renderTreinoMontado();
  renderPickerList();

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.querySelectorAll('#picker-tabs .picker-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      grupoFiltro = tab.dataset.grupo;
      document.querySelectorAll('#picker-tabs .picker-tab').forEach(t => t.classList.toggle('active', t.dataset.grupo === grupoFiltro));
      renderPickerList();
    });
  });

  document.getElementById('btn-salvar-treino').addEventListener('click', salvarTreino);
}

function renderTreinoMontado() {
  const el = document.getElementById('treino-montado-list');
  if (!exerciciosSelecionados.length) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:12px 0">Nenhum exercício adicionado ainda.</p>`;
    return;
  }
  el.innerHTML = exerciciosSelecionados.map((sel, idx) => {
    const ex = getExercicioPorId(sel.exId);
    return `
      <div class="treino-montado-item">
        <img class="treino-montado-thumb" src="${ex.gif}" loading="lazy">
        <div class="treino-montado-nome">${ex.nome}</div>
        <input class="treino-montado-series" type="text" value="${sel.series}" data-idx="${idx}" placeholder="3x12">
        <button class="btn-remove-ex" data-idx="${idx}">✕</button>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.treino-montado-series').forEach(inp => {
    inp.addEventListener('input', () => {
      exerciciosSelecionados[inp.dataset.idx].series = inp.value;
    });
  });
  el.querySelectorAll('.btn-remove-ex').forEach(btn => {
    btn.addEventListener('click', () => {
      exerciciosSelecionados.splice(parseInt(btn.dataset.idx), 1);
      renderTreinoMontado();
      renderPickerList();
    });
  });
}

function renderPickerList() {
  const el = document.getElementById('picker-list');
  const lista = getExerciciosPorGrupo(grupoFiltro);
  el.innerHTML = lista.map(ex => {
    const selecionado = exerciciosSelecionados.some(s => s.exId === ex.id);
    return `
      <div class="picker-item ${selecionado ? 'selected' : ''}" data-id="${ex.id}">
        <img class="picker-thumb" src="${ex.gif}" loading="lazy">
        <div class="picker-nome">${ex.nome}</div>
        <div class="picker-check"></div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.picker-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const idx = exerciciosSelecionados.findIndex(s => s.exId === id);
      if (idx >= 0) {
        exerciciosSelecionados.splice(idx, 1);
      } else {
        exerciciosSelecionados.push({ exId: id, series: '3x12' });
      }
      renderTreinoMontado();
      renderPickerList();
    });
  });
}

async function salvarTreino() {
  const nome = document.getElementById('nome-treino').value.trim() || `Treino ${letraAtual}`;
  if (!exerciciosSelecionados.length) {
    showToast('⚠️ Adicione ao menos um exercício');
    return;
  }

  const treinoData = {
    nome,
    exercicios: exerciciosSelecionados.map(s => {
      const ex = getExercicioPorId(s.exId);
      return { id: ex.id, nome: ex.nome, series: s.series, gif: ex.gif, musculos: ex.musculos };
    })
  };

  try {
    const userRef = doc(db, 'users', alunoAtual.uid);
    const treinosAtuais = alunoAtual.treinos || {};
    treinosAtuais[letraAtual] = treinoData;
    await updateDoc(userRef, { treinos: treinosAtuais });

    alunoAtual.treinos = treinosAtuais;
    const alunoIdx = alunos.findIndex(a => a.uid === alunoAtual.uid);
    if (alunoIdx >= 0) alunos[alunoIdx] = alunoAtual;

    document.getElementById('modal-builder').remove();
    showToast('✅ Treino salvo com sucesso!');
    renderAlunoDetail();
  } catch (e) {
    showToast('❌ Erro ao salvar: ' + e.message);
  }
}

// ── MODAL NOVO ALUNO ───────────────────────────────────────
fabAdd.addEventListener('click', abrirModalNovoAluno);

function abrirModalNovoAluno() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-novo-aluno';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Novo Aluno</div>
      <div class="login-error" id="erro-novo-aluno"></div>
      <div class="form-stack">
        <div class="field-group">
          <label>Nome completo</label>
          <input type="text" id="novo-aluno-nome" placeholder="Ex: João Silva">
        </div>
        <div class="field-group">
          <label>E-mail</label>
          <input type="email" id="novo-aluno-email" placeholder="joao@email.com">
        </div>
        <div class="field-group">
          <label>Senha provisória</label>
          <input type="text" id="novo-aluno-senha" placeholder="Mínimo 6 caracteres" value="${gerarSenhaAleatoria()}">
        </div>
        <button class="btn-primary" id="btn-criar-aluno">Cadastrar aluno</button>
      </div>
      <div id="credenciais-resultado"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('btn-criar-aluno').addEventListener('click', criarAluno);
}

function gerarSenhaAleatoria() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function criarAluno() {
  const nome  = document.getElementById('novo-aluno-nome').value.trim();
  const email = document.getElementById('novo-aluno-email').value.trim();
  const senha = document.getElementById('novo-aluno-senha').value;
  const errEl = document.getElementById('erro-novo-aluno');
  const btn   = document.getElementById('btn-criar-aluno');

  errEl.classList.remove('show');

  if (!nome || !email || !senha) { errEl.textContent = 'Preencha todos os campos.'; errEl.classList.add('show'); return; }
  if (senha.length < 6) { errEl.textContent = 'Senha deve ter ao menos 6 caracteres.'; errEl.classList.add('show'); return; }

  btn.disabled = true;
  btn.textContent = 'Criando...';

  try {
    const uid = await createAlunoSemDeslogar(email, senha);

    await setDoc(doc(db, 'users', uid), {
      uid, name: nome, email,
      role: 'aluno',
      professorId: currentUser.uid,
      treinos: {},
      createdAt: new Date().toISOString()
    });

    const novoAluno = { uid, name: nome, email, role: 'aluno', professorId: currentUser.uid, treinos: {} };
    alunos.push(novoAluno);

    document.getElementById('credenciais-resultado').innerHTML = `
      <div class="credential-box">
        <div class="label">✅ Aluno criado! Envie estas credenciais:</div>
        <div class="credential-row"><strong>E-mail</strong><span>${email}</span></div>
        <div class="credential-row"><strong>Senha</strong><span>${senha}</span></div>
      </div>
      <button class="btn-secondary" id="btn-fechar-novo-aluno" style="margin-top:14px">Concluir</button>
    `;
    btn.style.display = 'none';

    document.getElementById('btn-fechar-novo-aluno').addEventListener('click', () => {
      document.getElementById('modal-novo-aluno').remove();
      renderAlunosList();
    });
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Cadastrar aluno';
    const map = {
      'auth/email-already-in-use': 'Esse e-mail já está cadastrado.',
      'auth/invalid-email':        'E-mail inválido.',
      'auth/weak-password':        'Senha muito fraca.',
    };
    errEl.textContent = map[e.code] || ('Erro: ' + e.message);
    errEl.classList.add('show');
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
