# Configuração de Headers de Segurança no Cloudflare (Transform Rules)

Como o GitHub Pages não permite a personalização de headers HTTP, utilizaremos o proxy do Cloudflare para injetá-los.

## Passo a Passo:
1. Acesse o painel do Cloudflare e selecione o domínio `soykarolinareal.com`.
2. No menu lateral esquerdo, vá em **Rules** > **Transform Rules**.
3. Clique na aba **Modify Response Header**.
4. Clique em **Create Rule**.
5. Dê um nome à regra, ex: `Security Headers for GitHub Pages`.
6. Em **When incoming requests match**, deixe como `All requests` (ou `Hostname equals soykarolinareal.com`).
7. Na seção **Modify response headers**, adicione as seguintes regras (clique em "Add header" para cada uma):

   | Action | Header Name | Value |
   |---|---|---|
   | Set (or Replace) | `Content-Security-Policy` | `default-src 'self'; script-src 'self' https://www.googletagmanager.com 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com;` |
   | Set (or Replace) | `Referrer-Policy` | `strict-origin-when-cross-origin` |
   | Set (or Replace) | `X-Content-Type-Options` | `nosniff` |
   | Set (or Replace) | `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |

8. Clique em **Deploy**.