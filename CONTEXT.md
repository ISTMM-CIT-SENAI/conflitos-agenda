# Conflitos de Agenda

Organiza os períodos de ausência dos colaboradores e a análise das solicitações dessas ausências, detectando quando a ausência de uma pessoa crítica coincide com a de outra no mesmo projeto.

## Linguagem

### Pessoas e projetos

**Colaborador**:
Pessoa cadastrada no sistema, identificada por nome e e-mail.
_Evitar_: Funcionário, usuário, pessoa

**Coordenador**:
Colaborador habilitado a analisar Solicitações de outros colaboradores. Nunca analisa a própria Solicitação.
_Evitar_: Gestor, aprovador, chefe

**Projeto**:
Agrupamento de Colaboradores que trabalham juntos e cujas ausências precisam ser coordenadas.
_Evitar_: Equipe, time

**Pessoa Crítica**:
Colaborador cuja ausência afeta um Projeto específico. Ser Pessoa Crítica é sempre relativo a um Projeto.
_Evitar_: Pessoa-chave, essencial

### Ausências

**Período**:
Intervalo contínuo de datas (sem horário) em que um Colaborador estará ausente, com duração entre 10 e 30 dias, contada como `dataFim − dataInicio`. Cada Período pertence a no máximo uma Solicitação não Recusada, e os Períodos de um mesmo Colaborador não se sobrepõem.
_Evitar_: Intervalo, férias, folga

**Retorno**:
A `dataFim` de um Período: o dia em que o Colaborador volta, que não conta como dia de ausência. Em 15/10 → 25/10, a ausência vai de 15 a 24.
_Evitar_: Data final, último dia

**Solicitação**:
Pedido de um Colaborador para que de 1 a 3 Períodos já cadastrados sejam analisados por um Coordenador.
_Evitar_: Pedido, requisição

**Total de Dias**:
Soma das durações dos Períodos de uma Solicitação. É sempre calculado, nunca informado.

**Abono**:
Modalidade de Solicitação limitada a no máximo 2 Períodos e 20 dias no total.
_Evitar_: Venda de férias

**Conflito**:
Sobreposição entre um Período de uma Solicitação e um Período de outra Solicitação, não Recusada, de uma Pessoa Crítica do mesmo Projeto. Períodos que apenas se tocam (um termina no dia em que o outro começa) não são Conflito.
_Evitar_: Choque, colisão

### Status da Solicitação

**Em análise**:
Estado inicial de uma Solicitação, aguardando decisão do Coordenador.

**Conflito encontrado**:
Estado de uma Solicitação em que a validação detectou um Conflito. Ainda pode ser aprovada ou recusada.

**Aprovada**:
Estado final: o Coordenador aceitou a Solicitação. Não pode mais ser editada.

**Recusada**:
Estado final: o Coordenador rejeitou a Solicitação, sempre com uma observação justificando. Não pode mais ser editada.
