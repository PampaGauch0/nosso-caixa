# Nosso Caixa

Aplicativo de finanças do casal: gastos individuais e em conjunto, divisão automática, acerto entre os dois, contas a pagar, metas, orçamentos, alertas de economia e relatórios. Os dados ficam no Firebase Firestore e sincronizam em tempo real entre os aparelhos.

**Link do app:** https://pampagauch0.github.io/nosso-caixa/

## Como funciona

- **Site**: arquivos estáticos publicados pelo GitHub Pages.
- **Dados**: Firebase Firestore (projeto `nosso-caixa-c27ae`, região São Paulo, plano gratuito Spark), com cache offline.
- **Login**: e-mail e senha pelo Firebase Authentication, com confirmação de e-mail obrigatória.
- **Acesso**: só o administrador (definido em `firestore.rules` e `firebase-config.js`) e os e-mails da lista `acesso/membros` leem ou gravam dados. A lista é gerenciada no app, em Ajustes › Quem tem acesso.

## Instalar no celular (PWA)

- **Android (Chrome):** abra o link, toque em **Instalar** no aviso do app ou no menu ⋮ › **Instalar app**.
- **iPhone (Safari):** abra o link, toque em **Compartilhar** › **Adicionar à Tela de Início**.

O app abre em tela cheia, funciona sem internet (os lançamentos feitos offline sincronizam quando a conexão volta) e avisa quando há uma versão nova. Segurando o ícone, há atalhos para **Nova despesa** e **Nova receita**.

## Dar acesso a outra pessoa

1. Entre no app como administrador.
2. Ajustes › Quem tem acesso › digite o e-mail › Autorizar › Confirmar acesso.
3. Envie o link do app. A pessoa toca em "Primeiro acesso? Criar senha" com o mesmo e-mail e confirma pelo link recebido por e-mail.

## Arquivos

- `index.html`: estrutura da página e política de segurança (CSP).
- `app.js`: lógica do aplicativo.
- `firebase-config.js`: configuração pública do Firebase e e-mail do administrador.
- `firestore.rules`: cópia das regras de segurança publicadas no Firestore.
- `manifest.webmanifest`, `icon*.png`, `icon.svg`: instalação na tela inicial do celular.
- `sw.js`: service worker (abertura rápida e uso offline).

## Segurança

- Regras do Firestore exigem login com e-mail confirmado, conta autorizada e dados no formato esperado.
- O app trata tudo que vem do banco como não confiável (texto escapado, campos normalizados) e usa uma Content-Security-Policy que bloqueia scripts injetados.
- **Sair** apaga a cópia offline dos dados guardada no aparelho.
- A planilha exportada (CSV) neutraliza fórmulas para não executar nada ao ser aberta.

