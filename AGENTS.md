# AGENTS.md

## Projeto

O **Rachador** é um web app responsivo para grupos de amigos registrarem despesas compartilhadas, calcularem quem deve para quem e acompanharem a quitação dos valores.

O foco da v1 é manter o produto simples, rápido de usar e adequado principalmente para grupos de amigos em viagens.

---

## Stack

- **Linguagem:** TypeScript
- **Frontend:** React + Vite
- **Banco de dados:** Supabase / Postgres
- **Formato:** Web app responsivo, mobile-first

Antes de alterar dependências, estrutura do projeto ou arquitetura, verifique primeiro o que já existe no repositório.

---

## Escopo do MVP

Priorize as funcionalidades abaixo:

1. Criar um grupo com nome e participantes.
2. Registrar uma despesa com:
   - descrição;
   - valor;
   - participante que pagou;
   - forma de divisão.
3. Exibir o saldo simplificado de quem deve para quem.
4. Permitir marcar uma dívida como paga.
5. Permitir copiar a chave Pix de um participante.

Não adicionar sem necessidade funcionalidades que estão fora do escopo da v1, como:

- conversão de moedas;
- integração bancária / Open Finance;
- upload de fotos ou recibos;
- aplicativo nativo.

---

## Modelo de dados

A estrutura inicial prevista é:

- `grupo`
  - `nome`
  - `codigo_convite`
  - `criado_em`

- `participante`
  - `nome`
  - `chave_pix`
  - `grupo_id`

- `despesa`
  - `descricao`
  - `valor`
  - `pago_por_id`
  - `grupo_id`
  - `criado_em`

- `divisao`
  - `despesa_id`
  - `participante_id`
  - `valor_devido`

Evite alterar esse modelo sem necessidade clara ou sem considerar o impacto no fluxo principal do produto.

---

## Regras de produto

- Criar um grupo não deve exigir cadastro completo de todos os participantes.
- O usuário deve chegar rapidamente ao registro da primeira despesa.
- Valores monetários devem ser sempre fáceis de identificar.
- O saldo deve deixar claro quem deve, para quem e quanto.
- Confirmações importantes devem citar explicitamente pessoa e valor.
- A chave Pix é, na v1, apenas um campo de texto livre.

---

## Design

A interface deve parecer um produto financeiro simples e sério.

### Direção visual

- Fundo claro.
- Verde escuro como principal cor de destaque.
- Sem gradientes.
- Sem texturas decorativas.
- Poucas sombras.
- Bordas discretas e pouco arredondadas.
- Layout mobile-first em uma única coluna.

### Cores principais

- Primary: `#15803D`
- Background: `#F8FAFC`
- Card: `#FFFFFF`
- Accent: `#F0FDF4`
- Muted: `#F1F5F9`
- Border: `#E2E8F0`
- Destructive: `#DC2626`

Use verde para confirmação, dinheiro, progresso e estados positivos.  
Use vermelho apenas para erros, ações destrutivas e dívidas vencidas.

### Tipografia

- **Geist:** interface geral.
- **Geist Mono:** valores em reais, chaves Pix e códigos de convite.
- **Lora:** somente uso decorativo pontual.

O valor monetário deve ser o elemento visual de maior destaque quando fizer sentido na tela.

### Formas

- Cards: `4px`
- Inputs: `2px`
- Badges: `2px`
- Dialogs / bottom sheets: até `8px`
- Avatares podem ser circulares.

Evite componentes com aparência de “pill” ou excesso de arredondamento.

---

## Componentes

### Botão primário

- Fundo verde sólido.
- Texto branco.
- Radius de `4px`.
- Apenas um botão primário principal por tela.

### Card de despesa

Deve exibir com clareza:

- descrição;
- valor;
- quem pagou;
- estado relevante.

O valor deve permanecer alinhado à direita e não deve ficar escondido atrás de labels ou ícones.

### Saldo

A linha de saldo deve comunicar visualmente:

`devedor → credor + valor`

Quando aplicável, incluir ação de **Quitar**.

### Chave Pix

- Usar fonte monoespaçada.
- Não quebrar em múltiplas linhas.
- Disponibilizar ação para copiar.

---

## Espaçamento

Usar escala baseada em múltiplos de 4px:

`4, 8, 12, 16, 24, 32, 48px`

Referências:

- margem lateral da tela: `16px`;
- espaço entre cards: `12px`;
- padding interno de cards: `16px`;
- gap entre avatar e nome: `8px`.

Evite criar valores de espaçamento fora dessa escala sem necessidade.

---

## Boas práticas para alterações

Antes de implementar:

1. Entenda o fluxo existente.
2. Identifique o menor conjunto de arquivos que precisa mudar.
3. Preserve os padrões visuais e estruturais já utilizados.
4. Evite refatorações grandes quando a tarefa puder ser resolvida localmente.
5. Não adicione dependências sem necessidade.
6. Não introduza funcionalidades fora do escopo solicitado.
7. Garanta que a experiência continue funcionando bem em telas mobile.

Ao finalizar:

1. Verifique erros de TypeScript.
2. Execute os scripts disponíveis no `package.json` para lint, teste ou build, quando existirem.
3. Confirme que os fluxos principais continuam funcionando.
4. Revise estados de erro, loading e vazio quando forem afetados pela alteração.

---

## Decisões ainda em aberto

Não assumir como resolvido sem evidência no código ou nova definição do time:

- se a simplificação das dívidas roda no cliente ou no servidor;
- validação da aceitação do campo de chave Pix em texto livre;
- link definitivo do repositório;
- detalhes de deploy e variáveis de ambiente.

Quando uma tarefa depender de uma dessas decisões, preserve a implementação atual ou solicite definição antes de realizar uma mudança estrutural.

---

## Manutenção

Equipe responsável:

- João Pedro
- João Meira
- Leonardo Malta

Ao alterar regras de produto, arquitetura ou padrões visuais relevantes, atualize este arquivo e a documentação relacionada.
