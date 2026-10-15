# `dataFim` do Período é o dia de retorno (exclusivo)

A `dataFim` de um Período é o dia em que o Colaborador volta, não o último dia de ausência. Essa é a única leitura coerente com duas regras do backend: a duração é calculada como `dataFim − dataInicio`, e períodos adjacentes (A termina no mesmo dia em que B começa) não são conflito. Por isso a interface rotula o campo como "Retorno", e o calendário pinta a ausência até o dia anterior.
