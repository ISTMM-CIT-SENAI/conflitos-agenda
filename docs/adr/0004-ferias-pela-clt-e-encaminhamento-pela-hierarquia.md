# Férias pela CLT e encaminhamento pela hierarquia

As férias seguem a CLT: no ano, até 3 períodos, um com pelo menos 14 dias e os demais com pelo menos 5, até 30 dias (20 com abono pecuniário), sem começar nos 2 dias que antecedem domingo ou feriado (nacionais e de Belo Horizonte). Uma solicitação é só uma parte das férias: quem tira 15 dias agora pode não saber quando tirará os outros 15. Por isso as regras valem para o saldo do ano (as solicitações não recusadas daquele ano somadas), e o período de 14 dias é exigido só quando deixaria de caber. Primeiro tentamos exigir os 30 dias num só pedido, mas isso obrigava a pessoa a decidir o ano inteiro de uma vez.

Como não temos a data de admissão de cada pessoa, o período aquisitivo foi trocado pelo ano civil, contado pelo primeiro dia de ausência de cada solicitação. Se a data de admissão for cadastrada um dia, essa regra pode passar a usá-la.

O solicitante não escolhe quem analisa: cada colaborador tem um "Responde a" (supervisor ou o Coordenador), e a solicitação vai para ele, ficando registrada mesmo que a hierarquia mude depois. O Coordenador não responde a ninguém no sistema, então a solicitação dele já nasce aprovada, em vez de abrir uma exceção à regra de que ninguém decide a própria.

Os nomes dos níveis passaram a ser os do instituto: o antigo Administrador é o **Coordenador**, e o antigo Coordenador é o **Supervisor**, inclusive no código e no banco, para não haver duas palavras para a mesma coisa.

## Consequências

- O banco já vem com as pessoas e os projetos do ISTMM (`data/seed-istmm.json`, gerado de funcionarios.xlsx e pontos focais.xlsx). Cada pessoa recebe uma senha temporária aleatória, gravada uma única vez em `credenciais-iniciais.csv` (fora do git) para o Coordenador entregar individualmente.
- Com abono, 3 períodos são impossíveis na prática (14 + 5 + 5 passa de 20).
- O abono marcado em qualquer solicitação do ano baixa o limite do ano inteiro para 20 dias.
- Feriados estaduais e municipais de outras cidades e o Carnaval não são considerados.
