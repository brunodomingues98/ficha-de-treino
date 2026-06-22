// ============================================================
//  pwa.js — Registro do Service Worker + banner de instalação
// ============================================================

// ── Registra o Service Worker ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err =>
      console.warn('Service Worker não registrado:', err)
    );
  });
}

// ── Banner customizado de instalação (Android/Chrome) ───────
// O navegador dispara esse evento quando o site é instalável.
// Por padrão o Chrome mostra um mini-infobar; aqui interceptamos
// pra mostrar nosso próprio banner, com a identidade visual do app.
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;

  // Não mostra de novo se a pessoa já dispensou nesta sessão
  if (sessionStorage.getItem('pwa-install-dismissed')) return;

  mostrarBannerInstalacao();
});

function mostrarBannerInstalacao() {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-banner-icon">🏋️</div>
    <div class="pwa-banner-text">
      <strong>Instalar Ficha de Treino</strong>
      <span>Acesse direto da tela inicial</span>
    </div>
    <button id="pwa-install-btn">Instalar</button>
    <button id="pwa-dismiss-btn" aria-label="Fechar">✕</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    banner.remove();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('pwa-install-dismissed', '1');
  });
}

// ── iOS Safari: instruções manuais ──────────────────────────
// iOS não dispara beforeinstallprompt — precisa do passo manual
// "Compartilhar → Adicionar à Tela de Início". Detectamos e
// mostramos um banner explicativo (só uma vez por sessão).
function isIOS() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}
function isInStandaloneMode() {
  return ('standalone' in window.navigator) && window.navigator.standalone;
}

if (isIOS() && !isInStandaloneMode() && !sessionStorage.getItem('pwa-ios-dismissed')) {
  window.addEventListener('load', () => {
    setTimeout(mostrarBannerIOS, 1200);
  });
}

function mostrarBannerIOS() {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-banner-icon">🏋️</div>
    <div class="pwa-banner-text">
      <strong>Instalar Ficha de Treino</strong>
      <span>Toque em <strong>Compartilhar</strong> ⬆️ e depois em <strong>"Adicionar à Tela de Início"</strong></span>
    </div>
    <button id="pwa-dismiss-btn" aria-label="Fechar">✕</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('pwa-ios-dismissed', '1');
  });
}
