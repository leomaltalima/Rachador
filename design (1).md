# Rachador — Design System

## Overview

O Rachador se parece com um app de fintech enxuto — pense em algo entre o Nubank e o Mercury: fundo claro, verde escuro como única cor de destaque, bordas retas (não pílulas), sem gradiente, sem textura, sem ícone decorativo fora do necessário. A referência concreta é "app bancário sério que amigos usam pra dividir conta" — não um app social de calculadora divertida. Números grandes e em fonte monoespaçada são o elemento central de cada tela.

---

## Colors

| Cor | Hex | Papel |
|---|---|---|
| Primary | `#15803D` | Botão de ação principal, links, estado ativo, saldo positivo |
| Primary foreground | `#FFFFFF` | Texto sobre a cor primária |
| Background | `#F8FAFC` | Fundo geral da página |
| Card | `#FFFFFF` | Superfície de cards de despesa/grupo |
| Accent | `#F0FDF4` | Chips de participante, hover suave, destaques leves |
| Accent foreground | `#166534` | Texto sobre o accent |
| Muted | `#F1F5F9` | Campos desativados, superfícies secundárias |
| Muted foreground | `#64748B` | Texto secundário/legenda |
| Border | `#E2E8F0` | Toda borda padrão de card, input, divisor |
| Destructive | `#DC2626` | Dívida em atraso, exclusão, ação irreversível |
| Ring (foco) | `#15803D` | Anel de foco em inputs — mesma cor do primary |

Regra de uso: verde é reservado para confirmação, dinheiro e progresso — nunca para erro ou aviso. Vermelho (`destructive`) é exclusivo de ações destrutivas e dívidas vencidas.

Dark mode: fundo `#0A0F0A`, card `#111827`, primary `#22C55E` (verde mais brilhante para manter contraste em fundo escuro).

---

## Typography

Três famílias, dois usos práticos:

- **Geist** (sans) — toda a interface: títulos, labels, botões, descrições.
- **Geist Mono** — exclusivo para valores em R$, chaves Pix e códigos de convite, para manter os dígitos alinhados em listas.
- **Lora** (serif) — uso decorativo pontual, fora da interface funcional.

Pesos: apenas três — Bold (700) para títulos e valores totais, Semibold (600) para labels e nomes, Regular (400) para corpo de texto. Nada abaixo de Regular.

O que sempre vai em destaque: o valor monetário. Em qualquer tela, o número em reais é o elemento de maior peso e tamanho — nunca fica escondido atrás de um label.

| Uso | Tamanho | Peso | Fonte |
|---|---|---|---|
| Valor principal (saldo) | 2xl | Bold | Geist Mono |
| Título de grupo/tela | xl | Bold | Geist |
| Nome de despesa | base | Semibold | Geist |
| Valor de despesa | base | Regular | Geist Mono |
| Label de campo | sm | Medium | Geist |
| Metadata / data | xs | Regular | Geist |

---

## Layout

Escala de espaçamento em base 4px (`0.25rem`): 4, 8, 12, 16, 24, 32, 48px — sem valores fora dessa escala.

Grade: layout mobile-first, coluna única, sem sidebar. Margem lateral de 16px em toda tela. Espaço entre cards: 12px. Espaço interno de card (padding): 16px.

O que encosta em quê: o avatar do participante encosta no texto do nome com 8px de gap; o valor monetário fica sempre alinhado à direita do card, nunca abaixo do texto.

---

## Elevation & Depth

O produto é plano, não empilhado. Não há sombra (`box-shadow`) em cards de despesa, grupo ou saldo — a separação entre elementos é feita só por borda de 1px (`#E2E8F0`) e diferença de fundo (`card` branco sobre `background` cinza-claro).

Sombra é reservada só pra camadas que flutuam sobre o conteúdo: dialogs, bottom sheets e popovers. Nesses casos, uma única sombra suave e discreta — nunca sombra dupla ou glow.

---

## Shapes

Radius base de 4px — bordas nítidas, não arredondadas, é o que dá a leitura de precisão financeira.

| Elemento | Radius |
|---|---|
| Badge / chip de status | 2px |
| Input / select | 2px |
| Card de despesa/grupo | 4px |
| Dialog / bottom sheet | 8px |

Evitar: cantos muito arredondados (pill/rounded-full) em qualquer lugar exceto o avatar circular do participante — essa é a única exceção de forma redonda no sistema.

---

## Components

**Botão primário** — fundo `primary` sólido, texto branco, radius 4px, sem ícone obrigatório. Só um botão primário por tela (ex.: "Criar grupo", "Salvar despesa").

**Card de despesa** — descrição + valor (Geist Mono, bold, alinhado à direita) + "pago por [nome]" + badge `accent` quando "Pago por você".

**Linha de saldo** — avatar do devedor → seta → avatar do credor + valor em Geist Mono + botão "Quitar" (secundário, borda, sem preenchimento).

**Campo de chave Pix** — sempre em Geist Mono, com ícone de copiar ao lado; nunca quebra linha, usa reticências se necessário.

**Chip de participante** — avatar circular com iniciais, fundo `accent` quando é o usuário logado, `muted` para os demais.

---

## Do's and Don'ts

**Do's**
- Usar Geist Mono em todo valor monetário, chave Pix e código de convite
- Confirmar toda ação com nome e valor explícitos: "Pagamento de R$50 marcado como recebido"
- Acompanhar todo status de cor com ícone ou texto (nunca só a cor)
- Manter só um botão primário verde por tela

**Don'ts**
- Não usar verde para alertas de erro ou aviso — é exclusivo de confirmação e saldo positivo
- Não usar sombra em cards de conteúdo — só em camadas flutuantes (dialog, sheet, popover)
- Não arredondar cantos além de 8px em nenhum componente, exceto avatares
- Não esconder o valor da despesa atrás de um label ou ícone
