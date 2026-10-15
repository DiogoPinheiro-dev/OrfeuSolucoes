# Release candidate

O ensaio de release candidate é executado manualmente pelo workflow `Release candidate`, sempre em infraestrutura descartável. Ele não utiliza nem altera o banco local ou o banco de produção.

## Evidências exigidas

O workflow instala o backend com `npm ci`, cria um SQL Server limpo e aplica as migrations até o fim de agosto de 2026. O corte exclui explicitamente as migrations `202609*` e `202610*`, permitindo ensaiar em sequência a substituição das tarefas por itens do backlog, o controle de horas e a consolidação do catálogo. Em seguida, insere uma amostra relacionada de empresa, usuário, projeto, recurso, equipe, orçamento, custo, tarefa legada, solução customizada e catálogo anterior de horas, templates e portfólio.

Antes da atualização, o banco é salvo com `BACKUP DATABASE`, checksum e `RESTORE VERIFYONLY`. A migration completa deve transformar a tarefa legada em item do backlog, reconciliar o custo com esse item e preservar projeto, recurso, equipe e customização do catálogo. Também deve manter o contrato empresarial do Gerenciador de Projetos, retirar dos grupos comuns o acesso inicial às duas telas de horas, despublicar a ação antiga de apontar, aposentar a solução legada e as telas de templates e portfólio sem apagar seu histórico, além de registrar as mudanças na auditoria.

O rollback é feito exclusivamente pela restauração do backup anterior. Após confirmar a recuperação da tarefa e do vínculo de custo, as migrations são reaplicadas para demonstrar que o procedimento é repetível.

Por fim, o backend de homologação é iniciado duas vezes. Cada inicialização deve concluir o bootstrap, responder à consulta GraphQL de saúde com a origem permitida, bloquear uma mutation enviada por origem não confiável e preservar uma única instância da solução customizada e das soluções padrão. O bootstrap deve criar uma única vez `Meus apontamentos`, o agrupamento **Controle de horas** e suas duas abas, manter as funcionalidades restritas aos grupos comuns e gerar o rascunho versionado de `Horas do projeto` para revisão administrativa.

## Procedimento operacional

1. Confirmar que o workflow `Qualidade` está verde para o mesmo commit.
2. Executar manualmente o workflow `Release candidate` no commit candidato.
3. Exigir sucesso do job `Migração, backup e rollback` e guardar o link da execução.
4. Em uma promoção real, criar e verificar o backup do banco antes das migrations.
5. Depois do bootstrap, revisar no Configurador os rascunhos das funcionalidades de horas, publicar as versões aprovadas e liberar as permissões somente para os grupos definidos pela operação.
6. Se a validação pós-migration falhar, interromper a promoção e restaurar o backup anterior; migrations destrutivas não possuem rollback por SQL reverso.
7. Liberar tráfego somente após migrations, bootstrap, publicação do catálogo, permissões, saúde, CORS, autenticação e jornadas de homologação estarem aprovados.

O backup produzido no workflow é descartável e serve como prova do procedimento. Backups reais devem seguir a retenção, criptografia, controle de acesso e armazenamento definidos para o ambiente de destino.
