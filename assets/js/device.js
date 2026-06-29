// ============================================================
//  device.js — Detecção de dispositivo (mobile x desktop)
//  Usado para decidir quem pode acessar via desktop:
//  - Aluno: SEMPRE bloqueado no desktop (a ferramenta é pensada
//    para uso na academia, com o celular na mão)
//  - Professor / Admin: liberado também no desktop (trabalho de
//    gestão é mais confortável numa tela maior)
// ============================================================

/**
 * Detecta se o dispositivo atual é mobile, combinando largura de
 * tela com o user agent (mais confiável que só width, que falha
 * em casos como janela de navegador redimensionada no desktop).
 */
export function isMobile() {
  const larguraMobile = window.matchMedia('(max-width: 1024px)').matches;
  const uaMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  return larguraMobile || uaMobile;
}

/**
 * Aplica a regra de bloqueio de desktop conforme o papel do usuário.
 * - 'aluno' ou null/undefined → bloqueia sempre no desktop
 * - 'professor' ou 'admin'    → nunca bloqueia, mesmo no desktop
 *
 * Deve ser chamado depois que o app souber o role do usuário
 * (ou para decidir o que mostrar antes do login, passando null
 * — modo seguro, trata como se fosse aluno).
 */
export function aplicarBloqueioDesktop(role) {
  const desktopBlock = document.querySelector('.desktop-block');
  const appShell = document.getElementById('app-shell');
  const loginScreen = document.getElementById('login-screen');
  if (!desktopBlock) return;

  const bloqueiaEsseRole = role !== 'professor' && role !== 'admin';
  const deveBloquear = !isMobile() && bloqueiaEsseRole;

  desktopBlock.style.display = deveBloquear ? 'grid' : 'none';
  [appShell, loginScreen].forEach(el => {
    if (!el) return;
    el.style.display = deveBloquear ? 'none' : '';
  });
}

// Aplica o bloqueio em modo seguro imediatamente ao importar este
// módulo (antes mesmo de sabermos o role real) — evita qualquer
// flash de conteúdo liberado indevidamente em telas grandes
// enquanto a checagem de autenticação ainda está em andamento.
aplicarBloqueioDesktop(null);

// Marca que o JS de detecção de dispositivo já rodou — usado pelo
// CSS como fallback de segurança (ver style.css) caso este módulo
// falhe ao carregar por algum motivo.
document.documentElement.classList.add('js-device-ready');
