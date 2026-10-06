/**
 * ENGINE.JS - Motor de Escape de IAB (Versão Final de Produção)
 * [FATO]: Lógica de fallback de cookie robusta para contornar bloqueios de sessionStorage.
 * [FATO]: Gerenciamento estrito de event listeners para evitar memory leaks.
 * [FATO]: Validação temporal (< 1000ms) para evitar falsos positivos de 'escape_success'.
 */

(function() {
    'use strict';

    const DESTINATION_URL = 'https://privacy.com.br/checkout/soykarolinareal';
    const ESCAPE_TIMEOUT_MS = 1200;
    const STORAGE_KEY = '__iab_escape_attempts';
    const MAX_ATTEMPTS = 3;

    const primaryLink = document.getElementById('primary-link');
    const fallbackOverlay = document.getElementById('escape-fallback');
    const btnRetry = document.getElementById('retry-escape');
    const btnContinue = document.getElementById('continue-here');

    // 1. DETECÇÃO DE AMBIENTE
    const ua = navigator.userAgent || '';
    const isBot = /bot|crawl|spider|facebookexternalhit|twitterbot|whatsapp|slackbot|discordbot|telegrambot|linkedinbot|embedly|quora link preview|pinterest\/0\./i.test(ua);
    const isIAB = /Instagram|FBAN|FBAV|FB_IAB|TikTok|Bytedance|Twitter\/Android|Twitter\/iPhone/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isBot || !isIAB || (!isIOS && !isAndroid) || isStandalone) {
        return; 
    }

    if (typeof gtag === 'function') {
        gtag('event', 'iab_detected', { 
            iab_type: ua.match(/Instagram|TikTok|FBAN/i)?.[0] || 'unknown', 
            os: isIOS ? 'ios' : 'android' 
        });
    }

    // 2. PROTEÇÃO CONTRA LOOP (CORREÇÃO BUG 8: Fallback de cookie robusto)
    function getAttemptCount() {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored !== null) return parseInt(stored, 10) || 0;
        } catch (_) { 
            // sessionStorage indisponível (ex: Safari Private Mode rigoroso)
        }
        
        // Fallback seguro: ler do cookie com regex que escapa caracteres especiais
        const escapedKey = STORAGE_KEY.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        const match = document.cookie.match(new RegExp('(?:^|; )' + escapedKey + '=([^;]*)'));
        return match ? parseInt(match[1], 10) || 0 : 0;
    }

    function incrementAttemptCount() {
        const next = getAttemptCount() + 1;
        try {
            sessionStorage.setItem(STORAGE_KEY, String(next));
        } catch (_) {
            // Fallback: gravar no cookie com expiração de 1 hora (3600s)
            document.cookie = STORAGE_KEY + '=' + next + '; Path=/; SameSite=Lax; Max-Age=3600';
        }
    }

    // 3. GERENCIAMENTO DE FOCO (A11y)
    function openOverlay() {
        fallbackOverlay.hidden = false;
        requestAnimationFrame(() => {
            fallbackOverlay.classList.add('active');
            btnRetry.focus(); // Move foco para o modal
        });
    }

    function closeOverlay() {
        fallbackOverlay.classList.remove('active');
        setTimeout(() => { 
            fallbackOverlay.hidden = true; 
            primaryLink.focus(); // Devolve foco ao link original
        }, 300);
    }

    // Fechar com tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !fallbackOverlay.hidden) {
            closeOverlay();
        }
    });

    // 4. LÓGICA DE ESCAPE
    function handleLinkClick(e) {
        e.preventDefault(); 
        const clickTimestamp = Date.now(); // CORREÇÃO BUG 10: Timestamp para validar sucesso real

        const attempts = getAttemptCount();
        if (attempts >= MAX_ATTEMPTS) {
            // CORREÇÃO OPCIONAL 2: Logar desistência para analytics
            if (typeof gtag === 'function') {
                gtag('event', 'escape_gave_up', { attempts: attempts });
            }
            window.location.href = DESTINATION_URL;
            return;
        }

        incrementAttemptCount();
        let escapeSuccessful = false;

        const visibilityHandler = () => {
            if (document.visibilityState === 'hidden') {
                const elapsed = Date.now() - clickTimestamp;
                // CORREÇÃO BUG 10: Só considera sucesso se ocorrer dentro da janela de 1 segundo
                if (elapsed < 1000) {
                    escapeSuccessful = true;
                    if (typeof gtag === 'function') {
                        gtag('event', 'escape_success', { method: 'visibility_change', latency_ms: elapsed });
                    }
                }
            }
            // CORREÇÃO BUG 9: Remover SEMPRE o listener para evitar memory leak
            document.removeEventListener('visibilitychange', visibilityHandler);
        };
        document.addEventListener('visibilitychange', visibilityHandler);

        if (isIOS) {
            // CORREÇÃO BUG 1: Apenas UMA estratégia de navegação, síncrona ao clique
            const a = document.createElement('a');
            a.href = DESTINATION_URL;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else if (isAndroid) {
            // CORREÇÃO BUG 4: Intent robusta com action e category explícitos
            const encodedFallback = encodeURIComponent(DESTINATION_URL);
            const intentUrl = `intent://${DESTINATION_URL.replace('https://', '')}` +
                              `#Intent;scheme=https;` +
                              `action=android.intent.action.VIEW;` +
                              `category=android.intent.category.BROWSABLE;` +
                              `package=com.android.chrome;` +
                              `S.browser_fallback_url=${encodedFallback};end`;
            window.location.href = intentUrl;
        }

        // 5. FALLBACK VISUAL
        setTimeout(() => {
            // CORREÇÃO BUG 9: Garantir remoção do listener caso o timeout dispare antes do evento de visibilidade
            document.removeEventListener('visibilitychange', visibilityHandler);
            
            if (!escapeSuccessful && document.visibilityState === 'visible') {
                if (typeof gtag === 'function') {
                    gtag('event', 'escape_fail', { reason: 'timeout' });
                    gtag('event', 'fallback_shown');
                }
                openOverlay();
            }
        }, ESCAPE_TIMEOUT_MS);
    }

    // Listener sempre anexado; a lógica de limite está dentro do handler (CORREÇÃO BUG 3)
    primaryLink.addEventListener('click', handleLinkClick);

    // Ações do Overlay
    btnRetry.addEventListener('click', () => {
        if (typeof gtag === 'function') gtag('event', 'fallback_clicked', { action: 'retry' });
        closeOverlay();
        // Força navegação direta para evitar loop infinito de tentativas falhas
        window.location.href = DESTINATION_URL;
    });

    // CORREÇÃO BUG 2: "Abrir mesmo assim" navega de verdade, compensando o preventDefault()
    btnContinue.addEventListener('click', () => {
        if (typeof gtag === 'function') gtag('event', 'fallback_clicked', { action: 'continue_iab' });
        closeOverlay();
        window.location.href = DESTINATION_URL;
    });

})();