# Manual de uso — Conflitos de Agenda

O **Conflitos de Agenda** organiza os períodos de ausência dos colaboradores (férias, abonos, folgas) e ajuda os coordenadores a analisar os pedidos. Ele avisa quando duas **pessoas críticas** do mesmo projeto vão se ausentar ao mesmo tempo.

Este manual mostra como usar cada tela, passo a passo.

## Sumário

1. [Conceitos básicos](#1-conceitos-básicos)
2. [Navegação](#2-navegação)
3. [Dashboard](#3-dashboard)
4. [Colaboradores](#4-colaboradores)
5. [Projetos](#5-projetos)
6. [Períodos](#6-períodos)
7. [Solicitações](#7-solicitações)
8. [Calendário](#8-calendário)
9. [Regras do sistema](#9-regras-do-sistema)
10. [Dúvidas frequentes](#10-dúvidas-frequentes)

---

## 1. Conceitos básicos

| Termo | O que significa |
|---|---|
| **Colaborador** | Pessoa cadastrada no sistema, identificada por nome e e-mail. |
| **Coordenador** | Colaborador autorizado a analisar (aprovar ou recusar) as solicitações de outras pessoas. Nunca analisa a própria. |
| **Projeto** | Equipe de colaboradores que trabalham juntos e cujas ausências precisam ser coordenadas. |
| **Pessoa crítica** | Colaborador cuja ausência afeta um projeto específico. Uma pessoa pode ser crítica em um projeto e não em outro. |
| **Período** | Intervalo de datas em que o colaborador estará ausente, de **10 a 30 dias**. |
| **Retorno** | Dia em que o colaborador volta ao trabalho. **O dia de retorno não conta como ausência.** |
| **Solicitação** | Pedido para que de 1 a 3 períodos de um colaborador sejam analisados por um coordenador. |
| **Abono** | Tipo de solicitação com limites menores: no máximo 2 períodos e 20 dias no total. |
| **Conflito** | Quando a ausência de um colaborador coincide com a de uma pessoa crítica do mesmo projeto. |

> **Exemplo de período:** Início em 15/10 e Retorno em 25/10 significam que a pessoa fica ausente de 15/10 a 24/10 (10 dias) e volta a trabalhar no dia 25/10.

### Status de uma solicitação

Os status sempre aparecem com cor, ícone e texto:

| Status | Significado | O que ainda pode ser feito |
|---|---|---|
| ⏳ **Em análise** | Aguardando decisão do coordenador. | Editar, validar conflitos, aprovar, recusar, excluir |
| ⚠️ **Conflito encontrado** | A validação encontrou sobreposição com uma pessoa crítica. | Editar, validar de novo, aprovar (com aviso), recusar, excluir |
| ✅ **Aprovada** | O coordenador aceitou. Decisão final. | Apenas excluir |
| ❌ **Recusada** | O coordenador rejeitou, com justificativa. Decisão final. | Apenas excluir |

---

## 2. Navegação

O menu lateral, à esquerda, dá acesso a todas as áreas: **Dashboard**, **Colaboradores**, **Projetos**, **Períodos**, **Solicitações** e **Calendário**.

No celular, o menu fica escondido. Toque no ícone **☰**, no canto superior esquerdo, para abri-lo.

![Menu no celular](imagens/20-celular-menu.png)

**Dicas gerais**

- Todas as exclusões pedem confirmação antes de serem feitas.
- Enquanto uma operação está em andamento, o botão fica desabilitado. Isso evita salvar duas vezes.
- O resultado de cada ação aparece numa mensagem no canto inferior direito da tela: verde para sucesso, vermelha para erro e laranja para aviso.
- Os erros de preenchimento aparecem em vermelho, logo abaixo do campo com problema.
- Os filtros das listagens são guardados no endereço da página. Ao abrir um detalhe e voltar, os filtros continuam aplicados. Você também pode copiar o endereço para compartilhar a mesma visão.

### Modo demonstração

Enquanto o sistema roda com dados de demonstração, o rodapé do menu mostra a etiqueta **Modo demonstração** e o botão **Restaurar dados**. O botão descarta todas as alterações e recarrega os dados iniciais, o que é útil para treinamentos.

![Restaurar dados de demonstração](imagens/19-restaurar.png)

---

## 3. Dashboard

É a tela inicial, com um resumo da situação atual.

![Dashboard](imagens/01-dashboard.png)

- **Indicadores** (cartões no topo): mostram quantos colaboradores, projetos e solicitações existem em cada status. **Clique em um cartão** para abrir a lista já filtrada. Por exemplo, "Com conflito" abre só as solicitações com conflito.
- **Próximas ausências**: períodos em andamento ou futuros, com o status da solicitação de cada um. As ausências recusadas não aparecem.
- **Aguardando decisão**: solicitações que ainda precisam de uma decisão, das mais antigas para as mais recentes.
- **Nova solicitação**: atalho para criar um pedido.

---

## 4. Colaboradores

### 4.1 Listagem

![Lista de colaboradores](imagens/02-colaboradores.png)

- Use a **busca** para filtrar por nome ou e-mail. Acentos e letras maiúsculas são ignorados.
- A coluna **Perfil** indica quem é **Coordenador**.
- As colunas **Períodos** e **Solicitações** mostram quantos registros cada pessoa possui.
- Clique no título de uma coluna para ordenar a lista.
- Ícones de ação em cada linha:

| Ícone | Ação |
|---|---|
| 👁 | Ver detalhes do colaborador |
| ✏️ | Editar nome e e-mail |
| 🛡 | Tornar coordenador (desabilitado para quem já é) |
| 🗑 | Excluir |

### 4.2 Cadastrar ou editar

1. Clique em **Novo colaborador**, ou no ícone ✏️ da linha.
2. Preencha **Nome** e **E-mail**. Os dois são obrigatórios, e o e-mail precisa ser válido.
3. Clique em **Salvar**.

![Formulário de colaborador com erro de e-mail](imagens/03-colaborador-novo.png)

### 4.3 Tornar coordenador

Clique no ícone 🛡 na lista, ou no botão **Tornar coordenador** na página do colaborador, e confirme. A partir daí, a pessoa aparece como opção de coordenador nas solicitações.

### 4.4 Página do colaborador

Clique no nome do colaborador para ver tudo sobre ele em um só lugar:

![Detalhe do colaborador](imagens/04-colaborador-detalhe.png)

- **Períodos**: as ausências cadastradas e a solicitação de cada uma. O botão **Novo** cadastra um período já com o colaborador preenchido, e **Calendário** abre o calendário filtrado por ele.
- **Solicitações**: os pedidos feitos por ele.
- **Projetos**: os projetos de que participa. Aqueles em que ele é pessoa crítica aparecem destacados em laranja.
- **Solicitações sob sua análise**: só aparece para coordenadores.
- O botão **Nova solicitação** abre o formulário com o colaborador já selecionado.

### 4.5 Excluir

Só é possível excluir colaboradores **sem períodos e sem solicitações** vinculados. Se houver vínculos, o sistema informa quantos são, e você precisa excluí-los antes.

---

## 5. Projetos

### 5.1 Listagem

![Lista de projetos](imagens/05-projetos.png)

A lista mostra quantos colaboradores cada projeto tem e quem são as **pessoas críticas**. Nas ações de cada linha:

- 👥 **Ver colaboradores**: lista os membros e indica quem é pessoa crítica.
- ✏️ **Editar**
- 🗑 **Excluir**

### 5.2 Cadastrar ou editar

1. Clique em **Novo projeto**, ou no ícone ✏️.
2. Informe o **Nome**.
3. Em **Colaboradores**, selecione os membros. Digite para buscar; é possível escolher vários.
4. Em **Pessoas críticas**, escolha quem é essencial para o projeto. Só aparecem os colaboradores selecionados no passo anterior.
5. Clique em **Salvar**.

![Edição de projeto](imagens/06-projeto-editar.png)

> Ao remover um colaborador do projeto, ele também deixa de ser pessoa crítica desse projeto.

**Por que isso importa:** a detecção de conflitos usa as pessoas críticas de cada projeto. Manter essa lista atualizada é o que faz os avisos de conflito serem confiáveis.

---

## 6. Períodos

### 6.1 Listagem

![Lista de períodos](imagens/07-periodos.png)

- **Filtrar por colaborador**: mostra apenas os períodos de uma pessoa.
- Colunas **Início**, **Último dia** (último dia de ausência) e **Retorno** (dia da volta).
- **Solicitação**: número e status da solicitação que usa o período, ou "Sem solicitação".
- **Ver no calendário**: abre o calendário, mantendo o filtro de colaborador.

### 6.2 Cadastrar ou editar

1. Clique em **Novo período**, ou no ícone ✏️.
2. Selecione o **Colaborador**.
3. Escolha a data de **Início** (primeiro dia de ausência) e a de **Retorno** (dia em que a pessoa volta). As datas podem ser digitadas no formato dd/mm/aaaa ou escolhidas no ícone de calendário.
4. Confira o quadro de resumo:
   - **Verde**: o período é válido. O quadro mostra os dias exatos de ausência e o total.
   - **Azul**: lembrete da regra de 10 a 30 dias, exibido enquanto as datas não formam um período válido.
5. Clique em **Salvar**.

![Edição de período](imagens/08-periodo-editar.png)

**Restrições**

- O período deve ter entre 10 e 30 dias.
- Um colaborador não pode ter dois períodos que se sobreponham.
- Períodos de solicitações **aprovadas** não podem ser editados.
- Se o período já faz parte de uma solicitação, não é possível trocar o colaborador.
- Ao editar um período de uma solicitação ainda em aberto, o total de dias é recalculado e a solicitação **volta para Em análise**.
- Não é possível excluir um período que faz parte de uma solicitação. Remova-o da solicitação primeiro.

---

## 7. Solicitações

### 7.1 Listagem e filtros

![Lista de solicitações](imagens/09-solicitacoes.png)

Filtros disponíveis, que podem ser combinados:

| Filtro | Uso |
|---|---|
| **Busca** | Número da solicitação (ex.: `7` ou `#7`), nome do colaborador ou do coordenador, ou texto da observação |
| **Status** | Em análise, Conflito encontrado, Aprovada ou Recusada |
| **Colaborador** | Somente os pedidos de uma pessoa |
| **Ausente de / Até** | Solicitações com ausência em algum dia desse intervalo |

Use **Limpar filtros** para voltar à lista completa. Por padrão, a lista vem ordenada da solicitação mais recente para a mais antiga.

![Lista filtrada por status](imagens/10-solicitacoes-filtro.png)

**Indicadores** na lista:

- **Abono**: a solicitação é de abono.
- **Pessoa crítica**: o solicitante é pessoa crítica em algum projeto.
- ❗ (ícone vermelho ao lado do status): a solicitação viola alguma regra. Passe o mouse sobre o ícone para ver o motivo.

### 7.2 Criar uma solicitação

1. Clique em **Nova solicitação**.
2. **Colaborador**: escolha quem vai se ausentar.
3. **Coordenador**: escolha quem vai analisar. Só aparecem coordenadores, e o próprio solicitante nunca aparece.
4. **Períodos**: marque de 1 a 3 períodos do colaborador.
   - Só aparecem os períodos que ainda não fazem parte de outra solicitação.
   - Se o período desejado ainda não existe, clique em **Cadastrar novo período**. Depois de salvo, ele já vem marcado.
5. **Abono e observação**: ligue **Solicitação de abono**, se for o caso, e escreva uma observação (opcional).
6. Confira o **Resumo**, à direita:
   - **Total de dias** e **Pessoa crítica** são calculados automaticamente e não podem ser editados.
   - Se alguma regra estiver sendo violada (por exemplo, abono acima de 20 dias), aparece um aviso.
7. Clique em **Criar solicitação**. Ela é criada com status **Em análise**, e o sistema abre a página dela.

![Formulário de nova solicitação](imagens/11-solicitacao-nova.png)

Se algum campo obrigatório ficar vazio, o sistema mostra o que falta:

![Formulário com campos obrigatórios](imagens/12-solicitacao-nova-erros.png)

### 7.3 Página da solicitação

![Detalhe da solicitação](imagens/13-solicitacao-detalhe.png)

- No topo: o número da solicitação, o status e a data de criação, além dos botões **Validar conflitos**, **Aprovar** e **Recusar**.
- **Sobreposições com pessoas críticas**: lista, em tempo real, quem está ausente nas mesmas datas, de qual projeto e em qual solicitação. Isso ajuda a decidir.
- **Gerenciar**: **Editar** e **Excluir**.

### 7.4 Validar conflitos

Clique em **Validar conflitos** para registrar o resultado no status da solicitação:

- **Com conflito**: o status muda para **Conflito encontrado**, e uma mensagem informa com quem e em qual projeto.
- **Sem conflito**: o status permanece, ou volta para **Em análise** se antes havia conflito (por exemplo, porque a outra solicitação foi recusada).

![Resultado da validação de conflitos](imagens/14-validar-conflito.png)

> Períodos que apenas se encostam (um termina no dia em que o outro começa) **não** são conflito. Lembre-se de que o dia de retorno não conta como ausência.

### 7.5 Aprovar

1. Clique em **Aprovar**.
2. Confirme. Se a solicitação estiver com **Conflito encontrado**, o sistema mostra um aviso extra e o botão passa a se chamar **Aprovar mesmo assim**.

![Confirmação de aprovação](imagens/15-aprovar.png)

A aprovação é definitiva: depois dela, a solicitação não pode mais ser editada.

### 7.6 Recusar

1. Clique em **Recusar**.
2. Escreva o motivo no campo **Observação**. **A observação é obrigatória.**
3. Clique em **Recusar** para confirmar.

![Recusa exige observação](imagens/16-recusar.png)

A recusa também é definitiva. A observação fica registrada na solicitação.

### 7.7 Editar

Somente solicitações **Em análise** ou com **Conflito encontrado** podem ser editadas. O formulário é o mesmo da criação. Ao salvar, a solicitação **volta para Em análise** e deve ser validada de novo.

### 7.8 Solicitações que violam regras

Algumas solicitações antigas podem ter sido gravadas antes das regras atuais (por exemplo, um abono com 3 períodos). Nesse caso, a página exibe um alerta vermelho explicando o problema.

![Solicitação que viola regras](imagens/17-solicitacao-invalida.png)

Essas solicitações não podem ser aprovadas nem recusadas enquanto não forem corrigidas. Clique em **Editar**, ajuste os períodos ou desligue o abono, e salve.

### 7.9 Excluir

Clique em **Excluir**, na página da solicitação ou no ícone 🗑 da lista, e confirme. Solicitações de qualquer status podem ser excluídas. **Os períodos continuam cadastrados** e ficam livres para uma nova solicitação.

---

## 8. Calendário

Mostra todas as ausências mês a mês.

![Calendário](imagens/18-calendario.png)

- **Navegação**: as setas avançam ou voltam um mês, e **Este mês** retorna ao mês atual.
- **Cores**: cada ausência tem a cor do status da solicitação (veja a legenda abaixo do calendário). Períodos sem solicitação aparecem em cinza.
- **Conflitos**: ausências envolvidas em conflito com pessoa crítica têm o símbolo ⚠ e contorno tracejado vermelho.
- **Filtros**: por **Colaborador** e por **Status** (é possível marcar vários, inclusive "Sem solicitação").
- **Clique em uma ausência** para abrir a solicitação. Se o período não tiver solicitação, abre a página do colaborador.
- A barra termina no último dia de ausência. O dia de retorno não é pintado.

---

## 9. Regras do sistema

| Regra | Onde se aplica |
|---|---|
| O período deve ter de 10 a 30 dias, e o retorno deve ser posterior ao início. | Períodos |
| Os períodos de um mesmo colaborador não podem se sobrepor. | Períodos |
| Uma solicitação tem de 1 a 3 períodos, todos do próprio solicitante. | Solicitações |
| Um período só pode estar em uma solicitação ativa (não recusada). | Solicitações |
| Abono: no máximo 2 períodos e 20 dias no total. | Solicitações |
| O coordenador precisa ter perfil de coordenador e ser outra pessoa. | Solicitações |
| Total de dias e Pessoa crítica são calculados pelo sistema. | Solicitações |
| Recusar exige observação. | Solicitações |
| Aprovadas e recusadas não podem ser editadas. | Solicitações |
| Editar uma solicitação (ou um de seus períodos) a devolve para Em análise. | Solicitações / Períodos |
| Pessoas críticas precisam ser membros do projeto. | Projetos |
| Não é possível excluir um colaborador com períodos ou solicitações, nem um período usado em solicitação. | Colaboradores / Períodos |

---

## 10. Dúvidas frequentes

**Por que o meu período de 15/10 a 24/10 dá erro de duração mínima?**
Porque a segunda data é o **Retorno**, e o dia de retorno não conta como ausência. Para ficar ausente até 24/10, informe Retorno em 25/10, o que dá 10 dias.

**Não encontro o período ao criar a solicitação.**
Confira se o colaborador certo está selecionado e se o período já não faz parte de outra solicitação ativa (veja a coluna **Solicitação** na tela de Períodos). Se ele ainda não existir, use **Cadastrar novo período** no próprio formulário.

**O coordenador que eu quero não aparece na lista.**
Ele precisa ter o perfil de coordenador. Use **Tornar coordenador** na tela de Colaboradores. O próprio solicitante nunca aparece como opção.

**Validei e deu conflito. Posso aprovar mesmo assim?**
Sim. O sistema pede uma confirmação extra (**Aprovar mesmo assim**). A decisão é do coordenador.

**O conflito foi resolvido, mas o status continua "Conflito encontrado".**
O status só muda quando a validação é feita. Clique em **Validar conflitos** de novo: se não houver mais conflito, ele volta para **Em análise**.

**Aprovei por engano. Como desfaço?**
A aprovação é definitiva. Se precisar refazer, exclua a solicitação (os períodos são mantidos) e crie uma nova.

**Não consigo excluir um colaborador.**
Ele ainda tem períodos ou solicitações vinculados. A mensagem informa quantos são. Exclua primeiro as solicitações e depois os períodos.
