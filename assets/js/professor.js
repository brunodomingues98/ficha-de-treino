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

// ── HELPERS DE DATA ───────────────────────────────────────
function hojeISO() {
  return new Date().toISOString().split('T')[0];
}
function formatarDataBR(isoDate) {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

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

  if (snap.data().status === 'pendente' || snap.data().status === 'inativo') {
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

// ── DETALHE DO ALUNO (treinos dinâmicos) ─────────────────
function renderAlunoDetail() {
  const a = alunoAtual;
  const treinos = a.treinos || {};
  const ids = Object.keys(treinos);

  const treinoCards = ids.map(id => {
    const t = treinos[id];
    const count = t?.exercicios?.length || 0;
    const vigencia = t?.dataInicio && t?.dataFim
      ? `${formatarDataBR(t.dataInicio)} – ${formatarDataBR(t.dataFim)}`
      : '';
    const vencido = t?.dataFim && t.dataFim < hojeISO();
    return `
      <div class="treino-edit-card filled" style="position:relative">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div style="flex:1;cursor:pointer" data-edit-treino="${id}">
            <div class="treino-edit-letra" style="font-size:18px;letter-spacing:.02em">${t.nome || 'Sem nome'}</div>
            <div class="treino-edit-count has-exercicios">${count} exercício${count !== 1 ? 's' : ''}</div>
            ${vigencia ? `<div style="font-size:10px;color:${vencido ? '#f87171' : 'var(--text-muted)'};margin-top:3px">
              ${vencido ? '⚠️ Vencido · ' : ''}${vigencia}
            </div>` : ''}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="btn-edit-treino" data-edit-treino="${id}" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;color:var(--gold);font-size:12px;font-weight:700">✏️</button>
            <button class="btn-del-treino" data-del-treino="${id}" style="background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.25);border-radius:8px;padding:6px 10px;color:#f87171;font-size:12px;font-weight:700">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  appMain.innerHTML = `
    <div class="aluno-detail-header">
      <button class="btn-back" id="btn-back-detail">‹</button>
      <div>
        <div class="page-title" style="font-size:22px">${a.name}</div>
        <div class="page-badge">${a.email}</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 16px 8px">
      <p class="section-title" style="padding:0;margin:0">TREINOS (${ids.length})</p>
      <button class="btn-secondary" id="btn-novo-treino" style="width:auto;padding:8px 14px;font-size:13px">+ Novo treino</button>
    </div>

    <div class="treino-edit-cards" id="treinos-container">
      ${ids.length ? treinoCards : `
        <div class="empty-state" style="grid-column:1/-1;padding:32px 16px">
          <div class="icon">📋</div>
          <p>Nenhum treino cadastrado ainda.<br>Toque em "Novo treino" para começar.</p>
        </div>
      `}
    </div>

    <p class="section-title">EVOLUÇÃO DO ALUNO</p>
    <div style="padding:0 16px 16px">
      <div class="treino-edit-card filled" id="btn-ver-evolucao" style="cursor:pointer;display:flex;align-items:center;gap:12px">
        <div style="font-size:28px">📈</div>
        <div style="flex:1">
          <div class="aluno-nome" style="font-size:14px">Evolução de Cargas</div>
          <div class="treino-edit-count has-exercicios">
            ${Object.keys(a.cargas || {}).length} exercício${Object.keys(a.cargas || {}).length !== 1 ? 's' : ''} com histórico
          </div>
        </div>
        <span style="color:var(--text-muted)">›</span>
      </div>
    </div>

    <p class="section-title">NUTRIÇÃO</p>
    <div style="padding:0 16px 16px">
      <div class="treino-edit-card ${a.nutricao ? 'filled' : ''}" id="card-nutricao" style="width:100%;text-align:left;display:flex;align-items:center;gap:12px;cursor:pointer">
        <div style="font-size:28px">🥗</div>
        <div style="flex:1">
          <div class="aluno-nome" style="font-size:14px">Plano Nutricional</div>
          <div class="treino-edit-count ${a.nutricao ? 'has-exercicios' : ''}">
            ${a.nutricao ? `${a.nutricao.suplementos?.length || 0} suplementos · ${a.nutricao.refeicoes?.length || 0} refeições` : 'Vazio · tocar para montar'}
          </div>
        </div>
        <span style="color:var(--text-muted)">›</span>
      </div>
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

  document.getElementById('btn-novo-treino').addEventListener('click', () => abrirBuilderTreino(null));
  document.getElementById('btn-ver-evolucao')?.addEventListener('click', abrirTelaEvolucao);
  document.getElementById('card-nutricao').addEventListener('click', abrirBuilderNutricao);
  document.getElementById('btn-reset-senha').addEventListener('click', resetarSenhaAluno);
  document.getElementById('btn-remover-aluno').addEventListener('click', removerAluno);

  // editar treino
  document.querySelectorAll('[data-edit-treino]').forEach(el => {
    el.addEventListener('click', () => abrirBuilderTreino(el.dataset.editTreino));
  });

  // excluir treino
  document.querySelectorAll('.btn-del-treino').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.delTreino;
      const nome = alunoAtual.treinos[id]?.nome || 'este treino';
      if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return;
      try {
        const treinos = { ...alunoAtual.treinos };
        delete treinos[id];
        await updateDoc(doc(db, 'users', alunoAtual.uid), { treinos });
        alunoAtual.treinos = treinos;
        const idx = alunos.findIndex(a => a.uid === alunoAtual.uid);
        if (idx >= 0) alunos[idx] = alunoAtual;
        showToast('✅ Treino excluído');
        renderAlunoDetail();
      } catch (e) {
        showToast('❌ Erro ao excluir: ' + e.message);
      }
    });
  });
}

// ── TELA DE EVOLUÇÃO DE CARGAS ────────────────────────────
function abrirTelaEvolucao() {
  const a = alunoAtual;
  const cargas = a.cargas || {};
  const treinos = a.treinos || {};

  // Coleta todos os exercícios com histórico de carga
  const exerciciosComHist = [];
  const vistos = new Set();
  Object.values(treinos).forEach(t => {
    (t.exercicios || []).forEach(ex => {
      if (!vistos.has(ex.id) && cargas[ex.id]?.length >= 1) {
        vistos.add(ex.id);
        exerciciosComHist.push({ ...ex, hist: cargas[ex.id] });
      }
    });
  });

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-evolucao';
  overlay.innerHTML = `
    <div class="modal-sheet" style="max-height:95vh">
      <div class="modal-handle"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="modal-title" style="margin:0">📈 Evolução de ${a.name}</div>
        <button id="btn-fechar-evolucao" style="color:var(--text-muted);font-size:22px;line-height:1">×</button>
      </div>

      ${!exerciciosComHist.length ? `
        <div class="empty-state">
          <div class="icon">📊</div>
          <p>Nenhum histórico de carga ainda.<br>O aluno precisa registrar cargas durante os treinos.</p>
        </div>
      ` : exerciciosComHist.map(ex => renderMiniGrafico(ex)).join('')}
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('btn-fechar-evolucao').addEventListener('click', () => overlay.remove());
}

function extrairKg(str) {
  // Tenta extrair valor numérico de strings como "20kg", "2x10kg", "20 kg", "20.5", "20,5"
  if (!str) return null;
  const match = str.replace(',', '.').match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function renderMiniGrafico(ex) {
  const hist = ex.hist || [];
  const valores = hist.map(h => ({ data: h.data, val: extrairKg(h.carga), carga: h.carga }))
                      .filter(h => h.val !== null);

  // Se não tiver valores numéricos, mostra só texto
  if (!valores.length) {
    return `
      <div class="grafico-card">
        <div class="grafico-titulo">${ex.nome}</div>
        <div style="color:var(--text-muted);font-size:12px;padding:12px 0">
          ${hist.map(h => `<div>${formatarDataBR(h.data)}: ${h.carga}</div>`).join('')}
        </div>
      </div>
    `;
  }

  const W = 280, H = 80, PAD = 8;
  const minVal = Math.min(...valores.map(v => v.val));
  const maxVal = Math.max(...valores.map(v => v.val));
  const range = maxVal - minVal || 1;
  const n = valores.length;

  // Pontos do gráfico
  const pts = valores.map((v, i) => {
    const x = PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v.val - minVal) / range) * (H - PAD * 2);
    return { x, y, ...v };
  });

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  // Área abaixo da linha
  const areaPoints = `${pts[0].x},${H} ` +
    pts.map(p => `${p.x},${p.y}`).join(' ') +
    ` ${pts[pts.length-1].x},${H}`;

  const ultima = valores[valores.length - 1];
  const primeira = valores[0];
  const evolucaoNum = ultima.val - primeira.val;
  const evolucaoStr = evolucaoNum === 0 ? '→ Estável' :
    evolucaoNum > 0 ? `↑ +${evolucaoNum.toFixed(1)}kg` : `↓ ${evolucaoNum.toFixed(1)}kg`;
  const evolucaoCor = evolucaoNum > 0 ? '#34d399' : evolucaoNum < 0 ? '#f87171' : 'var(--text-muted)';

  // Labels do eixo X (datas, só primeira e última)
  const labelIni = formatarDataBR(pts[0].data);
  const labelFim = formatarDataBR(pts[pts.length-1].data);

  return `
    <div class="grafico-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div class="grafico-titulo">${ex.nome}</div>
        <span style="font-size:12px;font-weight:700;color:${evolucaoCor}">${evolucaoStr}</span>
      </div>

      <div style="position:relative">
        <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-${ex.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f7cf49" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#f7cf49" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <!-- Área -->
          <polygon points="${areaPoints}" fill="url(#grad-${ex.id})"/>

          <!-- Linha -->
          <polyline points="${polyline}"
            fill="none" stroke="#f7cf49" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Pontos -->
          ${pts.map((p, i) => `
            <circle cx="${p.x}" cy="${p.y}" r="3" fill="#f7cf49"/>
            ${i === pts.length - 1 ? `
              <text x="${p.x}" y="${p.y - 7}" text-anchor="middle"
                font-size="9" fill="#fde68a" font-family="Inter,sans-serif">${p.carga}</text>
            ` : ''}
          `).join('')}
        </svg>
      </div>

      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:2px">
        <span>${labelIni}: ${primeira.carga}</span>
        <span>${labelFim}: ${ultima.carga}</span>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:4px">
        ${valores.length} registro${valores.length !== 1 ? 's' : ''}
        · Pico: ${Math.max(...valores.map(v => v.val))}kg
      </div>
    </div>
  `;
}

function renderCargasAluno(a) {
  // mantida para compatibilidade mas não mais usada na UI
  return '';
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
function gerarIdTreino() {
  return 'treino_' + Date.now();
}

function abrirBuilderTreino(id) {
  // id = null → novo treino | id = string → editar existente
  letraAtual = id || gerarIdTreino();
  const treinoExistente = id ? alunoAtual.treinos?.[id] : null;
  exerciciosSelecionados = treinoExistente?.exercicios?.map(e => ({
    exId: e.id,
    numSeries: e.numSeries || 3,
    repeticoes: e.repeticoes || '8-12',
    descansoSegundos: e.descansoSegundos || 60
  })) || [];
  grupoFiltro = GRUPOS_MUSCULARES[0];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-builder';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">${treinoExistente ? 'Editar Treino' : 'Novo Treino'}</div>

      <div class="form-stack" style="margin-bottom:16px">
        <input type="text" id="nome-treino" placeholder="Nome do treino (ex: Peito e Tríceps)"
               value="${treinoExistente?.nome || ''}"
               style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-family:inherit">

        <div class="field-row-2">
          <div class="field-group">
            <label>Início da vigência</label>
            <input type="date" id="treino-data-inicio"
                   value="${treinoExistente?.dataInicio || ''}"
                   style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-family:inherit">
          </div>
          <div class="field-group">
            <label>Fim da vigência</label>
            <input type="date" id="treino-data-fim"
                   value="${treinoExistente?.dataFim || ''}"
                   style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-family:inherit">
          </div>
        </div>
        <p style="font-size:11px;color:var(--text-muted)">
          Após a data de fim, o aluno verá "aguardando renovação" em vez do treino.
        </p>
      </div>

      <div class="treino-montado-list" id="treino-montado-list"></div>

      <p class="section-title" style="padding:0 0 8px">ADICIONAR EXERCÍCIO</p>
      <div style="margin-bottom:10px">
        <input type="text" id="exercicio-search"
          placeholder="🔍 Buscar exercício por nome..."
          style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-size:14px;font-family:inherit">
      </div>
      <div class="picker-list" id="picker-list"></div>

      <button class="btn-primary" id="btn-salvar-treino" style="width:100%">Salvar Treino</button>
    </div>
  `;
  document.body.appendChild(overlay);

  renderTreinoMontado();
  renderPickerSearch('');

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('exercicio-search').addEventListener('input', e => {
    renderPickerSearch(e.target.value.trim());
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
      <div class="treino-montado-item" style="flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <img class="treino-montado-thumb" src="${ex.gif}" loading="lazy">
          <div class="treino-montado-nome" style="flex:1">${ex.nome}</div>
          <button class="btn-remove-ex" data-idx="${idx}">✕</button>
        </div>
        <div class="exercicio-params-row">
          <div class="exercicio-param">
            <label>Séries</label>
            <input type="number" class="param-series" data-idx="${idx}" value="${sel.numSeries}" min="1" max="10">
          </div>
          <div class="exercicio-param">
            <label>Repetições</label>
            <input type="text" class="param-reps" data-idx="${idx}" value="${sel.repeticoes}" placeholder="8-12">
          </div>
          <div class="exercicio-param">
            <label>Descanso</label>
            <select class="param-descanso" data-idx="${idx}">
              ${[15,20,30,45,60,75,90,120,150,180].map(s => `
                <option value="${s}" ${sel.descansoSegundos === s ? 'selected' : ''}>${s}s</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.param-series').forEach(inp => {
    inp.addEventListener('input', () => {
      exerciciosSelecionados[inp.dataset.idx].numSeries = parseInt(inp.value) || 1;
    });
  });
  el.querySelectorAll('.param-reps').forEach(inp => {
    inp.addEventListener('input', () => {
      exerciciosSelecionados[inp.dataset.idx].repeticoes = inp.value;
    });
  });
  el.querySelectorAll('.param-descanso').forEach(sel => {
    sel.addEventListener('change', () => {
      exerciciosSelecionados[sel.dataset.idx].descansoSegundos = parseInt(sel.value);
    });
  });
  el.querySelectorAll('.btn-remove-ex').forEach(btn => {
    btn.addEventListener('click', () => {
      exerciciosSelecionados.splice(parseInt(btn.dataset.idx), 1);
      renderTreinoMontado();
      const searchEl = document.getElementById('exercicio-search');
      renderPickerSearch(searchEl?.value.trim() || '');
    });
  });
}

function renderPickerSearch(termo) {
  const el = document.getElementById('picker-list');
  if (!el) return;

  // Filtra: sem termo → mostra todos; com termo → busca por nome ou grupo
  const lista = termo.length < 1
    ? BIBLIOTECA_EXERCICIOS
    : BIBLIOTECA_EXERCICIOS.filter(ex =>
        ex.nome.toLowerCase().includes(termo.toLowerCase()) ||
        ex.grupo.toLowerCase().includes(termo.toLowerCase())
      );

  if (!lista.length) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px 0">Nenhum exercício encontrado para "${termo}"</p>`;
    return;
  }

  // Agrupa resultados por grupo muscular para facilitar a leitura
  const porGrupo = {};
  lista.forEach(ex => {
    if (!porGrupo[ex.grupo]) porGrupo[ex.grupo] = [];
    porGrupo[ex.grupo].push(ex);
  });

  el.innerHTML = Object.entries(porGrupo).map(([grupo, exercicios]) => `
    <div class="picker-grupo-label">${grupo}</div>
    ${exercicios.map(ex => {
      const selecionado = exerciciosSelecionados.some(s => s.exId === ex.id);
      return `
        <div class="picker-item ${selecionado ? 'selected' : ''}" data-id="${ex.id}">
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
      const idx = exerciciosSelecionados.findIndex(s => s.exId === id);
      if (idx >= 0) {
        exerciciosSelecionados.splice(idx, 1);
      } else {
        exerciciosSelecionados.push({ exId: id, numSeries: 3, repeticoes: '8-12', descansoSegundos: 60 });
      }
      renderTreinoMontado();
      // mantém o campo de busca e re-renderiza com o mesmo termo
      const searchEl = document.getElementById('exercicio-search');
      renderPickerSearch(searchEl?.value.trim() || '');
    });
  });
}

async function salvarTreino() {
  const nome = document.getElementById('nome-treino').value.trim() || `Treino ${letraAtual}`;
  const dataInicio = document.getElementById('treino-data-inicio').value;
  const dataFim = document.getElementById('treino-data-fim').value;

  if (!exerciciosSelecionados.length) {
    showToast('⚠️ Adicione ao menos um exercício');
    return;
  }
  if (dataInicio && dataFim && dataFim < dataInicio) {
    showToast('⚠️ A data de fim não pode ser antes da data de início');
    return;
  }

  const treinoData = {
    nome,
    dataInicio: dataInicio || null,
    dataFim: dataFim || null,
    exercicios: exerciciosSelecionados.map(s => {
      const ex = getExercicioPorId(s.exId);
      return {
        id: ex.id,
        nome: ex.nome,
        gif: ex.gif,
        musculos: ex.musculos,
        dicas: ex.dicas || [],
        numSeries: s.numSeries,
        repeticoes: s.repeticoes,
        descansoSegundos: s.descansoSegundos,
        series: `${s.numSeries}x${s.repeticoes}` // compatibilidade com exibições antigas
      };
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

// ── BUILDER DE NUTRIÇÃO (modal) ───────────────────────────
let refeicoesSelecionadas = [];
let suplementosSelecionados = [];

function abrirBuilderNutricao() {
  const nutricaoExistente = alunoAtual.nutricao;
  refeicoesSelecionadas = nutricaoExistente?.refeicoes ? [...nutricaoExistente.refeicoes] : [];
  suplementosSelecionados = nutricaoExistente?.suplementos ? [...nutricaoExistente.suplementos] : [];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-nutricao';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Plano Nutricional</div>

      <div class="exercicio-picker-tabs">
        <div class="picker-tab active" data-nutritab="refeicoes">🍽️ Refeições</div>
        <div class="picker-tab" data-nutritab="suplementos">💊 Suplementos</div>
      </div>

      <div id="nutri-tab-content"></div>

      <button class="btn-primary" id="btn-salvar-nutricao" style="width:100%;margin-top:8px">Salvar Plano Nutricional</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.querySelectorAll('[data-nutritab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-nutritab]').forEach(t => t.classList.toggle('active', t === tab));
      renderNutriTabContent(tab.dataset.nutritab);
    });
  });

  renderNutriTabContent('refeicoes');
  document.getElementById('btn-salvar-nutricao').addEventListener('click', salvarNutricao);
}

function renderNutriTabContent(tab) {
  const el = document.getElementById('nutri-tab-content');
  el.innerHTML = tab === 'refeicoes' ? refeicoesFormHtml() : suplementosFormHtml();
  bindNutriTabEvents(tab);
}

function refeicoesFormHtml() {
  return `
    <div class="treino-montado-list" id="lista-refeicoes">
      ${refeicoesSelecionadas.map((r, idx) => `
        <div class="treino-montado-item" style="flex-direction:column;align-items:stretch;gap:6px">
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" class="ref-horario" data-idx="${idx}" value="${r.horario || ''}" placeholder="Horário"
                   style="width:90px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px">
            <input type="text" class="ref-nome" data-idx="${idx}" value="${r.ref || ''}" placeholder="Nome da refeição"
                   style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px">
            <button class="btn-remove-ex" data-remove-ref="${idx}">✕</button>
          </div>
          <textarea class="ref-opcoes" data-idx="${idx}" placeholder="Opções (uma por linha)"
                    style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px;min-height:50px;font-family:inherit">${(r.opcoes || []).join('\n')}</textarea>
        </div>
      `).join('')}
    </div>
    <button class="btn-secondary" id="btn-add-refeicao" style="margin-bottom:16px">+ Adicionar refeição</button>
  `;
}

function suplementosFormHtml() {
  return `
    <div class="treino-montado-list" id="lista-suplementos">
      ${suplementosSelecionados.map((s, idx) => `
        <div class="treino-montado-item" style="flex-direction:column;align-items:stretch;gap:6px">
          <div style="display:flex;gap:8px">
            <input type="text" class="sup-nome" data-idx="${idx}" value="${s.nome || ''}" placeholder="Nome do suplemento"
                   style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px">
            <button class="btn-remove-ex" data-remove-sup="${idx}">✕</button>
          </div>
          <div class="field-row-2">
            <input type="text" class="sup-qtd" data-idx="${idx}" value="${s.quantidade || ''}" placeholder="Quantidade (ex: 5g)"
                   style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px">
            <input type="text" class="sup-horario" data-idx="${idx}" value="${s.horario || ''}" placeholder="Horário"
                   style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px">
          </div>
          <input type="text" class="sup-dias" data-idx="${idx}" value="${s.dias || ''}" placeholder="Dias da semana"
                 style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px">
          <textarea class="sup-obs" data-idx="${idx}" placeholder="Observações"
                    style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px;color:#fff;font-size:12px;min-height:40px;font-family:inherit">${s.obs || ''}</textarea>
        </div>
      `).join('')}
    </div>
    <button class="btn-secondary" id="btn-add-suplemento" style="margin-bottom:16px">+ Adicionar suplemento</button>
  `;
}

function bindNutriTabEvents(tab) {
  if (tab === 'refeicoes') {
    document.getElementById('btn-add-refeicao').addEventListener('click', () => {
      refeicoesSelecionadas.push({ horario: '', ref: '', opcoes: [] });
      renderNutriTabContent('refeicoes');
    });
    document.querySelectorAll('[data-remove-ref]').forEach(btn => {
      btn.addEventListener('click', () => {
        refeicoesSelecionadas.splice(parseInt(btn.dataset.removeRef), 1);
        renderNutriTabContent('refeicoes');
      });
    });
    document.querySelectorAll('.ref-horario').forEach(inp => inp.addEventListener('input', () => refeicoesSelecionadas[inp.dataset.idx].horario = inp.value));
    document.querySelectorAll('.ref-nome').forEach(inp => inp.addEventListener('input', () => refeicoesSelecionadas[inp.dataset.idx].ref = inp.value));
    document.querySelectorAll('.ref-opcoes').forEach(inp => inp.addEventListener('input', () => refeicoesSelecionadas[inp.dataset.idx].opcoes = inp.value.split('\n').filter(Boolean)));
  } else {
    document.getElementById('btn-add-suplemento').addEventListener('click', () => {
      suplementosSelecionados.push({ nome: '', quantidade: '', horario: '', dias: '', obs: '' });
      renderNutriTabContent('suplementos');
    });
    document.querySelectorAll('[data-remove-sup]').forEach(btn => {
      btn.addEventListener('click', () => {
        suplementosSelecionados.splice(parseInt(btn.dataset.removeSup), 1);
        renderNutriTabContent('suplementos');
      });
    });
    document.querySelectorAll('.sup-nome').forEach(inp => inp.addEventListener('input', () => suplementosSelecionados[inp.dataset.idx].nome = inp.value));
    document.querySelectorAll('.sup-qtd').forEach(inp => inp.addEventListener('input', () => suplementosSelecionados[inp.dataset.idx].quantidade = inp.value));
    document.querySelectorAll('.sup-horario').forEach(inp => inp.addEventListener('input', () => suplementosSelecionados[inp.dataset.idx].horario = inp.value));
    document.querySelectorAll('.sup-dias').forEach(inp => inp.addEventListener('input', () => suplementosSelecionados[inp.dataset.idx].dias = inp.value));
    document.querySelectorAll('.sup-obs').forEach(inp => inp.addEventListener('input', () => suplementosSelecionados[inp.dataset.idx].obs = inp.value));
  }
}

async function salvarNutricao() {
  try {
    const userRef = doc(db, 'users', alunoAtual.uid);
    const nutricaoData = { refeicoes: refeicoesSelecionadas, suplementos: suplementosSelecionados };
    await updateDoc(userRef, { nutricao: nutricaoData });

    alunoAtual.nutricao = nutricaoData;
    const alunoIdx = alunos.findIndex(a => a.uid === alunoAtual.uid);
    if (alunoIdx >= 0) alunos[alunoIdx] = alunoAtual;

    document.getElementById('modal-nutricao').remove();
    showToast('✅ Plano nutricional salvo!');
    renderAlunoDetail();
  } catch (e) {
    showToast('❌ Erro ao salvar: ' + e.message);
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
