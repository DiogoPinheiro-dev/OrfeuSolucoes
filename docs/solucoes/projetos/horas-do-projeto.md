# Horas do projeto

## Objetivo

Acompanhar as horas lançadas em cada projeto, decidir apontamentos enviados, controlar competências mensais e consultar o impacto financeiro das horas aprovadas.

## Pré-requisitos

- Ter acesso ao Gerenciador de Projetos e à funcionalidade **Horas do projeto**.
- Possuir acesso ao projeto selecionado.
- Receber as ações específicas de aprovação, reabertura ou fechamento para executar cada decisão correspondente.

## Como acessar

No Hub, abra **Gerenciador de Projetos**, selecione **Controle de horas** e escolha a aba **Horas do projeto**. Se essa for a única aba autorizada, ela será aberta diretamente, sem a barra de abas.

## Consultar horas

Selecione o projeto e informe o início e o fim do período. É possível filtrar por pessoa, item do backlog e situação. A tela apresenta totais gerais, por pessoa e por item, além das competências alcançadas pelo intervalo e da lista paginada de apontamentos.

Projetos arquivados podem ser incluídos na consulta, mas permanecem em modo somente leitura. Informações de custo só aparecem quando o usuário também possui a autorização financeira necessária.

## Decidir apontamentos

- Para aprovar ou rejeitar em lote, marque somente apontamentos enviados e use a ação correspondente. A rejeição exige um motivo.
- Para reabrir, selecione um apontamento aprovado e informe o motivo. Ele volta para rascunho e o custo calculado é removido.
- Para fechar uma competência, confirme o mês após tratar os apontamentos pendentes. A reabertura exige autorização e motivo.
- Quando houver horas aprovadas sem custo calculado, use **Recalcular custos pendentes** depois de corrigir as taxas ou vínculos necessários.

## Permissões e estados protegidos

- `aprovar_horas` permite aprovar e rejeitar os lançamentos elegíveis.
- `reabrir_horas` permite devolver um lançamento aprovado para rascunho.
- `fechar_periodo` permite fechar e reabrir competências mensais.
- A empresa, o projeto, a participação do usuário, o estado do lançamento e a versão atual são validados pelo backend.
- A interface não oferece decisões incompatíveis com o estado atual, mas a proteção não depende apenas do botão.

## Resultado esperado

Apontamentos aprovados entram nos totais consolidados. Quando existe uma linha de custo e uma taxa válida, o valor calculado fica congelado no lançamento e compõe o realizado por horas do orçamento. Fechar a competência impede novos lançamentos ou alterações no período até uma reabertura autorizada.

## Erros comuns

- **Período inválido:** informe as duas datas, com o fim igual ou posterior ao início.
- **Apontamento não pode ser decidido:** confirme que ele ainda está enviado e atualize a lista.
- **Horas sem custo:** revise a capacitação, a taxa vigente e a linha de custo associada antes de recalcular.
- **Competência não pode ser fechada:** trate os apontamentos pendentes e confirme sua permissão para fechar o período.
