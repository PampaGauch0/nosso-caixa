# Nosso Caixa

Aplicativo de finanças do casal: gastos individuais e em conjunto, divisão automática, acerto entre os dois, contas a pagar, metas, orçamentos, alertas de economia e relatórios. Os dados ficam no Firebase Firestore e sincronizam em tempo real entre os aparelhos.

**Link do app:** https://pampagauch0.github.io/nosso-caixa/

## Como funciona

- **Site**: arquivos estáticos publicados pelo GitHub Pages.
- **Dados**: Firebase Firestore (projeto `nosso-caixa-c27ae`, região São Paulo, plano gratuito Spark), com cache offline.
- **Login**: e-mail e senha pelo Firebase Authentication, com confirmação de e-mail obrigatória.
- **Acesso**: só o administrador (definido em `firestore.rules` e `firebase-config.js`) e os e-mails da lista `acesso/membros` leem ou gravam dados. A lista é gerenciada no app, em Ajustes › Quem tem acesso.

## Dar acesso a outra pessoa

1. Entre no app como administrador.
2. Ajustes › Quem tem acesso › digite o e-mail › Autorizar › Confirmar acesso.
3. Envie o link do app. A pessoa toca em "Primeiro acesso? Criar senha" com o mesmo e-mail e confirma pelo link recebido por e-mail.

## Arquivos

- `index.html`: o aplicativo.
- `firebase-config.js`: configuração pública do Firebase e e-mail do administrador.
- `firestore.rules`: cópia das regras de segurança publicadas no Firestore.
- `manifest.webmanifest`, `icon*.png`, `icon.svg`: instalação na tela inicial do celular.
