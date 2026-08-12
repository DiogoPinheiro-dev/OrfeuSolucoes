# Cadastro de projetos

## Objetivo

Criar, consultar e manter os projetos da empresa ativa, incluindo ciclo de vida, responsável e equipe.

## Como acessar

No Hub, abra **Gerenciador de Projetos** e selecione **Cadastro de projetos**.

## Consultar projetos

A listagem permite pesquisar e filtrar por metodologia, situação e saúde. A paginação é processada pelo servidor. Quando necessário, habilite a opção de incluir projetos arquivados.

## Criar ou alterar

1. Selecione **Incluir** ou escolha um projeto e selecione **Alterar**.
2. Informe chave, nome, objetivo e descrição.
3. Defina metodologia, situação, saúde e datas aplicáveis.
4. Selecione o responsável e os integrantes da equipe.
5. Revise os dados e salve.

As metodologias disponíveis são Scrum, Kanban, híbrida e outra. As ações apresentadas respeitam as permissões efetivas de visualizar, incluir, alterar e excluir, além das autorizações específicas da funcionalidade.

## Ciclo de vida e arquivamento

Um projeto pode passar por rascunho, planejado, em andamento, pausado, concluído ou cancelado. O backend valida se a transição solicitada é aceita pelo estado atual.

O arquivamento preserva o projeto e seus registros. Projetos arquivados permanecem consultáveis, ficam protegidos contra novas alterações operacionais e podem ser reativados por usuário autorizado.

## Erros comuns

- uma chave já utilizada ou dados inválidos são apresentados junto ao formulário;
- usuários de outra empresa não podem ser usados fora do contexto autorizado;
- alterações de ciclo sem permissão são rejeitadas;
- conflitos e falhas de salvamento permanecem visíveis no modal para correção.
