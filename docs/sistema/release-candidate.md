# Release candidate

O ensaio de release candidate é executado manualmente pelo workflow `Release candidate`, sempre em infraestrutura descartável. Ele não utiliza nem altera o banco local ou o banco de produção.

## Evidências exigidas

O workflow instala o backend com `npm ci`, cria um SQL Server limpo e aplica as migrations até o estado imediatamente anterior à substituição das tarefas por itens do backlog. Em seguida, insere uma amostra relacionada de empresa, usuário, projeto, recurso, equipe, orçamento, custo, tarefa legada e solução customizada.

Antes da atualização, o banco é salvo com `BACKUP DATABASE`, checksum e `RESTORE VERIFYONLY`. A migration completa deve transformar a tarefa legada em item do backlog, reconciliar o custo com esse item e preservar projeto, recurso, equipe e customização do catálogo.

O rollback é feito exclusivamente pela restauração do backup anterior. Após confirmar a recuperação da tarefa e do vínculo de custo, as migrations são reaplicadas para demonstrar que o procedimento é repetível.

Por fim, o backend de homologação é iniciado duas vezes. Cada inicialização deve concluir o bootstrap, responder à consulta GraphQL de saúde com a origem permitida, bloquear uma mutation enviada por origem não confiável e preservar uma única instância da solução customizada e das soluções padrão.

## Procedimento operacional

1. Confirmar que o workflow `Qualidade` está verde para o mesmo commit.
2. Executar manualmente o workflow `Release candidate` no commit candidato.
3. Exigir sucesso do job `Migração, backup e rollback` e guardar o link da execução.
4. Em uma promoção real, criar e verificar o backup do banco antes das migrations.
5. Se a validação pós-migration falhar, interromper a promoção e restaurar o backup anterior; migrations destrutivas não possuem rollback por SQL reverso.
6. Liberar tráfego somente após migrations, bootstrap, saúde, CORS, autenticação e jornadas de homologação estarem aprovados.

O backup produzido no workflow é descartável e serve como prova do procedimento. Backups reais devem seguir a retenção, criptografia, controle de acesso e armazenamento definidos para o ambiente de destino.
