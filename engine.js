/**
 * ENGINE.JS - Gerenciamento de Overlay e Acessibilidade (A11y)
 * A lógica pesada de escape já foi executada inline no <head>.
 */

(function() {
    'use strict';

    const DESTINATION_URL = 'https://privacy.com.br/checkout/soykarolinareal';
    const fallbackOverlay = document.getElementById('escape-fallback');
    const btnRetry = document.getElementById('retry-escape');
    const btnContinue = document.getElementById('continue-here');

    if (!fallbackOverlay || !btnRetry || !btnContinue) return;

    function closeOverlay() {
        fallbackOverlay.classList.remove('active');
        setTimeout(() => { 
            fallbackOverlay.hidden = true; 
        }, 300);
    }

    // Fechar com tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !fallbackOverlay.hidden) {
            closeOverlay();
        }
    });

    // BUG 5 CORRIGIDO: Foco gerenciado via MutationObserver (sem depender de container.focus)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'hidden' && !fallbackOverlay.hidden) {
                setTimeout(() => btnRetry.focus(), 50);
            }
        });
    });
    observer.observe(fallbackOverlay, { attributes: true });

    // Ação: Tentar Novamente (Re-dispara o motor de escape)
    btnRetry.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita propagação para o reinforceEscape
        if (typeof gtag === 'function') gtag('event', 'fallback_clicked', { action: 'retry' });
        closeOverlay();
        if (typeof window.__iabeEscapeRetry === 'function') {
            window.__iabeEscapeRetry();
        } else {
            window.location.href = DESTINATION_URL;
        }
    });

    // Ação: Abrir mesmo assim (Navegação direta no IAB)
    btnContinue.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita propagação para o reinforceEscape
        if (typeof gtag === 'function') gtag('event', 'fallback_clicked', { action: 'continue_iab' });
        closeOverlay();
        setTimeout(() => { window.location.href = DESTINATION_URL; }, 350);
    });

})();
