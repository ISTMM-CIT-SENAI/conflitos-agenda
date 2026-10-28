# Conflitos de Agenda

Organiza os períodos de ausência dos colaboradores e a análise das solicitações dessas ausências, detectando quando a ausência de uma pessoa crítica coincide com a de outra no mesmo projeto.

## Linguagem

### Pessoas e projetos

**Colaborador**:
Pessoa cadastrada no sistema, identificada apenas pelo nome completo, que é único. O sistema não guarda e-mail nem outros contatos.
_Evitar_: Funcionário, usuário, pessoa

**Usuário**:
Conta de acesso ao sistema, identificada por um nome de usuário (ex.: `arthur.amaral`) e uma senha, e sempre pertencente a exatamente um Colaborador. Um Colaborador tem no máximo um Usuário e pode não ter nenhum. O Usuário é quem entra no sistema; o Colaborador é quem se ausenta. Um Usuário desativado não entra mais, mas seu histórico é preservado.
_Evitar_: Login, conta, colaborador

**Nível de acesso**:
O que um Usuário pode fazer no sistema: Coordenador, Supervisor ou Colaborador. Fora o Coordenador, o nível é derivado do Colaborador ligado ao Usuário: Supervisor se ele for Supervisor; senão, Colaborador.
_Evitar_: Perfil, papel, role, permissão

**Coordenador**:
Usuário com acesso total, o coordenador do setor: mantém colaboradores, projetos e usuários, vê tudo e pode decidir qualquer Solicitação, exceto a própria. Também é um Colaborador; como não responde a ninguém no sistema, a Solicitação dele já é registrada Aprovada (a aprovação acontece fora do sistema).
_Evitar_: Administrador, admin, gestor, superusuário

**Supervisor**:
Colaborador que recebe e analisa as Solicitações de quem responde a ele. Nunca analisa a própria Solicitação.
_Evitar_: Coordenador (é outro nível), gestor, aprovador, chefe

**Responde a**:
O Supervisor (ou o Coordenador) a quem um Colaborador está subordinado. As Solicitações do Colaborador são encaminhadas automaticamente a ele. Só o Coordenador não responde a ninguém.
_Evitar_: Chefe, gestor imediato

**Projeto**:
Agrupamento de Colaboradores que trabalham juntos e cujas ausências precisam ser coordenadas.
_Evitar_: Equipe, time

**Pessoa Crítica**:
Colaborador, de qualquer nível, cuja ausência afeta um Projeto específico. Ser Pessoa Crítica é sempre relativo a um Projeto.
_Evitar_: Pessoa-chave, essencial

### Ausências

**Período**:
Intervalo contínuo de datas (sem horário) em que um Colaborador estará ausente, com duração entre 5 e 30 dias, contada como `dataFim − dataInicio`. Não pode começar nos 2 dias que antecedem um domingo ou feriado (CLT, art. 134, §3º). Cada Período pertence a no máximo uma Solicitação não Recusada, e os Períodos de um mesmo Colaborador não se sobrepõem.
_Evitar_: Intervalo, férias, folga

**Retorno**:
A `dataFim` de um Período: o dia em que o Colaborador volta, que não conta como dia de ausência. Em 15/10 → 25/10, a ausência vai de 15 a 24.
_Evitar_: Data final, último dia

**Feriado**:
Feriado nacional ou municipal de Belo Horizonte (Sexta-feira da Paixão, Corpus Christi, 15/8 e 8/12). Carnaval não é feriado: é ponto facultativo e o instituto trabalha.

**Solicitação**:
Pedido de uma parte (ou do todo) das férias de um ano: de 1 a 3 Períodos já cadastrados, encaminhados a quem o Colaborador responde. O ano é o civil do primeiro dia de ausência. Segue a CLT (art. 134) pelo **Saldo de Férias** do ano, não pedido a pedido.
_Evitar_: Pedido, requisição

**Decisão**:
Aprovação ou recusa de uma Solicitação, registrada com quem decidiu e quando. Normalmente é tomada pelo Supervisor encaminhado, mas o Coordenador pode decidir no lugar dele; o Supervisor encaminhado continua registrado.
_Evitar_: Análise, parecer, avaliação

**Saldo de Férias**:
Quanto o Colaborador ainda pode pedir num ano civil, somando as Solicitações não Recusadas daquele ano: no máximo 3 Períodos e 30 dias (20 se alguma tiver Abono), e um dos Períodos precisa ter pelo menos 14 dias. Por isso um pedido é recusado quando, sem nenhum Período de 14 dias até ali, não sobraria espaço para ele. Ninguém é obrigado a completar os 30 dias.

**Total de Dias**:
Soma das durações dos Períodos de uma Solicitação. É sempre calculado, nunca informado.

**Abono**:
Abono pecuniário (CLT, art. 143): o Colaborador vende 10 dias. Se qualquer Solicitação do ano tiver Abono, o Saldo de Férias daquele ano cai para 20 dias.
_Evitar_: Venda de férias

**Conflito**:
Sobreposição entre um Período de uma Solicitação e um Período de outra Solicitação, não Recusada, de uma Pessoa Crítica do mesmo Projeto. Períodos que apenas se tocam (um termina no dia em que o outro começa) não são Conflito.
_Evitar_: Choque, colisão

### Status da Solicitação

**Em análise**:
Estado inicial de uma Solicitação, aguardando decisão do Supervisor.

**Conflito encontrado**:
Estado de uma Solicitação em que a validação detectou um Conflito. Ainda pode ser aprovada ou recusada.

**Aprovada**:
Estado final: a Solicitação foi aceita. Não pode mais ser editada.

**Recusada**:
Estado final: a Solicitação foi rejeitada, sempre com uma observação justificando. Não pode mais ser editada.
