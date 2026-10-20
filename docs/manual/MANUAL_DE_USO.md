# Manual de uso — Conflitos de Agenda

O **Conflitos de Agenda** organiza os períodos de ausência dos colaboradores (férias, abonos, folgas) e ajuda os coordenadores a analisar os pedidos. Ele avisa quando duas **pessoas críticas** do mesmo projeto vão se ausentar ao mesmo tempo.

O acesso é feito com **nome de usuário e senha**, em três níveis: **Administrador**, **Coordenador** e **Colaborador**. Cada um vê e faz apenas o que lhe cabe.

Este manual mostra como usar cada tela, passo a passo.

## Sumário

1. [Conceitos básicos](#1-conceitos-básicos)
2. [Entrar no sistema](#2-entrar-no-sistema)
3. [Níveis de acesso](#3-níveis-de-acesso)
4. [Navegação](#4-navegação)
5. [Dashboard](#5-dashboard)
6. [Colaboradores](#6-colaboradores) *(Administrador)*
7. [Projetos](#7-projetos) *(Administrador)*
8. [Usuários](#8-usuários) *(Administrador)*
9. [Períodos](#9-períodos)
10. [Solicitações](#10-solicitações)
11. [Calendário](#11-calendário)
12. [Regras do sistema](#12-regras-do-sistema)
13. [Dúvidas frequentes](#13-dúvidas-frequentes)

---

## 1. Conceitos básicos

| Termo | O que significa |
|---|---|
| **Colaborador** | Pessoa cadastrada no sistema, identificada apenas pelo **nome completo**, que não pode se repetir. O sistema não guarda e-mail nem outros contatos. |
| **Usuário** | Conta de acesso ao sistema: nome de usuário (ex.: `joao.silva`) e senha. Cada usuário pertence a um colaborador. Um colaborador pode não ter usuário; nesse caso, as ausências dele são lançadas por um administrador. |
| **Nível de acesso** | O que o usuário pode fazer: Administrador, Coordenador ou Colaborador (veja a [seção 3](#3-níveis-de-acesso)). |
| **Coordenador** | Colaborador autorizado a analisar (aprovar ou recusar) as solicitações de outras pessoas. Nunca analisa a própria. |
| **Administrador** | Usuário com acesso total, normalmente o coordenador do setor. Também não decide a própria solicitação. |
| **Projeto** | Equipe de colaboradores que trabalham juntos e cujas ausências precisam ser coordenadas. |
| **Pessoa crítica** | Colaborador cuja ausência afeta um projeto específico. Uma pessoa pode ser crítica em um projeto e não em outro. |
| **Período** | Intervalo de datas em que o colaborador estará ausente, de **10 a 30 dias**. |
| **Retorno** | Dia em que o colaborador volta ao trabalho. **O dia de retorno não conta como ausência.** |
| **Solicitação** | Pedido para que de 1 a 3 períodos de um colaborador sejam analisados por um coordenador. |
| **Abono** | Tipo de solicitação com limites menores: no máximo 2 períodos e 20 dias no total. |
| **Conflito** | Quando a ausência de um colaborador coincide com a de uma pessoa crítica do mesmo projeto. |
| **Decisão** | A aprovação ou recusa de uma solicitação. O sistema registra quem decidiu e quando. |

> **Exemplo de período:** Início em 15/10 e Retorno em 25/10 significam que a pessoa fica ausente de 15/10 a 24/10 (10 dias) e volta a trabalhar no dia 25/10.

### Status de uma solicitação

Os status sempre aparecem com cor, ícone e texto:

| Status | Significado | O que ainda pode ser feito |
|---|---|---|
| ⏳ **Em análise** | Aguardando decisão do coordenador. | Editar, validar conflitos, aprovar, recusar, excluir |
| ⚠️ **Conflito encontrado** | A validação encontrou sobreposição com uma pessoa crítica. | Editar, validar de novo, aprovar (com aviso), recusar, excluir |
| ✅ **Aprovada** | O coordenador (ou um administrador) aceitou. Decisão final. | Apenas excluir (administrador) |
| ❌ **Recusada** | O coordenador (ou um administrador) rejeitou, com justificativa. Decisão final. | Apenas excluir (administrador) |

---

## 2. Entrar no sistema

### 2.1 Login

Abra o sistema no navegador e informe o **nome de usuário** e a **senha** fornecidos pelo administrador. O ícone de olho ao lado da senha mostra o que foi digitado.

![Tela de login](imagens/21-login.png)

- O nome de usuário não diferencia maiúsculas de minúsculas: `Joao.Silva` e `joao.silva` são o mesmo usuário.
- Se o usuário ou a senha estiverem errados, aparece a mensagem "Usuário ou senha inválidos.". Por segurança, o sistema não diz qual dos dois está errado.
- Após **5 tentativas erradas**, o login fica bloqueado por **15 minutos**.

> **Modo demonstração:** quando o sistema roda sem o servidor (só para apresentações e treinamentos), a tela de login lista três usuários fictícios. Basta clicar em um deles para entrar: `admin`, `coordenador` ou `colaborador`, todos com a senha `demo123`.

### 2.2 Primeiro acesso: definir a sua senha

A senha que o administrador entrega é **temporária**. Logo após o primeiro login, o sistema pede que você crie a sua própria senha antes de liberar qualquer outra tela:

![Definir nova senha](imagens/22-trocar-senha.png)

1. Em **Senha temporária**, digite a senha recebida do administrador.
2. Em **Nova senha**, escolha uma senha com pelo menos **8 caracteres**.
3. Repita a nova senha em **Confirme a nova senha**.
4. Clique em **Salvar nova senha**.

A partir daí, a senha temporária deixa de funcionar e **só você conhece a nova senha**: nem o administrador tem acesso a ela.

### 2.3 Esqueci a minha senha

O sistema não envia e-mails. Peça ao **administrador** uma nova senha temporária (veja a [seção 8.3](#83-redefinir-senha)). No próximo login, você vai criar uma nova senha, como no primeiro acesso.

### 2.4 Sair

O seu nome, o nome de usuário e o nível de acesso aparecem no rodapé do menu lateral. Clique em **Sair** para encerrar a sessão. Por segurança, a sessão também expira sozinha depois de **8 horas sem uso**.

---

## 3. Níveis de acesso

| O que pode fazer | Administrador | Coordenador | Colaborador |
|---|:---:|:---:|:---:|
| Cadastrar colaboradores e projetos, tornar coordenador | ✅ | — | — |
| Criar e gerenciar usuários (acessos) | ✅ | — | — |
| Ver solicitações | todas | as suas e as atribuídas a ele | as suas |
| Criar e editar solicitações e períodos | de qualquer colaborador | os seus | os seus |
| Validar conflitos | todas | as suas e as atribuídas a ele | as suas |
| Aprovar e recusar | qualquer uma, exceto a própria | as atribuídas a ele, exceto a própria | — |
| Excluir solicitações | qualquer uma | as suas, antes da decisão | as suas, antes da decisão |
| Calendário | todas as ausências | as suas e as dos colegas de projeto | as suas e as dos colegas de projeto |

- Quem não é administrador tem o nível definido pelo cadastro: se o colaborador é **coordenador**, o acesso é de Coordenador; caso contrário, de Colaborador.
- O menu mostra apenas as áreas do seu nível. Coordenadores e colaboradores veem **Dashboard**, **Períodos**, **Solicitações** e **Calendário**:

![Dashboard de um colaborador](imagens/25-colaborador-dashboard.png)

---

## 4. Navegação

O menu lateral, à esquerda, dá acesso às áreas do seu nível de acesso. No celular, o menu fica escondido: toque no ícone **☰**, no canto superior esquerdo, para abri-lo.

![Menu no celular](imagens/20-celular-menu.png)

**Dicas gerais**

- Todas as exclusões pedem confirmação antes de serem feitas.
- Enquanto uma operação está em andamento, o botão fica desabilitado. Isso evita salvar duas vezes.
- O resultado de cada ação aparece numa mensagem no canto inferior direito da tela: verde para sucesso, vermelha para erro e laranja para aviso.
- Os erros de preenchimento aparecem em vermelho, logo abaixo do campo com problema.
- Os filtros das listagens são guardados no endereço da página. Ao abrir um detalhe e voltar, os filtros continuam aplicados.

### Modo demonstração

No modo demonstração, o rodapé do menu mostra a etiqueta **Modo demonstração** e o botão **Restaurar dados**, que descarta todas as alterações e recarrega os dados iniciais. É útil para treinamentos.

![Restaurar dados de demonstração](imagens/19-restaurar.png)

---

## 5. Dashboard

É a tela inicial, com um resumo da situação. O conteúdo depende do seu nível de acesso.

![Dashboard do administrador](imagens/01-dashboard.png)

- **Indicadores** (cartões no topo): quantas solicitações existem em cada status, considerando as que você pode ver. O administrador também vê o total de colaboradores e projetos. **Clique em um cartão** para abrir a lista já filtrada.
- **Próximas ausências**: períodos em andamento ou futuros. Para coordenadores e colaboradores, as ausências de colegas de projeto aparecem com a etiqueta "Colega de projeto".
- **Aguardando decisão**: para o administrador, todas as solicitações pendentes. Para o coordenador, as que esperam a decisão dele ("Aguardando sua decisão"). Para o colaborador, as suas em análise.
- **Nova solicitação**: atalho para criar um pedido.

---

## 6. Colaboradores

*Área exclusiva do administrador.*

### 6.1 Listagem

![Lista de colaboradores](imagens/02-colaboradores.png)

- Use a **busca** para filtrar pelo nome. Acentos e letras maiúsculas são ignorados.
- A coluna **Perfil** indica quem é **Coordenador**.
- A coluna **Acesso ao sistema** mostra o nome de usuário do colaborador, ou "Sem acesso".
- Ícones de ação em cada linha:

| Ícone | Ação |
|---|---|
| 👁 | Ver detalhes do colaborador |
| ✏️ | Editar o nome |
| 🛡 | Tornar coordenador (desabilitado para quem já é) |
| 🗑 | Excluir |

### 6.2 Cadastrar ou editar

1. Clique em **Novo colaborador**, ou no ícone ✏️ da linha.
2. Preencha o **Nome completo**. Ele identifica o colaborador e não pode se repetir: se já existir alguém com o mesmo nome, diferencie-o (por exemplo, "João Silva Souza").
3. Em **Acesso ao sistema**, ligue **Criar acesso para este colaborador** se a pessoa for entrar no sistema e preencha:
   - **Nome de usuário**: de 3 a 30 caracteres, com letras, números, ponto, hífen ou sublinhado (ex.: `joao.silva`);
   - **Senha temporária**: pelo menos 8 caracteres;
   - **Administrador**: marque só se a pessoa precisar de acesso total.
4. Clique em **Salvar**.
5. **Entregue a senha temporária à pessoa** (pessoalmente, por telefone ou pelo chat interno). Ela será obrigada a trocá-la no primeiro acesso.

![Novo colaborador com acesso ao sistema](imagens/03-colaborador-novo.png)

Se o colaborador já tem acesso, a seção mostra o nome de usuário e indica a tela **Usuários** para redefinir a senha ou desativar a conta.

### 6.3 Tornar coordenador

Clique no ícone 🛡 na lista, ou no botão **Tornar coordenador** na página do colaborador, e confirme. A partir daí, a pessoa aparece como opção de coordenador nas solicitações. Se ela tiver acesso ao sistema, passa a ter o nível de Coordenador.

### 6.4 Página do colaborador

Clique no nome do colaborador para ver tudo sobre ele em um só lugar:

![Detalhe do colaborador](imagens/04-colaborador-detalhe.png)

- No topo: se é coordenador e se tem acesso ao sistema.
- **Períodos**: as ausências cadastradas e a solicitação de cada uma.
- **Solicitações**: os pedidos feitos por ele.
- **Projetos**: os projetos de que participa, com destaque em laranja para aqueles em que é pessoa crítica.
- **Solicitações sob sua análise**: só aparece para coordenadores.

### 6.5 Excluir

Só é possível excluir colaboradores **sem períodos e sem solicitações** vinculados. Se o colaborador tiver **acesso ativo** ao sistema, desative o usuário dele antes (veja a [seção 8.4](#84-desativar-e-reativar)).

---

## 7. Projetos

*Área exclusiva do administrador.*

### 7.1 Listagem

![Lista de projetos](imagens/05-projetos.png)

A lista mostra quantos colaboradores cada projeto tem e quem são as **pessoas críticas**. Nas ações de cada linha:

- 👥 **Ver colaboradores**: lista os membros e indica quem é pessoa crítica.
- ✏️ **Editar**
- 🗑 **Excluir**

### 7.2 Cadastrar ou editar

1. Clique em **Novo projeto**, ou no ícone ✏️.
2. Informe o **Nome**.
3. Em **Colaboradores**, selecione os membros. Digite para buscar; é possível escolher vários.
4. Em **Pessoas críticas**, escolha quem é essencial para o projeto. Só aparecem os colaboradores selecionados no passo anterior.
5. Clique em **Salvar**.

![Edição de projeto](imagens/06-projeto-editar.png)

> Ao remover um colaborador do projeto, ele também deixa de ser pessoa crítica desse projeto.

**Por que isso importa:** a detecção de conflitos e o que cada colaborador vê no calendário dependem dos projetos. Mantê-los atualizados é o que torna os avisos confiáveis.

---

## 8. Usuários

*Área exclusiva do administrador.* Aqui ficam as contas de acesso ao sistema.

![Tela de usuários](imagens/23-usuarios.png)

A coluna **Situação** mostra:

| Situação | Significado |
|---|---|
| **Ativo** | A pessoa entra normalmente. |
| **Troca de senha pendente** | Ainda não fez o primeiro acesso ou teve a senha redefinida. |
| **Bloqueado** | Errou a senha 5 vezes; o bloqueio termina sozinho em 15 minutos. |
| **Desativado** | Não entra mais no sistema; o histórico é preservado. |

### 8.1 Criar acesso

Clique em **Novo acesso**, escolha o colaborador (só aparecem os que ainda não têm acesso) e preencha nome de usuário, senha temporária e, se for o caso, **Administrador**. Também é possível criar o acesso no cadastro do colaborador (veja a [seção 6.2](#62-cadastrar-ou-editar)). Entregue a senha temporária à pessoa.

### 8.2 Administrador

Use o ícone 🛡 para **tornar administrador** ou **remover administrador**. Você não pode remover o seu próprio acesso de administrador, e o sistema sempre mantém pelo menos um administrador ativo.

### 8.3 Redefinir senha

Quando alguém esquecer a senha:

1. Clique no ícone 🔑 **Redefinir senha** na linha da pessoa.
2. Digite uma nova senha temporária (pelo menos 8 caracteres) e clique em **Redefinir**.
3. Entregue a senha temporária à pessoa. No próximo login, ela vai criar uma nova senha.

![Redefinir senha](imagens/24-redefinir-senha.png)

A redefinição também encerra as sessões que a pessoa tinha abertas e desfaz um eventual bloqueio por tentativas erradas.

### 8.4 Desativar e reativar

Quando alguém sai do setor, use o ícone ⊘ **Desativar**. A pessoa não consegue mais entrar e é desconectada na hora, mas as solicitações que criou ou decidiu continuam no histórico. Para devolver o acesso, use **Reativar**. Não é possível desativar o próprio acesso.

---

## 9. Períodos

### 9.1 Listagem

![Lista de períodos](imagens/07-periodos.png)

- O **administrador** vê os períodos de todos e pode usar **Filtrar por colaborador**. Coordenadores e colaboradores veem **apenas os próprios períodos**.
- Colunas **Início**, **Último dia** (último dia de ausência) e **Retorno** (dia da volta).
- **Solicitação**: número e status da solicitação que usa o período, ou "Sem solicitação".
- **Ver no calendário**: abre o calendário com o mesmo filtro.

### 9.2 Cadastrar ou editar

1. Clique em **Novo período**, ou no ícone ✏️.
2. O **Colaborador** já vem preenchido com você. O administrador pode escolher qualquer colaborador.
3. Escolha a data de **Início** (primeiro dia de ausência) e a de **Retorno** (dia em que a pessoa volta). As datas podem ser digitadas no formato dd/mm/aaaa ou escolhidas no ícone de calendário.
4. Confira o quadro de resumo. Verde indica que o período é válido e mostra os dias exatos de ausência; azul é o lembrete da regra de 10 a 30 dias.
5. Clique em **Salvar**.

![Edição de período](imagens/08-periodo-editar.png)

**Restrições**

- O período deve ter entre 10 e 30 dias.
- Um colaborador não pode ter dois períodos que se sobreponham.
- Períodos de solicitações **aprovadas** não podem ser editados.
- Ao editar um período de uma solicitação ainda em aberto, o total de dias é recalculado e a solicitação **volta para Em análise**.
- Não é possível excluir um período que faz parte de uma solicitação. Remova-o da solicitação primeiro.

---

## 10. Solicitações

### 10.1 Listagem e filtros

![Lista de solicitações](imagens/09-solicitacoes.png)

A lista mostra só as solicitações que você pode ver (veja a [seção 3](#3-níveis-de-acesso)). Filtros disponíveis, que podem ser combinados:

| Filtro | Uso |
|---|---|
| **Busca** | Número da solicitação (ex.: `7` ou `#7`), nome do colaborador ou do coordenador, ou texto da observação |
| **Status** | Em análise, Conflito encontrado, Aprovada ou Recusada |
| **Colaborador** | Somente os pedidos de uma pessoa (administrador e coordenador) |
| **Ausente de / Até** | Solicitações com ausência em algum dia desse intervalo |

![Lista filtrada por status](imagens/10-solicitacoes-filtro.png)

**Indicadores** na lista: **Abono**, **Pessoa crítica** e o ícone ❗ vermelho para solicitações que violam alguma regra. Passe o mouse sobre o ícone para ver o motivo.

### 10.2 Criar uma solicitação

1. Clique em **Nova solicitação**.
2. **Colaborador**: já vem preenchido com você. Só o administrador pode criar solicitações para outras pessoas.
3. **Coordenador**: escolha quem vai analisar. Só aparecem coordenadores, e você nunca aparece como opção.
4. **Períodos**: marque de 1 a 3 períodos. Se o período desejado ainda não existe, clique em **Cadastrar novo período**; depois de salvo, ele já vem marcado.
5. **Abono e observação**: ligue **Solicitação de abono**, se for o caso, e escreva uma observação (opcional).
6. Confira o **Resumo**, à direita. **Total de dias** e **Pessoa crítica** são calculados automaticamente.
7. Clique em **Criar solicitação**. Ela é criada com status **Em análise**.

![Formulário de nova solicitação](imagens/11-solicitacao-nova.png)

Se algum campo obrigatório ficar vazio, o sistema mostra o que falta:

![Formulário com campos obrigatórios](imagens/12-solicitacao-nova-erros.png)

### 10.3 Página da solicitação

![Detalhe da solicitação](imagens/13-solicitacao-detalhe.png)

- No topo: número, status e data de criação, e os botões **Validar conflitos**, **Aprovar** e **Recusar**. Os botões só aparecem para quem pode usá-los: **Aprovar** e **Recusar** aparecem para o coordenador escolhido e para o administrador, nunca para o próprio solicitante.
- **Sobreposições com pessoas críticas** *(administrador)*: quem está ausente nas mesmas datas, de qual projeto e em qual solicitação.
- **Gerenciar**: **Editar** e **Excluir**, habilitados conforme a [seção 3](#3-níveis-de-acesso).

### 10.4 Validar conflitos

Clique em **Validar conflitos** para registrar o resultado no status:

- **Com conflito**: o status muda para **Conflito encontrado**, e uma mensagem informa com quem e em qual projeto.
- **Sem conflito**: o status permanece, ou volta para **Em análise** se antes havia conflito.

![Resultado da validação de conflitos](imagens/14-validar-conflito.png)

> Períodos que apenas se encostam (um termina no dia em que o outro começa) **não** são conflito.

### 10.5 Aprovar

1. Clique em **Aprovar**.
2. Confirme. Se a solicitação estiver com **Conflito encontrado**, o sistema mostra um aviso extra e o botão passa a se chamar **Aprovar mesmo assim**.

![Confirmação de aprovação](imagens/15-aprovar.png)

A aprovação é definitiva. O topo da solicitação passa a mostrar **quem decidiu e quando**. Se um administrador decidir no lugar do coordenador escolhido, aparece "(administrador)" ao lado do nome, e o coordenador escolhido continua registrado.

![Solicitação aprovada, com o registro da decisão](imagens/26-decisao.png)

### 10.6 Recusar

1. Clique em **Recusar**.
2. Escreva o motivo no campo **Observação**. **A observação é obrigatória.**
3. Clique em **Recusar** para confirmar.

![Recusa exige observação](imagens/16-recusar.png)

A recusa também é definitiva e fica registrada com quem decidiu e quando.

### 10.7 Editar

O próprio colaborador ou um administrador pode editar solicitações **Em análise** ou com **Conflito encontrado**. Ao salvar, a solicitação **volta para Em análise** e deve ser validada de novo.

### 10.8 Solicitações que violam regras

Solicitações antigas podem ter sido gravadas antes das regras atuais (por exemplo, um abono com 3 períodos). Nesse caso, a página mostra um alerta vermelho explicando o problema. Elas não podem ser aprovadas nem recusadas até serem corrigidas: clique em **Editar** e ajuste.

![Solicitação que viola regras](imagens/17-solicitacao-invalida.png)

### 10.9 Excluir

O colaborador pode excluir as próprias solicitações **antes da decisão**; o administrador pode excluir qualquer uma. **Os períodos continuam cadastrados** e ficam livres para uma nova solicitação.

---

## 11. Calendário

Mostra as ausências mês a mês.

![Calendário do administrador](imagens/18-calendario.png)

- **Navegação**: as setas avançam ou voltam um mês, e **Hoje** retorna ao mês atual.
- **Cores**: cada ausência tem a cor do status da solicitação (veja a legenda abaixo do calendário). Períodos sem solicitação aparecem em cinza.
- **Conflitos**: ausências envolvidas em conflito com pessoa crítica têm o símbolo ⚠ e contorno tracejado vermelho.
- **Filtros**: por **Colaborador** e por **Status** (é possível marcar vários).
- **Clique em uma ausência** para abrir a solicitação.
- A barra termina no último dia de ausência. O dia de retorno não é pintado.

**Para coordenadores e colaboradores**, o calendário também mostra, em cinza-claro, as ausências planejadas dos **colegas dos mesmos projetos**, para ajudar a escolher datas sem conflito. Elas mostram só o nome e as datas: os detalhes da solicitação do colega não ficam visíveis, e o clique não abre nada.

![Calendário de um colaborador, com a ausência de um colega](imagens/27-calendario-colaborador.png)

---

## 12. Regras do sistema

| Regra | Onde se aplica |
|---|---|
| O nome completo do colaborador é único (sem diferenciar maiúsculas). | Colaboradores |
| Cada colaborador tem no máximo um usuário; o nome de usuário é único. | Usuários |
| Senha com pelo menos 8 caracteres; senha temporária deve ser trocada no primeiro acesso. | Usuários |
| 5 tentativas de senha erradas bloqueiam o login por 15 minutos. | Login |
| A sessão expira após 8 horas sem uso. | Login |
| O período deve ter de 10 a 30 dias, e o retorno deve ser posterior ao início. | Períodos |
| Os períodos de um mesmo colaborador não podem se sobrepor. | Períodos |
| Uma solicitação tem de 1 a 3 períodos, todos do próprio solicitante. | Solicitações |
| Abono: no máximo 2 períodos e 20 dias no total. | Solicitações |
| O coordenador precisa ter perfil de coordenador e ser outra pessoa. | Solicitações |
| Ninguém aprova ou recusa a própria solicitação, nem o administrador. | Solicitações |
| Total de dias e Pessoa crítica são calculados pelo sistema. | Solicitações |
| Recusar exige observação. | Solicitações |
| Aprovadas e recusadas não podem ser editadas. | Solicitações |
| Pessoas críticas precisam ser membros do projeto. | Projetos |
| Não é possível excluir um colaborador com acesso ativo, períodos ou solicitações. | Colaboradores |

---

## 13. Dúvidas frequentes

**Esqueci a minha senha. Como recupero?**
Peça ao administrador uma senha temporária. No próximo login, você vai definir uma nova senha. O sistema não envia e-mails.

**Aparece "Muitas tentativas incorretas".**
O login foi bloqueado após 5 senhas erradas. Espere 15 minutos ou peça ao administrador para redefinir a senha, o que desfaz o bloqueio.

**Por que não vejo as telas de Colaboradores, Projetos e Usuários?**
Elas são exclusivas do administrador. Se precisar cadastrar algo, peça a ele.

**Não consigo escolher outro colaborador ao criar uma solicitação.**
Coordenadores e colaboradores criam solicitações apenas para si mesmos. Só o administrador cria para outras pessoas.

**O botão "Aprovar" não aparece para mim.**
Só o coordenador escolhido na solicitação e o administrador podem aprovar ou recusar, e nunca a própria solicitação.

**Por que o meu período de 15/10 a 24/10 dá erro de duração mínima?**
Porque a segunda data é o **Retorno**, e o dia de retorno não conta como ausência. Para ficar ausente até 24/10, informe Retorno em 25/10, o que dá 10 dias.

**O coordenador que eu quero não aparece na lista.**
Ele precisa ter o perfil de coordenador. Peça ao administrador para usar **Tornar coordenador** na tela de Colaboradores.

**Validei e deu conflito. Posso aprovar mesmo assim?**
Sim, se você for o coordenador escolhido ou o administrador. O sistema pede uma confirmação extra (**Aprovar mesmo assim**).

**Aprovei por engano. Como desfaço?**
A aprovação é definitiva. Peça ao administrador para excluir a solicitação (os períodos são mantidos) e crie uma nova.

**Alguém saiu do setor. O que faço com o acesso?**
O administrador desativa o usuário na tela **Usuários**. O histórico continua preservado.
